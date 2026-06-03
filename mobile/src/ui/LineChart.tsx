/**
 * Clinical multi-series line chart (react-native-svg).
 *
 * Features: smooth (Catmull-Rom) curves with a soft gradient area fill, optional
 * reference zones (e.g. the BP target band), an end-point marker per series, and
 * tap-to-inspect — touch/drag across the plot to pin a vertical guide with the
 * value(s) and date for that day. Actual data points are always marked so the
 * smoothing never hides a real reading. Width is measured responsively.
 */

import { useState } from 'react';
import {
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';

export interface ChartSeries {
  readonly points: readonly number[];
  readonly color: string;
  /** Draw a gradient area under the line. */
  readonly area?: boolean;
}

export interface ReferenceZone {
  readonly from: number;
  readonly to: number;
  readonly color: string;
}

export interface LineChartProps {
  readonly series: readonly ChartSeries[];
  readonly labels: readonly string[];
  readonly height?: number;
  readonly zones?: readonly ReferenceZone[];
  /** Pre-formatted date per index, shown in the inspect tooltip. */
  readonly dates?: readonly string[];
  readonly unit?: string;
  /** Screen-reader summary of the series (the SVG itself isn't readable). */
  readonly accessibilityLabel?: string;
}

const PAD = { left: 10, right: 46, top: 16, bottom: 24 } as const;

function niceFloor(v: number, step: number): number {
  return Math.floor(v / step) * step;
}
function niceCeil(v: number, step: number): number {
  return Math.ceil(v / step) * step;
}

/** Catmull-Rom → cubic bézier smoothing. */
function smoothPath(pts: ReadonlyArray<{ x: number; y: number }>): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export function LineChart({ series, labels, height = 184, zones, dates, unit, accessibilityLabel }: LineChartProps) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  // y-range is derived from the data only; zones are decorative overlays clamped
  // to the plot so they never distort the scale.
  const all = series.flatMap((s) => [...s.points]);
  const dataMin = all.length ? Math.min(...all) : 0;
  const dataMax = all.length ? Math.max(...all) : 1;
  const step = dataMax - dataMin > 40 ? 10 : 5;
  const yMin = niceFloor(dataMin - step / 2, step);
  const yMax = niceCeil(dataMax + step / 2, step);

  const n = labels.length;
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = height - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (n > 1 ? (plotW * i) / (n - 1) : plotW / 2);
  const y = (v: number) => PAD.top + plotH * (1 - (v - yMin) / (yMax - yMin || 1));

  const handleTouch = (e: GestureResponderEvent) => {
    if (n < 1 || plotW <= 0) return;
    const localX = e.nativeEvent.locationX - PAD.left;
    const idx = Math.round((localX / plotW) * (n - 1));
    setActive(Math.max(0, Math.min(n - 1, idx)));
  };

  return (
    <View
      onLayout={onLayout}
      style={{ width: '100%', height }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handleTouch}
      onResponderMove={handleTouch}
    >
      {width > 0 ? (
        <Svg width={width} height={height}>
          <Defs>
            {series.map((s, si) => (
              <LinearGradient key={si} id={`cg-grad-${si}`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={s.color} stopOpacity={0.16} />
                <Stop offset="1" stopColor={s.color} stopOpacity={0} />
              </LinearGradient>
            ))}
          </Defs>

          {/* reference zones (clamped to the plot) */}
          {(zones ?? []).map((z, zi) => {
            const top = Math.max(PAD.top, Math.min(PAD.top + plotH, y(z.to)));
            const bottom = Math.max(PAD.top, Math.min(PAD.top + plotH, y(z.from)));
            return <Rect key={`z${zi}`} x={PAD.left} y={top} width={plotW} height={Math.max(0, bottom - top)} fill={z.color} />;
          })}

          {/* gridlines + axis labels */}
          {[yMax, yMin].map((gv) => (
            <Line key={`g${gv}`} x1={PAD.left} y1={y(gv)} x2={PAD.left + plotW} y2={y(gv)} stroke={theme.colors.hairline} strokeWidth={1} />
          ))}
          {[yMax, yMin].map((gv) => (
            <SvgText key={`gl${gv}`} x={width - PAD.right + 8} y={y(gv) + 4} fontSize={11} fill={theme.colors.text3} fontFamily={theme.font.regular}>
              {gv}
            </SvgText>
          ))}

          {/* area fills */}
          {series.map((s, si) => {
            if (!s.area || s.points.length < 2) return null;
            const pts = s.points.map((v, i) => ({ x: x(i), y: y(v) }));
            const baseline = PAD.top + plotH;
            const area = `${smoothPath(pts)} L ${pts[pts.length - 1].x} ${baseline} L ${pts[0].x} ${baseline} Z`;
            return <Path key={`a${si}`} d={area} fill={`url(#cg-grad-${si})`} />;
          })}

          {/* active guide */}
          {active !== null ? (
            <Line x1={x(active)} y1={PAD.top} x2={x(active)} y2={PAD.top + plotH} stroke={theme.colors.border2} strokeWidth={1} strokeDasharray="3 3" />
          ) : null}

          {/* series lines */}
          {series.map((s, si) => (
            <Path
              key={`l${si}`}
              d={smoothPath(s.points.map((v, i) => ({ x: x(i), y: y(v) })))}
              fill="none"
              stroke={s.color}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* markers (end point, or active point when inspecting) */}
          {series.map((s, si) => {
            const last = s.points.length - 1;
            if (last < 0) return null;
            const markerIndex = active ?? last;
            return (
              <Circle key={`m${si}`} cx={x(markerIndex)} cy={y(s.points[markerIndex])} r={3.6} fill="#FFFFFF" stroke={s.color} strokeWidth={2.5} />
            );
          })}
          {active === null
            ? series.map((s, si) => {
                const last = s.points.length - 1;
                if (last < 0) return null;
                return (
                  <SvgText key={`v${si}`} x={x(last) + 8} y={y(s.points[last]) + 4} fontSize={12} fontWeight="600" fill={s.color} fontFamily={theme.font.semibold}>
                    {s.points[last]}
                  </SvgText>
                );
              })
            : null}

          {/* x labels */}
          {labels.map((label, i) => (
            <SvgText key={`x${i}`} x={x(i)} y={height - 6} fontSize={11} fill={i === active ? theme.colors.text : theme.colors.text3} textAnchor="middle" fontFamily={i === active ? theme.font.semibold : theme.font.regular}>
              {label}
            </SvgText>
          ))}
        </Svg>
      ) : null}

      {/* inspect tooltip (RN overlay) */}
      {active !== null && width > 0 ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: Math.max(4, Math.min(width - 116, x(active) - 58)),
            width: 112,
            backgroundColor: theme.colors.ink,
            borderRadius: 10,
            paddingHorizontal: 10,
            paddingVertical: 7,
          }}
        >
          {dates?.[active] ? (
            <AppText style={{ color: '#AEC2DC', fontSize: 11, fontFamily: theme.font.medium }}>{dates[active]}</AppText>
          ) : null}
          {series.map((s, si) => (
            <View key={si} style={{ flexDirection: 'row', alignItems: 'center', columnGap: 6, marginTop: 2 }}>
              <View style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: s.color }} />
              <AppText tabular style={{ color: '#FFFFFF', fontSize: 13, fontFamily: theme.font.semibold }}>
                {s.points[active]}
                {unit ? <AppText style={{ color: '#AEC2DC', fontSize: 11 }}> {unit}</AppText> : null}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
