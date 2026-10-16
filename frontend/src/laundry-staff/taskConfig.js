/**
 * Laundry Staff Portal Task & Service Configuration
 * 
 * Rules:
 * 1. WORK WITH TASKS, NOT SERVICES:
 *    - wash-fold:  ["wash", "dry", "fold"]
 *    - wash-iron:  ["wash", "dry", "iron"]
 *    - steam-iron: ["steam", "iron"]
 *    - dry-clean:  ["dry-clean", "press"]
 * 
 * 2. TASK ORDER:
 *    inspect → wash → dry → steam → dry-clean → iron → press → fold → quality-check → pack
 * 
 * 3. DEDUPLICATION:
 *    When an item has multiple services (e.g. wash-fold + wash-iron),
 *    merge tasks, deduplicate, and sort according to fixed TASK_ORDER.
 *    Example: wash-fold + wash-iron → ["wash", "dry", "iron", "fold"]
 */

export const SERVICE_TASK_CONFIG = {
  'wash-fold': ['wash', 'dry', 'fold'],
  'wash-iron': ['wash', 'dry', 'iron'],
  'steam-iron': ['steam', 'iron'],
  'dry-clean': ['dry-clean', 'press'],
  // Key variations / legacy names support
  'wash_fold': ['wash', 'dry', 'fold'],
  'wash_iron': ['wash', 'dry', 'iron'],
  'steam_iron': ['steam', 'iron'],
  'dry_clean': ['dry-clean', 'press'],
  'wash & fold': ['wash', 'dry', 'fold'],
  'wash & iron': ['wash', 'dry', 'iron'],
  'steam iron': ['steam', 'iron'],
  'dry clean': ['dry-clean', 'press'],
};

export const TASK_ORDER = [
  'inspect',
  'wash',
  'dry',
  'steam',
  'dry-clean',
  'iron',
  'press',
  'fold',
  'quality-check',
  'pack'
];

export const PROCESSING_TASKS = [
  'wash',
  'dry',
  'steam',
  'dry-clean',
  'iron',
  'press',
  'fold'
];

export const TASK_LABELS = {
  'inspect': 'Inspection',
  'wash': 'Wash',
  'dry': 'Dry',
  'steam': 'Steam',
  'dry-clean': 'Dry Clean',
  'iron': 'Iron',
  'press': 'Press',
  'fold': 'Fold',
  'quality-check': 'Quality Check',
  'pack': 'Pack'
};

export const TASK_GERUND = {
  'inspect': 'Inspecting',
  'wash': 'Washing',
  'dry': 'Drying',
  'steam': 'Steaming',
  'dry-clean': 'Dry Cleaning',
  'iron': 'Ironing',
  'press': 'Pressing',
  'fold': 'Folding',
  'quality-check': 'Quality Check',
  'pack': 'Packing'
};

export const SERVICE_DISPLAY_NAMES = {
  'wash-fold': 'Wash & Fold',
  'wash-iron': 'Wash & Iron',
  'steam-iron': 'Steam Iron',
  'dry-clean': 'Dry Clean',
  'wash_fold': 'Wash & Fold',
  'wash_iron': 'Wash & Iron',
  'steam_iron': 'Steam Iron',
  'dry_clean': 'Dry Clean'
};

/**
 * Expands an array of service IDs into a deduplicated, fixed-order list of tasks.
 * @param {string[]} services Array of service keys
 * @returns {string[]} Ordered, deduplicated tasks
 */
export const computeItemTasks = (services = []) => {
  if (!Array.isArray(services) || services.length === 0) {
    return ['wash', 'dry', 'fold']; // Default fallback
  }

  const rawTaskSet = new Set();
  services.forEach(svc => {
    const key = String(svc).toLowerCase().trim();
    const tasks = SERVICE_TASK_CONFIG[key] || [];
    tasks.forEach(t => rawTaskSet.add(t));
  });

  if (rawTaskSet.size === 0) {
    rawTaskSet.add('wash');
    rawTaskSet.add('dry');
    rawTaskSet.add('fold');
  }

  // Sort strictly according to TASK_ORDER
  return TASK_ORDER.filter(t => rawTaskSet.has(t));
};

/**
 * Generates a note when services were merged for an item.
 * Example: "Wash included once (Wash & Fold + Wash & Iron)"
 * @param {string[]} services
 * @returns {string|null}
 */
