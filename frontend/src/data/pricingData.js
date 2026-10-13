/**
 * Centralized Laundry Pricing Data Catalog
 * Contains 5 Main Categories, 4 Subcategories, and 87 Item-wise Records.
 * 
 * Rules:
 * - Real, commercially sensible laundry prices in Indian Rupees (₹) for Indian market.
 * - Dry Cleaning and Steam Iron: isPriceEnabled is false, prices are hidden/omitted.
 * - Wash & Fold, Wash & Iron, Express Laundry: item-wise prices displayed.
 */

export const PRICING_CATEGORIES = [
  {
    id: 'wash-fold',
    name: 'Wash & Fold',
    desc: 'Everyday clothes, fresh and clean.',
    rateBadge: '₹ 85 / kg',
    isPriceEnabled: true,
    icon: 'Shirt'
  },
  {
    id: 'wash-iron',
    name: 'Wash & Iron',
    desc: 'Cleaned and neatly ironed.',
    rateBadge: '₹ 120 / kg',
    isPriceEnabled: true,
    icon: 'Layers'
  },
  {
    id: 'dry-cleaning',
    name: 'Dry Cleaning',
    desc: 'For premium and delicate fabrics.',
    rateBadge: '',
    isPriceEnabled: false, // Critical: Prices hidden
    icon: 'Sparkles'
  },
  {
    id: 'steam-iron',
    name: 'Steam Iron',
    desc: 'Quick and perfect finish.',
    rateBadge: '',
    isPriceEnabled: false, // Critical: Prices hidden
    icon: 'Flame'
  },
  {
    id: 'express-laundry',
    name: 'Express Laundry',
    desc: 'Superfast 24-hour turnaround for urgent laundry care.',
    rateBadge: '₹ 200 / item',
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
  // 2. WOMEN SUBCATEGORY (25 ITEMS)
  // ==========================================
  {
    id: 'women-tshirt',
    name: 'T-shirt',
    subcategory: 'women',
    unit: 'item',
    prices: { 'wash-fold': 35, 'wash-iron': 50, 'express-laundry': 70, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'women-top',
    name: 'Top',
    subcategory: 'women',
    unit: 'item',
    prices: { 'wash-fold': 35, 'wash-iron': 50, 'express-laundry': 70, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'women-shirt',
    name: 'Shirt',
    subcategory: 'women',
    unit: 'item',
    prices: { 'wash-fold': 40, 'wash-iron': 55, 'express-laundry': 80, 'dry-cleaning': null, 'steam-iron': null }
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
    id: 'women-kurta',
    name: 'Kurta',
    subcategory: 'women',
    unit: 'item',
    prices: { 'wash-fold': 50, 'wash-iron': 65, 'express-laundry': 100, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'women-jeans',
    name: 'Jeans',
    subcategory: 'women',
    unit: 'item',
    prices: { 'wash-fold': 50, 'wash-iron': 65, 'express-laundry': 100, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'women-trousers',
    name: 'Trousers',
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
    id: 'women-jacket',
    name: 'Jacket',
    subcategory: 'women',
    unit: 'item',
    prices: { 'wash-fold': 90, 'wash-iron': 120, 'express-laundry': 180, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'women-sweater',
    name: 'Sweater',
    subcategory: 'women',
    unit: 'item',
    prices: { 'wash-fold': 60, 'wash-iron': 80, 'express-laundry': 120, 'dry-cleaning': null, 'steam-iron': null }
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
  // 3. KIDS SUBCATEGORY (21 ITEMS)
  // ==========================================
  {
    id: 'kids-tshirt',
    name: 'T-shirt',
    subcategory: 'kids',
    unit: 'item',
    prices: { 'wash-fold': 25, 'wash-iron': 35, 'express-laundry': 50, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'kids-shirt',
    name: 'Shirt',
    subcategory: 'kids',
    unit: 'item',
    prices: { 'wash-fold': 30, 'wash-iron': 40, 'express-laundry': 60, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'kids-top',
    name: 'Top',
    subcategory: 'kids',
    unit: 'item',
    prices: { 'wash-fold': 25, 'wash-iron': 35, 'express-laundry': 50, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'kids-shorts',
    name: 'Shorts',
    subcategory: 'kids',
    unit: 'item',
    prices: { 'wash-fold': 25, 'wash-iron': 35, 'express-laundry': 50, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'kids-jeans',
    name: 'Jeans',
    subcategory: 'kids',
    unit: 'item',
    prices: { 'wash-fold': 35, 'wash-iron': 45, 'express-laundry': 70, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'kids-trousers',
    name: 'Trousers',
    subcategory: 'kids',
    unit: 'item',
    prices: { 'wash-fold': 35, 'wash-iron': 45, 'express-laundry': 70, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'kids-dress',
    name: 'Dress',
    subcategory: 'kids',
    unit: 'item',
    prices: { 'wash-fold': 40, 'wash-iron': 55, 'express-laundry': 80, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'kids-frock',
    name: 'Frock',
    subcategory: 'kids',
    unit: 'item',
    prices: { 'wash-fold': 35, 'wash-iron': 50, 'express-laundry': 70, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'kids-skirt',
    name: 'Skirt',
    subcategory: 'kids',
    unit: 'item',
    prices: { 'wash-fold': 30, 'wash-iron': 45, 'express-laundry': 65, 'dry-cleaning': null, 'steam-iron': null }
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
    id: 'kids-sweater',
    name: 'Sweater',
    subcategory: 'kids',
    unit: 'item',
    prices: { 'wash-fold': 45, 'wash-iron': 60, 'express-laundry': 90, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'kids-hoodie',
    name: 'Hoodie',
    subcategory: 'kids',
    unit: 'item',
    prices: { 'wash-fold': 50, 'wash-iron': 65, 'express-laundry': 100, 'dry-cleaning': null, 'steam-iron': null }
  },
  {
    id: 'kids-jacket',
    name: 'Jacket',
    subcategory: 'kids',
    unit: 'item',
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
  // 4. HOUSEHOLD SUBCATEGORY (20 ITEMS)
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
  }
];

/**
 * Helper to fetch category items for a given category and subcategory
 */
export const getCategoryItems = (categoryId, subcategoryId) => {
  const category = PRICING_CATEGORIES.find(c => c.id === categoryId);
  const isPriceEnabled = category ? category.isPriceEnabled : false;
  
  return PRICING_ITEMS
    .filter(item => item.subcategory === subcategoryId)
    .map(item => ({
      id: item.id,
      name: item.name,
      unit: item.unit,
      price: isPriceEnabled ? item.prices[categoryId] : null,
      isPriceEnabled: isPriceEnabled
    }));
};
