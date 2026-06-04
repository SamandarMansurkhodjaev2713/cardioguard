/**
 * Labeled text field (`.cg-field` / `.cg-input`). Supports a focus ring, error
 * state, help text, a trailing unit suffix, and an optional password reveal.
 */

import { useState } from 'react';
import {
  Pressable,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type TextInputProps,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';
import { Icon } from './Icon';

export interface TextFieldProps {
  readonly label?: string;
  readonly value: string;
  readonly onChangeText: (value: string) => void;
  readonly placeholder?: string;
  readonly keyboardType?: KeyboardTypeOptions;
  readonly secure?: boolean;
  readonly error?: string;
  readonly help?: string;
  readonly suffix?: string;
  readonly autoCapitalize?: TextInputProps['autoCapitalize'];
  readonly maxLength?: number;
  readonly multiline?: boolean;
  readonly showPasswordLabel?: string;
  readonly hidePasswordLabel?: string;
  readonly onBlur?: () => void;
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secure = false,
  error,
  help,
  suffix,
  autoCapitalize = 'sentences',
  maxLength,
  multiline = false,
  showPasswordLabel = 'Показать пароль',
  hidePasswordLabel = 'Скрыть пароль',
  onBlur,
}: TextFieldProps) {
  const theme = useTheme();
  const { colors, radius, fontSize, font } = theme;
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const borderColor = error ? colors.high : focused ? colors.primary : colors.border2;

  return (
    <View style={{ rowGap: 6 }}>
      {label && <AppText variant="label">{label}</AppText>}

      <View
        style={{
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          minHeight: multiline ? 92 : 46,
          height: multiline ? undefined : 46,
          paddingHorizontal: 13,
          paddingVertical: multiline ? 10 : 0,
          borderRadius: radius.field,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.text3}
          keyboardType={keyboardType}
          secureTextEntry={secure && !revealed}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          style={{
            flex: 1,
            fontFamily: font.regular,
            fontSize: fontSize.body,
            color: colors.text,
            paddingVertical: 0,
            minHeight: multiline ? 72 : undefined,
            // Remove the browser focus ring on web (we render our own border).
            outlineWidth: 0,
          }}
        />

        {suffix && !secure && (
          <AppText variant="help" style={{ marginLeft: 6 }}>
            {suffix}
          </AppText>
        )}

        {secure && (
          <Pressable
            onPress={() => setRevealed((r) => !r)}
            accessibilityRole="button"
            accessibilityLabel={revealed ? hidePasswordLabel : showPasswordLabel}
            hitSlop={8}
            style={{ paddingLeft: 8 }}
          >
            <Icon name={revealed ? 'eyeOff' : 'eye'} size={18} color={colors.text3} />
          </Pressable>
        )}
      </View>

      {error ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 5 }}>
          <Icon name="alert" size={13} color={colors.high} />
          <AppText variant="help" color={colors.high}>
            {error}
          </AppText>
        </View>
      ) : help ? (
        <AppText variant="help">{help}</AppText>
      ) : null}
    </View>
  );
}