export const getMergedTaskNote = (services = []) => {
  if (!Array.isArray(services) || services.length <= 1) return null;

  // Track task frequencies across selected services
  const taskCounts = {};
  const serviceNames = [];

  services.forEach(svc => {
    const key = String(svc).toLowerCase().trim();
    const displayName = SERVICE_DISPLAY_NAMES[key] || svc;
    serviceNames.push(displayName);

    const tasks = SERVICE_TASK_CONFIG[key] || [];
    tasks.forEach(t => {
      taskCounts[t] = (taskCounts[t] || 0) + 1;
    });
  });

  const duplicatedTasks = Object.entries(taskCounts)
    .filter(([_, count]) => count > 1)
    .map(([task]) => TASK_LABELS[task] || task);

  if (duplicatedTasks.includes('Wash')) {
    return `Wash included once (${serviceNames.join(' + ')})`;
  }

  if (duplicatedTasks.length > 0) {
    const taskListStr = duplicatedTasks.join(' & ');
    return `${taskListStr} included once (${serviceNames.join(' + ')})`;
  }

  return `Combined services (${serviceNames.join(' + ')})`;
};

/**
 * Checks for conflicting services on an item or order (e.g. Dry Clean with Wash).
 * @param {object} item
 * @returns {{hasConflict: boolean, reason: string|null}}
 */
export const checkItemConflict = (item) => {
  const services = (item.services || []).map(s => String(s).toLowerCase().trim());
  const tasks = item.tasks || computeItemTasks(services);

  const hasWash = tasks.includes('wash') || services.includes('wash-fold') || services.includes('wash-iron');
  const hasDryClean = tasks.includes('dry-clean') || services.includes('dry-clean');

  if (hasWash && hasDryClean) {
    return {
      hasConflict: true,
      reason: 'Dry Clean combined with Wash cycle on same item (fabric damage risk)'
    };
  }

  return { hasConflict: false, reason: null };
};

/**
 * Checks if any item in the order has conflicting services.
 * @param {object} order
 * @returns {{hasConflict: boolean, reason: string|null}}
 */
export const checkOrderConflict = (order) => {
  if (order.conflict_resolved) return { hasConflict: false, reason: null, conflictItems: [] };
  const items = order.items || [];
  const conflictItems = [];
  for (const item of items) {
    const result = checkItemConflict(item);
    if (result.hasConflict) {
      conflictItems.push(item);
    }
  }
  if (conflictItems.length > 0) {
    return {
      hasConflict: true,
      reason: 'Dry Clean combined with Wash cycle on same item (fabric damage risk)',
      conflictItems
    };
  }
  return { hasConflict: false, reason: null, conflictItems: [] };
};

/**
 * Builds the one-line plan text: "Washing → Drying → Ironing → Folding"
 * @param {string[]} tasks
 * @returns {string}
 */
export const buildPlanString = (tasks = []) => {
  if (!tasks || tasks.length === 0) return 'No plan assigned';
  return tasks.map(t => TASK_GERUND[t] || TASK_LABELS[t] || t).join(' → ');
};

/**
 * Normalizes an order item to ensure services, tasks, currentTaskIndex are present.
 * @param {object} item
 * @returns {object}
 */
export const normalizeOrderItem = (item, index = 0) => {
  let services = item.services;
  if (!services || !Array.isArray(services) || services.length === 0) {
    if (item.service_key) {
      services = [item.service_key];
    } else if (item.service_name) {
      const matchKey = Object.keys(SERVICE_DISPLAY_NAMES).find(
        k => SERVICE_DISPLAY_NAMES[k].toLowerCase() === item.service_name.toLowerCase()
      );
      services = [matchKey || 'wash-fold'];
    } else {
      services = ['wash-fold'];
    }
  }

  const tasks = (item.tasks && item.tasks.length > 0)
    ? item.tasks
    : computeItemTasks(services);

  return {
    ...item,
    id: item.id || `item-${index + 1}-${Date.now()}`,
    services,
    tasks,
    currentTaskIndex: typeof item.currentTaskIndex === 'number' ? item.currentTaskIndex : 0,
    status: item.status || 'PENDING'
  };
};

/**
 * Normalizes a full order with task configs and item plans.
 * @param {object} order
 * @returns {object}
 */
