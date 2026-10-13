/**
 * Centralized Laundry Pricing Data Catalog
 * 
 * Rules:
 * - Prices displayed ONLY for the main categories (restored to original values).
 * - No prices displayed for subcategories or individual clothing items.
 * - All duplicate clothing items removed across subcategories (unique to each category).
 */

export const PRICING_CATEGORIES = [
  {
    id: 'wash-fold',
    name: 'Wash & Fold',
    desc: 'Everyday clothes, fresh and clean.',
    price: '₹ 85 / kg',
    icon: 'Shirt'
  },
  {
    id: 'wash-iron',
    name: 'Wash & Iron',
    desc: 'Cleaned and neatly ironed.',
    price: '₹ 120 / kg',
    icon: 'Layers'
  },
  {
    id: 'dry-cleaning',
    name: 'Dry Cleaning',
    desc: 'For premium and delicate fabrics.',
    price: '₹ 120 / item',
    icon: 'Sparkles'
  },
  {
    id: 'steam-iron',
    name: 'Steam Iron',
    desc: 'Quick and perfect finish.',
    price: '₹ 20 / item',
    icon: 'Flame'
  },
  {
    id: 'express-laundry',
    name: 'Express Laundry',
    desc: 'Superfast 24-hour turnaround for urgent laundry care.',
    price: '₹ 200 / item',
    icon: 'Zap'
  }
];

export const PRICING_SUBCATEGORIES = [
  { id: 'men', name: 'Men', icon: 'User', desc: 'Shirts, trousers, suits & everyday mens wear' },
  { id: 'women', name: 'Women', icon: 'Sparkles', desc: 'Dresses, sarees, kurtis & delicate wear' },
  { id: 'kids', name: 'Kids', icon: 'Baby', desc: 'School uniforms, casuals & baby wear' },
  { id: 'household', name: 'Household', icon: 'Home', desc: 'Bedsheets, blankets, curtains & linens' }
];

