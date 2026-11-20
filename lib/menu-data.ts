export type AllergenKey = "gluten" | "dairy" | "nuts" | "egg" | "soy" | "shellfish" | "fish" | "celery" | "mustard" | "sesame";

export const ALLERGEN_LABELS: Record<AllergenKey, { label: string; emoji: string; color: string }> = {
  gluten:   { label: "Gluten",   emoji: "🌾", color: "bg-yellow-100 text-yellow-800" },
  dairy:    { label: "Dairy",    emoji: "🥛", color: "bg-blue-100 text-blue-800" },
  nuts:     { label: "Nuts",     emoji: "🥜", color: "bg-orange-100 text-orange-800" },
  egg:      { label: "Egg",      emoji: "🥚", color: "bg-yellow-50 text-yellow-700" },
  soy:      { label: "Soy",      emoji: "🫘", color: "bg-green-100 text-green-800" },
  shellfish:{ label: "Shellfish",emoji: "🦐", color: "bg-red-100 text-red-800" },
  fish:     { label: "Fish",     emoji: "🐟", color: "bg-cyan-100 text-cyan-800" },
  celery:   { label: "Celery",   emoji: "🥬", color: "bg-green-50 text-green-700" },
  mustard:  { label: "Mustard",  emoji: "🟡", color: "bg-yellow-100 text-yellow-700" },
  sesame:   { label: "Sesame",   emoji: "🌰", color: "bg-amber-100 text-amber-800" },
};

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: "starter" | "main" | "side" | "rice" | "bread" | "special";
  allergens: AllergenKey[];
  isVegan?: boolean;
  isVegetarian?: boolean;
  isSpicy?: boolean;
  chefPick?: boolean;
}

