import { router } from 'expo-router';
import { useState } from 'react';

import { AuthScreen } from '@/components/auth-screen';
import { PasswordField } from '@/components/ui/password-field';
import { TextField } from '@/components/ui/text-field';
import { showAlert } from '@/lib/alert';
import { supabase } from '@/lib/supabase';

export default function RegisterScreen() {
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
    <AuthScreen
      title="Account maken"
      subtitle="Maak een account aan, en koppel het daarna aan jullie huishouden."
      submitLabel="Registreren"
      loading={loading}
      onSubmit={handleRegister}
      linkPrompt="Al een account?"
      linkActionLabel="Log in"
      onLinkPress={() => router.push('/(auth)/login')}>
      <TextField
        placeholder="E-mailadres"
        autoCapitalize="none"
        keyboardType="email-address"
        textContentType="emailAddress"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
      />
      <PasswordField
        placeholder="Wachtwoord (min. 6 tekens)"
        textContentType="newPassword"
        autoComplete="new-password"
        value={password}
        onChangeText={setPassword}
      />
    </AuthScreen>
  );
}
