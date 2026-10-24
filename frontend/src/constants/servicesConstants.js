/**
 * Initial Default Laundry Services Catalog
 * Contains only the 4 core services.
 */
export const INITIAL_SERVICES = [
  {
    id: 'wash-fold',
    name: 'Wash & Fold',
    subtitle: 'Everyday essentials fresh and clean.',
    pricePerKg: 85,
    unit: 'kg',
    price: 85,
    icon: 'Shirt',
    image: '/assets/service-wash.jpg',
    checked: false,
    popular: true
  },
  {
    id: 'wash-iron',
    name: 'Wash & Iron',
    subtitle: 'Clean clothes, ready to wear.',
    pricePerKg: 120,
    unit: 'kg',
    price: 120,
    icon: 'Layers',
    image: '/assets/service-wash.jpg',
    checked: false
  },
  {
    id: 'dry-cleaning',
    name: 'Dry Cleaning',
    subtitle: 'For your delicate and premium wear.',
    pricePerPiece: 120,
    unit: 'piece',
    price: 120,
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
    unit: 'piece',
    price: 20,
    icon: 'Flame',
    image: '/assets/service-iron.jpg',
    checked: false
  }
];

export default INITIAL_SERVICES;
