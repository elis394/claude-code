import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Radius, Spacing } from '@/constants/theme';

type AuthScreenProps = {
  title: string;
  subtitle: string;
  submitLabel: string;
  loading: boolean;
  onSubmit: () => void;
  linkPrompt: string;
  linkActionLabel: string;
  onLinkPress: () => void;
  children: ReactNode;
};

/** Shared shell for the login/register screens - logo, brand label,
 * title/subtitle, field slot, submit button, and the cross-link at the
 * bottom. The two screens differ only in copy, fields, and what submit/the
 * link do. */
export function AuthScreen({
  title,
  subtitle,
  submitLabel,
  loading,
  onSubmit,
  linkPrompt,
  linkActionLabel,
  onLinkPress,
  children,
}: AuthScreenProps) {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.form}>
          <Image source={require('@/assets/images/icon.png')} style={styles.logo} contentFit="cover" />
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.brand}>
            Flora Food
          </ThemedText>

          <ThemedText type="title" style={styles.title}>
            {title}
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            {subtitle}
          </ThemedText>

          <View style={styles.fields}>{children}</View>

          <Button onPress={onSubmit} loading={loading} style={styles.submit}>
            {submitLabel}
          </Button>

          <Pressable style={styles.linkRow} onPress={onLinkPress}>
            <ThemedText type="link" themeColor="textSecondary">
              {linkPrompt} <ThemedText type="linkPrimary">{linkActionLabel}</ThemedText>
            </ThemedText>
          </Pressable>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.four },
  form: {},
  logo: {
    width: 72,
    height: 72,
    borderRadius: Radius.lg,
    marginBottom: Spacing.two,
  },
  brand: { textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.four },
  title: { marginBottom: Spacing.one },
  subtitle: { marginBottom: Spacing.five },
  fields: { gap: Spacing.three },
  submit: { marginTop: Spacing.four },
  linkRow: { alignItems: 'center', marginTop: Spacing.four },
});
