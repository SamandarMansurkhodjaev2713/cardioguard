import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, TextInput, View } from 'react-native';

import type { CohortMember } from '../../src/domain/cohort';
import { DEMO_COHORT } from '../../src/data/cohort';
import { useAppStore } from '../../src/store/useAppStore';
import { useTheme } from '../../src/theme/ThemeProvider';
import { AppText } from '../../src/ui/AppText';
import { Badge } from '../../src/ui/Badge';
import { Card } from '../../src/ui/Card';
import { Icon } from '../../src/ui/Icon';
import { PageHeader } from '../../src/ui/PageHeader';
import { Progress } from '../../src/ui/Progress';
import { RolePill } from '../../src/ui/RolePill';
import { adherenceTone, riskTone } from '../../src/utils/format';
import { adherenceBand } from '../../src/domain/calculators';

export default function DoctorPatientsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const role = useAppStore((s) => s.role);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (q === '') return DEMO_COHORT;
    return DEMO_COHORT.filter((p) => p.id.toUpperCase().includes(q));
  }, [query]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <PageHeader
        title={t('doctor.patientsTitle')}
        subtitle={t('doctor.patientsSubtitle')}
        right={<RolePill label={t('roles.doctorShort')} role={role} />}
      />

      <View style={{ paddingHorizontal: theme.space.screenPad, rowGap: theme.space.gapSm }}>
        {/* Search */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            columnGap: 9,
            height: 46,
            paddingHorizontal: 13,
            borderRadius: theme.radius.field,
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.border2,
          }}
        >
          <Icon name="search" size={18} color={theme.colors.text3} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('doctor.searchPlaceholder')}
            placeholderTextColor={theme.colors.text3}
            autoCapitalize="characters"
            style={{
              flex: 1,
              fontFamily: theme.font.regular,
              fontSize: theme.fontSize.body,
              color: theme.colors.text,
              paddingVertical: 0,
              outlineWidth: 0,
            }}
          />
        </View>

        {filtered.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 32 }}>
            <AppText variant="help">{t('doctor.notFound')}</AppText>
          </View>
        ) : (
          filtered.map((patient) => <PatientCard key={patient.id} patient={patient} />)
        )}
      </View>
    </ScrollView>
  );
}

function PatientCard({ patient }: { readonly patient: CohortMember }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const band = adherenceBand(patient.adherencePercent);
  const lastSeen =
    patient.lastSeenDaysAgo === 0
      ? t('doctor.patient.today')
      : t('doctor.patient.daysAgo', { count: patient.lastSeenDaysAgo });

  return (
    <Card style={{ rowGap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', columnGap: 10 }}>
        <AppText variant="title" tabular>{patient.id}</AppText>
        <Badge label={t(`enums.riskCategory.${patient.riskCategory}`)} tone={riskTone(patient.riskCategory)} />
      </View>

      <AppText variant="help" color={theme.colors.text2}>
        {t('doctor.patient.years', { age: patient.age })} · {t(`enums.sex.${patient.sex}`)} · {patient.systolicBp}/{patient.diastolicBp} {t('units.mmHg')} · {t('units.kgm2')} {patient.bmi} · {t(`doctor.groupNames.${patient.group}`)}
      </AppText>

      <View style={{ rowGap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <AppText variant="help" color={theme.colors.text3}>{t('doctor.patient.adherence')}</AppText>
          <AppText variant="help" tabular style={{ fontFamily: theme.font.semibold }}>{patient.adherencePercent}%</AppText>
        </View>
        <Progress value={patient.adherencePercent / 100} tone={band === 'good' ? 'ok' : band === 'moderate' ? 'warn' : 'primary'} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {patient.activeAlerts > 0 ? (
          <Badge label={t('doctor.patient.alerts', { count: patient.activeAlerts })} tone="high" />
        ) : (
          <View />
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 5 }}>
          <Icon name="clock" size={13} color={theme.colors.text3} />
          <AppText variant="help" color={theme.colors.text3}>{lastSeen}</AppText>
        </View>
      </View>
    </Card>
  );
}
