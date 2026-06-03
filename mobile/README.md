# CardioGuard (React Native · Expo)

Кроссплатформенный (Android · iOS · Web) клинико-технологический прототип для
мониторинга кардиометаболического здоровья, контроля приверженности терапии и
профилактики сердечно-сосудистых заболеваний. Дизайн воспроизводит клиническую
дизайн-систему из Claude; функционал портирован с нативного Android-приложения
(Kotlin/Compose).

> ⚠️ Прототип. Калькуляторы риска (SCORE2 / Framingham) демонстрационные и
> требуют клинической валидации. Приложение не устанавливает диагноз и не
> заменяет консультацию врача.

## Стек

- **Expo SDK 56** · React Native 0.85 · React 19.2
- **TypeScript** (strict)
- **Expo Router** (file-based навигация, группы вкладок patient/doctor)
- **Zustand** — состояние; **AsyncStorage** — локальное хранение через слой-репозиторий
- **Zod** — schema-валидация на границе данных (персист / внешний API)
- **react-i18next** + expo-localization — локализация **ru / uz**
- **react-native-svg** — графики и кольцевые индикаторы; **lucide-react-native** — иконки
- **expo-notifications** (локальные напоминания) · **expo-print** + **expo-sharing** (PDF-отчёт) · **expo-haptics** (тактильная отдача)
- **Jest** (jest-expo) + Testing Library — тесты

## Запуск

```bash
npm install
npm run web        # веб-превью (http://localhost:8081)
npm run android    # Android (Expo Go или эмулятор)
npm run ios        # iOS (Expo Go или симулятор, нужен macOS)
npm test           # юнит-тесты
npm run typecheck  # tsc --noEmit
```

На телефоне: `npx expo start`, затем сканировать QR приложением **Expo Go**.

## Запуск на реальном устройстве (iPhone / Android)

Веб-превью не задействует нативные возможности — их нужно проверять на устройстве.

**Быстро — Expo Go** (для демонстрации UI и большинства функций):

```bash
npx expo start          # затем сканировать QR приложением Expo Go
```

- iOS: локальные напоминания, печать-в-PDF и шеринг, haptics работают.
- Android: UI и шеринг/печать работают; для корректных каналов/иконки локальных
  уведомлений на Android используйте dev build (ниже).

**Полноценно — Development Build (EAS)** — нужен для гарантированной проверки
уведомлений/каналов на Android и нативной конфигурации:

```bash
npm i -g eas-cli && eas login && eas init   # один раз
eas build --profile development --platform ios     # или android / all
# установить сборку на устройство, затем:
npx expo start --dev-client
```

**Что проверить на устройстве (чего не покрывает web):**

1. **Напоминания** — на экране «Лекарства» включить тумблер → разрешить уведомления
   → локальные уведомления приходят в часы приёма (`SchedulableTriggerInputTypes.DAILY`).
2. **Отчёт для врача** — на панели врача «Отчёт для врача» → генерация PDF → системный
   лист «Поделиться».
3. **Haptics** — тактильная отдача на кнопках, чипах, шкалах опроса самочувствия.
4. **Шрифты IBM Plex Sans** и **safe-area** (вырезы/динамический остров) корректны.
5. **Тёмная тема** — «Ещё → Внешний вид → Системная» следует системной теме устройства
   (в `app.json` задан `userInterfaceStyle: "automatic"`).

## Архитектура (слои)

```
app/                 Маршруты Expo Router (тонкие, только композиция UI)
  (patient)/         Вкладки пациента: dashboard, monitoring, medication, risk, more
  (doctor)/          Вкладки врача: overview (+групповая аналитика), patients, signals, more
  index.tsx          Авторизация · onboarding · measurement · alerts · recommendations
  profile · wellbeing · insights · goals · education · article · about (push-маршруты)
src/
  domain/            Чистая бизнес-логика (без UI и I/O):
    types.ts           Модели (канонические enum-коды, не локализованные строки)
    constants.ts       Все клинические пороги — именованные константы (нет magic values)
    calculators.ts     ИМТ, классификация АД, приверженность, SCORE2, Framingham
    riskEngine.ts      Движок рекомендаций
    alertEngine.ts     Движок ранних предупреждений (9 триггеров, `now` инъектируется)
    mood.ts            Психо-эмоциональный скоринг + классификация (Модуль 5)
    insights.ts        Тренды (регрессия/EWMA) + прогноз рисков, on-device (Модуль 6)
    healthIndex.ts     Композитный индекс здоровья 0–100 (Модуль 11)
    cohort.ts          Синтетическая когорта + групповая агрегация (Модули 10–11)
  data/              repository (абстракция под REST/Supabase API) · localRepository
                     (AsyncStorage) · schemas (Zod-валидация) · seed · cohort (демо-когорта)
  services/          Платформенные side-effects: notifications · reportHtml/reportExport
  store/             Zustand-стор: гидратация/сидирование, мутации, селекторы
  theme/             Дизайн-токены из CSS · ThemeProvider (плотность/скругление/тема)
  i18n/              ru / uz словари + инициализация
  ui/                Примитивы дизайн-системы (Button, Card, Badge, Chip, TextField,
                     MetricCard, LineChart, Ring, Skeleton, EmptyState, Toggle, …)
  features/          Логика между ролями (AlertsView, MoreView, ReportButton, HealthIndexCard)
  utils/             format · logger (единственный sink) · haptics · prng (детерминированный)
  testing/           Фабрики тестовых данных
```

