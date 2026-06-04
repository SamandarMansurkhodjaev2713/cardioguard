import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, ScrollView, View } from 'react-native';

import { adherenceBand } from '../../src/domain/calculators';
import { buildReminderSlots } from '../../src/domain/reminders';
import type { Medication } from '../../src/domain/types';
import {
  cancelMedicationReminders,
  requestReminderPermission,
  syncMedicationReminders,
  type ReminderNotification,
} from '../../src/services/notifications';
import { selectAdherencePercent, useAppStore } from '../../src/store/useAppStore';
import { useTheme } from '../../src/theme/ThemeProvider';
import { AppText } from '../../src/ui/AppText';
import { Badge } from '../../src/ui/Badge';
import { Button } from '../../src/ui/Button';
import { Card } from '../../src/ui/Card';
import { EmptyState } from '../../src/ui/EmptyState';
import { Icon } from '../../src/ui/Icon';
import { PageHeader } from '../../src/ui/PageHeader';
import { Progress } from '../../src/ui/Progress';
import { RolePill } from '../../src/ui/RolePill';
import { Toggle } from '../../src/ui/Toggle';
import { adherenceTone } from '../../src/utils/format';

const REMINDERS_SUPPORTED = Platform.OS !== 'web';

function isToday(iso: string | null, now: Date): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

interface ScheduleSlot {
  readonly medication: Medication;
  readonly time: string;
  readonly taken: boolean;
}

