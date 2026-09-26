import { router } from 'expo-router';
import { useState } from 'react';

import { AuthScreen } from '@/components/auth-screen';
import { TextField } from '@/components/ui/text-field';
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
    <AuthScreen
      title="Inloggen"
      subtitle="Log in om jullie recepten en boodschappenlijst te zien."
      submitLabel="Inloggen"
      loading={loading}
      onSubmit={handleLogin}
      linkPrompt="Nog geen account?"
      linkActionLabel="Registreer"
      onLinkPress={() => router.push('/(auth)/register')}>
      <TextField
        placeholder="E-mailadres"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextField placeholder="Wachtwoord" secureTextEntry value={password} onChangeText={setPassword} />
    </AuthScreen>
  );
}