**Поток данных:** действие пользователя → стор (side-effects: даты, id, IO) →
чистые доменные движки пересчитывают риск/рекомендации/алерты → UI обновляется →
состояние персистится. Домен не импортирует UI/инфраструктуру.

## Локализация

Данные хранят **канонические коды** (`'current'`, `'male'`…), подписи берутся из
словарей через i18n — поэтому ru/uz переключаются без изменений в логике.
Узбекские длинные клинические тексты — добротный черновик, перед релизом
рекомендуется вычитка носителем.

## Модули системы (по расширенному ТЗ)

| # | Модуль | Где |
|---|--------|-----|
| 1 | Профиль / медицинская карта | `app/profile.tsx`, `domain/types.ts` (UserProfile) |
| 2 | Мониторинг показателей | `app/(patient)/monitoring.tsx`, `measurement.tsx` |
| 3 | Оценка риска ССЗ (SCORE2 / Framingham) | `domain/calculators.ts`, `app/(patient)/risk.tsx` |
| 4 | Лекарственная приверженность + напоминания | `app/(patient)/medication.tsx`, `services/notifications.ts` |
| 5 | Психо-эмоциональный мониторинг (еженедельный опрос) | `domain/mood.ts`, `app/wellbeing.tsx` |
| 6 | Интеллектуальная аналитика и прогноз (on-device) | `domain/insights.ts`, `app/insights.tsx` |
| 7 | Раннее предупреждение (9 триггеров) | `domain/alertEngine.ts`, `features/AlertsView.tsx` |
| 8 | Персонализированные рекомендации | `domain/riskEngine.ts`, `app/recommendations.tsx` |
| 9 | Образовательная база знаний | `app/education.tsx`, `article.tsx` |
| 10 | Группы и коллективная аналитика | `domain/cohort.ts`, `data/cohort.ts` |
| 11 | Аналитическая панель + индекс здоровья | `domain/healthIndex.ts`, `features/HealthIndexCard.tsx`, `app/(doctor)/overview.tsx` |

> Модуль 6 — детерминированный движок на устройстве (МНК-регрессия + EWMA + объяснимые
> правила), без облака и ML-сервиса: воспроизводимо, работает оффлайн, прогноз снабжён
> дисклеймером и не является диагнозом.

## Качество

- TypeScript strict, без `any`; нет magic values, silent catch, бизнес-логики в UI.
- **194 теста** (`npm test`), все зелёные: домен (калькуляторы, оба движка, mood,
  insights, healthIndex, cohort/prng), слой данных (REST-адаптер с retry/timeout,
  Zod-валидация персиста), стор-интеграция, UI-примитивы и экраны.
- **Zod-валидация** всех внешних/персист-данных (T-03): повреждённое хранилище
  деградирует к чистому пересиду, а не падает.
- Доступность: роли/метки на интерактиве, доступные графики (role=image + сводка),
  масштабирование шрифта, контраст AA в светлой и тёмной темах.
- Исправлены 2 клинических бага исходного Kotlin (задокументированы в
  `calculators.ts`): зазоры в классификации ИМТ и выбор худшей оси для АД.
- Иммутабельные обновления состояния; синтетическая когорта детерминирована (seed).

> На этой Windows-машине параллельный запуск Jest может упереться в память —
> используйте `npx jest --runInBand` (стабильно, ~8–10 с).

## Бэкенд (синхронизация)

Слой данных абстрагирован интерфейсом `StateRepository`. По умолчанию приложение
работает **полностью оффлайн** на AsyncStorage. Если задать `EXPO_PUBLIC_API_URL`
(см. `.env.example`), включается **offline-first** режим: локальное хранилище
остаётся источником истины оффлайн, а REST-бэкенд синхронизируется best-effort и
используется для гидратации между устройствами. Приложение продолжает работать при
отсутствии сети (graceful degradation).

Контракт бэкенда (документ всего состояния):

```
GET    {API_URL}/state  -> 200 PersistedState | 404
PUT    {API_URL}/state  <- PersistedState  -> 2xx
DELETE {API_URL}/state                     -> 2xx
```

`apiRepository` устойчив: per-request timeout, retry с экспоненциальной задержкой
для транзиентных (network/5xx) сбоев, schema-валидация ответа. Для гранулярного API
(эндпойнты на сущности) достаточно расширить `StateRepository` и адаптер — стор и
экраны не меняются.

## Сборка и публикация (EAS)

Конфигурация в `eas.json` (профили `development` / `preview` / `production`),
идентификаторы и версии — в `app.json` (`com.cardioguard.app`).

```bash
npm i -g eas-cli      # один раз
eas login
eas init              # привяжет projectId (extra.eas.projectId)

npm run eas:build:preview   # internal APK (Android) + Simulator (iOS)
npm run eas:build:prod      # AAB + IPA для сторов
npm run eas:submit          # отправка в Google Play / App Store
npm run web:export          # статический веб-бандл (dist/) для хостинга
```

Перед публикацией: аккаунты разработчика (Apple $99/год, Google $25), иконки и
сплэши всех размеров, политика приватности.

## Заметки

- Демо-пациент «Алишер» и когорта врача — синтетические данные из `data/seed.ts`.
- Вход демонстрационный (без реальной аутентификации).
- Данные сохраняются между запусками локально; для сброса демо — «Сменить роль» и
  повторный вход, либо очистка хранилища приложения.
