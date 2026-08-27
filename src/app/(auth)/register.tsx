import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { showAlert } from '@/lib/alert';
import { supabase } from '@/lib/supabase';

export default function RegisterScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!email.trim() || password.length < 6) {
      showAlert('Vul een e-mailadres in en een wachtwoord van minstens 6 tekens');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      showAlert('Registreren mislukt', error.message);
      return;
    }
    // If email confirmations are disabled in the Supabase project, this
    // already signs the user in and the root layout will route them onward.
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.form}>
          <ThemedText type="title" style={styles.title}>
            Account maken
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Maak een account aan, en koppel het daarna aan jullie huishouden.
          </ThemedText>

          <TextInput
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            placeholder="E-mailadres"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            placeholder="Wachtwoord (min. 6 tekens)"
            placeholderTextColor={theme.textSecondary}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Pressable
            style={[styles.button, { opacity: loading ? 0.6 : 1 }]}
            disabled={loading}
            onPress={handleRegister}>
            <ThemedText type="smallBold" themeColor="background">
              {loading ? 'Bezig...' : 'Registreren'}
            </ThemedText>
          </Pressable>

          <Pressable style={styles.linkRow} onPress={() => router.push('/(auth)/login')}>
            <ThemedText type="link" themeColor="textSecondary">
              Al een account? <ThemedText type="linkPrimary">Log in</ThemedText>
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
