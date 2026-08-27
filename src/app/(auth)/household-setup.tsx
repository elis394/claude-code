import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
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
      Alert.alert('Geef je huishouden een naam');
      return;
    }
    try {
      await createHousehold.mutateAsync(householdName.trim());
    } catch (error) {
      Alert.alert('Aanmaken mislukt', error instanceof Error ? error.message : 'Onbekende fout');
    }
  }

  async function handleJoin() {
    if (!inviteCode.trim()) {
      Alert.alert('Vul de uitnodigingscode van je partner in');
      return;
    }
    try {
      await joinHousehold.mutateAsync(inviteCode.trim());
    } catch (error) {
      Alert.alert('Joinen mislukt', error instanceof Error ? error.message : 'Onbekende fout');
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.form}>
          <ThemedText type="title" style={styles.title}>
            Huishouden
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Ingelogd als {session?.user.email}. Maak een nieuw huishouden aan, of join dat van je
            partner met een uitnodigingscode.
          </ThemedText>

          <ThemedView type="backgroundElement" style={styles.tabRow}>
            <Pressable
              style={[styles.tabButton, mode === 'create' && { backgroundColor: theme.backgroundSelected }]}
              onPress={() => setMode('create')}>
              <ThemedText type="smallBold">Nieuw huishouden</ThemedText>
            </Pressable>
            <Pressable
              style={[styles.tabButton, mode === 'join' && { backgroundColor: theme.backgroundSelected }]}
              onPress={() => setMode('join')}>
              <ThemedText type="smallBold">Huishouden joinen</ThemedText>
            </Pressable>
          </ThemedView>

          {mode === 'create' ? (
            <>
              <TextInput
                style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                placeholder="Naam huishouden (bv. 'Thuis')"
                placeholderTextColor={theme.textSecondary}
                value={householdName}
                onChangeText={setHouseholdName}
              />
              <Pressable
                style={[styles.button, { opacity: busy ? 0.6 : 1 }]}
                disabled={busy}
                onPress={handleCreate}>
                <ThemedText type="smallBold" themeColor="background">
                  {busy ? 'Bezig...' : 'Aanmaken'}
                </ThemedText>
              </Pressable>
            </>
          ) : (
            <>
              <TextInput
                style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                placeholder="Uitnodigingscode"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="characters"
                value={inviteCode}
                onChangeText={setInviteCode}
              />
              <Pressable
                style={[styles.button, { opacity: busy ? 0.6 : 1 }]}
                disabled={busy}
                onPress={handleJoin}>
                <ThemedText type="smallBold" themeColor="background">
                  {busy ? 'Bezig...' : 'Joinen'}
                </ThemedText>
              </Pressable>
            </>
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
  form: { gap: Spacing.three },
  title: { marginBottom: Spacing.one },
  tabRow: {
    flexDirection: 'row',
    borderRadius: Spacing.two,
    padding: Spacing.half,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  input: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#3c87f7',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  linkRow: { alignItems: 'center', marginTop: Spacing.two },
});
