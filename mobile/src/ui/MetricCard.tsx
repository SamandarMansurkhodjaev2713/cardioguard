/**
 * Dashboard metric tile (`.cg-metric`) — labeled icon, large tabular value with
 * a unit, and a status badge or trend footer. Pressable with an active scale.
 */

import { Pressable, View, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import type { StatusTone } from '../theme/tokens';
import { AppText } from './AppText';
import { Badge } from './Badge';
import { Icon, type IconName } from './Icon';

export interface MetricTrend {
  readonly label: string;
  readonly direction: 'up' | 'down' | 'flat';
}

export interface MetricCardProps {
  readonly icon: IconName;
  readonly label: string;
  readonly value: string;
  readonly unit?: string;
  readonly badge?: { readonly label: string; readonly tone: StatusTone };
  readonly trend?: MetricTrend;
  readonly onPress?: () => void;
  readonly style?: ViewStyle;
}

export function MetricCard({ icon, label, value, unit, badge, trend, onPress, style }: MetricCardProps) {
  const theme = useTheme();
  const { colors, radius, space } = theme;

  const trendColor =
    trend?.direction === 'up' ? colors.warn : trend?.direction === 'down' ? colors.ok : colors.text3;

  // Read the whole tile as one node ("Label: value unit, badge, trend") rather
  // than fragmented text fields.
  const a11yLabel = [`${label}: ${value}${unit ? ` ${unit}` : ''}`, badge?.label, trend?.label]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessible
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={a11yLabel}
      style={({ pressed }) => [
        {
          minHeight: 116,
          backgroundColor: pressed && onPress ? colors.surfaceSoft : colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.card,
          padding: space.padCard,
          rowGap: 8,
          transform: [{ scale: pressed && onPress ? 0.985 : 1 }],
          boxShadow: '0px 1px 2px rgba(20,30,50,0.04)',
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', columnGap: 7, minHeight: 34 }}>
        <Icon name={icon} size={16} color={colors.text3} />
        <AppText variant="label" color={colors.text2} style={{ flex: 1 }}>
          {label}
        </AppText>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <AppText variant="metric" tabular>
          {value}
        </AppText>
        {unit ? (
          <AppText variant="help" style={{ marginLeft: 3 }}>
            {unit}
          </AppText>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: 6, rowGap: 4, marginTop: 'auto' }}>
        {badge ? <Badge label={badge.label} tone={badge.tone} /> : null}
        {trend ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 3 }}>
            {trend.direction !== 'flat' ? (
              <Icon name={trend.direction === 'up' ? 'arrowUp' : 'arrowDown'} size={12} color={trendColor} />
            ) : null}
            <AppText variant="help" color={trendColor}>
              {trend.label}
            </AppText>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
