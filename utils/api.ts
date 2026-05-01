const SPOONACULAR_API_KEY = process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY;
const BASE_URL = 'https://api.spoonacular.com/recipes';

/** Fetch a list of meal stubs by multiple ingredients */
export const fetchRecipesForInventory = async (
  inventoryNames: string[],
  limit = 16
): Promise<{ meal: any; matchCount: number; matchedItems: string[]; minRequired: number }[]> => {
  if (inventoryNames.length === 0) return [];

  // Words to ignore when extracting the core ingredient
  const IGNORE_WORDS = ['fresh', 'organic', 'frozen', 'raw', 'canned', 'whole', 'sliced', 'diced', 'chopped', 'sweet'];

  const extractKeyword = (name: string) => {
    const words = name.toLowerCase().split(' ').map(w => w.trim()).filter(Boolean);
    for (const w of words) {
      if (!IGNORE_WORDS.includes(w)) return w;
    }
    return words[0] || '';
  };

  const keywords = [...new Set(inventoryNames.map(extractKeyword))]
    .filter(k => k.length > 2)
    .slice(0, 15); // Spoonacular can handle more ingredients nicely

  if (keywords.length === 0) return [];

  const ingredientsParam = keywords.join(',');

  try {
    const res = await fetch(`${BASE_URL}/findByIngredients?ingredients=${encodeURIComponent(ingredientsParam)}&number=${limit}&ranking=2&ignorePantry=true&apiKey=${SPOONACULAR_API_KEY}`);
    const data = await res.json();
    
    if (!Array.isArray(data)) return [];

    // Map Spoonacular response to our RankedRecipe format
    return data.map((recipe: any) => ({
      meal: {
        idMeal: recipe.id.toString(),
        strMeal: recipe.title,
        strMealThumb: recipe.image,
      },
      matchCount: recipe.usedIngredientCount,
      matchedItems: recipe.usedIngredients.map((ing: any) => ing.name),
      minRequired: 1, // Spoonacular already ranks them, we can just return what it gives
    }));
  } catch (error) {
    console.error('Error fetching recipes from Spoonacular:', error);
    return [];
  }
};

/** Fetch full meal details by meal ID */
export const fetchRecipeDetails = async (id: string): Promise<any | null> => {
  try {
    const res = await fetch(`${BASE_URL}/${id}/information?apiKey=${SPOONACULAR_API_KEY}`);
    const data = await res.json();
    
    if (!data || !data.title) return null;

    // Map Spoonacular detail response to the format expected by our UI (TheMealDB format)
    // Or we can just adapt the UI to accept the new format. Adapting the object is safer to not break the UI.
    const mappedMeal: any = {
      idMeal: data.id.toString(),
      strMeal: data.title,
      strMealThumb: data.image,
      strCategory: data.dishTypes?.[0] || 'Main',
      strArea: data.cuisines?.[0] || 'Mixed',
      strInstructions: data.instructions || data.summary?.replace(/<[^>]+>/g, '') || 'Instructions not provided.',
    };

    // Map ingredients to strIngredientX, strMeasureX
    data.extendedIngredients?.forEach((ing: any, idx: number) => {
      mappedMeal[`strIngredient${idx + 1}`] = ing.nameClean || ing.name;
      mappedMeal[`strMeasure${idx + 1}`] = `${ing.measures?.us?.amount || ''} ${ing.measures?.us?.unitShort || ''}`.trim() || ing.original;
    });

    return mappedMeal;
  } catch (error) {
    console.error('Error fetching recipe details:', error);
    return null;
  }
};
