import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing } from '@/constants/theme';
import { showAlert } from '@/lib/alert';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      showAlert('Vul e-mail en wachtwoord in');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      showAlert('Inloggen mislukt', error.message);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.form}>
          <Image source={require('@/assets/images/icon.png')} style={styles.logo} contentFit="cover" />
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.brand}>
            Flora Food
          </ThemedText>

          <ThemedText type="title" style={styles.title}>
            Inloggen
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            Log in om jullie recepten en boodschappenlijst te zien.
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
              placeholder="Wachtwoord"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <Button onPress={handleLogin} loading={loading} style={styles.submit}>
            Inloggen
          </Button>

          <Pressable style={styles.linkRow} onPress={() => router.push('/(auth)/register')}>
            <ThemedText type="link" themeColor="textSecondary">
              Nog geen account? <ThemedText type="linkPrimary">Registreer</ThemedText>
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
