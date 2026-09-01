import { StyleSheet, View, type ViewProps } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** iOS grouped-table card: flat, distinguished from the page background by
 * fill color alone (no shadow) — see Settings.app for the reference look. */
export function Card({ style, ...rest }: ViewProps) {
  const theme = useTheme();
  return <View style={[styles.card, { backgroundColor: theme.surface }, style]} {...rest} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    padding: Spacing.four,
  },
});
