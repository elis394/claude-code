import * as Clipboard from 'expo-clipboard';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useCurrentHousehold } from '@/lib/use-current-household';

export default function AccountScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const { household } = useCurrentHousehold();

  async function copyInviteCode() {
    if (!household) return;
    await Clipboard.setStringAsync(household.invite_code);
    Alert.alert('Gekopieerd', 'Uitnodigingscode staat op je klembord.');
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedText type="title" style={styles.title}>
          Account
        </ThemedText>

        <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="small" themeColor="textSecondary">
            Ingelogd als
          </ThemedText>
          <ThemedText type="smallBold">{session?.user.email}</ThemedText>
        </View>

        {household && (
          <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="small" themeColor="textSecondary">
              Huishouden
            </ThemedText>
            <ThemedText type="smallBold">{household.name}</ThemedText>

            <ThemedText type="small" themeColor="textSecondary" style={styles.inviteLabel}>
              Uitnodigingscode voor je partner
            </ThemedText>
            <Pressable onPress={copyInviteCode} style={styles.inviteRow}>
              <ThemedText type="title" style={styles.inviteCode}>
                {household.invite_code}
              </ThemedText>
              <ThemedText type="link" themeColor="textSecondary">
                Tik om te kopiëren
              </ThemedText>
            </Pressable>
          </View>
        )}

        <Pressable style={styles.signOutButton} onPress={() => supabase.auth.signOut()}>
          <ThemedText style={{ color: '#e05252' }}>Uitloggen</ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.three },
  title: { marginTop: Spacing.two, marginBottom: Spacing.three },
  card: { borderRadius: Spacing.three, padding: Spacing.three, marginBottom: Spacing.three, gap: Spacing.one },
  inviteLabel: { marginTop: Spacing.two },
  inviteRow: { alignItems: 'center', gap: Spacing.half, paddingVertical: Spacing.two },
  inviteCode: { letterSpacing: 4 },
  signOutButton: { alignItems: 'center', marginTop: Spacing.four },
});
