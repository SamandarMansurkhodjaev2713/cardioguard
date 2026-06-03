/**
 * Pre-hydration splash. Shown by the root layout while fonts load and persisted
 * state hydrates. Uses skeleton shapes + the brand tile only — no text — so it
 * renders correctly before fonts are ready and outside the ThemeProvider (fixed
 * light palette). Mimics the dashboard layout so the swap to real content is
 * visually smooth.
 */

import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { palette } from '../theme/tokens';
import { Skeleton } from './Skeleton';

const BLOCK = palette.surface2;

function BrandTile() {
  return (
    <LinearGradient
      colors={[palette.primary, palette.primary800]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={{ width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg width={25} height={25} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 3 4.8 6.1v5.1c0 4.4 3 7.5 7.2 8.6 4.2-1.1 7.2-4.2 7.2-8.6V6.1L12 3z" />
        <Path d="M7.5 12.3h2l1.3-3.4 1.8 5.2 1.1-2.5h2.3" />
      </Svg>
    </LinearGradient>
  );
}

function TileSkeleton() {
  return (
    <View
      style={{
        width: '47%',
        flexGrow: 1,
        minHeight: 116,
        backgroundColor: palette.surface,
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: 16,
        padding: 14,
        rowGap: 10,
      }}
    >
      <Skeleton width="60%" height={12} color={BLOCK} />
      <Skeleton width="45%" height={24} color={BLOCK} />
      <Skeleton width="35%" height={16} radius={999} color={BLOCK} style={{ marginTop: 'auto' }} />
    </View>
  );
}

export function AppLoading() {
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ width: '100%', maxWidth: 440, alignSelf: 'center', flex: 1, paddingHorizontal: 18, paddingTop: 64 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 12, marginBottom: 28 }}>
          <BrandTile />
          <View style={{ flex: 1, rowGap: 8 }}>
            <Skeleton width="55%" height={16} color={BLOCK} />
            <Skeleton width="38%" height={12} color={BLOCK} />
          </View>
        </View>

        {/* Metric tiles */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <TileSkeleton />
          <TileSkeleton />
          <TileSkeleton />
          <TileSkeleton />
        </View>

        {/* List rows */}
        <View style={{ marginTop: 24, rowGap: 14 }}>
          <Skeleton width="40%" height={14} color={BLOCK} />
          <Skeleton width="100%" height={56} color={palette.surface} style={{ borderWidth: 1, borderColor: palette.border }} />
          <Skeleton width="100%" height={56} color={palette.surface} style={{ borderWidth: 1, borderColor: palette.border }} />
        </View>
      </View>
    </View>
  );
}