export const menuItems: MenuItem[] = [
  // TODAY'S SPECIALS
  {
    id: "s1",
    name: "Lamb Shank Rogan Josh",
    description: "Slow-braised lamb shank in a rich Kashmiri sauce of whole spices, yoghurt and aromatic red chillies. Served with pilau rice and naan.",
    price: 21.95,
    category: "special",
    allergens: ["dairy", "gluten"],
    isSpicy: true,
    chefPick: true,
  },
  {
    id: "s2",
    name: "Prawn Moilee",
    description: "King prawns simmered in a delicate South Indian coconut broth with turmeric, green chillies and fresh curry leaves.",
    price: 18.95,
    category: "special",
    allergens: ["shellfish", "dairy"],
    chefPick: true,
  },

  // STARTERS
  {
    id: "st1",
    name: "Onion Bhaji",
    description: "Crispy spiced onion fritters with a light chickpea batter, served with mint chutney and tamarind dip.",
    price: 5.95,
    category: "starter",
    allergens: ["gluten", "celery"],
    isVegan: true,
  },
  {
    id: "st2",
    name: "Chicken Tikka",
    description: "Tender chicken marinated overnight in spiced yoghurt, chargrilled in the tandoor. Served with salad and mint raita.",
    price: 7.95,
    category: "starter",
    allergens: ["dairy"],
    isSpicy: true,
  },
  {
    id: "st3",
    name: "Seekh Kebab",
    description: "Minced lamb with fresh herbs and spices, hand-rolled and grilled on skewers. With green chutney.",
    price: 7.95,
    category: "starter",
    allergens: ["egg", "gluten"],
    isSpicy: true,
  },
  {
    id: "st4",
    name: "Samosa (2 pcs)",
    description: "Golden pastry parcels filled with spiced potato and peas, served with date and tamarind chutney.",
    price: 5.50,
    category: "starter",
    allergens: ["gluten"],
    isVegan: true,
  },
  {
    id: "st5",
    name: "Prawn Puri",
    description: "Juicy prawns in a tangy spiced sauce, served on a puffed deep-fried bread.",
    price: 8.95,
    category: "starter",
    allergens: ["shellfish", "gluten"],
  },
  {
    id: "st6",
    name: "Mushroom Pakora",
    description: "Button mushrooms in a crisp herbed batter with carom seeds, served with green chutney.",
    price: 6.50,
    category: "starter",
    allergens: ["gluten"],
    isVegan: true,
  },

  // MAINS
  {
    id: "m1",
    name: "Chicken Tikka Masala",
    description: "Our house classic. Chargrilled chicken tikka in a velvety tomato and cream sauce with aromatic spices. Mild and rich.",
    price: 14.95,
    category: "main",
    allergens: ["dairy"],
    chefPick: true,
  },
  {
    id: "m2",
    name: "Lamb Bhuna",
    description: "Slow-cooked diced lamb with a thick, intensely spiced tomato and onion sauce. Medium heat.",
    price: 15.95,
    category: "main",
    allergens: ["celery"],
    isSpicy: true,
  },
  {
    id: "m3",
    name: "Saag Paneer",
    description: "Fresh Indian cottage cheese cubes in a silky spinach and fenugreek sauce, finished with cream.",
    price: 12.95,
    category: "main",
    allergens: ["dairy"],
    isVegetarian: true,
  },
  {
    id: "m4",
    name: "Prawn Jalfrezi",
    description: "King prawns with strips of peppers and onion in a bold, tangy sauce with green chillies. Hot.",
    price: 16.95,
    category: "main",
    allergens: ["shellfish"],
    isSpicy: true,
  },
  {
    id: "m5",
    name: "Dal Makhani",
    description: "Black lentils slow-cooked overnight with butter, cream and a hint of fenugreek. A legendary dish.",
    price: 11.95,
    category: "main",
    allergens: ["dairy"],
    isVegetarian: true,
  },
  {
    id: "m6",
    name: "Chicken Korma",
    description: "Tender chicken in a fragrant, lightly spiced almond and coconut cream sauce. Very mild and aromatic.",
    price: 13.95,
    category: "main",
    allergens: ["dairy", "nuts"],
  },
  {
    id: "m7",
    name: "Goat Karahi",
    description: "Bone-in goat cooked in an iron wok with tomatoes, ginger, green chillies and whole spices.",
    price: 17.95,
    category: "main",
    allergens: [],
    isSpicy: true,
  },
  {
    id: "m8",
    name: "Chana Masala",
    description: "Chickpeas simmered in a tangy, spiced tomato gravy with dried mango powder. Vegan-friendly.",
    price: 11.95,
    category: "main",
    allergens: [],
    isVegan: true,
  },

  // SIDES
  {
    id: "si1",
    name: "Saag Aloo",
    description: "Cubed potatoes and spinach sautéed with garlic, cumin and spices.",
    price: 4.95,
    category: "side",
    allergens: [],
    isVegan: true,
  },
  {
    id: "si2",
    name: "Tarka Dal",
    description: "Yellow lentils tempered with mustard seeds, garlic, and dried red chilli.",
    price: 4.50,
    category: "side",
    allergens: ["mustard"],
    isVegan: true,
  },
  {
    id: "si3",
    name: "Raita",
    description: "Cooling yoghurt with grated cucumber, roasted cumin and fresh mint.",
    price: 3.50,
    category: "side",
    allergens: ["dairy"],
    isVegetarian: true,
  },
  {
    id: "si4",
    name: "Mango Chutney",
    description: "House-made sweet and tangy mango chutney.",
    price: 2.00,
    category: "side",
    allergens: [],
    isVegan: true,
  },
  {
    id: "si5",
    name: "Papadum (4 pcs) with Chutneys",
    description: "Crisp lentil wafers served with mint, tamarind and mango chutneys.",
    price: 3.50,
    category: "side",
    allergens: ["gluten", "mustard"],
    isVegan: true,
  },

  // RICE
  {
    id: "r1",
    name: "Steamed Basmati Rice",
    description: "Fluffy long-grain basmati rice, simply steamed.",
    price: 3.50,
    category: "rice",
    allergens: [],
    isVegan: true,
  },
  {
    id: "r2",
    name: "Pilau Rice",
    description: "Basmati rice cooked with whole spices, saffron and golden onions.",
    price: 4.00,
    category: "rice",
    allergens: [],
    isVegan: true,
  },
  {
    id: "r3",
    name: "Chicken Biryani",
    description: "Fragrant basmati layered with spiced chicken, saffron and fried onions. Served with raita.",
    price: 15.95,
    category: "rice",
    allergens: ["dairy"],
    chefPick: true,
  },
  {
    id: "r4",
    name: "Vegetable Biryani",
    description: "Seasonal vegetables and paneer layered with saffron basmati. Served with raita.",
    price: 13.95,
    category: "rice",
    allergens: ["dairy"],
    isVegetarian: true,
  },

  // BREADS
  {
    id: "b1",
    name: "Plain Naan",
    description: "Soft, pillowy leavened bread baked fresh in the tandoor.",
    price: 3.00,
    category: "bread",
    allergens: ["gluten", "dairy"],
    isVegetarian: true,
  },
  {
    id: "b2",
    name: "Garlic & Coriander Naan",
    description: "Tandoor naan brushed with garlic butter and fresh coriander.",
    price: 3.75,
    category: "bread",
    allergens: ["gluten", "dairy"],
    isVegetarian: true,
  },
  {
    id: "b3",
    name: "Peshwari Naan",
    description: "Sweet naan filled with desiccated coconut, almonds and sultanas.",
    price: 3.95,
    category: "bread",
    allergens: ["gluten", "dairy", "nuts"],
    isVegetarian: true,
  },
  {
    id: "b4",
    name: "Paratha",
    description: "Whole wheat layered flatbread, pan-fried with butter.",
    price: 3.50,
    category: "bread",
    allergens: ["gluten", "dairy"],
    isVegetarian: true,
  },
  {
    id: "b5",
    name: "Chapati",
    description: "Unleavened whole wheat flatbread, lightly toasted on the tawa.",
    price: 2.50,
    category: "bread",
    allergens: ["gluten"],
    isVegan: true,
  },
];

export const categoryOrder = ["special", "starter", "main", "side", "rice", "bread"] as const;

export const categoryLabels: Record<string, string> = {
  special: "Today's Specials",
  starter: "Starters",
  main: "Main Course",
  side: "Side Dishes",
  rice: "Rice & Biryani",
  bread: "Breads",
};
