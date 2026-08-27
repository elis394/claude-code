import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  useAddShoppingListItem,
  useClearShoppingList,
  useDeleteShoppingListItem,
  useGenerateShoppingList,
  useRecipes,
  useShoppingList,
  useToggleShoppingListItem,
} from '@/lib/queries';
import type { ShoppingListItem } from '@/lib/types';
import { useCurrentHousehold } from '@/lib/use-current-household';

export default function ShoppingListScreen() {
  const theme = useTheme();
  const { householdId } = useCurrentHousehold();
  const { data: recipes } = useRecipes(householdId);
  const { data: items } = useShoppingList(householdId);

  const generateList = useGenerateShoppingList(householdId);
  const toggleItem = useToggleShoppingListItem(householdId);
  const deleteItem = useDeleteShoppingListItem(householdId);
  const addManualItem = useAddShoppingListItem(householdId);
  const clearList = useClearShoppingList(householdId);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [manualName, setManualName] = useState('');
  const [manualQty, setManualQty] = useState('');
  const [manualUnit, setManualUnit] = useState('');

  const selectedCount = Object.values(selectedIds).filter(Boolean).length;

  const sortedItems = useMemo(() => {
    if (!items) return [];
    return [...items].sort((a, b) => Number(a.checked) - Number(b.checked));
  }, [items]);

  function toggleSelected(id: string) {
    setSelectedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function handleGenerate() {
    const ids = Object.entries(selectedIds)
      .filter(([, selected]) => selected)
      .map(([id]) => id);
    if (ids.length === 0) {
      Alert.alert('Selecteer eerst één of meer recepten');
      return;
    }
    await generateList.mutateAsync(ids);
    setPickerOpen(false);
    setSelectedIds({});
  }

  async function handleAddManual() {
    if (!manualName.trim()) return;
    await addManualItem.mutateAsync({
      name: manualName,
      quantity: manualQty.trim() ? parseFloat(manualQty.replace(',', '.')) : null,
      unit: manualUnit.trim() ? manualUnit.trim() : null,
    });
    setManualName('');
    setManualQty('');
    setManualUnit('');
  }

  function handleClear() {
    if (!items || items.length === 0) return;
    Alert.alert('Boodschappenlijst leegmaken?', undefined, [
      { text: 'Annuleren', style: 'cancel' },
      { text: 'Leegmaken', style: 'destructive', onPress: () => clearList.mutate() },
    ]);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <FlatList
          data={sortedItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View>
              <View style={styles.headerRow}>
                <ThemedText type="title">Boodschappen</ThemedText>
                {items && items.length > 0 && (
                  <Pressable onPress={handleClear}>
                    <ThemedText type="link" themeColor="textSecondary">
                      Leegmaken
                    </ThemedText>
                  </Pressable>
                )}
              </View>

              <Pressable
                style={[styles.pickerToggle, { backgroundColor: theme.backgroundElement }]}
                onPress={() => setPickerOpen((open) => !open)}>
                <ThemedText type="smallBold">
                  Recepten kiezen{selectedCount > 0 ? ` (${selectedCount})` : ''}
                </ThemedText>
                <Ionicons name={pickerOpen ? 'chevron-up' : 'chevron-down'} size={18} color={theme.text} />
              </Pressable>

              {pickerOpen && (
                <View style={[styles.picker, { backgroundColor: theme.backgroundElement }]}>
                  {(recipes ?? []).length === 0 ? (
                    <ThemedText type="small" themeColor="textSecondary">
                      Voeg eerst recepten toe in de Recepten-tab.
                    </ThemedText>
                  ) : (
                    recipes?.map((recipe) => (
                      <Pressable
                        key={recipe.id}
                        style={styles.pickerRow}
                        onPress={() => toggleSelected(recipe.id)}>
                        <Ionicons
                          name={selectedIds[recipe.id] ? 'checkbox' : 'square-outline'}
                          size={20}
                          color={theme.text}
                        />
                        <ThemedText style={styles.pickerRowText}>{recipe.title}</ThemedText>
                      </Pressable>
                    ))
                  )}
                  <Pressable
                    style={[styles.generateButton, { opacity: generateList.isPending ? 0.6 : 1 }]}
                    disabled={generateList.isPending}
                    onPress={handleGenerate}>
                    <ThemedText type="smallBold" themeColor="background">
                      {generateList.isPending ? 'Bezig...' : 'Genereer lijst'}
                    </ThemedText>
                  </Pressable>
                </View>
              )}

              <View style={styles.manualRow}>
                <TextInput
                  style={[styles.input, styles.qtyInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                  placeholder="#"
                  placeholderTextColor={theme.textSecondary}
                  value={manualQty}
                  onChangeText={setManualQty}
                />
                <TextInput
                  style={[styles.input, styles.unitInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                  placeholder="Eenh."
                  placeholderTextColor={theme.textSecondary}
                  value={manualUnit}
                  onChangeText={setManualUnit}
                />
                <TextInput
                  style={[styles.input, styles.nameInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                  placeholder="Item toevoegen..."
                  placeholderTextColor={theme.textSecondary}
                  value={manualName}
                  onChangeText={setManualName}
                  onSubmitEditing={handleAddManual}
                />
                <Pressable onPress={handleAddManual} style={styles.addButton}>
                  <Ionicons name="add-circle" size={30} color={theme.text} />
                </Pressable>
              </View>

              {sortedItems.length === 0 && (
                <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
                  Nog geen items. Kies recepten hierboven, of voeg zelf iets toe.
                </ThemedText>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <ShoppingRow
              item={item}
              onToggle={() => toggleItem.mutate({ id: item.id, checked: !item.checked })}
              onDelete={() => deleteItem.mutate(item.id)}
            />
          )}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

function ShoppingRow({
  item,
  onToggle,
  onDelete,
}: {
  item: ShoppingListItem;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const theme = useTheme();
  const line = [item.quantity, item.unit, item.name].filter(Boolean).join(' ');
  return (
    <View style={[styles.itemRow, { backgroundColor: theme.backgroundElement }]}>
      <Pressable style={styles.itemLeft} onPress={onToggle}>
        <Ionicons
          name={item.checked ? 'checkbox' : 'square-outline'}
          size={20}
          color={item.checked ? theme.textSecondary : theme.text}
        />
        <ThemedText
          style={[styles.itemText, item.checked && styles.itemTextChecked]}
          themeColor={item.checked ? 'textSecondary' : 'text'}>
          {line}
        </ThemedText>
      </Pressable>
      <Pressable onPress={onDelete}>
        <Ionicons name="close" size={18} color={theme.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.three },
  list: { paddingBottom: Spacing.six, gap: Spacing.one },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
    marginBottom: Spacing.three,
  },
  pickerToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  picker: {
    marginTop: Spacing.one,
    borderRadius: Spacing.two,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  pickerRowText: { flex: 1 },
  generateButton: {
    backgroundColor: '#3c87f7',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  manualRow: { flexDirection: 'row', gap: Spacing.one, marginTop: Spacing.three, alignItems: 'center' },
  input: { borderRadius: Spacing.two, paddingHorizontal: Spacing.two, paddingVertical: Spacing.two, fontSize: 15 },
  qtyInput: { width: 44 },
  unitInput: { width: 60 },
  nameInput: { flex: 1 },
  addButton: { paddingLeft: Spacing.one },
  emptyText: { marginTop: Spacing.four, textAlign: 'center' },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    marginTop: Spacing.two,
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flex: 1 },
  itemText: { flex: 1 },
  itemTextChecked: { textDecorationLine: 'line-through' },
});
