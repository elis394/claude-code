import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
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
          <View style={[styles.logo, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="restaurant" size={28} color={theme.primary} />
          </View>

          <ThemedText type="title" style={styles.title}>
            Account maken
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            Maak een account aan, en koppel het daarna aan jullie huishouden.
          </ThemedText>

          <View style={styles.fields}>
            <TextField
              placeholder="E-mailadres"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextField
              placeholder="Wachtwoord (min. 6 tekens)"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <Button onPress={handleRegister} loading={loading} style={styles.submit}>
            Registreren
          </Button>

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
  fields: { gap: Spacing.three },
  submit: { marginTop: Spacing.four },
  linkRow: { alignItems: 'center', marginTop: Spacing.four },
});
