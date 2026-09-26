import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase, unwrap } from '@/lib/supabase';
import type {
  ExtractRecipeResult,
  Household,
  NewIngredientInput,
  Recipe,
  RecipeIngredient,
  RecipeWithIngredients,
  ShoppingListItem,
} from '@/lib/types';

// ---------------------------------------------------------------------------
// Household
// ---------------------------------------------------------------------------

export function useHousehold(userId: string | undefined) {
  return useQuery({
    queryKey: ['household', userId],
    enabled: !!userId,
    queryFn: async (): Promise<Household | null> => {
      const data = await unwrap<{ households: Household } | null>(
        supabase.from('household_members').select('households(*)').eq('user_id', userId).maybeSingle()
      );
      return data?.households ?? null;
    },
  });
}

export function useCreateHousehold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      unwrap<Household>(supabase.rpc('create_household', { household_name: name })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['household'] }),
  });
}

export function useJoinHousehold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => unwrap<Household>(supabase.rpc('join_household', { code })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['household'] }),
  });
}

// ---------------------------------------------------------------------------
// Recipes
// ---------------------------------------------------------------------------

export function useRecipes(householdId: string | undefined) {
  return useQuery({
    queryKey: ['recipes', householdId],
    enabled: !!householdId,
    queryFn: () =>
      unwrap<RecipeWithIngredients[]>(
        supabase
          .from('recipes')
          .select('*, recipe_ingredients(*)')
          .eq('household_id', householdId)
          .order('created_at', { ascending: false })
      ),
  });
}

export function useRecipe(recipeId: string | undefined) {
  return useQuery({
    queryKey: ['recipe', recipeId],
    enabled: !!recipeId,
    queryFn: () =>
      unwrap<RecipeWithIngredients>(
        supabase.from('recipes').select('*, recipe_ingredients(*)').eq('id', recipeId).single()
      ),
  });
}

type AddRecipeInput = {
  householdId: string;
  userId: string;
  title: string;
  sourceUrl: string | null;
  sourceType: 'website' | 'video' | 'manual';
  imageUrl: string | null;
  instructions: string | null;
  servings: number | null;
  ingredients: NewIngredientInput[];
};

export function useAddRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddRecipeInput) => {
      const recipe = await unwrap<Recipe>(
        supabase
          .from('recipes')
          .insert({
            household_id: input.householdId,
            title: input.title,
            source_url: input.sourceUrl,
            source_type: input.sourceType,
            image_url: input.imageUrl,
            instructions: input.instructions,
            servings: input.servings,
            created_by: input.userId,
          })
          .select()
          .single()
      );

      const ingredientRows = input.ingredients
        .filter((ing) => ing.name.trim().length > 0)
        .map((ing, index) => ({
          recipe_id: recipe.id,
          name: ing.name.trim(),
          quantity: ing.quantity,
          unit: ing.unit,
          position: index,
        }));

      if (ingredientRows.length > 0) {
        await unwrap(supabase.from('recipe_ingredients').insert(ingredientRows));
      }

      return recipe;
    },
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: ['recipes', variables.householdId] }),
  });
}

export function useDeleteRecipe(householdId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recipeId: string) => unwrap(supabase.from('recipes').delete().eq('id', recipeId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recipes', householdId] }),
  });
}

export type ExtractRecipeInput = { url?: string; rawCaption?: string; imageUrl?: string | null };

export function useExtractRecipe() {
  return useMutation({
    mutationFn: (input: string | ExtractRecipeInput) =>
      unwrap<ExtractRecipeResult>(
        supabase.functions.invoke('extract-recipe', { body: typeof input === 'string' ? { url: input } : input })
      ),
  });
}

// ---------------------------------------------------------------------------
// Shopping list
// ---------------------------------------------------------------------------

export function useShoppingList(householdId: string | undefined) {
  return useQuery({
    queryKey: ['shopping-list', householdId],
    enabled: !!householdId,
    queryFn: () =>
      unwrap<ShoppingListItem[]>(
        supabase
          .from('shopping_list_items')
          .select('*')
          .eq('household_id', householdId)
          .order('created_at', { ascending: true })
      ),
  });
}

function normalizeKey(name: string, unit: string | null) {
  return `${name.trim().toLowerCase()}|${(unit ?? '').trim().toLowerCase()}`;
}

export function useGenerateShoppingList(householdId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (recipeIds: string[]) => {
      if (!householdId) throw new Error('No household');

      const ingredients = await unwrap<RecipeIngredient[]>(
        supabase.from('recipe_ingredients').select('*').in('recipe_id', recipeIds)
      );

      const aggregated = new Map<
        string,
        { name: string; unit: string | null; quantity: number | null; hasNull: boolean }
      >();

      for (const ingredient of ingredients ?? []) {
        const key = normalizeKey(ingredient.name, ingredient.unit);
        const existing = aggregated.get(key);
        if (!existing) {
          aggregated.set(key, {
            name: ingredient.name,
            unit: ingredient.unit,
            quantity: ingredient.quantity,
            hasNull: ingredient.quantity === null,
          });
        } else {
          existing.hasNull = existing.hasNull || ingredient.quantity === null;
          existing.quantity =
            existing.quantity !== null && ingredient.quantity !== null
              ? existing.quantity + ingredient.quantity
              : existing.quantity;
        }
      }

      // Replace the previously generated items, but keep anything the user
      // added manually.
      await unwrap(
        supabase.from('shopping_list_items').delete().eq('household_id', householdId).eq('source', 'generated')
      );

      const rows = Array.from(aggregated.values()).map((item) => ({
        household_id: householdId,
        name: item.name,
        quantity: item.hasNull ? null : item.quantity,
        unit: item.unit,
        source: 'generated' as const,
      }));

      if (rows.length > 0) {
        await unwrap(supabase.from('shopping_list_items').insert(rows));
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shopping-list', householdId] }),
  });
}

export function useAddShoppingListItem(householdId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; quantity: number | null; unit: string | null }) => {
      if (!householdId) throw new Error('No household');
      return unwrap(
        supabase.from('shopping_list_items').insert({
          household_id: householdId,
          name: input.name.trim(),
          quantity: input.quantity,
          unit: input.unit,
          source: 'manual',
        })
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shopping-list', householdId] }),
  });
}

export function useToggleShoppingListItem(householdId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; checked: boolean }) =>
      unwrap(supabase.from('shopping_list_items').update({ checked: input.checked }).eq('id', input.id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shopping-list', householdId] }),
  });
}

export function useDeleteShoppingListItem(householdId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unwrap(supabase.from('shopping_list_items').delete().eq('id', id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shopping-list', householdId] }),
  });
}

export function useClearShoppingList(householdId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!householdId) throw new Error('No household');
      return unwrap(supabase.from('shopping_list_items').delete().eq('household_id', householdId));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shopping-list', householdId] }),
  });
}
