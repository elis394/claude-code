import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'title'
    | 'small'
    | 'smallBold'
    | 'subtitle'
    | 'label'
    | 'link'
    | 'linkPrimary'
    | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const defaultColor = type === 'linkPrimary' ? 'primary' : 'text';
  const defaultFont = type === 'code' ? Fonts.mono : Fonts.sans;

  return (
    <Text
      style={[
        { color: theme[themeColor ?? defaultColor], fontFamily: defaultFont },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'label' && styles.label,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

// Roughly follows Apple's Dynamic Type scale (Large Title / Title 2 /
// Headline / Body / Subheadline / Footnote / Caption).
const styles = StyleSheet.create({
  small: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: 400,
  },
  smallBold: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: 600,
  },
  default: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: 400,
  },
  title: {
    fontSize: 34,
    fontWeight: 700,
    lineHeight: 41,
    letterSpacing: 0.4,
  },
  subtitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: 700,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  link: {
    lineHeight: 22,
    fontSize: 17,
  },
  linkPrimary: {
    lineHeight: 22,
    fontSize: 17,
    fontWeight: 600,
  },
  code: {
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});