export const normalizeOrder = (order) => {
  const items = (order.items || []).map((item, idx) => normalizeOrderItem(item, idx));
  const conflict = checkOrderConflict({ ...order, items });

  return {
    ...order,
    items,
    is_express: Boolean(order.is_express || order.express || order.priority === 'EXPRESS'),
    has_conflict: conflict.hasConflict,
    conflict_reason: conflict.reason,
    conflict_resolved: Boolean(order.conflict_resolved)
  };
};

/**
 * 5 Reference Orders Matching Image 1 for Laundry Staff Portal
 */
export const MOCK_LAUNDRY_ORDERS = [
  // 1. FC-10463 Mohan Das | Shirt x 3 | Wash & Fold | Received | 10:42 AM
  {
    id: 10463,
    order_number: 'FC-10463',
    order_id: 'FC-10463',
    customer_name: 'Mohan Das',
    customer_phone: '+91 98765 43210',
    pickup_address: '12th Main, Indiranagar, Bangalore',
    delivery_address: '12th Main, Indiranagar, Bangalore',
    is_express: false,
    status: 'RECEIVED_BY_LAUNDRY',
    status_display: 'Received',
    service: 'Wash & Fold',
    services: ['Wash & Fold'],
    items_summary: 'Shirt x 3',
    placed: '10:42 AM',
    created_at: '2026-10-15T10:42:00Z',
    items: [{ id: 'it-1', name: 'Shirt', quantity: 3, services: ['wash-fold'] }]
  },
  // 2. FC-10462 Sana Khan | Kurta x 3 | Wash & Fold | Received | 10:15 AM
  {
    id: 10462,
    order_number: 'FC-10462',
    order_id: 'FC-10462',
    customer_name: 'Sana Khan',
    customer_phone: '+91 98765 43211',
    pickup_address: 'Koramangala 4th Block, Bangalore',
    delivery_address: 'Koramangala 4th Block, Bangalore',
    is_express: false,
    status: 'RECEIVED_BY_LAUNDRY',
    status_display: 'Received',
    service: 'Wash & Fold',
    services: ['Wash & Fold'],
    items_summary: 'Kurta x 3',
    placed: '10:15 AM',
    created_at: '2026-10-15T10:15:00Z',
    items: [{ id: 'it-2', name: 'Kurta', quantity: 3, services: ['wash-fold'] }]
  },
  // 3. FC-10458 Neha Gupta | Kurta x 3 | Wash & Fold | Received | 09:50 AM
  {
    id: 10458,
    order_number: 'FC-10458',
    order_id: 'FC-10458',
    customer_name: 'Neha Gupta',
    customer_phone: '+91 98765 43212',
    pickup_address: 'HSR Layout Sector 2, Bangalore',
    delivery_address: 'HSR Layout Sector 2, Bangalore',
    is_express: false,
    status: 'RECEIVED_BY_LAUNDRY',
    status_display: 'Received',
    service: 'Wash & Fold',
    services: ['Wash & Fold'],
    items_summary: 'Kurta x 3',
    placed: '09:50 AM',
    created_at: '2026-10-15T09:50:00Z',
    items: [{ id: 'it-3', name: 'Kurta', quantity: 3, services: ['wash-fold'] }]
  },
  // 4. FC-10452 Riya Sharma | Men's Shirt x 2 | Wash & Fold + Iron | Inspection | 09:30 AM
  {
    id: 10452,
    order_number: 'FC-10452',
    order_id: 'FC-10452',
    customer_name: 'Riya Sharma',
    customer_phone: '+91 98765 43213',
    pickup_address: 'Tower B, 804, Green Valley Apartments, Bangalore',
    delivery_address: 'Tower B, 804, Green Valley Apartments, Bangalore',
    is_express: true,
    status: 'INSPECTION',
    status_display: 'Inspection',
    service: 'Wash & Fold + Iron',
    services: ['Wash & Fold + Iron'],
    items_summary: "Men's Shirt x 2",
    placed: '09:30 AM',
    created_at: '2026-10-15T09:30:00Z',
    items: [{ id: 'it-4', name: "Men's Shirt", quantity: 2, services: ['wash-fold', 'wash-iron'] }]
  },
  // 5. FC-10453 Amit Patel | Jeans x 1 | Wash + Iron | Washing | 09:10 AM
  {
    id: 10453,
    order_number: 'FC-10453',
    order_id: 'FC-10453',
    customer_name: 'Amit Patel',
    customer_phone: '+91 98765 43214',
    pickup_address: 'Villa 21, Sunrise Residency, Sarjapur, Bangalore',
    delivery_address: 'Villa 21, Sunrise Residency, Sarjapur, Bangalore',
    is_express: false,
    status: 'WASHING',
    status_display: 'Washing',
    service: 'Wash + Iron',
    services: ['Wash + Iron'],
    items_summary: 'Jeans x 1',
    placed: '09:10 AM',
    created_at: '2026-10-15T09:10:00Z',
    items: [{ id: 'it-5', name: 'Jeans', quantity: 1, services: ['wash-iron'] }]
  },
  // 6. FC-10449 Vikram Singh | Shirt x 3 | Wash + Iron | Drying | 08:45 AM
  {
    id: 10449,
    order_number: 'FC-10449',
    order_id: 'FC-10449',
    customer_name: 'Vikram Singh',
    customer_phone: '+91 98765 43215',
    pickup_address: 'Palm Meadows, Whitefield, Bangalore',
    delivery_address: 'Palm Meadows, Whitefield, Bangalore',
    is_express: false,
    status: 'DRYING',
    status_display: 'Drying',
    service: 'Wash + Iron',
    services: ['Wash + Iron'],
    items_summary: 'Shirt x 3',
    placed: '08:45 AM',
    created_at: '2026-10-15T08:45:00Z',
    items: [{ id: 'it-6', name: 'Shirt', quantity: 3, services: ['wash-iron'] }]
  },
  // 7. FC-10446 Rohan Das | Trouser x 2 | Steam Iron | Ironing | 08:20 AM
  {
    id: 10446,
    order_number: 'FC-10446',
    order_id: 'FC-10446',
    customer_name: 'Rohan Das',
    customer_phone: '+91 98765 43216',
    pickup_address: 'Prestige Shantiniketan, Whitefield, Bangalore',
    delivery_address: 'Prestige Shantiniketan, Whitefield, Bangalore',
    is_express: false,
    status: 'IRONING',
    status_display: 'Ironing',
    service: 'Steam Iron',
    services: ['Steam Iron'],
    items_summary: 'Trouser x 2',
    placed: '08:20 AM',
    created_at: '2026-10-15T08:20:00Z',
    items: [{ id: 'it-7', name: 'Trouser', quantity: 2, services: ['steam-iron'] }]
  },
  // 8. FC-10444 Pankaj Shah | Kurta x 2 | Wash & Fold | Folding | 08:05 AM
  {
    id: 10444,
    order_number: 'FC-10444',
    order_id: 'FC-10444',
    customer_name: 'Pankaj Shah',
    customer_phone: '+91 98765 43217',
    pickup_address: 'Banaswadi Main Road, Bangalore',
    delivery_address: 'Banaswadi Main Road, Bangalore',
    is_express: false,
    status: 'FOLDING',
    status_display: 'Folding',
    service: 'Wash & Fold',
    services: ['Wash & Fold'],
    items_summary: 'Kurta x 2',
    placed: '08:05 AM',
    created_at: '2026-10-15T08:05:00Z',
    items: [{ id: 'it-8', name: 'Kurta', quantity: 2, services: ['wash-fold'] }]
  },
  // 9. FC-10440 Karan Malhotra | Shirt x 5 | Wash + Iron | Quality Check | Yesterday
  {
    id: 10440,
    order_number: 'FC-10440',
    order_id: 'FC-10440',
    customer_name: 'Karan Malhotra',
    customer_phone: '+91 98765 43218',
    pickup_address: 'Sadashivanagar, Bangalore',
    delivery_address: 'Sadashivanagar, Bangalore',
    is_express: false,
    status: 'QUALITY_CHECK',
    status_display: 'Quality Check',
    service: 'Wash + Iron',
    services: ['Wash + Iron'],
    items_summary: 'Shirt x 5',
    placed: 'Yesterday',
    created_at: '2026-10-14T17:00:00Z',
    items: [{ id: 'it-9', name: 'Shirt', quantity: 5, services: ['wash-iron'] }]
  },
  // 10. FC-10436 Preeti Kulkarni | Saree x 2 | Steam Iron | Packing | Yesterday
  {
    id: 10436,
    order_number: 'FC-10436',
    order_id: 'FC-10436',
    customer_name: 'Preeti Kulkarni',
    customer_phone: '+91 98765 43219',
    pickup_address: 'Jayanagar 4th Block, Bangalore',
    delivery_address: 'Jayanagar 4th Block, Bangalore',
    is_express: false,
    status: 'PACKING',
    status_display: 'Packing',
    service: 'Steam Iron',
    services: ['Steam Iron'],
    items_summary: 'Saree x 2',
    placed: 'Yesterday',
    created_at: '2026-10-14T15:30:00Z',
    items: [{ id: 'it-10', name: 'Saree', quantity: 2, services: ['steam-iron'] }]
  },
  // 11. FC-10430 Sunita Pawar | Bedsheet x 2 | Wash & Fold | Ready for Delivery | Yesterday
  {
    id: 10430,
    order_number: 'FC-10430',
    order_id: 'FC-10430',
    customer_name: 'Sunita Pawar',
    customer_phone: '+91 98765 43220',
    pickup_address: 'Malleshwaram, Bangalore',
    delivery_address: 'Malleshwaram, Bangalore',
    is_express: false,
    status: 'READY_FOR_DELIVERY',
    status_display: 'Ready for Delivery',
    service: 'Wash & Fold',
    services: ['Wash & Fold'],
    items_summary: 'Bedsheet x 2',
    placed: 'Yesterday',
    created_at: '2026-10-14T14:15:00Z',
    items: [{ id: 'it-11', name: 'Bedsheet', quantity: 2, services: ['wash-fold'] }]
  },
  // 12. FC-10425 Deepak Joshi | Shirt x 3 | Wash + Iron | Out for Delivery | Yesterday
  {
    id: 10425,
    order_number: 'FC-10425',
    order_id: 'FC-10425',
    customer_name: 'Deepak Joshi',
    customer_phone: '+91 98765 43221',
    pickup_address: 'Frazer Town, Bangalore',
    delivery_address: 'Frazer Town, Bangalore',
    is_express: false,
    status: 'OUT_FOR_DELIVERY',
    status_display: 'Out for Delivery',
    service: 'Wash + Iron',
    services: ['Wash + Iron'],
    items_summary: 'Shirt x 3',
    placed: 'Yesterday',
    created_at: '2026-10-14T12:00:00Z',
    items: [{ id: 'it-12', name: 'Shirt', quantity: 3, services: ['wash-iron'] }]
  },
  // 13. FC-10419 Lata Menon | Saree x 1 | Dry Clean | Delivered | Yesterday
  {
    id: 10419,
    order_number: 'FC-10419',
    order_id: 'FC-10419',
    customer_name: 'Lata Menon',
    customer_phone: '+91 98765 43222',
    pickup_address: 'Kalyan Nagar, Bangalore',
    delivery_address: 'Kalyan Nagar, Bangalore',
    is_express: false,
    status: 'DELIVERED',
    status_display: 'Delivered',
    service: 'Dry Clean',
    services: ['Dry Clean'],
    items_summary: 'Saree x 1',
    placed: 'Yesterday',
    created_at: '2026-10-14T10:30:00Z',
    items: [{ id: 'it-13', name: 'Saree', quantity: 1, services: ['dry-clean'] }]
  },

  // PAGE 2 (Orders 14 - 26)
  // 14. FC-10415 Rajesh Rao | Suit x 1 | Dry Clean | Received | Yesterday
  {
    id: 10415,
    order_number: 'FC-10415',
    order_id: 'FC-10415',
    customer_name: 'Rajesh Rao',
    customer_phone: '+91 98765 43223',
    pickup_address: 'Richmond Town, Bangalore',
    delivery_address: 'Richmond Town, Bangalore',
    is_express: false,
    status: 'RECEIVED_BY_LAUNDRY',
    status_display: 'Received',
    service: 'Dry Clean',
    services: ['Dry Clean'],
    items_summary: 'Suit x 1',
    placed: 'Yesterday',
    created_at: '2026-10-14T09:15:00Z',
    items: [{ id: 'it-14', name: 'Suit', quantity: 1, services: ['dry-clean'] }]
  },
  // 15. FC-10412 Ananya Roy | Kurti x 2 | Wash & Fold | Received | Yesterday
  {
    id: 10412,
    order_number: 'FC-10412',
    order_id: 'FC-10412',
    customer_name: 'Ananya Roy',
    customer_phone: '+91 98765 43224',
    pickup_address: 'Lavelle Road, Bangalore',
    delivery_address: 'Lavelle Road, Bangalore',
    is_express: false,
    status: 'RECEIVED_BY_LAUNDRY',
    status_display: 'Received',
    service: 'Wash & Fold',
    services: ['Wash & Fold'],
    items_summary: 'Kurti x 2',
    placed: 'Yesterday',
    created_at: '2026-10-14T08:40:00Z',
    items: [{ id: 'it-15', name: 'Kurti', quantity: 2, services: ['wash-fold'] }]
  },
  // 16. FC-10408 Suresh Nair | Trouser x 3 | Wash + Iron | Inspection | Yesterday
  {
    id: 10408,
    order_number: 'FC-10408',
    order_id: 'FC-10408',
    customer_name: 'Suresh Nair',
    customer_phone: '+91 98765 43225',
    pickup_address: 'Cunningham Road, Bangalore',
    delivery_address: 'Cunningham Road, Bangalore',
    is_express: false,
    status: 'INSPECTION',
    status_display: 'Inspection',
    service: 'Wash + Iron',
    services: ['Wash + Iron'],
    items_summary: 'Trouser x 3',
    placed: 'Yesterday',
    created_at: '2026-10-14T08:10:00Z',
    items: [{ id: 'it-16', name: 'Trouser', quantity: 3, services: ['wash-iron'] }]
  },
  // 17. FC-10405 Kavita Verma | Saree x 1 | Steam Iron | Washing | Yesterday
  {
    id: 10405,
    order_number: 'FC-10405',
    order_id: 'FC-10405',
    customer_name: 'Kavita Verma',
    customer_phone: '+91 98765 43226',
    pickup_address: 'Ulsoor, Bangalore',
    delivery_address: 'Ulsoor, Bangalore',
    is_express: false,
    status: 'WASHING',
    status_display: 'Washing',
    service: 'Steam Iron',
    services: ['Steam Iron'],
    items_summary: 'Saree x 1',
    placed: 'Yesterday',
    created_at: '2026-10-14T07:50:00Z',
    items: [{ id: 'it-17', name: 'Saree', quantity: 1, services: ['steam-iron'] }]
  },
  // 18. FC-10402 Arjun Reddy | T-Shirt x 4 | Wash & Fold | Washing | 2 days ago
  {
    id: 10402,
    order_number: 'FC-10402',
    order_id: 'FC-10402',
    customer_name: 'Arjun Reddy',
    customer_phone: '+91 98765 43227',
    pickup_address: 'Domlur, Bangalore',
    delivery_address: 'Domlur, Bangalore',
    is_express: false,
    status: 'WASHING',
    status_display: 'Washing',
    service: 'Wash & Fold',
    services: ['Wash & Fold'],
    items_summary: 'T-Shirt x 4',
    placed: '2 days ago',
    created_at: '2026-10-13T16:20:00Z',
    items: [{ id: 'it-18', name: 'T-Shirt', quantity: 4, services: ['wash-fold'] }]
  },
  // 19. FC-10398 Meera Sen | Dress x 2 | Dry Clean | Drying | 2 days ago
  {
    id: 10398,
    order_number: 'FC-10398',
    order_id: 'FC-10398',
    customer_name: 'Meera Sen',
    customer_phone: '+91 98765 43228',
    pickup_address: 'MG Road, Bangalore',
    delivery_address: 'MG Road, Bangalore',
    is_express: false,
    status: 'DRYING',
    status_display: 'Drying',
    service: 'Dry Clean',
    services: ['Dry Clean'],
    items_summary: 'Dress x 2',
    placed: '2 days ago',
    created_at: '2026-10-13T15:00:00Z',
    items: [{ id: 'it-19', name: 'Dress', quantity: 2, services: ['dry-clean'] }]
  },
  // 20. FC-10394 Sanjay Dutt | Blazer x 1 | Steam Iron | Ironing | 2 days ago
  {
    id: 10394,
    order_number: 'FC-10394',
    order_id: 'FC-10394',
    customer_name: 'Sanjay Dutt',
    customer_phone: '+91 98765 43229',
    pickup_address: 'BTM Layout, Bangalore',
    delivery_address: 'BTM Layout, Bangalore',
    is_express: false,
    status: 'IRONING',
    status_display: 'Ironing',
    service: 'Steam Iron',
    services: ['Steam Iron'],
    items_summary: 'Blazer x 1',
    placed: '2 days ago',
    created_at: '2026-10-13T14:10:00Z',
    items: [{ id: 'it-20', name: 'Blazer', quantity: 1, services: ['steam-iron'] }]
  },
  // 21. FC-10391 Divya Nair | Kurta x 2 | Wash + Iron | Ironing | 2 days ago
  {
    id: 10391,
    order_number: 'FC-10391',
    order_id: 'FC-10391',
    customer_name: 'Divya Nair',
    customer_phone: '+91 98765 43230',
    pickup_address: 'JP Nagar Phase 2, Bangalore',
    delivery_address: 'JP Nagar Phase 2, Bangalore',
    is_express: false,
    status: 'IRONING',
    status_display: 'Ironing',
    service: 'Wash + Iron',
    services: ['Wash + Iron'],
    items_summary: 'Kurta x 2',
    placed: '2 days ago',
    created_at: '2026-10-13T13:40:00Z',
    items: [{ id: 'it-21', name: 'Kurta', quantity: 2, services: ['wash-iron'] }]
  },
  // 22. FC-10387 Rahul Bose | Shirt x 4 | Wash & Fold | Folding | 2 days ago
  {
    id: 10387,
    order_number: 'FC-10387',
    order_id: 'FC-10387',
    customer_name: 'Rahul Bose',
    customer_phone: '+91 98765 43231',
    pickup_address: 'Bellandur, Bangalore',
    delivery_address: 'Bellandur, Bangalore',
    is_express: false,
    status: 'FOLDING',
    status_display: 'Folding',
    service: 'Wash & Fold',
    services: ['Wash & Fold'],
    items_summary: 'Shirt x 4',
    placed: '2 days ago',
    created_at: '2026-10-13T12:00:00Z',
    items: [{ id: 'it-22', name: 'Shirt', quantity: 4, services: ['wash-fold'] }]
  },
  // 23. FC-10382 Pooja Hegde | Bedsheet x 2 | Wash & Fold | Quality Check | 2 days ago
  {
    id: 10382,
    order_number: 'FC-10382',
    order_id: 'FC-10382',
    customer_name: 'Pooja Hegde',
    customer_phone: '+91 98765 43232',
    pickup_address: 'Marathahalli, Bangalore',
    delivery_address: 'Marathahalli, Bangalore',
    is_express: false,
    status: 'QUALITY_CHECK',
    status_display: 'Quality Check',
    service: 'Wash & Fold',
    services: ['Wash & Fold'],
    items_summary: 'Bedsheet x 2',
    placed: '2 days ago',
    created_at: '2026-10-13T10:15:00Z',
    items: [{ id: 'it-23', name: 'Bedsheet', quantity: 2, services: ['wash-fold'] }]
  },
  // 24. FC-10378 Nikhil Jain | Suit x 1 | Dry Clean | Quality Check | 3 days ago
  {
    id: 10378,
    order_number: 'FC-10378',
    order_id: 'FC-10378',
    customer_name: 'Nikhil Jain',
    customer_phone: '+91 98765 43233',
    pickup_address: 'Hebbal, Bangalore',
    delivery_address: 'Hebbal, Bangalore',
    is_express: false,
    status: 'QUALITY_CHECK',
    status_display: 'Quality Check',
    service: 'Dry Clean',
    services: ['Dry Clean'],
    items_summary: 'Suit x 1',
    placed: '3 days ago',
    created_at: '2026-10-12T16:00:00Z',
    items: [{ id: 'it-24', name: 'Suit', quantity: 1, services: ['dry-clean'] }]
  },
  // 25. FC-10374 Priya Nair | Silk Saree x 1 | Steam Iron | Packing | 3 days ago
  {
    id: 10374,
    order_number: 'FC-10374',
    order_id: 'FC-10374',
    customer_name: 'Priya Nair',
    customer_phone: '+91 98765 43234',
    pickup_address: 'Rajajinagar, Bangalore',
    delivery_address: 'Rajajinagar, Bangalore',
    is_express: false,
    status: 'PACKING',
    status_display: 'Packing',
    service: 'Steam Iron',
    services: ['Steam Iron'],
    items_summary: 'Silk Saree x 1',
    placed: '3 days ago',
    created_at: '2026-10-12T14:30:00Z',
    items: [{ id: 'it-25', name: 'Silk Saree', quantity: 1, services: ['steam-iron'] }]
  },
  // 26. FC-10370 Tarun Sen | Jeans x 2 | Wash + Iron | Ready for Delivery | 3 days ago
  {
    id: 10370,
    order_number: 'FC-10370',
    order_id: 'FC-10370',
    customer_name: 'Tarun Sen',
    customer_phone: '+91 98765 43235',
    pickup_address: 'Electronic City Phase 1, Bangalore',
    delivery_address: 'Electronic City Phase 1, Bangalore',
    is_express: false,
    status: 'READY_FOR_DELIVERY',
    status_display: 'Ready for Delivery',
    service: 'Wash + Iron',
    services: ['Wash + Iron'],
    items_summary: 'Jeans x 2',
    placed: '3 days ago',
    created_at: '2026-10-12T11:00:00Z',
    items: [{ id: 'it-26', name: 'Jeans', quantity: 2, services: ['wash-iron'] }]
  },

  // PAGE 3 (Orders 27 - 29)
  // 27. FC-10365 Manoj Tiwari | Kurta x 3 | Wash & Fold | Delivered | 3 days ago
  {
    id: 10365,
    order_number: 'FC-10365',
    order_id: 'FC-10365',
    customer_name: 'Manoj Tiwari',
    customer_phone: '+91 98765 43236',
    pickup_address: 'Basavanagudi, Bangalore',
    delivery_address: 'Basavanagudi, Bangalore',
    is_express: false,
    status: 'DELIVERED',
    status_display: 'Delivered',
    service: 'Wash & Fold',
    services: ['Wash & Fold'],
    items_summary: 'Kurta x 3',
    placed: '3 days ago',
    created_at: '2026-10-12T09:30:00Z',
    items: [{ id: 'it-27', name: 'Kurta', quantity: 3, services: ['wash-fold'] }]
  },
  // 28. FC-10360 Shreya Ghoshal | Saree x 2 | Dry Clean | Delivered | 4 days ago
  {
    id: 10360,
    order_number: 'FC-10360',
    order_id: 'FC-10360',
    customer_name: 'Shreya Ghoshal',
    customer_phone: '+91 98765 43237',
    pickup_address: 'Koramangala 6th Block, Bangalore',
    delivery_address: 'Koramangala 6th Block, Bangalore',
    is_express: false,
    status: 'DELIVERED',
    status_display: 'Delivered',
    service: 'Dry Clean',
    services: ['Dry Clean'],
    items_summary: 'Saree x 2',
    placed: '4 days ago',
    created_at: '2026-10-11T16:00:00Z',
    items: [{ id: 'it-28', name: 'Saree', quantity: 2, services: ['dry-clean'] }]
  },
  // 29. FC-10355 Harish Kalyan | Shirt x 2 | Wash + Iron | Delivered | 4 days ago
  {
    id: 10355,
    order_number: 'FC-10355',
    order_id: 'FC-10355',
    customer_name: 'Harish Kalyan',
    customer_phone: '+91 98765 43238',
    pickup_address: 'Indiranagar 100ft Road, Bangalore',
    delivery_address: 'Indiranagar 100ft Road, Bangalore',
    is_express: false,
    status: 'DELIVERED',
    status_display: 'Delivered',
    service: 'Wash + Iron',
    services: ['Wash + Iron'],
    items_summary: 'Shirt x 2',
    placed: '4 days ago',
    created_at: '2026-10-11T10:00:00Z',
    items: [{ id: 'it-29', name: 'Shirt', quantity: 2, services: ['wash-iron'] }]
  }
];

