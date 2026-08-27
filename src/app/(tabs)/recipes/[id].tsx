import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useDeleteRecipe, useRecipe } from '@/lib/queries';
import { useCurrentHousehold } from '@/lib/use-current-household';

function formatQuantity(quantity: number | null) {
  if (quantity === null) return '';
  return Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(2).replace(/\.?0+$/, '');
}

export default function RecipeDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { householdId } = useCurrentHousehold();
  const { data: recipe, isLoading } = useRecipe(id);
  const deleteRecipe = useDeleteRecipe(householdId);

  function handleDelete() {
    if (!recipe) return;
    Alert.alert('Recept verwijderen?', recipe.title, [
      { text: 'Annuleren', style: 'cancel' },
      {
        text: 'Verwijderen',
        style: 'destructive',
        onPress: async () => {
          await deleteRecipe.mutateAsync(recipe.id);
          router.back();
        },
      },
    ]);
  }

  if (isLoading || !recipe) {
    return <ThemedView style={styles.container} />;
  }

  const ingredients = [...recipe.recipe_ingredients].sort((a, b) => a.position - b.position);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {recipe.image_url ? (
            <Image source={{ uri: recipe.image_url }} style={styles.image} contentFit="cover" />
          ) : null}

          <ThemedText type="title" style={styles.title}>
            {recipe.title}
          </ThemedText>

          {recipe.servings ? (
            <ThemedText type="small" themeColor="textSecondary">
              {recipe.servings} porties
            </ThemedText>
          ) : null}

          {recipe.source_url ? (
            <ExternalLink href={recipe.source_url as `${string}:${string}`} style={styles.sourceLink}>
              <ThemedText type="linkPrimary">Bekijk oorspronkelijke bron</ThemedText>
            </ExternalLink>
          ) : null}

          {ingredients.length > 0 && (
            <View style={styles.section}>
              <ThemedText type="smallBold" style={styles.sectionLabel}>
                Ingrediënten
              </ThemedText>
              {ingredients.map((ingredient) => (
                <ThemedText key={ingredient.id} style={styles.ingredientLine}>
                  {[formatQuantity(ingredient.quantity), ingredient.unit, ingredient.name]
                    .filter(Boolean)
                    .join(' ')}
                </ThemedText>
              ))}
            </View>
          )}

          {recipe.instructions ? (
            <View style={styles.section}>
              <ThemedText type="smallBold" style={styles.sectionLabel}>
                Bereidingswijze
              </ThemedText>
              <ThemedText>{recipe.instructions}</ThemedText>
            </View>
          ) : null}

          <Pressable style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color="#e05252" />
            <ThemedText style={{ color: '#e05252' }}>Recept verwijderen</ThemedText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { padding: Spacing.three, paddingBottom: Spacing.six },
  image: { width: '100%', height: 220, borderRadius: Spacing.three, marginBottom: Spacing.three },
  title: { marginBottom: Spacing.one },
  sourceLink: { marginTop: Spacing.one },
  section: { marginTop: Spacing.four, gap: Spacing.one },
  sectionLabel: { marginBottom: Spacing.one },
  ingredientLine: { lineHeight: 24 },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.five,
    alignSelf: 'center',
  },
});
