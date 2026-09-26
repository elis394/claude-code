import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { showAlert } from '@/lib/alert';
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
    showAlert('Gekopieerd', 'Uitnodigingscode staat op je klembord.');
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedText type="title" style={styles.title}>
          Account
        </ThemedText>

        <Card style={styles.card}>
          <View style={[styles.avatar, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="person" size={20} color={theme.primary} />
          </View>
          <View style={styles.cardText}>
            <ThemedText type="small" themeColor="textSecondary">
              Ingelogd als
            </ThemedText>
            <ThemedText type="smallBold">{session?.user.email}</ThemedText>
          </View>
        </Card>

        {household && (
          <Card style={styles.householdCard}>
            <View style={styles.householdHeader}>
              <View style={[styles.avatar, { backgroundColor: theme.secondarySoft }]}>
                <Ionicons name="home" size={20} color={theme.secondary} />
              </View>
              <View style={styles.cardText}>
                <ThemedText type="small" themeColor="textSecondary">
                  Huishouden
                </ThemedText>
                <ThemedText type="smallBold">{household.name}</ThemedText>
              </View>
            </View>

            <ThemedText type="label" themeColor="textSecondary" style={styles.inviteLabel}>
              Uitnodigingscode voor je partner
            </ThemedText>
            <Pressable
              onPress={copyInviteCode}
              style={[styles.inviteChip, { backgroundColor: theme.primarySoft }]}>
              <ThemedText type="subtitle" themeColor="primary" style={styles.inviteCode}>
                {household.invite_code}
              </ThemedText>
              <Ionicons name="copy-outline" size={16} color={theme.primary} />
            </Pressable>
          </Card>
        )}

        <Pressable style={styles.signOutButton} onPress={() => supabase.auth.signOut()}>
          <Ionicons name="log-out-outline" size={18} color={theme.danger} />
          <ThemedText type="smallBold" themeColor="danger">
            Uitloggen
          </ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four },
  title: { marginTop: Spacing.three, marginBottom: Spacing.four },
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, marginBottom: Spacing.three },
  householdCard: { marginBottom: Spacing.three },
  householdHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { gap: Spacing.half },
  inviteLabel: { marginTop: Spacing.four, marginBottom: Spacing.two },
  inviteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
    paddingVertical: Spacing.three,
  },
  inviteCode: { letterSpacing: 4 },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    marginTop: Spacing.four,
  },
});
