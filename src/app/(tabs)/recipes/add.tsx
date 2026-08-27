import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
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
          <ThemedText type="small" themeColor="textSecondary">
            Link van een receptensite, YouTube, TikTok of Instagram
          </ThemedText>
          <View style={styles.urlRow}>
            <TextInput
              style={[styles.input, styles.urlInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
              placeholder="https://..."
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="none"
              keyboardType="url"
              value={url}
              onChangeText={setUrl}
            />
            <Pressable
              style={[styles.extractButton, { opacity: extractRecipe.isPending ? 0.6 : 1 }]}
              disabled={extractRecipe.isPending}
              onPress={handleExtract}>
              {extractRecipe.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText type="smallBold" themeColor="background">
                  Ophalen
                </ThemedText>
              )}
            </Pressable>
          </View>

          {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.preview} contentFit="cover" /> : null}

          <ThemedText type="smallBold" style={styles.sectionLabel}>
            Titel
          </ThemedText>
          <TextInput
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            placeholder="Titel van het recept"
            placeholderTextColor={theme.textSecondary}
            value={title}
            onChangeText={setTitle}
          />

          <ThemedText type="smallBold" style={styles.sectionLabel}>
            Porties
          </ThemedText>
          <TextInput
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            placeholder="bv. 4"
            placeholderTextColor={theme.textSecondary}
            keyboardType="number-pad"
            value={servings}
            onChangeText={setServings}
          />

          <ThemedText type="smallBold" style={styles.sectionLabel}>
            Ingrediënten
          </ThemedText>
          {ingredientRows.map((row) => (
            <View key={row.key} style={styles.ingredientRow}>
              <TextInput
                style={[styles.input, styles.qtyInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                placeholder="Aantal"
                placeholderTextColor={theme.textSecondary}
                value={row.quantity}
                onChangeText={(value) => updateRow(row.key, { quantity: value })}
                keyboardType="numbers-and-punctuation"
              />
              <TextInput
                style={[styles.input, styles.unitInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                placeholder="Eenheid"
                placeholderTextColor={theme.textSecondary}
                value={row.unit}
                onChangeText={(value) => updateRow(row.key, { unit: value })}
              />
              <TextInput
                style={[styles.input, styles.nameInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                placeholder="Ingrediënt"
                placeholderTextColor={theme.textSecondary}
                value={row.name}
                onChangeText={(value) => updateRow(row.key, { name: value })}
              />
              <Pressable onPress={() => removeRow(row.key)} style={styles.removeButton}>
                <Ionicons name="close-circle" size={22} color={theme.textSecondary} />
              </Pressable>
            </View>
          ))}
          <Pressable style={styles.addRowButton} onPress={() => setIngredientRows((rows) => [...rows, newRow()])}>
            <Ionicons name="add-circle-outline" size={20} color={theme.text} />
            <ThemedText type="link">Ingrediënt toevoegen</ThemedText>
          </Pressable>

          <ThemedText type="smallBold" style={styles.sectionLabel}>
            Bereidingswijze
          </ThemedText>
          <TextInput
            style={[styles.input, styles.multiline, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            placeholder="Stappen, of ruwe tekst uit een bijschrift die je zelf verder ordent..."
            placeholderTextColor={theme.textSecondary}
            multiline
            value={instructions}
            onChangeText={setInstructions}
          />

          <Pressable
            style={[styles.saveButton, { opacity: addRecipe.isPending ? 0.6 : 1 }]}
            disabled={addRecipe.isPending}
            onPress={handleSave}>
            <ThemedText type="smallBold" themeColor="background">
              {addRecipe.isPending ? 'Opslaan...' : 'Recept opslaan'}
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
  scroll: { padding: Spacing.three, gap: Spacing.two, paddingBottom: Spacing.six },
  urlRow: { flexDirection: 'row', gap: Spacing.two },
  urlInput: { flex: 1 },
  extractButton: {
    backgroundColor: '#3c87f7',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: { width: '100%', height: 180, borderRadius: Spacing.three, marginTop: Spacing.two },
  sectionLabel: { marginTop: Spacing.three },
  input: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  multiline: { minHeight: 140, textAlignVertical: 'top' },
  ingredientRow: { flexDirection: 'row', gap: Spacing.one, alignItems: 'center' },
  qtyInput: { width: 64 },
  unitInput: { width: 72 },
  nameInput: { flex: 1 },
  removeButton: { padding: Spacing.one },
  addRowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  saveButton: {
    backgroundColor: '#3c87f7',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.four,
  },
});
