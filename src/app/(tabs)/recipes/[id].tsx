import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { showAlert } from '@/lib/alert';
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
    showAlert('Recept verwijderen?', recipe.title, [
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
          ) : (
            <View style={[styles.image, styles.imagePlaceholder, { backgroundColor: theme.primarySoft }]}>
              <Ionicons name="restaurant" size={40} color={theme.primary} />
            </View>
          )}

          <ThemedText type="title" style={styles.title}>
            {recipe.title}
          </ThemedText>

          <View style={styles.metaRow}>
            {recipe.servings ? (
              <View style={[styles.pill, { backgroundColor: theme.surfaceSelected }]}>
                <Ionicons name="people-outline" size={14} color={theme.textSecondary} />
                <ThemedText type="small" themeColor="textSecondary">
                  {recipe.servings} porties
                </ThemedText>
              </View>
            ) : null}

            {recipe.source_url ? (
              <ExternalLink href={recipe.source_url as `${string}:${string}`}>
                <View style={[styles.pill, { backgroundColor: theme.primarySoft }]}>
                  <Ionicons name="link" size={14} color={theme.primary} />
                  <ThemedText type="small" themeColor="primary">
                    Bron
                  </ThemedText>
                </View>
              </ExternalLink>
            ) : null}
          </View>

          {ingredients.length > 0 && (
            <View style={styles.section}>
              <ThemedText type="label" themeColor="textSecondary" style={styles.sectionLabel}>
                Ingrediënten
              </ThemedText>
              <View style={styles.ingredientList}>
                {ingredients.map((ingredient) => (
                  <View key={ingredient.id} style={styles.ingredientRow}>
                    <View style={[styles.dot, { backgroundColor: theme.secondary }]} />
                    <ThemedText style={styles.ingredientLine}>
                      {[formatQuantity(ingredient.quantity), ingredient.unit, ingredient.name]
                        .filter(Boolean)
                        .join(' ')}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>
          )}

          {recipe.instructions ? (
            <View style={styles.section}>
              <ThemedText type="label" themeColor="textSecondary" style={styles.sectionLabel}>
                Bereidingswijze
              </ThemedText>
              <ThemedText style={styles.instructions}>{recipe.instructions}</ThemedText>
            </View>
          ) : null}

          <Pressable style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color={theme.danger} />
            <ThemedText type="smallBold" themeColor="danger">
              Recept verwijderen
            </ThemedText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { padding: Spacing.four, paddingBottom: Spacing.six },
  image: { width: '100%', height: 230, borderRadius: Radius.lg, marginBottom: Spacing.four },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  title: { marginBottom: Spacing.two },
  metaRow: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  section: { marginTop: Spacing.five },
  sectionLabel: { marginBottom: Spacing.two },
  ingredientList: { gap: Spacing.two },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  dot: { width: 6, height: 6, borderRadius: 3 },
  ingredientLine: { lineHeight: 24 },
  instructions: { lineHeight: 26 },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.six,
    alignSelf: 'center',
  },
});
