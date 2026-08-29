import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TextField } from '@/components/ui/text-field';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useRecipes } from '@/lib/queries';
import type { RecipeWithIngredients } from '@/lib/types';
import { useCurrentHousehold } from '@/lib/use-current-household';

export default function RecipesScreen() {
  const theme = useTheme();
  const { householdId } = useCurrentHousehold();
  const { data: recipes, isLoading, isRefetching, refetch } = useRecipes(householdId);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!recipes) return [];
    const query = search.trim().toLowerCase();
    if (!query) return recipes;
    return recipes.filter((recipe) => recipe.title.toLowerCase().includes(query));
  }, [recipes, search]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <ThemedText type="title">Recepten</ThemedText>
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              Shadow.sm,
              { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => router.push('/(tabs)/recipes/add')}>
            <Ionicons name="add" size={26} color={theme.onPrimary} />
          </Pressable>
        </View>

        <TextField
          style={styles.search}
          placeholder="Zoek recepten..."
          value={search}
          onChangeText={setSearch}
        />

        {!isLoading && filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.primarySoft }]}>
              <Ionicons name="restaurant" size={30} color={theme.primary} />
            </View>
            <ThemedText type="subtitle" style={styles.emptyTitle}>
              Nog geen recepten
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.emptyText}>
              Tik op + om je eerste recept toe te voegen via een link of handmatig.
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
            renderItem={({ item }) => <RecipeCard recipe={item} />}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

function RecipeCard({ recipe }: { recipe: RecipeWithIngredients }) {
  const theme = useTheme();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.surface, opacity: pressed ? 0.7 : 1 },
      ]}
      onPress={() => router.push(`/(tabs)/recipes/${recipe.id}`)}>
      {recipe.image_url ? (
        <Image source={{ uri: recipe.image_url }} style={styles.cardImage} contentFit="cover" />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder, { backgroundColor: theme.primarySoft }]}>
          <Ionicons name="restaurant-outline" size={28} color={theme.primary} />
        </View>
      )}
      <View style={styles.cardBody}>
        <ThemedText type="smallBold" numberOfLines={2}>
          {recipe.title || 'Naamloos recept'}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {recipe.recipe_ingredients?.length ?? 0} ingrediënten
          {recipe.servings ? ` · ${recipe.servings} porties` : ''}
        </ThemedText>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} style={styles.chevron} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.three,
  },
  addButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: { marginTop: Spacing.four },
  list: { paddingTop: Spacing.four, paddingBottom: Spacing.six, gap: Spacing.three },
  card: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  cardImage: { width: 96, height: 96 },
  cardImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, padding: Spacing.three, gap: Spacing.one, justifyContent: 'center' },
  chevron: { marginRight: Spacing.three },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.four },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  emptyTitle: { marginBottom: Spacing.one },
  emptyText: { textAlign: 'center' },
});
