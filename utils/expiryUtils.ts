import { InventoryItem } from '../app/(tabs)/_layout';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/**
 * Parses a date string like "25 Apr" or "6 May" (no year).
 * If the month/day is already in the past this year, it assumes NEXT year.
 */
export const parseDateStr = (dateStr: string): Date => {
  const parts = dateStr.trim().split(' ');
  if (parts.length < 2) return new Date();
  const day = parseInt(parts[0], 10);
  const monthIdx = MONTH_NAMES.indexOf(parts[1]);
  if (monthIdx === -1 || isNaN(day)) return new Date();

  const today = new Date();
  let year = today.getFullYear();

  // If a year is explicitly provided (e.g. "6 Apr 2026"), use it without auto-shifting
  if (parts.length >= 3) {
    const parsedYear = parseInt(parts[2], 10);
    if (!isNaN(parsedYear)) {
      return new Date(parsedYear, monthIdx, day);
    }
  }

  // Otherwise, if no year is provided, assume next year if the date has passed
  const candidate = new Date(year, monthIdx, day);
  candidate.setHours(0, 0, 0, 0);
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (candidate < todayMidnight) year += 1;
  return new Date(year, monthIdx, day);
};

/** Returns days until expiry (negative = already expired). */
export const getDaysUntilExpiry = (dateStr: string): number => {
  const exp = parseDateStr(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((exp.getTime() - today.getTime()) / 86400000);
};

// Determine if an item is edible/food item
export const isEdibleItem = (itemName: string): boolean => {
  const lowerName = itemName.toLowerCase().trim();

  // NON-EDIBLE items to exclude (be specific to avoid false negatives)
  const NON_EDIBLE = [
    'glycerin', 'glycerene', 'shampoo', 'conditioner', 'lotion',
    'sanitizer', 'disinfectant', 'detergent', 'cleaner', 'harpic', 'bleach', 'acid',
    'perfume', 'deodorant', 'toothpaste', 'toothbrush', 'brush', 'comb',
    'facewash', 'facemask', 'serum', 'toner', 'wipe', 'tissue',
    'napkin', 'toilet', 'paper', 'towel', 'cloth', 'fabric', 'soap', 'pencil', 'pen',
    'medicine', 'tablet', 'pill', 'capsule', 'ointment', 'balm', 'aromatherapy', 'candle',
    'led', 'bulb', 'electrical', 'light', 'wire', 'cable', 'battery', 'batteries', 'aa ', 'aaa ',
    'dettol', 'handwash', 'hand wash', 'dish wash', 'dishwash', 'gel', 'colgate', 'total'
  ];

  // Check if item contains non-edible keywords
  if (NON_EDIBLE.some(keyword => lowerName.includes(keyword))) {
    return false;
  }

  // Check for common prepared dishes (recipes) to exclude from raw ingredient lists
  const PREPARED_DISHES = [
    'pancake', 'blini', 'soup', 'salad', 'burger', 'pizza', 'sandwich', 'pasta',
    'noodles', 'noodle', 'stir', 'fry', 'fried', 'kheer', 'jamun', 'mousse', 'pudding',
    'raita', 'curry', 'biryani', 'dal', 'roti', 'paratha', 'naan', 'gravy',
    'cookie', 'biscuit', 'chocolate', 'chip', 'cracker', 'candy', 'snack', 'sweets', 'gum'
  ];

  if (PREPARED_DISHES.some(keyword => lowerName.includes(keyword))) {
    return false;
  }

  // EDIBLE items - common raw ingredients
  const EDIBLE_KEYWORDS = [
    'paneer', 'panir', 'cheese', 'butter', 'milk', 'yogurt', 'curd', 'ghee',
    'water', 'juice', 'tea', 'coffee', 'beverage', 'lemonade', 'smoothie',
    'salt', 'sugar', 'honey', 'jam', 'sauce', 'paste', 'spice', 'herb', 'ginger', 'garlic',
    'rice', 'wheat', 'flour', 'bread', 'grain',
    'vegetable', 'fruit', 'orange', 'apple', 'banana', 'carrot', 'spinach', 'tomato',
    'potato', 'onion', 'cabbage', 'broccoli', 'bean', 'lentils', 'chickpea', 'peas',
    'corn', 'capsicum', 'cucumber', 'gobi', 'cauliflower', 'watermelon', 'strawberry',
    'mango', 'papaya', 'guava', 'grapes', 'nuts', 'walnut', 'almond', 'cashew',
    'peanut', 'seeds', 'meat', 'fish', 'egg', 'chicken', 'beef', 'ham', 'bacon',
    'sausage', 'cocoa', 'edible', 'food', 'fresh', 'organic', 'toned', 'amul',
    'chai', 'mask'
  ];

  // Accept if contains known edible keywords
  if (EDIBLE_KEYWORDS.some(keyword => lowerName.includes(keyword))) {
    return true;
  }

  // Accept common grocery items with quantities like "TOMATO 1KG", "PANEER 200G"
  // Remove measurements and check if remaining text looks like food
  const nameWithoutQty = lowerName
    .replace(/\d+\s*(kg|g|ml|l|units?|packs?|boxes?|bottles?|box)/gi, '')
    .trim();

  if (
    nameWithoutQty.length > 2 &&
    /[a-zA-Z]/.test(nameWithoutQty) &&
    !NON_EDIBLE.some(keyword => nameWithoutQty.includes(keyword))
  ) {
    return true; // Assume it's food if it looks like a word and not explicitly non-edible
  }

  return false;
};




// Categorize items by expiry risk
export const categorizeByExpiry = (inventory: InventoryItem[]) => {
  const critical = inventory.filter(item => {
    const days = getDaysUntilExpiry(item.exp);
    return days <= 3 && days >= 0; // 0-3 days
  });
  
  const warning = inventory.filter(item => {
    const days = getDaysUntilExpiry(item.exp);
    return days > 3 && days <= 7; // 4-7 days
  });
  
  const good = inventory.filter(item => {
    const days = getDaysUntilExpiry(item.exp);
    return days > 7; // More than 7 days
  });

  return { critical, warning, good };
};

// Get matching recipes for items
export const getRecipesForItems = (items: InventoryItem[]) => {
  const itemNames = items.map(i => i.name.toLowerCase());

  const RECIPE_DATABASE = [
    // BREAKFAST & SNACKS
    { id: '1', title: 'Masala Omelette', icon: '🍳', ingredients: ['egg', 'onion', 'tomato', 'salt', 'pepper', 'butter'], time: '10m', instructions: '1. Heat butter in pan.\n2. Beat eggs with salt.\n3. Pour into pan.\n4. Add chopped onion & tomato.\n5. Fold and serve hot.', category: 'breakfast' },
    { id: '2', title: 'Bread Butter Toast', icon: '🍞', ingredients: ['bread', 'butter', 'salt'], time: '5m', instructions: '1. Toast bread until golden.\n2. Apply butter while hot.\n3. Add salt to taste.\n4. Serve immediately.', category: 'breakfast' },
    { id: '3', title: 'Paneer Sandwich', icon: '🥪', ingredients: ['bread', 'paneer', 'tomato', 'onion', 'butter', 'salt'], time: '8m', instructions: '1. Butter bread slices.\n2. Add paneer cubes.\n3. Layer tomato & onion.\n4. Toast in pan until golden.', category: 'breakfast' },
    { id: '4', title: 'Cheese Toast', icon: '🧀', ingredients: ['bread', 'cheese', 'butter'], time: '5m', instructions: '1. Toast bread.\n2. Add butter.\n3. Layer cheese.\n4. Grill until melted.', category: 'breakfast' },
    { id: '5', title: 'Honey Banana Smoothie', icon: '🍌', ingredients: ['banana', 'milk', 'honey', 'water'], time: '5m', instructions: '1. Blend banana with milk.\n2. Add honey.\n3. Mix well.\n4. Serve chilled.', category: 'breakfast' },
    
    // MAIN COURSES (Curries & Rice Dishes)
    { id: '6', title: 'Paneer Butter Masala', icon: '🍛', ingredients: ['paneer', 'butter', 'tomato', 'milk', 'onion', 'garlic'], time: '30m', instructions: '1. Cube paneer.\n2. Sauté onion & garlic.\n3. Add tomato & spices.\n4. Cook paneer in sauce.\n5. Add milk/cream.\n6. Simmer 5 minutes.', category: 'main course' },
    { id: '7', title: 'Chole Bhature', icon: '🍲', ingredients: ['chickpeas', 'flour', 'yogurt', 'onion', 'tomato', 'salt', 'oil'], time: '45m', instructions: '1. Soak & boil chickpeas.\n2. Cook with spices.\n3. Make dough from flour & yogurt.\n4. Deep fry bhature.\n5. Serve with chole.', category: 'main course' },
    { id: '8', title: 'Aloo Gobi', icon: '🥔', ingredients: ['potato', 'cabbage', 'onion', 'tomato', 'oil', 'salt'], time: '25m', instructions: '1. Heat oil.\n2. Fry cubed potatoes.\n3. Add cabbage & tomato.\n4. Season with salt & spices.\n5. Cook until soft.', category: 'main course' },
    { id: '9', title: 'Dal Fry', icon: '🍲', ingredients: ['lentils', 'water', 'onion', 'garlic', 'tomato', 'salt', 'oil'], time: '35m', instructions: '1. Boil lentils until soft.\n2. Fry onion & garlic.\n3. Add tomato.\n4. Mix with cooked lentils.\n5. Season and serve.', category: 'main course' },
    { id: '10', title: 'Chana Masala', icon: '🥘', ingredients: ['chickpeas', 'onion', 'tomato', 'garlic', 'salt', 'oil'], time: '30m', instructions: '1. Heat oil.\n2. Sauté onion & garlic.\n3. Add tomato & spices.\n4. Cook chickpeas in sauce.\n5. Serve hot.', category: 'main course' },
    { id: '11', title: 'Vegetable Rice', icon: '🍚', ingredients: ['rice', 'carrot', 'peas', 'onion', 'salt', 'oil'], time: '20m', instructions: '1. Heat oil.\n2. Stir fry vegetables.\n3. Add rice & salt.\n4. Cook with water until done.\n5. Fluff with fork.', category: 'main course' },
    { id: '12', title: 'Fried Rice', icon: '🍚', ingredients: ['rice', 'egg', 'onion', 'carrot', 'soy sauce', 'oil'], time: '15m', instructions: '1. Heat oil.\n2. Scramble egg.\n3. Add veggies.\n4. Mix in cooked rice.\n5. Season with soy sauce.', category: 'main course' },
    
    // SOUPS & LIGHT DISHES
    { id: '13', title: 'Tomato Soup', icon: '🍲', ingredients: ['tomato', 'water', 'butter', 'salt', 'pepper'], time: '20m', instructions: '1. Boil tomatoes in water.\n2. Blend smooth.\n3. Strain & reheat.\n4. Add butter & salt.\n5. Serve hot.', category: 'soup' },
    { id: '14', title: 'Carrot Soup', icon: '🥕', ingredients: ['carrot', 'water', 'milk', 'salt', 'butter'], time: '25m', instructions: '1. Chop & boil carrots.\n2. Blend with milk.\n3. Strain.\n4. Reheat with butter.\n5. Season & serve.', category: 'soup' },
    { id: '15', title: 'Vegetable Soup', icon: '🥬', ingredients: ['carrot', 'cabbage', 'potato', 'water', 'salt', 'oil'], time: '30m', instructions: '1. Dice vegetables.\n2. Heat oil & sauté.\n3. Add water & salt.\n4. Boil until tender.\n5. Serve hot.', category: 'soup' },
    
    // SALADS & SIDES
    { id: '16', title: 'Green Salad', icon: '🥗', ingredients: ['spinach', 'carrot', 'tomato', 'onion', 'salt', 'oil'], time: '5m', instructions: '1. Wash greens.\n2. Slice vegetables.\n3. Toss together.\n4. Drizzle oil.\n5. Add salt & serve.', category: 'salad' },
    { id: '17', title: 'Tomato Salad', icon: '🍅', ingredients: ['tomato', 'onion', 'salt', 'pepper', 'oil'], time: '5m', instructions: '1. Chop tomatoes.\n2. Slice onion.\n3. Mix together.\n4. Add salt, pepper & oil.\n5. Toss & serve.', category: 'salad' },
    { id: '18', title: 'Cucumber Raita', icon: '🥒', ingredients: ['cucumber', 'yogurt', 'salt', 'pepper', 'water'], time: '5m', instructions: '1. Grate cucumber.\n2. Mix with yogurt.\n3. Add salt & pepper.\n4. Add water for consistency.\n5. Chill & serve.', category: 'side dish' },
    { id: '19', title: 'Onion Salad', icon: '🧅', ingredients: ['onion', 'lemon', 'salt', 'water'], time: '3m', instructions: '1. Slice onions fine.\n2. Soak in salt water.\n3. Add lemon juice.\n4. Mix well.\n5. Serve cold.', category: 'side dish' },
    
    // VEGETABLES & STIR FRIES
    { id: '20', title: 'Capsicum Stir Fry', icon: '🫑', ingredients: ['capsicum', 'onion', 'garlic', 'salt', 'oil'], time: '10m', instructions: '1. Slice capsicums.\n2. Heat oil & add garlic.\n3. Stir fry capsicum & onion.\n4. Season with salt.\n5. Serve hot.', category: 'side dish' },
    { id: '21', title: 'Broccoli Fry', icon: '🥦', ingredients: ['broccoli', 'garlic', 'salt', 'oil'], time: '12m', instructions: '1. Cut broccoli florets.\n2. Blanch briefly.\n3. Heat oil & add garlic.\n4. Stir fry broccoli.\n5. Season & serve.', category: 'side dish' },
    { id: '22', title: 'Spinach Fry', icon: '🌿', ingredients: ['spinach', 'onion', 'garlic', 'salt', 'oil'], time: '15m', instructions: '1. Chop spinach.\n2. Heat oil.\n3. Fry onion & garlic.\n4. Add spinach & salt.\n5. Cook until wilted.', category: 'side dish' },
    { id: '23', title: 'Dry Gobi Fry', icon: '🥬', ingredients: ['cabbage', 'onion', 'garlic', 'salt', 'oil'], time: '15m', instructions: '1. Shred cabbage.\n2. Heat oil.\n3. Fry until crispy.\n4. Add onion & garlic.\n5. Season & serve dry.', category: 'side dish' },
    
    // SNACKS & APPETIZERS
    { id: '24', title: 'Fried Onion Rings', icon: '🧅', ingredients: ['onion', 'flour', 'salt', 'water', 'oil'], time: '15m', instructions: '1. Slice onions in rings.\n2. Make batter with flour & water.\n3. Coat onion rings.\n4. Deep fry until golden.\n5. Drain & serve.', category: 'snack' },
    { id: '25', title: 'Potato Fries', icon: '🍟', ingredients: ['potato', 'salt', 'oil'], time: '20m', instructions: '1. Cut potatoes into sticks.\n2. Soak in salt water.\n3. Deep fry until golden.\n4. Drain on paper.\n5. Serve hot.', category: 'snack' },
    { id: '26', title: 'Cheese Corn Snack', icon: '🌽', ingredients: ['corn', 'cheese', 'butter', 'salt'], time: '10m', instructions: '1. Heat butter.\n2. Add corn.\n3. Sprinkle cheese.\n4. Heat until melted.\n5. Serve warm.', category: 'snack' },
    { id: '27', title: 'Paneer Tikka', icon: '🍗', ingredients: ['paneer', 'yogurt', 'salt', 'pepper', 'oil'], time: '25m', instructions: '1. Cube paneer.\n2. Marinade in yogurt & spices.\n3. Grill or bake 15-20 mins.\n4. Serve with lemon.', category: 'snack' },
    
    // DESSERTS & SWEETS
    { id: '28', title: 'Kheer', icon: '🍮', ingredients: ['milk', 'rice', 'sugar', 'almonds', 'cardamom'], time: '40m', instructions: '1. Cook rice in milk.\n2. Add sugar & cardamom.\n3. Simmer 20 mins.\n4. Garnish with almonds.\n5. Chill before serving.', category: 'dessert' },
    { id: '29', title: 'Gulab Jamun', icon: '🍡', ingredients: ['milk powder', 'flour', 'milk', 'sugar', 'oil'], time: '35m', instructions: '1. Mix milk powder & flour.\n2. Make soft dough.\n3. Roll into balls.\n4. Deep fry until brown.\n5. Soak in sugar syrup.', category: 'dessert' },
    { id: '30', title: 'Chocolate Mousse', icon: '🍫', ingredients: ['chocolate', 'milk', 'sugar', 'water'], time: '15m', instructions: '1. Melt chocolate.\n2. Heat milk.\n3. Mix together.\n4. Chill well.\n5. Serve cold.', category: 'dessert' },
    { id: '31', title: 'Honey Banana Pudding', icon: '🍌', ingredients: ['banana', 'milk', 'honey', 'bread'], time: '10m', instructions: '1. Cut banana & bread.\n2. Layer in bowl.\n3. Pour milk over.\n4. Drizzle honey.\n5. Chill & serve.', category: 'dessert' },
    
    // BEVERAGES & DRINKS
    { id: '32', title: 'Masala Chai', icon: '☕', ingredients: ['tea', 'milk', 'water', 'sugar', 'ginger'], time: '10m', instructions: '1. Boil water & ginger.\n2. Add tea leaves.\n3. Simmer 2-3 mins.\n4. Add milk & sugar.\n5. Strain & serve.', category: 'beverage' },
    { id: '33', title: 'Plain Milk', icon: '🥛', ingredients: ['milk', 'water', 'sugar'], time: '5m', instructions: '1. Heat milk.\n2. Add sugar to taste.\n3. Mix well.\n4. Serve warm or cold.', category: 'beverage' },
    { id: '34', title: 'Orange Juice', icon: '🧡', ingredients: ['orange', 'water', 'sugar'], time: '5m', instructions: '1. Squeeze orange juice.\n2. Add water if needed.\n3. Add sugar to taste.\n4. Stir well.\n5. Serve chilled.', category: 'beverage' },
    { id: '35', title: 'Apple Juice', icon: '🍎', ingredients: ['apple', 'water', 'sugar'], time: '10m', instructions: '1. Cut apple.\n2. Blend with water.\n3. Strain.\n4. Add sugar.\n5. Serve chilled.', category: 'beverage' },
    { id: '36', title: 'Mango Smoothie', icon: '🥭', ingredients: ['mango', 'milk', 'sugar', 'water'], time: '8m', instructions: '1. Cut mango.\n2. Blend with milk.\n3. Add sugar & water.\n4. Mix well.\n5. Serve cold.', category: 'beverage' },
    { id: '37', title: 'Strawberry Shake', icon: '🍓', ingredients: ['strawberry', 'milk', 'sugar', 'water'], time: '5m', instructions: '1. Blend strawberry with milk.\n2. Add sugar.\n3. Add water for consistency.\n4. Mix well.\n5. Serve chilled.', category: 'beverage' },
    { id: '38', title: 'Lemonade', icon: '🍋', ingredients: ['lemon', 'water', 'sugar', 'salt'], time: '5m', instructions: '1. Squeeze lemon juice.\n2. Mix with water.\n3. Add sugar & salt.\n4. Stir well.\n5. Serve chilled with ice.', category: 'beverage' },
    { id: '39', title: 'Watermelon Juice', icon: '🍉', ingredients: ['watermelon', 'water', 'sugar'], time: '8m', instructions: '1. Cut watermelon.\n2. Blend with water.\n3. Strain if needed.\n4. Add sugar.\n5. Serve very cold.', category: 'beverage' },
    { id: '40', title: 'Cucumber Water', icon: '💧', ingredients: ['cucumber', 'water', 'lemon'], time: '5m', instructions: '1. Slice cucumber.\n2. Add to water.\n3. Add lemon slices.\n4. Chill for 1 hour.\n5. Serve cold.', category: 'beverage' },
  ];

  return RECIPE_DATABASE.filter(recipe =>
    recipe.ingredients.some(ingredient =>
      itemNames.some(itemName => itemName.includes(ingredient) || ingredient.includes(itemName))
    )
  );
};
