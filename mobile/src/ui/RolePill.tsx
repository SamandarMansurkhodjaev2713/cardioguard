/**
 * Role pill (`.cg-role`) — small identity chip shown in screen headers. Blue for
 * the patient, teal for the doctor / researcher.
 */

import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import type { UserRole } from '../domain/types';
import { AppText } from './AppText';
import { Icon } from './Icon';

export function RolePill({ label, role = 'patient' }: { readonly label: string; readonly role?: UserRole }) {
  const theme = useTheme();
  const isDoctor = role === 'doctor';
  const bg = isDoctor ? theme.colors.tealSoft : theme.colors.primarySoft;
  const fg = isDoctor ? theme.colors.teal700 : theme.colors.primary700;
  const bd = isDoctor ? theme.colors.tealBorder : theme.colors.primarySoft2;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 6,
        paddingVertical: 4,
        paddingHorizontal: 9,
        borderRadius: 999,
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: bd,
      }}
    >
      <Icon name={isDoctor ? 'stethoscope' : 'user'} size={13} color={fg} />
      <AppText style={{ fontFamily: theme.font.semibold, fontSize: 12, color: fg }}>{label}</AppText>
    </View>
  );
}
