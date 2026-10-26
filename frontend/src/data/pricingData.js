/**
 * Centralized Laundry Pricing Data Catalog
 * Contains 5 Main Categories, 4 Subcategories, and 69 Deduplicated Item Records.
 * 
 * Rules:
 * - All duplicate clothing items removed across subcategories.
 * - Original item-wise laundry prices restored for Wash & Fold, Wash & Iron, and Express Laundry.
 * - Dry Cleaning & Steam Iron item prices omitted/hidden (Available tag displayed).
 * - No "(item)" label rendered after standard clothing names.
 */

export const PRICING_CATEGORIES = [
  {
    id: 'wash-fold',
    name: 'Wash & Fold',
    desc: 'Everyday essentials fresh and clean.',
    price: '₹ 85 / kg',
    isPriceEnabled: true,
    icon: 'Shirt'
  },
  {
    id: 'wash-iron',
    name: 'Wash & Iron',
    desc: 'Clean clothes, ready to wear.',
    price: '₹ 120 / kg',
    isPriceEnabled: true,
    icon: 'Layers'
  },
  {
    id: 'dry-cleaning',
    name: 'Dry Cleaning',
    desc: 'For your delicate and premium wear.',
    price: '₹ 120 / piece',
    isPriceEnabled: true,
    icon: 'Sparkles'
  },
  {
    id: 'steam-iron',
    name: 'Steam Iron',
    desc: 'Crisp and perfectly pressed.',
    price: '₹ 20 / item',
    isPriceEnabled: true,
    icon: 'Flame'
  },
  {
    id: 'express-laundry',
    name: 'Express Laundry',
    desc: 'Superfast 24-hour priority laundry service.',
    price: '₹ 200 / item',
    isPriceEnabled: true,
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
  {
    id: 'men-tshirt',
    name: 'T-shirt',
    subcategory: 'men',
    unit: 'item',
    prices: { 'wash-fold': 35, 'wash-iron': 50, 'express-laundry': 70, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'men-shirt',
    name: 'Shirt',
    subcategory: 'men',
    unit: 'item',
    prices: { 'wash-fold': 40, 'wash-iron': 55, 'express-laundry': 80, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'men-formal-shirt',
    name: 'Formal shirt',
    subcategory: 'men',
    unit: 'item',
    prices: { 'wash-fold': 45, 'wash-iron': 60, 'express-laundry': 90, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'men-polo-tshirt',
    name: 'Polo T-shirt',
    subcategory: 'men',
    unit: 'item',
    prices: { 'wash-fold': 40, 'wash-iron': 55, 'express-laundry': 80, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'men-jeans',
    name: 'Jeans',
    subcategory: 'men',
    unit: 'item',
    prices: { 'wash-fold': 50, 'wash-iron': 65, 'express-laundry': 100, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'men-trousers',
    name: 'Trousers',
    subcategory: 'men',
    unit: 'item',
    prices: { 'wash-fold': 45, 'wash-iron': 60, 'express-laundry': 90, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'men-shorts',
    name: 'Shorts',
    subcategory: 'men',
    unit: 'item',
    prices: { 'wash-fold': 30, 'wash-iron': 40, 'express-laundry': 60, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'men-kurta',
    name: 'Kurta',
    subcategory: 'men',
    unit: 'item',
    prices: { 'wash-fold': 50, 'wash-iron': 65, 'express-laundry': 100, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'men-pajama',
    name: 'Pajama',
    subcategory: 'men',
    unit: 'item',
    prices: { 'wash-fold': 40, 'wash-iron': 55, 'express-laundry': 80, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'men-suit-2pc',
    name: 'Suit (2-piece)',
    subcategory: 'men',
    unit: 'set',
    prices: { 'wash-fold': 150, 'wash-iron': 220, 'express-laundry': 320, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'men-blazer',
    name: 'Blazer',
    subcategory: 'men',
    unit: 'item',
    prices: { 'wash-fold': 100, 'wash-iron': 140, 'express-laundry': 200, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'men-jacket',
    name: 'Jacket',
    subcategory: 'men',
    unit: 'item',
    prices: { 'wash-fold': 90, 'wash-iron': 120, 'express-laundry': 180, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'men-sweater',
    name: 'Sweater',
    subcategory: 'men',
    unit: 'item',
    prices: { 'wash-fold': 60, 'wash-iron': 80, 'express-laundry': 120, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'men-hoodie',
    name: 'Hoodie',
    subcategory: 'men',
    unit: 'item',
    prices: { 'wash-fold': 65, 'wash-iron': 85, 'express-laundry': 130, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'men-sweatshirt',
    name: 'Sweatshirt',
    subcategory: 'men',
    unit: 'item',
    prices: { 'wash-fold': 60, 'wash-iron': 80, 'express-laundry': 120, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'men-waistcoat',
    name: 'Waistcoat',
    subcategory: 'men',
    unit: 'item',
    prices: { 'wash-fold': 50, 'wash-iron': 70, 'express-laundry': 100, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'men-traditional-wear',
    name: 'Traditional wear',
    subcategory: 'men',
    unit: 'item',
    prices: { 'wash-fold': 70, 'wash-iron': 95, 'express-laundry': 140, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'men-dhoti',
    name: 'Dhoti',
    subcategory: 'men',
    unit: 'item',
    prices: { 'wash-fold': 45, 'wash-iron': 60, 'express-laundry': 90, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'men-tie',
    name: 'Tie',
    subcategory: 'men',
    unit: 'item',
    prices: { 'wash-fold': 25, 'wash-iron': 35, 'express-laundry': 50, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'men-socks',
    name: 'Socks',
    subcategory: 'men',
    unit: 'pair',
    prices: { 'wash-fold': 20, 'wash-iron': 25, 'express-laundry': 40, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'men-undergarments',
    name: 'Undergarments',
    subcategory: 'men',
    unit: 'item',
    prices: { 'wash-fold': 20, 'wash-iron': 25, 'express-laundry': 40, 'dry-cleaning': null, 'steam-iron': null }
  },

  // ==========================================
  // 2. WOMEN SUBCATEGORY (18 UNIQUE ITEMS - NO MEN DUPLICATES)
  // ==========================================
  {
    id: 'women-top',
    name: 'Top',
    subcategory: 'women',
    unit: 'item',
    prices: { 'wash-fold': 35, 'wash-iron': 50, 'express-laundry': 70, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'women-blouse',
    name: 'Blouse',
    subcategory: 'women',
    unit: 'item',
    prices: { 'wash-fold': 30, 'wash-iron': 45, 'express-laundry': 65, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'women-kurti',
    name: 'Kurti',
    subcategory: 'women',
    unit: 'item',
    prices: { 'wash-fold': 45, 'wash-iron': 60, 'express-laundry': 90, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'women-leggings',
    name: 'Leggings',
    subcategory: 'women',
    unit: 'item',
    prices: { 'wash-fold': 35, 'wash-iron': 45, 'express-laundry': 70, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'women-skirt',
    name: 'Skirt',
    subcategory: 'women',
    unit: 'item',
    prices: { 'wash-fold': 45, 'wash-iron': 60, 'express-laundry': 90, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'women-dress',
    name: 'Dress',
    subcategory: 'women',
    unit: 'item',
    prices: { 'wash-fold': 60, 'wash-iron': 85, 'express-laundry': 120, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'women-gown',
    name: 'Gown',
    subcategory: 'women',
    unit: 'item',
    prices: { 'wash-fold': 120, 'wash-iron': 160, 'express-laundry': 240, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'women-saree',
    name: 'Saree',
    subcategory: 'women',
    unit: 'item',
    prices: { 'wash-fold': 80, 'wash-iron': 120, 'express-laundry': 180, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'women-saree-blouse',
    name: 'Saree blouse',
    subcategory: 'women',
    unit: 'item',
    prices: { 'wash-fold': 30, 'wash-iron': 45, 'express-laundry': 65, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'women-dupatta',
    name: 'Dupatta',
    subcategory: 'women',
    unit: 'item',
    prices: { 'wash-fold': 30, 'wash-iron': 45, 'express-laundry': 65, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'women-salwar-suit',
    name: 'Salwar suit',
    subcategory: 'women',
    unit: 'set',
    prices: { 'wash-fold': 70, 'wash-iron': 95, 'express-laundry': 140, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'women-lehenga',
    name: 'Lehenga',
    subcategory: 'women',
    unit: 'set',
    prices: { 'wash-fold': 160, 'wash-iron': 220, 'express-laundry': 320, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'women-anarkali-dress',
    name: 'Anarkali dress',
    subcategory: 'women',
    unit: 'item',
    prices: { 'wash-fold': 90, 'wash-iron': 130, 'express-laundry': 180, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'women-cardigan',
    name: 'Cardigan',
    subcategory: 'women',
    unit: 'item',
    prices: { 'wash-fold': 60, 'wash-iron': 80, 'express-laundry': 120, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'women-shawl',
    name: 'Shawl',
    subcategory: 'women',
    unit: 'item',
    prices: { 'wash-fold': 45, 'wash-iron': 65, 'express-laundry': 95, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'women-scarf',
    name: 'Scarf',
    subcategory: 'women',
    unit: 'item',
    prices: { 'wash-fold': 25, 'wash-iron': 35, 'express-laundry': 50, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'women-suit',
    name: 'Women’s suit',
    subcategory: 'women',
    unit: 'set',
    prices: { 'wash-fold': 140, 'wash-iron': 190, 'express-laundry': 280, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'women-nightwear',
    name: 'Nightwear',
    subcategory: 'women',
    unit: 'item',
    prices: { 'wash-fold': 40, 'wash-iron': 55, 'express-laundry': 80, 'dry-cleaning': null, 'steam-iron': null }
  },

  // ==========================================
  // 3. KIDS SUBCATEGORY (10 UNIQUE ITEMS - NO MEN/WOMEN DUPLICATES)
  // ==========================================
  {
    id: 'kids-frock',
    name: 'Frock',
    subcategory: 'kids',
    unit: 'item',
    prices: { 'wash-fold': 35, 'wash-iron': 50, 'express-laundry': 70, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'kids-school-uniform',
    name: 'School uniform',
    subcategory: 'kids',
    unit: 'set',
    prices: { 'wash-fold': 60, 'wash-iron': 80, 'express-laundry': 120, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'kids-school-shirt',
    name: 'School shirt',
    subcategory: 'kids',
    unit: 'item',
    prices: { 'wash-fold': 30, 'wash-iron': 40, 'express-laundry': 60, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'kids-school-trousers',
    name: 'School trousers',
    subcategory: 'kids',
    unit: 'item',
    prices: { 'wash-fold': 35, 'wash-iron': 45, 'express-laundry': 70, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'kids-school-skirt',
    name: 'School skirt',
    subcategory: 'kids',
    unit: 'item',
    prices: { 'wash-fold': 30, 'wash-iron': 40, 'express-laundry': 60, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'kids-kurta-pajama',
    name: 'Kurta pajama',
    subcategory: 'kids',
    unit: 'set',
    prices: { 'wash-fold': 50, 'wash-iron': 70, 'express-laundry': 100, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'kids-ethnic-wear',
    name: 'Ethnic wear',
    subcategory: 'kids',
    unit: 'set',
    prices: { 'wash-fold': 60, 'wash-iron': 80, 'express-laundry': 120, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'kids-baby-clothes',
    name: 'Baby clothes',
    subcategory: 'kids',
    unit: 'item',
    prices: { 'wash-fold': 25, 'wash-iron': 35, 'express-laundry': 50, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'kids-romper',
    name: 'Romper',
    subcategory: 'kids',
    unit: 'item',
    prices: { 'wash-fold': 25, 'wash-iron': 35, 'express-laundry': 50, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'kids-blanket',
    name: "Kids' blanket",
    subcategory: 'kids',
    unit: 'item',
    prices: { 'wash-fold': 70, 'wash-iron': 95, 'express-laundry': 140, 'dry-cleaning': null, 'steam-iron': null }
  },

  // ==========================================
  // 4. HOUSEHOLD SUBCATEGORY (20 UNIQUE ITEMS)
  // ==========================================
  {
    id: 'hh-single-bedsheet',
    name: 'Single bedsheet',
    subcategory: 'household',
    unit: 'piece',
    prices: { 'wash-fold': 60, 'wash-iron': 85, 'express-laundry': 120, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'hh-double-bedsheet',
    name: 'Double bedsheet',
    subcategory: 'household',
    unit: 'piece',
    prices: { 'wash-fold': 90, 'wash-iron': 120, 'express-laundry': 170, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'hh-pillow-cover',
    name: 'Pillow cover',
    subcategory: 'household',
    unit: 'piece',
    prices: { 'wash-fold': 20, 'wash-iron': 30, 'express-laundry': 45, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'hh-pillow',
    name: 'Pillow',
    subcategory: 'household',
    unit: 'piece',
    prices: { 'wash-fold': 70, 'wash-iron': 90, 'express-laundry': 130, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'hh-blanket',
    name: 'Blanket',
    subcategory: 'household',
    unit: 'piece',
    prices: { 'wash-fold': 150, 'wash-iron': 190, 'express-laundry': 280, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'hh-comforter',
    name: 'Comforter',
    subcategory: 'household',
    unit: 'piece',
    prices: { 'wash-fold': 180, 'wash-iron': 230, 'express-laundry': 330, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'hh-quilt',
    name: 'Quilt',
    subcategory: 'household',
    unit: 'piece',
    prices: { 'wash-fold': 180, 'wash-iron': 230, 'express-laundry': 330, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'hh-duvet',
    name: 'Duvet',
    subcategory: 'household',
    unit: 'piece',
    prices: { 'wash-fold': 190, 'wash-iron': 240, 'express-laundry': 340, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'hh-mattress-protector',
    name: 'Mattress protector',
    subcategory: 'household',
    unit: 'piece',
    prices: { 'wash-fold': 120, 'wash-iron': 150, 'express-laundry': 220, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'hh-bed-cover',
    name: 'Bed cover',
    subcategory: 'household',
    unit: 'piece',
    prices: { 'wash-fold': 100, 'wash-iron': 130, 'express-laundry': 190, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'hh-curtains',
    name: 'Curtains',
    subcategory: 'household',
    unit: 'piece',
    prices: { 'wash-fold': 90, 'wash-iron': 130, 'express-laundry': 180, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'hh-cushion-cover',
    name: 'Cushion cover',
    subcategory: 'household',
    unit: 'piece',
    prices: { 'wash-fold': 30, 'wash-iron': 45, 'express-laundry': 65, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'hh-sofa-cover',
    name: 'Sofa cover',
    subcategory: 'household',
    unit: 'piece',
    prices: { 'wash-fold': 120, 'wash-iron': 160, 'express-laundry': 240, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'hh-tablecloth',
    name: 'Tablecloth',
    subcategory: 'household',
    unit: 'piece',
    prices: { 'wash-fold': 50, 'wash-iron': 70, 'express-laundry': 110, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'hh-table-runner',
    name: 'Table runner',
    subcategory: 'household',
    unit: 'piece',
    prices: { 'wash-fold': 35, 'wash-iron': 50, 'express-laundry': 75, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'hh-bath-towel',
    name: 'Bath towel',
    subcategory: 'household',
    unit: 'piece',
    prices: { 'wash-fold': 40, 'wash-iron': 55, 'express-laundry': 80, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'hh-hand-towel',
    name: 'Hand towel',
    subcategory: 'household',
    unit: 'piece',
    prices: { 'wash-fold': 20, 'wash-iron': 28, 'express-laundry': 40, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'hh-bath-mat',
    name: 'Bath mat',
    subcategory: 'household',
    unit: 'piece',
    prices: { 'wash-fold': 35, 'wash-iron': 45, 'express-laundry': 65, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'hh-doormat',
    name: 'Doormat',
    subcategory: 'household',
    unit: 'piece',
    prices: { 'wash-fold': 35, 'wash-iron': 45, 'express-laundry': 65, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'hh-kitchen-towel',
    name: 'Kitchen towel',
    subcategory: 'household',
    unit: 'piece',
    prices: { 'wash-fold': 15, 'wash-iron': 22, 'express-laundry': 30, 'dry-cleaning': null, 'steam-iron': null }
  },

  // ==========================================
  // 5. SHOE LAUNDRY ITEMS (6 ITEMS)
  // ==========================================
  {
    id: 'shoe-sneakers',
    name: 'Sneakers / Casual shoes',
    subcategory: 'men',
    unit: 'pair',
    prices: { 'shoe-laundry': 150, 'wash-fold': 150, 'dry-cleaning': 180, 'express-laundry': 250 }
  },
  {
    id: 'shoe-sports',
    name: 'Sports / Running shoes',
    subcategory: 'men',
    unit: 'pair',
    prices: { 'shoe-laundry': 150, 'wash-fold': 150, 'dry-cleaning': 180, 'express-laundry': 250 }
  },
  {
    id: 'shoe-leather',
    name: 'Formal leather shoes',
    subcategory: 'men',
    unit: 'pair',
    prices: { 'shoe-laundry': 200, 'wash-fold': 200, 'dry-cleaning': 220, 'express-laundry': 300 }
  },
  {
    id: 'shoe-suede',
    name: 'Suede shoes / Boots',
    subcategory: 'men',
    unit: 'pair',
    prices: { 'shoe-laundry': 250, 'wash-fold': 250, 'dry-cleaning': 280, 'express-laundry': 350 }
  },
  {
    id: 'shoe-women-heels',
    name: 'Heels / Wedges / Flats',
    subcategory: 'women',
    unit: 'pair',
    prices: { 'shoe-laundry': 160, 'wash-fold': 160, 'dry-cleaning': 180, 'express-laundry': 260 }
  },
  {
    id: 'shoe-kids',
    name: 'Kids school / sports shoes',
    subcategory: 'kids',
    unit: 'pair',
    prices: { 'shoe-laundry': 100, 'wash-fold': 100, 'dry-cleaning': 120, 'express-laundry': 180 }
  }
];

/**
 * 4 Core Express Laundry Services
 */
export const EXPRESS_SERVICES = [
  {
    id: 'wash-fold',
    name: 'Wash & Fold',
    icon: 'Shirt',
    desc: 'Washed, dried & neatly folded',
    tag: '24h Priority'
  },
  {
    id: 'wash-iron',
    name: 'Wash & Iron',
    icon: 'Layers',
    desc: 'Washed & crisply ironed',
    tag: '24h Priority'
  },
  {
    id: 'dry-cleaning',
    name: 'Dry Cleaning',
    icon: 'Sparkles',
    desc: 'Delicate dry cleaning & press',
    tag: '24h Priority'
  },
  {
    id: 'steam-iron',
    name: 'Steam Iron',
    icon: 'Flame',
    desc: 'Wrinkle-free steam pressing',
    tag: '24h Priority'
  }
];

/**
 * Check if a specific clothing item is applicable to a given laundry service
 */
export const isItemApplicableToService = (item, serviceId) => {
  if (!item) return false;

  const targetService = String(serviceId || '').toLowerCase().trim();

  // 1. Check if item has an applicableServices or services array
  const servicesList = Array.isArray(item.applicableServices) 
    ? item.applicableServices 
    : (Array.isArray(item.services) ? item.services : null);

  if (servicesList && servicesList.length > 0) {
    const hasExplicitMatch = servicesList.some(s => {
      const sLower = String(s || '').toLowerCase().trim();
      if (sLower === 'all' || sLower === 'all services' || sLower.includes('all')) return true;
      if (sLower === targetService) return true;
      if (targetService.includes('fold') && sLower.includes('fold')) return true;
      if (targetService.includes('iron') && targetService.includes('wash') && sLower.includes('iron') && sLower.includes('wash')) return true;
      if (targetService.includes('dry') && sLower.includes('dry')) return true;
      if (targetService.includes('steam') && (sLower.includes('steam') || (sLower.includes('iron') && !sLower.includes('wash')))) return true;
      if (targetService.includes('shoe') && sLower.includes('shoe')) return true;
      if (targetService.includes('express') && sLower.includes('express')) return true;
      return false;
    });
    if (hasExplicitMatch) return true;
  }

  // 2. Direct check: If item has prices map with this service explicitly set to a number
  if (item.prices && typeof item.prices === 'object') {
    if (item.prices[serviceId] !== undefined && item.prices[serviceId] !== null) {
      return true;
    }
  }

  // 3. Check category or service property on item
  const cat = String(item.category || item.service || '').toLowerCase().trim();
  if (cat.includes('all')) return true;
  if (cat && (cat === targetService || 
      (targetService.includes('fold') && cat.includes('fold')) ||
      (targetService.includes('wash') && targetService.includes('iron') && cat.includes('wash') && cat.includes('iron')) ||
      (targetService.includes('dry') && cat.includes('dry')) ||
      (targetService.includes('steam') && (cat.includes('steam') || (cat.includes('iron') && !cat.includes('wash'))))
  )) {
    return true;
  }

  // 4. Safely extract string ID or code
  const rawId = item.code || item.slug || (typeof item.id === 'string' ? item.id : (item.id != null ? String(item.id) : ''));
  const id = String(rawId || '').toLowerCase().trim();
  const name = String(item.name || '').toLowerCase().trim();
  const subcategory = String(item.subcategory || item.subcategoryId || '').toLowerCase().trim();
  const category = String(item.category || '').toLowerCase().trim();

  // Shoe laundry only accepts shoe items
  if (targetService === 'shoe-laundry') {
    return id.startsWith('shoe-') || name.includes('shoe') || subcategory === 'shoe';
  }

  // Home Care only accepts household items
  if (targetService === 'home-care') {
    return subcategory === 'household' || category === 'household';
  }

  // Other standard clothing services should not include shoes
  if (id.startsWith('shoe-') || name.includes('shoe') || subcategory === 'shoe') {
    return false;
  }

  if (targetService === 'wash-fold') {
    // Structured formal 2pc suits/blazers are dry clean only
    if (id === 'men-suit-2pc' || id === 'men-blazer' || name.includes('blazer') || (name.includes('suit') && !name.includes('salwar'))) return false;
    return true;
  }

  if (targetService === 'wash-iron') {
    // Exclude items that are never ironed (undergarments, socks, mats, heavy suits)
    if (id === 'men-undergarments' || id === 'men-socks' || name.includes('undergarment') || name.includes('sock')) return false;
    if (id === 'hh-bath-mat' || id === 'hh-doormat' || id === 'hh-kitchen-towel' || name.includes('mat') || name.includes('kitchen towel')) return false;
    if (id === 'men-suit-2pc' || id === 'men-blazer' || name.includes('blazer') || (name.includes('suit') && !name.includes('salwar'))) return false;
    return true;
  }

  if (targetService === 'dry-cleaning') {
    // Delicate, formal, wool, ethnic garments and heavy linens
    // Exclude everyday undergarments, basic socks, casual shorts, bath mats, doormats, towels
    if (id === 'men-undergarments' || id === 'men-socks' || id === 'men-shorts') return false;
    if (id === 'women-nightwear' || id === 'women-leggings') return false;
    if (id === 'kids-romper' || id === 'kids-baby-clothes') return false;
    if (id === 'hh-bath-mat' || id === 'hh-doormat' || id === 'hh-kitchen-towel' || id === 'hh-hand-towel') return false;
    if (name.includes('undergarment') || name.includes('sock') || name.includes('doormat') || name.includes('bath mat')) return false;
    return true;
  }

  if (targetService === 'steam-iron') {
    // Items that can be pressed with high temperature steam
    // Exclude undergarments, socks, thick bedding/quilts/duvets, mats, towels
    if (id === 'men-undergarments' || id === 'men-socks') return false;
    if (id === 'women-leggings' || id === 'women-nightwear') return false;
    if (id === 'kids-baby-clothes' || id === 'kids-romper') return false;
    if (id === 'hh-blanket' || id === 'hh-comforter' || id === 'hh-quilt' || id === 'hh-duvet' || id === 'hh-bath-mat' || id === 'hh-doormat' || id === 'hh-bath-towel') return false;
    if (name.includes('undergarment') || name.includes('sock') || name.includes('blanket') || name.includes('quilt') || name.includes('comforter') || name.includes('mat')) return false;
    return true;
  }

  return true;
};

// Live Admin Services Catalog state and caching
let _liveAdminCatalog = null;

export const setLiveAdminCatalog = (catalog) => {
  if (Array.isArray(catalog)) {
    _liveAdminCatalog = catalog;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('fabricare_admin_services', JSON.stringify(catalog));
      }
    } catch (_) {}
  }
};

export const getLiveAdminCatalog = () => {
  if (_liveAdminCatalog && _liveAdminCatalog.length > 0) return _liveAdminCatalog;
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('fabricare_admin_services');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          _liveAdminCatalog = parsed;
          return parsed;
        }
      }
    }
  } catch (_) {}
  return null;
};

/**
 * Determine base standard price for an item under a specific service,
 * respecting any live admin updates.
 */
export const getItemBasePrice = (item, serviceId) => {
  if (!item) return 50;

  // 1. Direct explicit price override on the item
  if (item.prices && serviceId && item.prices[serviceId] != null) {
    return Number(item.prices[serviceId]);
  }

  // 2. Check live admin catalog for updated price
  const catalog = getLiveAdminCatalog();
  if (catalog && catalog.length > 0) {
    const cleanItemId = String(item.id || '').toLowerCase();
    const cleanItemName = String(item.name || '').trim().toLowerCase();
    const match = catalog.find(s => 
      (s.code && String(s.code).toLowerCase() === cleanItemId) ||
      (s.id && String(s.id).toLowerCase() === cleanItemId) ||
      (s.name && String(s.name).trim().toLowerCase() === cleanItemName)
    );

    if (match) {
      if (serviceId && match.prices && match.prices[serviceId] != null) {
        return Number(match.prices[serviceId]);
      }
      if (match.price != null && (match.category === serviceId || !match.prices)) {
        return Number(match.price);
      }
    }
  }

  // 3. Category/Service specific fallbacks
  if (serviceId === 'wash-fold') {
    return item.prices?.['wash-fold'] || 40;
  }

  if (serviceId === 'wash-iron') {
    return item.prices?.['wash-iron'] || 55;
  }

  if (serviceId === 'dry-cleaning') {
    if (item.prices?.['dry-cleaning']) return item.prices['dry-cleaning'];
    const n = String(item.name || '').toLowerCase();
    if (n.includes('suit') || n.includes('lehenga')) return 250;
    if (n.includes('blazer') || n.includes('gown') || n.includes('anarkali') || n.includes('blanket') || n.includes('quilt')) return 180;
    if (n.includes('jacket') || n.includes('saree') || n.includes('comforter') || n.includes('curtain') || n.includes('duvet')) return 150;
    if (n.includes('sweater') || n.includes('kurta') || n.includes('dress') || n.includes('bedsheet')) return 120;
    if (n.includes('shirt') || n.includes('trouser') || n.includes('blouse') || n.includes('skirt')) return 90;
    if (n.includes('tie') || n.includes('scarf') || n.includes('pillow')) return 60;
    return 100;
  }

  if (serviceId === 'steam-iron') {
    if (item.prices?.['steam-iron']) return item.prices['steam-iron'];
    const n = String(item.name || '').toLowerCase();
    if (n.includes('suit') || n.includes('blazer') || n.includes('jacket') || n.includes('saree') || n.includes('lehenga') || n.includes('gown')) return 50;
    if (n.includes('kurta') || n.includes('pajama') || n.includes('dress') || n.includes('bedsheet') || n.includes('curtain') || n.includes('tablecloth')) return 30;
    if (n.includes('tie') || n.includes('scarf') || n.includes('pillow') || n.includes('runner')) return 15;
    return 20;
  }

  return Number(item.price) || 50;
};

/**
 * Determine doubled Express Laundry price for an item based on selected service
 */
export const getExpressItemPrice = (item, serviceId = 'wash-fold') => {
  if (item?.expressPrice) return Number(item.expressPrice);
  const basePrice = getItemBasePrice(item, serviceId);
  return basePrice * 2;
};

/**
 * Helper to fetch category items for a given category and subcategory,
 * with real-time support for admin edits, status deactivations, deletions, and new items.
 */
export const getCategoryItems = (categoryId, subcategoryId, expressService = 'wash-fold', overrideCatalog = null) => {
  const isExpress = categoryId === 'express-laundry';
  const effectiveService = isExpress ? (expressService || 'wash-fold') : categoryId;

  // Retrieve live admin services catalog (override or cache or memory)
  const liveCatalog = (overrideCatalog && Array.isArray(overrideCatalog)) 
    ? overrideCatalog 
    : getLiveAdminCatalog();

  // Build lookup map for admin updates
  const adminOverridesMap = new Map();
  const customAdminItems = [];

  if (Array.isArray(liveCatalog) && liveCatalog.length > 0) {
    liveCatalog.forEach(adminItem => {
      if (!adminItem) return;
      const cCode = adminItem.code ? String(adminItem.code).toLowerCase() : null;
      const cId = adminItem.id ? String(adminItem.id).toLowerCase() : null;
      const cName = adminItem.name ? String(adminItem.name).trim().toLowerCase() : null;

      if (cCode) adminOverridesMap.set(cCode, adminItem);
      if (cId) adminOverridesMap.set(cId, adminItem);
      if (cName) adminOverridesMap.set(cName, adminItem);

      // Check if this is a custom item added by admin (not in base PRICING_ITEMS)
      const isBaseItem = PRICING_ITEMS.some(b => 
        (cCode && b.id.toLowerCase() === cCode) ||
        (cName && b.name.trim().toLowerCase() === cName)
      );

      if (!isBaseItem) {
        const subCat = (adminItem.subcategory || adminItem.subcategoryId || '').toLowerCase();
        if (subCat === String(subcategoryId || '').toLowerCase()) {
          customAdminItems.push(adminItem);
        }
      }
    });
  }

  // Combine base items and custom admin items
  const combinedList = [...PRICING_ITEMS];
  customAdminItems.forEach(cust => {
    combinedList.push({
      id: cust.code || cust.id || `custom-${cust.name.toLowerCase().replace(/\s+/g, '-')}`,
      name: cust.name,
      subcategory: subcategoryId,
      unit: cust.unit || 'item',
      prices: cust.prices || { [effectiveService]: Number(cust.price) || 100 },
      isCustomAdminItem: true
    });
  });

  return combinedList
    .filter(item => {
      if (item.subcategory !== subcategoryId) return false;

      // Check if item has admin override
      const cleanItemId = String(item.id || '').toLowerCase();
      const cleanItemName = String(item.name || '').trim().toLowerCase();
      const match = adminOverridesMap.get(cleanItemId) || adminOverridesMap.get(cleanItemName);

      // If marked Inactive or Deleted by admin, exclude immediately!
      if (match) {
        if (
          match.isDeleted === true ||
          match.status === 'Deleted' ||
          match.status === 'Inactive' ||
          match.is_active === false ||
          match.isActive === false ||
          match.status === false
        ) {
          return false;
        }
      }

      return isItemApplicableToService(item, effectiveService);
    })
    .map(item => {
      const cleanItemId = String(item.id || '').toLowerCase();
      const cleanItemName = String(item.name || '').trim().toLowerCase();
      const match = adminOverridesMap.get(cleanItemId) || adminOverridesMap.get(cleanItemName);

      const displayName = match?.name || item.name;
      const displayUnit = match?.unit || item.unit;

      // Determine effective base rate for this service:
      let baseRate = 0;
      if (match) {
        if (match.prices && match.prices[effectiveService] != null) {
          baseRate = Number(match.prices[effectiveService]);
        } else if (match.price != null && (match.category === effectiveService || !match.prices)) {
          baseRate = Number(match.price);
        } else {
          baseRate = getItemBasePrice(item, effectiveService);
        }
      } else {
        baseRate = getItemBasePrice(item, effectiveService);
      }

      if (isExpress) {
        const doubledPrice = (match?.expressPrice && Number(match.expressPrice) > 0)
          ? Number(match.expressPrice)
          : (baseRate * 2);

        return {
          id: item.id,
          name: displayName,
          unit: displayUnit,
          price: doubledPrice,
          basePrice: baseRate,
          isPriceEnabled: true,
          expressService: effectiveService
        };
      }

      return {
        id: item.id,
        name: displayName,
        unit: displayUnit,
        price: baseRate,
        basePrice: baseRate,
        isPriceEnabled: true
      };
    });
};
