import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { showAlert } from '@/lib/alert';
import { useAuth } from '@/lib/auth-context';
import { useCreateHousehold, useJoinHousehold } from '@/lib/queries';
import { supabase } from '@/lib/supabase';

export default function HouseholdSetupScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [householdName, setHouseholdName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const createHousehold = useCreateHousehold();
  const joinHousehold = useJoinHousehold();
  const busy = createHousehold.isPending || joinHousehold.isPending;

  async function handleCreate() {
    if (!householdName.trim()) {
      showAlert('Geef je huishouden een naam');
      return;
    }
    try {
      await createHousehold.mutateAsync(householdName.trim());
    } catch (error) {
      showAlert('Aanmaken mislukt', error instanceof Error ? error.message : 'Onbekende fout');
    }
  }

  async function handleJoin() {
    if (!inviteCode.trim()) {
      showAlert('Vul de uitnodigingscode van je partner in');
      return;
    }
    try {
      await joinHousehold.mutateAsync(inviteCode.trim());
    } catch (error) {
      showAlert('Joinen mislukt', error instanceof Error ? error.message : 'Onbekende fout');
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.form}>
          <View style={[styles.logo, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="home" size={28} color={theme.primary} />
          </View>

          <ThemedText type="title" style={styles.title}>
            Huishouden
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            Ingelogd als {session?.user.email}. Maak een nieuw huishouden aan, of join dat van je
            partner met een uitnodigingscode.
          </ThemedText>

          <View style={[styles.tabRow, { backgroundColor: theme.surfaceSelected }]}>
            <Pressable
              style={[
                styles.tabButton,
                mode === 'create' && [styles.tabButtonActive, Shadow.sm, { backgroundColor: theme.surface }],
              ]}
              onPress={() => setMode('create')}>
              <ThemedText type="smallBold" themeColor={mode === 'create' ? 'primary' : 'textSecondary'}>
                Nieuw huishouden
              </ThemedText>
            </Pressable>
            <Pressable
              style={[
                styles.tabButton,
                mode === 'join' && [styles.tabButtonActive, Shadow.sm, { backgroundColor: theme.surface }],
              ]}
              onPress={() => setMode('join')}>
              <ThemedText type="smallBold" themeColor={mode === 'join' ? 'primary' : 'textSecondary'}>
                Huishouden joinen
              </ThemedText>
            </Pressable>
          </View>

          {mode === 'create' ? (
            <View style={styles.fields}>
              <TextField
                placeholder="Naam huishouden (bv. 'Thuis')"
                value={householdName}
                onChangeText={setHouseholdName}
              />
              <Button onPress={handleCreate} loading={busy}>
                Aanmaken
              </Button>
            </View>
          ) : (
            <View style={styles.fields}>
              <TextField
                placeholder="Uitnodigingscode"
                autoCapitalize="characters"
                value={inviteCode}
                onChangeText={setInviteCode}
              />
              <Button onPress={handleJoin} loading={busy}>
                Joinen
              </Button>
            </View>
          )}

          <Pressable style={styles.linkRow} onPress={() => supabase.auth.signOut()}>
            <ThemedText type="link" themeColor="textSecondary">
              Uitloggen
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
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  title: { marginBottom: Spacing.one },
  subtitle: { marginBottom: Spacing.five },
  tabRow: {
    flexDirection: 'row',
    borderRadius: Radius.sm,
    padding: Spacing.half,
    marginBottom: Spacing.four,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Radius.sm - 2,
  },
  tabButtonActive: {
    borderCurve: 'continuous',
  },
  fields: { gap: Spacing.three },
  linkRow: { alignItems: 'center', marginTop: Spacing.four },
});
