export type SourceType = 'website' | 'video' | 'manual';
export type ShoppingItemSource = 'generated' | 'manual';

export type Household = {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
};

export type Recipe = {
  id: string;
  household_id: string;
  title: string;
  source_url: string | null;
  source_type: SourceType;
  image_url: string | null;
  instructions: string | null;
  servings: number | null;
  created_by: string | null;
  created_at: string;
};

export type RecipeIngredient = {
  id: string;
  recipe_id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  position: number;
};

export type RecipeWithIngredients = Recipe & {
  recipe_ingredients: RecipeIngredient[];
};

export type ShoppingListItem = {
  id: string;
  household_id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  checked: boolean;
  recipe_id: string | null;
  source: ShoppingItemSource;
  created_at: string;
};

export type NewIngredientInput = {
  name: string;
  quantity: number | null;
  unit: string | null;
};

export type ExtractRecipeResult = {
  title: string;
  imageUrl: string | null;
  servings: number | null;
  instructions: string;
  ingredients: NewIngredientInput[];
  sourceType: SourceType;
  rawCaption: string | null;
};
