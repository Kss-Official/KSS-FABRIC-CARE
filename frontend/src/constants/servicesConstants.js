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
    checked: true,
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
    checked: true,
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
    id: 'shoe-laundry',
    name: 'Shoe Laundry',
    subtitle: 'Clean shoes, step brighter.',
    pricePerPair: 250,
    unit: 'pair',
    price: 250,
    icon: 'Footprints',
    image: '/assets/service-shoe.jpg',
    checked: false
  },
  {
    id: 'home-care',
    name: 'Home Care',
    subtitle: 'Curtains, bed sheets and more.',
    pricePerItem: 150,
    unit: 'item',
    price: 200,
    icon: 'BedDouble',
    image: '/assets/service-curtain.jpg',
    checked: false
  }
];

export default INITIAL_SERVICES;
