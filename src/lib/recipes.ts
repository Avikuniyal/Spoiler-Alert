import { Recipe } from '@/types/pantry';

export const RECIPE_DATABASE: Recipe[] = [
  {
    id: '1',
    title: 'Garden Vegetable Stir-Fry',
    matchedIngredients: [],
    allIngredients: ['broccoli', 'carrots', 'bell peppers', 'onion', 'garlic', 'soy sauce', 'sesame oil'],
    steps: [
      'Heat sesame oil in a large wok over high heat.',
      'Add garlic and stir-fry for 30 seconds until fragrant.',
      'Add harder vegetables (carrots, broccoli) first, cook 3 minutes.',
      'Add softer vegetables (bell peppers, onion), cook 2 more minutes.',
      'Drizzle soy sauce, toss to combine and serve hot.',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80',
    cookTime: '15 min',
  },
  {
    id: '2',
    title: 'Creamy Dairy Pasta',
    matchedIngredients: [],
    allIngredients: ['pasta', 'milk', 'butter', 'parmesan', 'garlic', 'herbs', 'black pepper'],
    steps: [
      'Cook pasta according to package directions.',
      'Melt butter in a pan, sauté garlic for 1 minute.',
      'Add milk and bring to a gentle simmer.',
      'Stir in parmesan until melted and creamy.',
      'Toss with pasta, season with pepper and herbs.',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400&q=80',
    cookTime: '20 min',
  },
  {
    id: '3',
    title: 'Savory Meat & Herb Skillet',
    matchedIngredients: [],
    allIngredients: ['ground beef', 'chicken', 'onion', 'garlic', 'rosemary', 'thyme', 'olive oil'],
    steps: [
      'Season meat generously with salt, pepper, and herbs.',
      'Heat olive oil in a cast iron skillet over medium-high.',
      'Sear meat on all sides until golden brown.',
      'Add aromatics (onion, garlic) and cook 3 more minutes.',
      'Rest 5 minutes before serving.',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80',
    cookTime: '25 min',
  },
  {
    id: '4',
    title: 'Pantry Staple Soup',
    matchedIngredients: [],
    allIngredients: ['canned tomatoes', 'beans', 'pasta', 'onion', 'garlic', 'vegetable broth', 'basil'],
    steps: [
      'Sauté onion and garlic in olive oil until soft.',
      'Add canned tomatoes and vegetable broth, bring to boil.',
      'Add beans and pasta, cook until pasta is tender.',
      'Season with basil, salt, and pepper.',
      'Serve with crusty bread.',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80',
    cookTime: '30 min',
  },
  {
    id: '5',
    title: 'Fresh Fruit Smoothie Bowl',
    matchedIngredients: [],
    allIngredients: ['mixed berries', 'banana', 'yogurt', 'honey', 'granola', 'chia seeds'],
    steps: [
      'Blend frozen berries and banana with a splash of milk.',
      'Pour thick smoothie into a bowl.',
      'Top with fresh fruit, granola, and chia seeds.',
      'Drizzle honey over the top.',
      'Serve immediately for best texture.',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400&q=80',
    cookTime: '5 min',
  },
  {
    id: '6',
    title: 'Cheese & Veggie Frittata',
    matchedIngredients: [],
    allIngredients: ['eggs', 'cheese', 'spinach', 'tomatoes', 'onion', 'olive oil', 'herbs'],
    steps: [
      'Preheat oven to 375°F (190°C).',
      'Sauté vegetables in an oven-safe skillet.',
      'Whisk eggs with salt, pepper, and herbs.',
      'Pour eggs over vegetables, sprinkle cheese on top.',
      'Bake 15 minutes until set and golden.',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1569581159046-b8d19d45cb39?w=400&q=80',
    cookTime: '25 min',
  },
];

export function getMatchingRecipes(expiringItems: string[], count: number = 3): Recipe[] {
  const itemNames = expiringItems.map(name => name.toLowerCase());
  
  const scored = RECIPE_DATABASE.map(recipe => {
    const matched = recipe.allIngredients.filter(ing =>
      itemNames.some(name => ing.toLowerCase().includes(name) || name.includes(ing.toLowerCase()))
    );
    return { ...recipe, matchedIngredients: matched, score: matched.length };
  });
  
  scored.sort((a, b) => b.score - a.score);
  
  return scored.slice(0, count);
}
