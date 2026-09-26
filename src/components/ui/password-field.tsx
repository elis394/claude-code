import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View, type TextInputProps } from 'react-native';

import { TextField } from '@/components/ui/text-field';
import { useTheme } from '@/hooks/use-theme';

/** TextField with a show/hide toggle — secureTextEntry is controlled internally. */
export function PasswordField({ style, ...rest }: Omit<TextInputProps, 'secureTextEntry'>) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrap}>
      <TextField {...rest} secureTextEntry={!visible} style={[styles.input, style]} />
      <Pressable
        onPress={() => setVisible((v) => !v)}
        style={styles.toggle}
        hitSlop={8}
        accessibilityLabel={visible ? 'Wachtwoord verbergen' : 'Wachtwoord tonen'}>
        <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { justifyContent: 'center' },
  input: { paddingRight: 44 },
  toggle: { position: 'absolute', right: 14 },
});
