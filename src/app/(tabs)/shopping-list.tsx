import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { showAlert } from '@/lib/alert';
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
      showAlert('Selecteer eerst één of meer recepten');
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
    showAlert('Boodschappenlijst leegmaken?', undefined, [
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
                    <ThemedText type="link" themeColor="danger">
                      Leegmaken
                    </ThemedText>
                  </Pressable>
                )}
              </View>

              <Pressable
                style={[
                  styles.pickerToggle,
                  Shadow.sm,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
                onPress={() => setPickerOpen((open) => !open)}>
                <View style={styles.pickerToggleLeft}>
                  <Ionicons name="restaurant-outline" size={18} color={theme.primary} />
                  <ThemedText type="smallBold">
                    Recepten kiezen{selectedCount > 0 ? ` (${selectedCount})` : ''}
                  </ThemedText>
                </View>
                <Ionicons
                  name={pickerOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={theme.textSecondary}
                />
              </Pressable>

              {pickerOpen && (
                <View style={[styles.picker, { backgroundColor: theme.surface, borderColor: theme.border }]}>
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
                          color={selectedIds[recipe.id] ? theme.primary : theme.textSecondary}
                        />
                        <ThemedText style={styles.pickerRowText}>{recipe.title}</ThemedText>
                      </Pressable>
                    ))
                  )}
                  <Button onPress={handleGenerate} loading={generateList.isPending} style={styles.generateButton}>
                    Genereer lijst
                  </Button>
                </View>
              )}

              <View style={styles.manualRow}>
                <TextField
                  style={styles.qtyInput}
                  placeholder="#"
                  value={manualQty}
                  onChangeText={setManualQty}
                />
                <TextField
                  style={styles.unitInput}
                  placeholder="Eenh."
                  value={manualUnit}
                  onChangeText={setManualUnit}
                />
                <TextField
                  style={styles.nameInput}
                  placeholder="Item toevoegen..."
                  value={manualName}
                  onChangeText={setManualName}
                  onSubmitEditing={handleAddManual}
                />
                <Pressable onPress={handleAddManual} style={styles.addButton}>
                  <Ionicons name="add-circle" size={32} color={theme.primary} />
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
    <View
      style={[
        styles.itemRow,
        Shadow.sm,
        { backgroundColor: item.checked ? theme.secondarySoft : theme.surface },
      ]}>
      <Pressable style={styles.itemLeft} onPress={onToggle}>
        <Ionicons
          name={item.checked ? 'checkbox' : 'square-outline'}
          size={20}
          color={item.checked ? theme.secondary : theme.primary}
        />
        <ThemedText
          style={[styles.itemText, item.checked && styles.itemTextChecked]}
          themeColor={item.checked ? 'textSecondary' : 'text'}>
          {line}
        </ThemedText>
      </Pressable>
      <Pressable onPress={onDelete} hitSlop={8}>
        <Ionicons name="close" size={18} color={theme.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four },
  list: { paddingBottom: Spacing.six, gap: Spacing.two },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.three,
    marginBottom: Spacing.four,
  },
  pickerToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  pickerToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  picker: {
    marginTop: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  pickerRowText: { flex: 1 },
  generateButton: { marginTop: Spacing.one },
  manualRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.four, alignItems: 'center' },
  qtyInput: { width: 52, paddingHorizontal: Spacing.two },
  unitInput: { width: 72, paddingHorizontal: Spacing.two },
  nameInput: { flex: 1, minWidth: 0 },
  addButton: { paddingLeft: Spacing.half },
  emptyText: { marginTop: Spacing.five, textAlign: 'center' },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flex: 1 },
  itemText: { flex: 1 },
  itemTextChecked: { textDecorationLine: 'line-through' },
});
