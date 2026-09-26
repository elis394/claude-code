import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { Pressable } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

function RecipeBackButton() {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/recipes'))}
      hitSlop={8}>
      <Ionicons name="chevron-back" size={28} color={theme.primary} />
    </Pressable>
  );
}

export default function RecipesLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Recepten' }} />
      <Stack.Screen name="add" options={{ title: 'Recept toevoegen', presentation: 'modal' }} />
      <Stack.Screen name="[id]" options={{ title: 'Recept', headerLeft: RecipeBackButton }} />
    </Stack>
  );
}
