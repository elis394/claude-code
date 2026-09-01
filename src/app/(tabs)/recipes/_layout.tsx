import { Stack } from 'expo-router';

export default function RecipesLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Recepten' }} />
      <Stack.Screen name="add" options={{ title: 'Recept toevoegen', presentation: 'modal' }} />
      <Stack.Screen name="[id]" options={{ title: 'Recept' }} />
    </Stack>
  );
}
