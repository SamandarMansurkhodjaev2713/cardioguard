# CardioGuard — RN/Expo Rebuild · План и прогресс

> Перенос CardioGuard с нативного Android (Kotlin/Compose) на **React Native + Expo**
> по дизайну из Claude (клиническая дизайн-система). Кроссплатформа: Android + iOS + Web.

## Архитектура (слои)

```
app/                 Expo Router маршруты (тонкие, только композиция)
src/
  theme/             Дизайн-токены из cg-styles.css + ThemeProvider (density/radius/role)
  i18n/              Локализация ru + uz (канонические коды → подписи)
  domain/            Чистая бизнес-логика (без UI, без I/O):
    types.ts           Модели (канонические enum-коды, не локализованные строки)
    constants.ts       Все пороги/числа как именованные константы (нет magic values)
    calculators.ts     ИМТ, АД, приверженность, SCORE2, Framingham
    riskEngine.ts      Движок рекомендаций (10 правил)
    alertEngine.ts     Движок ранних предупреждений (7 триггеров, дедуп)
  data/              Слой данных:
    repository.ts      Интерфейс (абстракция под будущий REST/Supabase)
    localRepository.ts Реализация на AsyncStorage
    seed.ts            Демо-данные (порт MockData + согласование с дизайном)
  store/             Zustand-стор (состояние приложения)
  ui/                Примитивы дизайн-системы (Button, Card, Badge, Chip, Field…)
  components/        Композитные (Header, BottomNav, Chart…)
  features/          Экранная логика (хуки-вьюмодели + подкомпоненты)
```

## Принципы (Definition of Done — чек-лист пользователя)
- TypeScript strict, нет `any` без `// TYPE-EXCEPTION`
- Нет magic values, silent catch, God class>200/func>30, бизнес-логики в UI
- Домен не импортирует UI/инфраструктуру; side-effects изолированы в data/
- Полное покрытие тестами (домен unit + компоненты + интеграция)
- i18n: канонические коды в данных, подписи через словари ru/uz
- Локальное сохранение через repository (готовность к API)
- Reflexion-петля на ключевых решениях

## Прогресс

### Фаза 0 — Каркас
- [x] Expo (blank-typescript) создан (SDK 56, React 19.2, RN 0.85)
- [x] expo-router + safe-area + screens + svg + async-storage + zustand + i18next + jest-expo (+ babel-preset-expo, @react-native/jest-preset, jest@29)
- [x] Конфиг (app.json scheme/plugins, main=expo-router/entry, babel, tsconfig strict, jest)
- [x] Веб-превью поднимается в этой среде — Metro собрал 848 модулей, app загрузился (Chrome MCP для скриншотов, сервер на :8081)
- [x] Тесты домена зелёные (36/36 калькуляторы)

### Фаза 1 — Дизайн-система
- [x] tokens.ts (цвета/типографика/радиусы/плотность из CSS, boxShadow)
- [x] ThemeProvider + useTheme + useThemeControls (density/radius твики)
- [x] UI-примитивы: AppText, Button, Card, Badge, TextField, Icon, BrandMark, AppFrame (web phone-frame)
- [ ] Остальные примитивы: Chip, Switch, Progress, Metric, AlertCard, Header, BottomNav, Sheet, Chart

### Фаза 2 — Домен (порт из Kotlin)
- [x] types.ts (канонические enum-коды)
- [x] constants.ts (все пороги)
- [x] calculators.ts + тесты (36 зелёных)
- [x] riskEngine.ts (10 правил рекомендаций) — тесты ⏳
- [x] alertEngine.ts (8 триггеров) — тесты ⏳

### Фаза 3 — Данные/состояние
- [x] repository интерфейс + localRepository (AsyncStorage, валидация) + seed
- [x] zustand store (гидратация, мутации, селекторы, deriveRisk)

### Фаза 4 — Навигация + i18n
- [x] Router: app/(patient) + app/(doctor) Tabs-группы, роль из стора
- [x] Кастомный BottomNav под дизайн (бейдж непрочитанных)
- [x] i18n ru/uz (common/enums/auth/dashboard; длинный контент — по мере экранов)

### Фаза 5 — Экраны (с превью-чекпойнтами)
- [x] Auth — сверен с дизайном ✓
- [x] Dashboard — сверен с дизайном ✓ (данные из движков)
- [~] Навигационный каркас + заглушки остальных вкладок (patient/doctor)
- [ ] Onboarding (5 шагов)
- [ ] Monitoring + Add measurement
- [ ] Medication
- [ ] Risk
- [ ] Recommendations
- [ ] Education + Article
- [ ] Alerts
- [ ] Doctor Overview
- [ ] Doctor Patients
- [ ] More / Settings / About

### Фаза 6 — Качество
- [ ] Полные тесты (компоненты/интеграция)
- [ ] A11y, перф, reduced-motion
- [ ] Прогон чек-листа, README, документация
