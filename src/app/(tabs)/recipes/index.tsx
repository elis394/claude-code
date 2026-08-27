import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
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
          <ThemedText type="title" style={styles.title}>
            Recepten
          </ThemedText>
          <Pressable
            style={[styles.addButton, { backgroundColor: theme.backgroundElement }]}
            onPress={() => router.push('/(tabs)/recipes/add')}>
            <Ionicons name="add" size={26} color={theme.text} />
          </Pressable>
        </View>

        <TextInput
          style={[styles.search, { color: theme.text, backgroundColor: theme.backgroundElement }]}
          placeholder="Zoek recepten..."
          placeholderTextColor={theme.textSecondary}
          value={search}
          onChangeText={setSearch}
        />

        {!isLoading && filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText themeColor="textSecondary" style={styles.emptyText}>
              Nog geen recepten. Tik op + om je eerste recept toe te voegen via een link of
              handmatig.
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
      style={[styles.card, { backgroundColor: theme.backgroundElement }]}
      onPress={() => router.push(`/(tabs)/recipes/${recipe.id}`)}>
      {recipe.image_url ? (
        <Image source={{ uri: recipe.image_url }} style={styles.cardImage} contentFit="cover" />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder, { backgroundColor: theme.backgroundSelected }]}>
          <Ionicons name="restaurant-outline" size={28} color={theme.textSecondary} />
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.three },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  title: {},
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    marginTop: Spacing.three,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  list: { paddingVertical: Spacing.three, gap: Spacing.two },
  card: {
    flexDirection: 'row',
    borderRadius: Spacing.three,
    overflow: 'hidden',
    marginBottom: Spacing.two,
  },
  cardImage: { width: 88, height: 88 },
  cardImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, padding: Spacing.three, gap: Spacing.one, justifyContent: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.four },
  emptyText: { textAlign: 'center' },
});