export default function MedicationScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const role = useAppStore((s) => s.role);
  const medications = useAppStore((s) => s.medications);
  const medicationLogs = useAppStore((s) => s.medicationLogs);
  const recordIntake = useAppStore((s) => s.recordIntake);
  const remindersEnabled = useAppStore((s) => s.remindersEnabled);
  const setRemindersEnabled = useAppStore((s) => s.setRemindersEnabled);
  const adherence = useAppStore(selectAdherencePercent);
  const band = adherenceBand(adherence);

  const takenCount = medicationLogs.filter((l) => l.status === 'taken').length;

  const [permissionDenied, setPermissionDenied] = useState(false);

  // Daily reminder payloads derived from the active schedule (one per time slot).
  const reminderItems = useMemo<ReminderNotification[]>(() => {
    const notifTitle = t('medication.reminders.notifTitle');
    return buildReminderSlots(medications).map((slot) => ({
      hour: slot.hour,
      minute: slot.minute,
      title: notifTitle,
      body: slot.medications.map((m) => `${m.name} ${m.dosage}`).join(', '),
    }));
  }, [medications, t]);

  // Keep the OS schedule in sync with the derived reminders while enabled.
  useEffect(() => {
    if (remindersEnabled && REMINDERS_SUPPORTED) void syncMedicationReminders(reminderItems);
  }, [remindersEnabled, reminderItems]);

  const onToggleReminders = async (next: boolean) => {
    if (!next) {
      setRemindersEnabled(false);
      void cancelMedicationReminders();
      return;
    }
    const result = await requestReminderPermission();
    if (result === 'granted') {
      setPermissionDenied(false);
      setRemindersEnabled(true);
    } else if (result === 'denied') {
      setPermissionDenied(true);
    }
  };

  const schedule = useMemo<ScheduleSlot[]>(() => {
    const now = new Date();
    return medications
      .flatMap((medication) =>
        medication.intakeTimes.map((time) => {
          const taken = medicationLogs.some(
            (l) =>
              l.medicationId === medication.id &&
              l.scheduledTime === time &&
              l.status === 'taken' &&
              isToday(l.actualTime, now),
          );
          return { medication, time, taken };
        }),
      )
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [medications, medicationLogs]);

  const allTaken = schedule.length > 0 && schedule.every((s) => s.taken);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <PageHeader
        title={t('medication.title')}
        subtitle={t('medication.subtitle')}
        right={<RolePill label={t('roles.patient')} role={role} />}
      />

      <View style={{ paddingHorizontal: theme.space.screenPad, rowGap: theme.space.gap }}>
        {/* Adherence */}
        <Card style={{ rowGap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <AppText variant="title">{t('medication.adherenceTitle')}</AppText>
            <Badge label={t(`enums.adherenceBand.${band}`)} tone={adherenceTone(band)} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', columnGap: 2 }}>
            <AppText variant="metric" tabular>{adherence}</AppText>
            <AppText variant="help">{t('units.percent')}</AppText>
          </View>
          <Progress value={adherence / 100} tone={band === 'good' ? 'ok' : band === 'moderate' ? 'warn' : 'primary'} />
          <AppText variant="help">
            {t('medication.adherenceCaption', { taken: takenCount, total: medicationLogs.length })}
          </AppText>
        </Card>

        {/* Reminders */}
        <Card style={{ rowGap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 12 }}>
            <View
              style={{
                width: 38, height: 38, borderRadius: 10,
                backgroundColor: theme.colors.primarySoft,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Icon name="bell" size={18} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="title">{t('medication.reminders.title')}</AppText>
              <AppText variant="help" color={theme.colors.text3}>{t('medication.reminders.subtitle')}</AppText>
            </View>
            <Toggle
              value={remindersEnabled && REMINDERS_SUPPORTED}
              onValueChange={onToggleReminders}
              disabled={!REMINDERS_SUPPORTED}
              accessibilityLabel={t('medication.reminders.title')}
            />
          </View>
          {!REMINDERS_SUPPORTED ? (
            <AppText variant="help" color={theme.colors.text3}>{t('medication.reminders.noteWeb')}</AppText>
          ) : permissionDenied ? (
            <AppText variant="help" color={theme.colors.high}>{t('medication.reminders.denied')}</AppText>
          ) : remindersEnabled && reminderItems.length > 0 ? (
            <AppText variant="help" color={theme.colors.ok}>
              {t('medication.reminders.scheduled', { count: reminderItems.length })}
            </AppText>
          ) : reminderItems.length === 0 ? (
            <AppText variant="help" color={theme.colors.text3}>{t('medication.reminders.empty')}</AppText>
          ) : null}
        </Card>

        {/* Today's schedule */}
        <AppText variant="h2" style={{ marginTop: 4 }}>{t('medication.todayTitle')}</AppText>
        <Card bare style={{ paddingHorizontal: theme.space.padCard }}>
          {schedule.length === 0 ? (
            <View style={{ paddingVertical: 18 }}>
              <AppText variant="help" center>{t('medication.empty')}</AppText>
            </View>
          ) : (
            schedule.map((slot, i) => (
              <View
                key={`${slot.medication.id}_${slot.time}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  columnGap: 12,
                  paddingVertical: theme.space.rowPad,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: theme.colors.hairline,
                }}
              >
                <View style={{ width: 46 }}>
                  <AppText tabular style={{ fontFamily: theme.font.semibold, fontSize: 14 }}>{slot.time}</AppText>
                </View>
                <View style={{ flex: 1 }}>
                  <AppText style={{ fontFamily: theme.font.semibold, fontSize: 14 }}>
                    {slot.medication.name} {slot.medication.dosage}
                  </AppText>
                  <AppText variant="help" color={theme.colors.text3}>{slot.medication.instructions}</AppText>
                </View>
                {slot.taken ? (
                  <Badge label={t('medication.taken')} tone="ok" />
                ) : (
                  <Button
                    label={t('medication.markTaken')}
                    size="sm"
                    variant="secondary"
                    leftIcon="check"
                    onPress={() => recordIntake(slot.medication.id, slot.time)}
                  />
                )}
              </View>
            ))
          )}
          {allTaken ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 7, paddingVertical: 10 }}>
              <Icon name="check" size={15} color={theme.colors.ok} />
              <AppText variant="help" color={theme.colors.ok}>{t('medication.allDoneToday')}</AppText>
            </View>
          ) : null}
        </Card>

        {/* Active medications */}
        <AppText variant="h2" style={{ marginTop: 4 }}>{t('medication.activeTitle')}</AppText>
        {medications.length === 0 ? (
          <Card><EmptyState compact icon="medication" title={t('medication.empty')} /></Card>
        ) : (
        <View style={{ rowGap: theme.space.gapSm }}>
          {medications.map((med) => (
            <Card key={med.id} style={{ flexDirection: 'row', alignItems: 'flex-start', columnGap: 12 }}>
              <View
                style={{
                  width: 38, height: 38, borderRadius: 10,
                  backgroundColor: theme.colors.primarySoft,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Icon name="medication" size={18} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', columnGap: 8 }}>
                  <AppText variant="title">{med.name}</AppText>
                  <Badge label={med.dosage} tone="neutral" dot={false} />
                </View>
                <AppText variant="help" color={theme.colors.text3} style={{ marginTop: 2 }}>{med.instructions}</AppText>
                <AppText variant="help" color={theme.colors.text2} style={{ marginTop: 4 }}>
                  {t('medication.perDay', { count: med.frequencyPerDay })} · {t('medication.scheduleAt', { times: med.intakeTimes.join(', ') })}
                </AppText>
              </View>
            </Card>
          ))}
        </View>
        )}
      </View>
    </ScrollView>
  );
}
