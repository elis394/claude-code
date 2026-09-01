import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type {
  ExtractRecipeResult,
  Household,
  NewIngredientInput,
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
      const { data, error } = await supabase
        .from('household_members')
        .select('households(*)')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return (data?.households as unknown as Household) ?? null;
    },
  });
}

export function useCreateHousehold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase.rpc('create_household', { household_name: name });
      if (error) throw error;
      return data as Household;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['household'] }),
  });
}

export function useJoinHousehold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.rpc('join_household', { code });
      if (error) throw error;
      return data as Household;
    },
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
    queryFn: async (): Promise<RecipeWithIngredients[]> => {
      const { data, error } = await supabase
        .from('recipes')
        .select('*, recipe_ingredients(*)')
        .eq('household_id', householdId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as RecipeWithIngredients[];
    },
  });
}

export function useRecipe(recipeId: string | undefined) {
  return useQuery({
    queryKey: ['recipe', recipeId],
    enabled: !!recipeId,
    queryFn: async (): Promise<RecipeWithIngredients> => {
      const { data, error } = await supabase
        .from('recipes')
        .select('*, recipe_ingredients(*)')
        .eq('id', recipeId)
        .single();
      if (error) throw error;
      return data as RecipeWithIngredients;
    },
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
      const { data: recipe, error: recipeError } = await supabase
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
        .single();
      if (recipeError) throw recipeError;

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
        const { error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .insert(ingredientRows);
        if (ingredientsError) throw ingredientsError;
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
    mutationFn: async (recipeId: string) => {
      const { error } = await supabase.from('recipes').delete().eq('id', recipeId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recipes', householdId] }),
  });
}

export function useExtractRecipe() {
  return useMutation({
    mutationFn: async (url: string): Promise<ExtractRecipeResult> => {
      const { data, error } = await supabase.functions.invoke('extract-recipe', {
        body: { url },
      });
      if (error) throw error;
      return data as ExtractRecipeResult;
    },
  });
}

// ---------------------------------------------------------------------------
// Shopping list
// ---------------------------------------------------------------------------

export function useShoppingList(householdId: string | undefined) {
  return useQuery({
    queryKey: ['shopping-list', householdId],
    enabled: !!householdId,
    queryFn: async (): Promise<ShoppingListItem[]> => {
      const { data, error } = await supabase
        .from('shopping_list_items')
        .select('*')
        .eq('household_id', householdId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as ShoppingListItem[];
    },
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

      const { data: ingredients, error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .select('*')
        .in('recipe_id', recipeIds);
      if (ingredientsError) throw ingredientsError;

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
      const { error: deleteError } = await supabase
        .from('shopping_list_items')
        .delete()
        .eq('household_id', householdId)
        .eq('source', 'generated');
      if (deleteError) throw deleteError;

      const rows = Array.from(aggregated.values()).map((item) => ({
        household_id: householdId,
        name: item.name,
        quantity: item.hasNull ? null : item.quantity,
        unit: item.unit,
        source: 'generated' as const,
      }));

      if (rows.length > 0) {
        const { error: insertError } = await supabase.from('shopping_list_items').insert(rows);
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shopping-list', householdId] }),
  });
}

export function useAddShoppingListItem(householdId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; quantity: number | null; unit: string | null }) => {
      if (!householdId) throw new Error('No household');
      const { error } = await supabase.from('shopping_list_items').insert({
        household_id: householdId,
        name: input.name.trim(),
        quantity: input.quantity,
        unit: input.unit,
        source: 'manual',
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shopping-list', householdId] }),
  });
}

export function useToggleShoppingListItem(householdId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; checked: boolean }) => {
      const { error } = await supabase
        .from('shopping_list_items')
        .update({ checked: input.checked })
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shopping-list', householdId] }),
  });
}

export function useDeleteShoppingListItem(householdId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shopping_list_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shopping-list', householdId] }),
  });
}

export function useClearShoppingList(householdId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!householdId) throw new Error('No household');
      const { error } = await supabase
        .from('shopping_list_items')
        .delete()
        .eq('household_id', householdId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shopping-list', householdId] }),
  });
}
