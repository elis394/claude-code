import { forwardRef, useState } from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export const TextField = forwardRef<TextInput, TextInputProps>(function TextField(
  { style, onFocus, onBlur, ...rest },
  ref
) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      ref={ref}
      style={[
        styles.input,
        {
          color: theme.text,
          backgroundColor: theme.surface,
          borderColor: focused ? theme.primary : theme.border,
        },
        style,
      ]}
      placeholderTextColor={theme.textSecondary}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      {...rest}
    />
  );
});

const styles = StyleSheet.create({
  input: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
    fontFamily: Fonts.sans,
  },
});
