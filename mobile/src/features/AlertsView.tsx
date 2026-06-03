/**
 * Shared early-warning list, used by both the patient (`/alerts`, pushed with a
 * back button) and the doctor (`/signals` tab, with a role pill). Unread alerts
 * sort to the top; tapping one marks it read.
 */

import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { useAppStore } from '../store/useAppStore';
import { useTheme } from '../theme/ThemeProvider';
import { AlertCard } from '../ui/AlertCard';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { PageHeader } from '../ui/PageHeader';
import { RolePill } from '../ui/RolePill';

export interface AlertsViewProps {
  readonly onBack?: () => void;
  readonly showRole?: boolean;
}

export function AlertsView({ onBack, showRole }: AlertsViewProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const alerts = useAppStore((s) => s.alerts);
  const language = useAppStore((s) => s.language);
  const role = useAppStore((s) => s.role);
  const markAlertRead = useAppStore((s) => s.markAlertRead);

  const sorted = [...alerts].sort(
    (a, b) =>
      Number(a.isRead) - Number(b.isRead) || new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const hasUnread = alerts.some((a) => !a.isRead);
  const markAll = () => alerts.filter((a) => !a.isRead).forEach((a) => markAlertRead(a.id));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <PageHeader
        title={t('alerts.title')}
        subtitle={t('alerts.subtitle')}
        onBack={onBack}
        right={showRole ? <RolePill label={t('roles.doctorShort')} role={role} /> : undefined}
      />

      <View style={{ paddingHorizontal: theme.space.screenPad, rowGap: theme.space.gapSm }}>
        {hasUnread ? (
          <View style={{ alignItems: 'flex-end' }}>
            <Button label={t('alerts.markAllRead')} variant="ghost" size="sm" leftIcon="check" onPress={markAll} />
          </View>
        ) : null}

        {sorted.length === 0 ? (
          <EmptyState icon="check" tone="ok" title={t('alerts.empty')} hint={t('alerts.emptyHint')} />
        ) : (
          sorted.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              language={language}
              onPress={alert.isRead ? undefined : () => markAlertRead(alert.id)}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}
