/**
 * Initial Default Laundry Services Catalog
 * Extracted from BookingContext to ensure clean React Fast Refresh compatibility.
 */
export const INITIAL_SERVICES = [
  {
    id: 'wash-fold',
    name: 'Wash & Fold',
    subtitle: 'Everyday essentials fresh and clean.',
    pricePerKg: 60,
    unit: 'kg',
    price: 120,
    icon: 'Shirt',
    image: '/assets/service-wash.jpg',
    checked: false,
    popular: true
  },
  {
    id: 'wash-iron',
    name: 'Wash & Iron',
    subtitle: 'Clean clothes, ready to wear.',
    pricePerKg: 90,
    unit: 'kg',
    price: 180,
    icon: 'Layers',
    image: '/assets/service-wash.jpg',
    checked: false
  },
  {
    id: 'dry-cleaning',
    name: 'Dry Cleaning',
    subtitle: 'For your delicate and premium wear.',
    pricePerPiece: 120,
    unit: 'pc',
    price: 220,
    icon: 'Sparkles',
    image: '/assets/service-dryclean.jpg',
    checked: false,
    popular: true
  },
  {
    id: 'steam-iron',
    name: 'Steam Iron',
    subtitle: 'Crisp and perfectly pressed.',
    pricePerPiece: 20,
    unit: 'pc',
    price: 60,
    icon: 'Flame',
    image: '/assets/service-iron.jpg',
    checked: false
  },
  {
    id: 'express-laundry',
    name: 'Express Laundry',
    subtitle: 'Superfast 24-hour priority laundry service.',
    pricePerPiece: 200,
    unit: 'item',
    price: 200,
    icon: 'Zap',
    image: '/assets/service-wash.jpg',
    checked: false,
    popular: true
  }
];

export default INITIAL_SERVICES;
