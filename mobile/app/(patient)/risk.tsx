import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import type { RiskCategory, RiskModel, RiskRegion } from '../../src/domain/types';
import { deriveRisk, useAppStore } from '../../src/store/useAppStore';
import { useTheme } from '../../src/theme/ThemeProvider';
import { AppText } from '../../src/ui/AppText';
import { Badge } from '../../src/ui/Badge';
import { Card } from '../../src/ui/Card';
import { Icon } from '../../src/ui/Icon';
import { OptionPills } from '../../src/ui/OptionPills';
import { PageHeader } from '../../src/ui/PageHeader';
import { RolePill } from '../../src/ui/RolePill';
import { SegmentedControl } from '../../src/ui/SegmentedControl';
import { TextField } from '../../src/ui/TextField';
import { riskTone } from '../../src/utils/format';

const REGION_ORDER: readonly RiskRegion[] = ['low', 'moderate', 'high', 'veryHigh'];

const CATEGORY_ORDER: readonly RiskCategory[] = ['low', 'moderate', 'high', 'veryHigh'];

export default function RiskScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const role = useAppStore((s) => s.role);
  const profile = useAppStore((s) => s.profile);
  const measurements = useAppStore((s) => s.measurements);
  const riskModel = useAppStore((s) => s.riskModel);
  const setRiskModel = useAppStore((s) => s.setRiskModel);
  const setRiskInputs = useAppStore((s) => s.setRiskInputs);

  const [totalChol, setTotalChol] = useState(profile.totalCholMmol != null ? String(profile.totalCholMmol) : '');
  const [hdl, setHdl] = useState(profile.hdlCholMmol != null ? String(profile.hdlCholMmol) : '');

  const commitLab = (raw: string, key: 'totalCholMmol' | 'hdlCholMmol') => {
    const n = Number(raw.replace(',', '.').trim());
    if (Number.isFinite(n) && n > 0) setRiskInputs({ [key]: n });
  };

  const risk = useMemo(
    () => deriveRisk({ profile, measurements, riskModel }),
    [profile, measurements, riskModel],
  );
  const tone = riskTone(risk.category);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <PageHeader
        title={t('risk.title')}
        subtitle={t('risk.subtitle')}
        right={<RolePill label={t('roles.patient')} role={role} />}
      />

      <View style={{ paddingHorizontal: theme.space.screenPad, rowGap: theme.space.gap }}>
        <View style={{ rowGap: 6 }}>
          <AppText variant="label">{t('risk.model')}</AppText>
          <SegmentedControl<RiskModel>
            value={riskModel}
            onChange={setRiskModel}
            options={[
              { value: 'score2', label: t('risk.models.score2') },
              { value: 'framingham', label: t('risk.models.framingham') },
            ]}
          />
          <AppText variant="help" style={{ marginTop: 2 }}>{t(`risk.modelNote.${riskModel}`)}</AppText>
        </View>

        {/* Result */}
        <Card style={{ rowGap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', columnGap: 10 }}>
            <AppText variant="title">{t('risk.resultTitle')}</AppText>
            <Badge label={t(`enums.riskCategory.${risk.category}`)} tone={tone} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', columnGap: 6 }}>
            <AppText variant="metric" color={theme.tone(tone).fg} tabular>
              {risk.percent}
            </AppText>
            <AppText variant="h2" color={theme.tone(tone).fg}>{t('units.percent')}</AppText>
            <AppText variant="help" style={{ marginLeft: 2 }}>{t('risk.over10Years')}</AppText>
          </View>

          <RiskScale current={risk.category} />

          <AppText variant="help" color={theme.colors.text2} style={{ lineHeight: 19 }}>
            {t('risk.explanation')}
          </AppText>
        </Card>

        {/* Refine inputs — labs + region drive the real SCORE2/Framingham */}
        <Card style={{ rowGap: theme.space.gap }}>
          <AppText variant="title">{t('risk.labsTitle')}</AppText>
          <View style={{ flexDirection: 'row', columnGap: theme.space.gap }}>
            <View style={{ flex: 1 }}>
              <TextField
                label={t('risk.totalChol')}
                value={totalChol}
                onChangeText={setTotalChol}
                onBlur={() => commitLab(totalChol, 'totalCholMmol')}
                keyboardType="decimal-pad"
                suffix={t('risk.cholUnit')}
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextField
                label={t('risk.hdl')}
                value={hdl}
                onChangeText={setHdl}
                onBlur={() => commitLab(hdl, 'hdlCholMmol')}
                keyboardType="decimal-pad"
                suffix={t('risk.cholUnit')}
              />
            </View>
          </View>
          {riskModel === 'score2' ? (
            <View style={{ rowGap: 7 }}>
              <AppText variant="label">{t('risk.region')}</AppText>
              <OptionPills<RiskRegion>
                value={profile.riskRegion ?? 'veryHigh'}
                onChange={(region) => setRiskInputs({ riskRegion: region })}
                options={REGION_ORDER.map((region) => ({ value: region, label: t(`risk.regions.${region}`) }))}
              />
              <AppText variant="help">{t('risk.regionHint')}</AppText>
            </View>
          ) : null}
        </Card>

        {/* Assumptions */}
        {risk.assumptionKeys.length > 0 ? (
          <Card variant="soft" style={{ rowGap: 8 }}>
            <AppText variant="label">{t('risk.assumptionsTitle')}</AppText>
            {risk.assumptionKeys.map((key) => (
              <View key={key} style={{ flexDirection: 'row', columnGap: 8, alignItems: 'flex-start' }}>
                <Icon name="info" size={14} color={theme.colors.text3} />
                <AppText variant="help" style={{ flex: 1, lineHeight: 18 }}>{t(`risk.assumptions.${key}`)}</AppText>
              </View>
            ))}
          </Card>
        ) : null}

        {/* Factors */}
        <AppText variant="h2" style={{ marginTop: 4 }}>{t('risk.factorsTitle')}</AppText>
        <Card style={{ rowGap: 0 }}>
          {risk.factorKeys.length === 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 9, paddingVertical: 4 }}>
              <Icon name="check" size={16} color={theme.colors.ok} />
              <AppText variant="body" color={theme.colors.text2}>{t('risk.noFactors')}</AppText>
            </View>
          ) : (
            risk.factorKeys.map((key, i) => (
              <View
                key={key}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  columnGap: 10,
                  paddingVertical: theme.space.rowPad,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: theme.colors.hairline,
                }}
              >
                <View style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: theme.colors.high }} />
                <AppText variant="body" color={theme.colors.text} style={{ flex: 1 }}>
                  {t(`risk.factors.${key}`)}
                </AppText>
              </View>
            ))
          )}
        </Card>

        {/* Disclaimer */}
        <View
          style={{
            flexDirection: 'row',
            columnGap: 9,
            padding: 12,
            borderRadius: theme.radius.field,
            backgroundColor: theme.colors.infoBg,
            borderWidth: 1,
            borderColor: theme.colors.infoBd,
          }}
        >
          <Icon name="info" size={16} color={theme.colors.info} />
          <AppText variant="help" color={theme.colors.info} style={{ flex: 1, lineHeight: 18 }}>
            {t('risk.disclaimer')}
          </AppText>
        </View>
      </View>
    </ScrollView>
  );
}

function RiskScale({ current }: { readonly current: RiskCategory }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const toneByCategory: Record<RiskCategory, string> = {
    low: theme.colors.ok,
    moderate: theme.colors.warn,
    high: theme.colors.high,
    veryHigh: theme.colors.vhigh,
  };

  return (
    <View style={{ rowGap: 8 }}>
      <View style={{ flexDirection: 'row', height: 10, columnGap: 2 }}>
        {CATEGORY_ORDER.map((category) => (
          <View
            key={category}
            style={{
              flex: 1,
              borderRadius: 4,
              backgroundColor: toneByCategory[category],
              opacity: category === current ? 1 : 0.26,
            }}
          />
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {CATEGORY_ORDER.map((category) => (
          <AppText
            key={category}
            style={{
              fontFamily: category === current ? theme.font.semibold : theme.font.regular,
              fontSize: 11,
              color: category === current ? theme.colors.text : theme.colors.text3,
            }}
          >
            {t(`enums.riskCategory.${category}`)}
          </AppText>
        ))}
      </View>
    </View>
  );
}
