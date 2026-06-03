import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import type { RiskCategory } from '../../src/domain/types';
import type { GroupStats } from '../../src/domain/cohort';
import { DEMO_COHORT_SUMMARY } from '../../src/data/cohort';
import { ReportButton } from '../../src/features/ReportButton';
import { useAppStore } from '../../src/store/useAppStore';
import { useTheme } from '../../src/theme/ThemeProvider';
import { AppText } from '../../src/ui/AppText';
import { Badge } from '../../src/ui/Badge';
import { Card } from '../../src/ui/Card';
import { Icon } from '../../src/ui/Icon';
import { PageHeader } from '../../src/ui/PageHeader';
import { RolePill } from '../../src/ui/RolePill';
import { riskTone } from '../../src/utils/format';

const COHORT = DEMO_COHORT_SUMMARY;

export default function DoctorOverviewScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const role = useAppStore((s) => s.role);

  const kpis = [
    { label: t('doctor.kpi.users'), value: `${COHORT.count}` },
    { label: t('doctor.kpi.avgBp'), value: `${COHORT.avgSystolic}/${COHORT.avgDiastolic}`, unit: t('units.mmHg') },
    { label: t('doctor.kpi.avgBmi'), value: `${COHORT.avgBmi}`, unit: t('units.kgm2') },
    { label: t('doctor.kpi.avgAdherence'), value: `${COHORT.avgAdherence}`, unit: t('units.percent') },
    { label: t('doctor.kpi.highRisk'), value: `${COHORT.atRiskCount}`, color: theme.colors.high },
    { label: t('doctor.kpi.activeAlerts'), value: `${COHORT.activeAlerts}`, color: theme.colors.warn },
  ];

  const maxDist = Math.max(...COHORT.riskDistribution.map((d) => d.value));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <PageHeader
        title={t('doctor.title')}
        subtitle={t('doctor.subtitle')}
        right={<RolePill label={t('roles.doctorShort')} role={role} />}
      />

      <View style={{ paddingHorizontal: theme.space.screenPad, rowGap: theme.space.gap }}>
        {/* Privacy */}
        <View
          style={{
            flexDirection: 'row',
            columnGap: 9,
            padding: 11,
            borderRadius: theme.radius.field,
            backgroundColor: theme.colors.surfaceSoft,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <Icon name="lock" size={15} color={theme.colors.text3} />
          <AppText variant="help" style={{ flex: 1 }}>{t('doctor.privacyNote')}</AppText>
        </View>

        {/* KPI grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.gap }}>
          {kpis.map((kpi) => (
            <Card key={kpi.label} style={{ width: '47%', flexGrow: 1, rowGap: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', columnGap: 3 }}>
                <AppText variant="metric" tabular color={kpi.color} style={{ fontSize: 25 }}>
                  {kpi.value}
                </AppText>
                {kpi.unit ? <AppText variant="help">{kpi.unit}</AppText> : null}
              </View>
              <AppText variant="help">{kpi.label}</AppText>
            </Card>
          ))}
        </View>

        {/* Risk distribution */}
        <AppText variant="h2" style={{ marginTop: 6 }}>{t('doctor.riskDistribution')}</AppText>
        <Card style={{ rowGap: 12 }}>
          {COHORT.riskDistribution.map((d) => (
            <View key={d.category} style={{ flexDirection: 'row', alignItems: 'center', columnGap: 12 }}>
              <AppText variant="help" color={theme.colors.text2} style={{ width: 96 }}>
                {t(`enums.riskCategory.${d.category as RiskCategory}`)}
              </AppText>
              <View style={{ flex: 1, height: 10, borderRadius: 999, backgroundColor: theme.colors.surface2, overflow: 'hidden' }}>
                <View
                  style={{
                    height: '100%',
                    width: `${(d.value / maxDist) * 100}%`,
                    borderRadius: 999,
                    backgroundColor: theme.tone(riskTone(d.category as RiskCategory)).fg,
                  }}
                />
              </View>
              <AppText tabular style={{ fontFamily: theme.font.semibold, fontSize: 14, width: 28, textAlign: 'right' }}>
                {d.value}
              </AppText>
            </View>
          ))}
        </Card>

        {/* Per-group breakdown (Module 10) */}
        <AppText variant="h2" style={{ marginTop: 6 }}>{t('doctor.groupsTitle')}</AppText>
        <View style={{ rowGap: theme.space.gapSm }}>
          {COHORT.groups.map((group) => <GroupCard key={group.group} stats={group} />)}
        </View>

        {/* Patient report export */}
        <AppText variant="h2" style={{ marginTop: 6 }}>{t('report.button')}</AppText>
        <ReportButton />
      </View>
    </ScrollView>
  );
}

function GroupCard({ stats }: { readonly stats: GroupStats }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const rows: ReadonlyArray<{ label: string; value: string }> = [
    { label: t('doctor.group.members'), value: `${stats.count}` },
    { label: t('doctor.group.avgAge'), value: t('doctor.patient.years', { age: stats.avgAge }) },
    { label: t('doctor.group.avgBp'), value: `${stats.avgSystolic}/${stats.avgDiastolic} ${t('units.mmHg')}` },
    { label: t('doctor.group.avgBmi'), value: `${stats.avgBmi} ${t('units.kgm2')}` },
    { label: t('doctor.group.avgWeight'), value: `${stats.avgWeightKg} ${t('units.kg')}` },
    { label: t('doctor.group.avgAdherence'), value: `${stats.avgAdherence} ${t('units.percent')}` },
    { label: t('doctor.group.hypertension'), value: `${stats.hypertensionPercent} ${t('units.percent')}` },
    { label: t('doctor.group.diabetes'), value: `${stats.diabetesPercent} ${t('units.percent')}` },
    { label: t('doctor.group.highStress'), value: `${stats.highStressPercent} ${t('units.percent')}` },
  ];
  return (
    <Card style={{ rowGap: 9 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', columnGap: 10 }}>
        <AppText variant="title">{t(`doctor.groupNames.${stats.group}`)}</AppText>
        <Badge
          label={t('doctor.group.atRisk', { count: stats.atRiskCount })}
          tone={stats.atRiskCount > 0 ? 'high' : 'ok'}
        />
      </View>
      {rows.map((r) => (
        <View key={r.label} style={{ flexDirection: 'row', justifyContent: 'space-between', columnGap: 12 }}>
          <AppText variant="help" color={theme.colors.text2}>{r.label}</AppText>
          <AppText variant="help" tabular style={{ fontFamily: theme.font.semibold }}>{r.value}</AppText>
        </View>
      ))}
    </Card>
  );
}
