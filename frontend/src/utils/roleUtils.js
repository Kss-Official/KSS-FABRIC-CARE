/**
 * Normalizes backend / Firebase custom claim roles into canonical role identifiers:
 * 'admin' | 'agent' | 'staff' | 'customer'
 */
export const normalizeRole = (role) => {
  if (!role) return 'customer';
  const r = String(role).trim().toLowerCase();
  if (r === 'admin' || r === 'super_admin') return 'admin';
  if (r === 'agent' || r === 'delivery_agent' || r === 'delivery' || r === 'delivery_staff' || r === 'driver') return 'agent';
  if (r === 'staff' || r === 'laundry_staff' || r === 'laundry') return 'staff';
  return 'customer';
};

/**
 * Returns the destination portal page id based on canonical role:
 * - admin -> 'admin'
 * - agent -> 'delivery-portal'
 * - staff -> 'laundry-portal'
 * - customer -> 'customer-dashboard'
 */
export const getPortalForRole = (role) => {
  const norm = normalizeRole(role);
  switch (norm) {
    case 'admin':
      return 'admin';
    case 'agent':
      return 'delivery-portal';
    case 'staff':
      return 'laundry-portal';
    case 'customer':
    default:
      return 'customer-dashboard';
  }
};
