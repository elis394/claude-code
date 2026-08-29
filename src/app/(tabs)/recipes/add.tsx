import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { showAlert } from '@/lib/alert';
import { useAddRecipe, useExtractRecipe } from '@/lib/queries';
import type { NewIngredientInput, SourceType } from '@/lib/types';
import { useCurrentHousehold } from '@/lib/use-current-household';

type IngredientRow = { key: string; name: string; quantity: string; unit: string };

let rowIdCounter = 0;
function newRow(partial?: Partial<IngredientRow>): IngredientRow {
  rowIdCounter += 1;
  return { key: `row-${rowIdCounter}`, name: '', quantity: '', unit: '', ...partial };
}

export default function AddRecipeScreen() {
  const theme = useTheme();
  const { householdId, userId } = useCurrentHousehold();
  const extractRecipe = useExtractRecipe();
  const addRecipe = useAddRecipe();

  const [url, setUrl] = useState('');
  const [sourceType, setSourceType] = useState<SourceType>('manual');
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [servings, setServings] = useState('');
  const [instructions, setInstructions] = useState('');
  const [ingredientRows, setIngredientRows] = useState<IngredientRow[]>([newRow()]);

  async function handleExtract() {
    if (!url.trim()) {
      showAlert('Plak eerst een link');
      return;
    }
    try {
      const result = await extractRecipe.mutateAsync(url.trim());
      setSourceType(result.sourceType);
      if (result.title) setTitle(result.title);
      if (result.imageUrl) setImageUrl(result.imageUrl);
      if (result.servings) setServings(String(result.servings));
      if (result.instructions) setInstructions(result.instructions);
      if (result.ingredients.length > 0) {
        setIngredientRows(
          result.ingredients.map((ing) =>
            newRow({
              name: ing.name,
              quantity: ing.quantity !== null ? String(ing.quantity) : '',
              unit: ing.unit ?? '',
            })
          )
        );
      }
      if (!result.title && result.ingredients.length === 0 && !result.instructions) {
        showAlert(
          'Kon niets automatisch ophalen',
          'Vul het recept hieronder handmatig aan. De link blijft bewaard als bron.'
        );
      }
    } catch (error) {
      showAlert(
        'Ophalen mislukt',
        error instanceof Error ? error.message : 'Vul het recept handmatig in.'
      );
    }
  }

  function updateRow(key: string, patch: Partial<IngredientRow>) {
    setIngredientRows((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function removeRow(key: string) {
    setIngredientRows((rows) => (rows.length > 1 ? rows.filter((row) => row.key !== key) : rows));
  }

  async function handleSave() {
    if (!title.trim()) {
      showAlert('Geef het recept een titel');
      return;
    }
    if (!householdId) return;

    const ingredients: NewIngredientInput[] = ingredientRows
      .filter((row) => row.name.trim().length > 0)
      .map((row) => ({
        name: row.name.trim(),
        quantity: row.quantity.trim() ? parseFloat(row.quantity.replace(',', '.')) : null,
        unit: row.unit.trim() ? row.unit.trim() : null,
      }));

    try {
      const recipe = await addRecipe.mutateAsync({
        householdId,
        userId,
        title: title.trim(),
        sourceUrl: url.trim() ? url.trim() : null,
        sourceType,
        imageUrl,
        instructions: instructions.trim() ? instructions.trim() : null,
        servings: servings.trim() ? parseInt(servings, 10) : null,
        ingredients,
      });
      router.replace(`/(tabs)/recipes/${recipe.id}`);
    } catch (error) {
      showAlert('Opslaan mislukt', error instanceof Error ? error.message : 'Onbekende fout');
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <ThemedText type="label" themeColor="textSecondary">
            Link
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
            Van een receptensite, YouTube, TikTok of Instagram
          </ThemedText>
          <View style={styles.urlRow}>
            <TextField
              style={styles.urlInput}
              placeholder="https://..."
              autoCapitalize="none"
              keyboardType="url"
              value={url}
              onChangeText={setUrl}
            />
            <Button onPress={handleExtract} loading={extractRecipe.isPending} style={styles.extractButton}>
              Ophalen
            </Button>
          </View>

          {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.preview} contentFit="cover" /> : null}

          <ThemedText type="label" themeColor="textSecondary" style={styles.sectionLabel}>
            Titel
          </ThemedText>
          <TextField placeholder="Titel van het recept" value={title} onChangeText={setTitle} />

          <ThemedText type="label" themeColor="textSecondary" style={styles.sectionLabel}>
            Porties
          </ThemedText>
          <TextField
            placeholder="bv. 4"
            keyboardType="number-pad"
            value={servings}
            onChangeText={setServings}
            style={styles.servingsInput}
          />

          <ThemedText type="label" themeColor="textSecondary" style={styles.sectionLabel}>
            Ingrediënten
          </ThemedText>
          <View style={styles.ingredientList}>
            {ingredientRows.map((row) => (
              <View key={row.key} style={styles.ingredientRow}>
                <TextField
                  style={styles.qtyInput}
                  placeholder="Aantal"
                  value={row.quantity}
                  onChangeText={(value) => updateRow(row.key, { quantity: value })}
                  keyboardType="numbers-and-punctuation"
                />
                <TextField
                  style={styles.unitInput}
                  placeholder="Eenheid"
                  value={row.unit}
                  onChangeText={(value) => updateRow(row.key, { unit: value })}
                />
                <TextField
                  style={styles.nameInput}
                  placeholder="Ingrediënt"
                  value={row.name}
                  onChangeText={(value) => updateRow(row.key, { name: value })}
                />
                <Pressable onPress={() => removeRow(row.key)} style={styles.removeButton} hitSlop={8}>
                  <Ionicons name="close-circle" size={22} color={theme.textSecondary} />
                </Pressable>
              </View>
            ))}
          </View>
          <Pressable style={styles.addRowButton} onPress={() => setIngredientRows((rows) => [...rows, newRow()])}>
            <Ionicons name="add-circle-outline" size={20} color={theme.primary} />
            <ThemedText type="linkPrimary">Ingrediënt toevoegen</ThemedText>
          </Pressable>

          <ThemedText type="label" themeColor="textSecondary" style={styles.sectionLabel}>
            Bereidingswijze
          </ThemedText>
          <TextField
            style={styles.multiline}
            placeholder="Stappen, of ruwe tekst uit een bijschrift die je zelf verder ordent..."
            multiline
            value={instructions}
            onChangeText={setInstructions}
          />

          <Button onPress={handleSave} loading={addRecipe.isPending} style={styles.saveButton}>
            Recept opslaan
          </Button>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { padding: Spacing.four, paddingBottom: Spacing.six },
  hint: { marginTop: Spacing.half, marginBottom: Spacing.two },
  urlRow: { flexDirection: 'row', gap: Spacing.two },
  urlInput: { flex: 1, minWidth: 0 },
  extractButton: { paddingHorizontal: Spacing.four },
  preview: { width: '100%', height: 190, borderRadius: Radius.lg, marginTop: Spacing.three },
  sectionLabel: { marginTop: Spacing.five, marginBottom: Spacing.two },
  servingsInput: { alignSelf: 'flex-start', minWidth: 96 },
  ingredientList: { gap: Spacing.two },
  ingredientRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  qtyInput: { width: 68, paddingHorizontal: Spacing.two },
  unitInput: { width: 76, paddingHorizontal: Spacing.two },
  nameInput: { flex: 1, minWidth: 0 },
  removeButton: { padding: Spacing.one },
  addRowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.three,
  },
  multiline: { minHeight: 140, textAlignVertical: 'top' },
  saveButton: { marginTop: Spacing.five },
});
