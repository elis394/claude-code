import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { showAlert } from '@/lib/alert';
import { useDeleteRecipe, useRecipe } from '@/lib/queries';
import { useCurrentHousehold } from '@/lib/use-current-household';

const quantityFormatter = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 2 });

function formatQuantity(quantity: number | null) {
  if (quantity === null) return '';
  return quantityFormatter.format(quantity);
}

type InstructionItem =
  | { kind: 'step'; number: number; text: string }
  | { kind: 'tip'; text: string };

const TIP_PREFIX = /^tip:?\s*/i;

function parseInstructionItems(instructions: string): InstructionItem[] {
  let stepNumber = 0;
  return instructions
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (TIP_PREFIX.test(line)) {
        return { kind: 'tip', text: line.replace(TIP_PREFIX, '') };
      }
      stepNumber += 1;
      return { kind: 'step', number: stepNumber, text: line };
    });
}

export default function RecipeDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { householdId } = useCurrentHousehold();
  const { data: recipe, isLoading } = useRecipe(id);
  const deleteRecipe = useDeleteRecipe(householdId);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());

  function toggleIngredient(ingredientId: string) {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(ingredientId)) {
        next.delete(ingredientId);
      } else {
        next.add(ingredientId);
      }
      return next;
    });
  }

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

  const ingredients = useMemo(
    () => [...(recipe?.recipe_ingredients ?? [])].sort((a, b) => a.position - b.position),
    [recipe?.recipe_ingredients]
  );
  const instructionItems = useMemo(
    () => (recipe?.instructions ? parseInstructionItems(recipe.instructions) : []),
    [recipe?.instructions]
  );

  if (isLoading || !recipe) {
    return (
      <ThemedView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator color={theme.primary} />
      </ThemedView>
    );
  }

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
                <View style={styles.sourceLink}>
                  <Ionicons name="link" size={13} color={theme.textSecondary} />
                  <ThemedText type="small" themeColor="textSecondary">
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
                {ingredients.map((ingredient) => {
                  const checked = checkedIngredients.has(ingredient.id);
                  return (
                    <Pressable
                      key={ingredient.id}
                      style={styles.ingredientRow}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked }}
                      accessibilityLabel={[formatQuantity(ingredient.quantity), ingredient.unit, ingredient.name]
                        .filter(Boolean)
                        .join(' ')}
                      onPress={() => toggleIngredient(ingredient.id)}>
                      <Ionicons
                        name={checked ? 'checkmark-circle' : 'ellipse-outline'}
                        size={22}
                        color={checked ? theme.secondary : theme.textSecondary}
                      />
                      <ThemedText
                        style={[
                          styles.ingredientLine,
                          checked && styles.ingredientLineChecked,
                          checked && { color: theme.textSecondary },
                        ]}>
                        {[formatQuantity(ingredient.quantity), ingredient.unit, ingredient.name]
                          .filter(Boolean)
                          .join(' ')}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {recipe.instructions ? (
            <View style={styles.section}>
              <ThemedText type="label" themeColor="textSecondary" style={styles.sectionLabel}>
                Bereidingswijze
              </ThemedText>
              <View style={styles.instructionList}>
                {instructionItems.map((item, index) =>
                  item.kind === 'tip' ? (
                    <View key={index} style={[styles.tipRow, { backgroundColor: theme.secondarySoft }]}>
                      <Ionicons name="bulb-outline" size={16} color={theme.secondary} />
                      <ThemedText type="small" style={styles.tipText}>
                        {item.text}
                      </ThemedText>
                    </View>
                  ) : (
                    <View key={index} style={styles.stepRow}>
                      <View style={[styles.stepNumber, { backgroundColor: theme.surfaceSelected }]}>
                        <ThemedText type="smallBold" themeColor="textSecondary">
                          {item.number}
                        </ThemedText>
                      </View>
                      <ThemedText style={styles.stepText}>{item.text}</ThemedText>
                    </View>
                  )
                )}
              </View>
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
  loadingContainer: { alignItems: 'center', justifyContent: 'center' },
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
  sourceLink: { flexDirection: 'row', alignItems: 'center', gap: Spacing.half, paddingVertical: Spacing.one },
  ingredientList: { gap: Spacing.one },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.one },
  ingredientLine: { lineHeight: 24, flex: 1 },
  ingredientLineChecked: { textDecorationLine: 'line-through' },
  instructionList: { gap: Spacing.three },
  stepRow: { flexDirection: 'row', gap: Spacing.three },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepText: { flex: 1, lineHeight: 26 },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  tipText: { flex: 1, fontStyle: 'italic', lineHeight: 20 },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.six,
    alignSelf: 'center',
  },
});