/**
 * Computes dashboard counts by task stage.
 * An item in Ironing counts only in Ironing!
 * @param {object[]} orders
 * @returns {Record<string, number>}
 */
export const computeDashboardTaskCounts = (orders = []) => {
  const counts = {
    wash: 0,
    dry: 0,
    steam: 0,
    'dry-clean': 0,
    iron: 0,
    press: 0,
    fold: 0,
    'quality-check': 0,
    pack: 0
  };

  orders.forEach(order => {
    // Only count active processing or specific stage orders
    if (order.status === 'QUALITY_CHECK') {
      const itemCount = (order.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);
      counts['quality-check'] += itemCount;
    } else if (order.status === 'PACKING' || order.status === 'PACKED') {
      const itemCount = (order.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);
      counts['pack'] += itemCount;
    } else if (['PROCESSING', 'WASHING', 'DRYING', 'IRONING', 'INSPECTION'].includes(order.status)) {
      (order.items || []).forEach(item => {
        if (item.status !== 'COMPLETED' && Array.isArray(item.tasks) && item.tasks.length > 0) {
          const activeTask = item.tasks[item.currentTaskIndex || 0];
          if (activeTask && counts[activeTask] !== undefined) {
            counts[activeTask] += (item.quantity || 1);
          }
        }
      });
    }
  });

  return counts;
};