export const PRICING_ITEMS = [
  // ==========================================
  // 1. MEN SUBCATEGORY (21 ITEMS)
  // ==========================================
  { id: 'men-tshirt', name: 'T-shirt', subcategory: 'men', unit: 'item' },
  { id: 'men-shirt', name: 'Shirt', subcategory: 'men', unit: 'item' },
  { id: 'men-formal-shirt', name: 'Formal shirt', subcategory: 'men', unit: 'item' },
  { id: 'men-polo-tshirt', name: 'Polo T-shirt', subcategory: 'men', unit: 'item' },
  { id: 'men-jeans', name: 'Jeans', subcategory: 'men', unit: 'item' },
  { id: 'men-trousers', name: 'Trousers', subcategory: 'men', unit: 'item' },
  { id: 'men-shorts', name: 'Shorts', subcategory: 'men', unit: 'item' },
  { id: 'men-kurta', name: 'Kurta', subcategory: 'men', unit: 'item' },
  { id: 'men-pajama', name: 'Pajama', subcategory: 'men', unit: 'item' },
  { id: 'men-suit-2pc', name: 'Suit (2-piece)', subcategory: 'men', unit: 'set' },
  { id: 'men-blazer', name: 'Blazer', subcategory: 'men', unit: 'item' },
  { id: 'men-jacket', name: 'Jacket', subcategory: 'men', unit: 'item' },
  { id: 'men-sweater', name: 'Sweater', subcategory: 'men', unit: 'item' },
  { id: 'men-hoodie', name: 'Hoodie', subcategory: 'men', unit: 'item' },
  { id: 'men-sweatshirt', name: 'Sweatshirt', subcategory: 'men', unit: 'item' },
  { id: 'men-waistcoat', name: 'Waistcoat', subcategory: 'men', unit: 'item' },
  { id: 'men-traditional-wear', name: 'Traditional wear', subcategory: 'men', unit: 'item' },
  { id: 'men-dhoti', name: 'Dhoti', subcategory: 'men', unit: 'item' },
  { id: 'men-tie', name: 'Tie', subcategory: 'men', unit: 'item' },
  { id: 'men-socks', name: 'Socks', subcategory: 'men', unit: 'pair' },
  { id: 'men-undergarments', name: 'Undergarments', subcategory: 'men', unit: 'item' },

  // ==========================================
  // 2. WOMEN SUBCATEGORY (18 UNIQUE ITEMS - NO MEN DUPLICATES)
  // ==========================================
  { id: 'women-top', name: 'Top', subcategory: 'women', unit: 'item' },
  { id: 'women-blouse', name: 'Blouse', subcategory: 'women', unit: 'item' },
  { id: 'women-kurti', name: 'Kurti', subcategory: 'women', unit: 'item' },
  { id: 'women-leggings', name: 'Leggings', subcategory: 'women', unit: 'item' },
  { id: 'women-skirt', name: 'Skirt', subcategory: 'women', unit: 'item' },
  { id: 'women-dress', name: 'Dress', subcategory: 'women', unit: 'item' },
  { id: 'women-gown', name: 'Gown', subcategory: 'women', unit: 'item' },
  { id: 'women-saree', name: 'Saree', subcategory: 'women', unit: 'item' },
  { id: 'women-saree-blouse', name: 'Saree blouse', subcategory: 'women', unit: 'item' },
  { id: 'women-dupatta', name: 'Dupatta', subcategory: 'women', unit: 'item' },
  { id: 'women-salwar-suit', name: 'Salwar suit', subcategory: 'women', unit: 'set' },
  { id: 'women-lehenga', name: 'Lehenga', subcategory: 'women', unit: 'set' },
  { id: 'women-anarkali-dress', name: 'Anarkali dress', subcategory: 'women', unit: 'item' },
  { id: 'women-cardigan', name: 'Cardigan', subcategory: 'women', unit: 'item' },
  { id: 'women-shawl', name: 'Shawl', subcategory: 'women', unit: 'item' },
  { id: 'women-scarf', name: 'Scarf', subcategory: 'women', unit: 'item' },
  { id: 'women-suit', name: 'Women’s suit', subcategory: 'women', unit: 'set' },
  { id: 'women-nightwear', name: 'Nightwear', subcategory: 'women', unit: 'item' },

  // ==========================================
  // 3. KIDS SUBCATEGORY (10 UNIQUE ITEMS - NO MEN/WOMEN DUPLICATES)
  // ==========================================
  { id: 'kids-frock', name: 'Frock', subcategory: 'kids', unit: 'item' },
  { id: 'kids-school-uniform', name: 'School uniform', subcategory: 'kids', unit: 'set' },
  { id: 'kids-school-shirt', name: 'School shirt', subcategory: 'kids', unit: 'item' },
  { id: 'kids-school-trousers', name: 'School trousers', subcategory: 'kids', unit: 'item' },
  { id: 'kids-school-skirt', name: 'School skirt', subcategory: 'kids', unit: 'item' },
  { id: 'kids-kurta-pajama', name: 'Kurta pajama', subcategory: 'kids', unit: 'set' },
  { id: 'kids-ethnic-wear', name: 'Ethnic wear', subcategory: 'kids', unit: 'set' },
  { id: 'kids-baby-clothes', name: 'Baby clothes', subcategory: 'kids', unit: 'item' },
  { id: 'kids-romper', name: 'Romper', subcategory: 'kids', unit: 'item' },
  { id: 'kids-blanket', name: "Kids' blanket", subcategory: 'kids', unit: 'item' },

  // ==========================================
  // 4. HOUSEHOLD SUBCATEGORY (20 UNIQUE ITEMS)
  // ==========================================
  { id: 'hh-single-bedsheet', name: 'Single bedsheet', subcategory: 'household', unit: 'piece' },
  { id: 'hh-double-bedsheet', name: 'Double bedsheet', subcategory: 'household', unit: 'piece' },
  { id: 'hh-pillow-cover', name: 'Pillow cover', subcategory: 'household', unit: 'piece' },
  { id: 'hh-pillow', name: 'Pillow', subcategory: 'household', unit: 'piece' },
  { id: 'hh-blanket', name: 'Blanket', subcategory: 'household', unit: 'piece' },
  { id: 'hh-comforter', name: 'Comforter', subcategory: 'household', unit: 'piece' },
  { id: 'hh-quilt', name: 'Quilt', subcategory: 'household', unit: 'piece' },
  { id: 'hh-duvet', name: 'Duvet', subcategory: 'household', unit: 'piece' },
  { id: 'hh-mattress-protector', name: 'Mattress protector', subcategory: 'household', unit: 'piece' },
  { id: 'hh-bed-cover', name: 'Bed cover', subcategory: 'household', unit: 'piece' },
  { id: 'hh-curtains', name: 'Curtains', subcategory: 'household', unit: 'piece' },
  { id: 'hh-cushion-cover', name: 'Cushion cover', subcategory: 'household', unit: 'piece' },
  { id: 'hh-sofa-cover', name: 'Sofa cover', subcategory: 'household', unit: 'piece' },
  { id: 'hh-tablecloth', name: 'Tablecloth', subcategory: 'household', unit: 'piece' },
  { id: 'hh-table-runner', name: 'Table runner', subcategory: 'household', unit: 'piece' },
  { id: 'hh-bath-towel', name: 'Bath towel', subcategory: 'household', unit: 'piece' },
  { id: 'hh-hand-towel', name: 'Hand towel', subcategory: 'household', unit: 'piece' },
  { id: 'hh-bath-mat', name: 'Bath mat', subcategory: 'household', unit: 'piece' },
  { id: 'hh-doormat', name: 'Doormat', subcategory: 'household', unit: 'piece' },
  { id: 'hh-kitchen-towel', name: 'Kitchen towel', subcategory: 'household', unit: 'piece' }
];

/**
 * Helper to fetch category items for a given category and subcategory
 */
export const getCategoryItems = (categoryId, subcategoryId) => {
  return PRICING_ITEMS
    .filter(item => item.subcategory === subcategoryId)
    .map(item => ({
      id: item.id,
      name: item.name,
      unit: item.unit,
      subcategory: item.subcategory
    }));
};
