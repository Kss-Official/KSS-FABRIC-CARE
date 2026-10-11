/**
 * Normalizes backend / firebase roles into canonical role identifiers:
 * 'admin' | 'delivery_agent' | 'laundry_staff' | 'customer'
 */
export const normalizeRole = (role) => {
  if (!role) return 'customer';
  const r = String(role).trim().toLowerCase();
  if (r === 'admin' || r === 'super_admin') return 'admin';
  if (r === 'delivery_staff' || r === 'delivery_agent' || r === 'delivery' || r === 'driver') return 'delivery_agent';
  if (r === 'laundry_staff' || r === 'laundry' || r === 'staff') return 'laundry_staff';
  return 'customer';
};

/**
 * Returns the destination portal page id based on canonical role:
 * - admin -> 'admin'
 * - delivery_agent -> 'delivery-portal'
 * - laundry_staff -> 'laundry-portal'
 * - customer -> 'customer-dashboard'
 */
export const getPortalForRole = (role) => {
  const norm = normalizeRole(role);
  switch (norm) {
    case 'admin':
      return 'admin';
    case 'delivery_agent':
      return 'delivery-portal';
    case 'laundry_staff':
      return 'laundry-portal';
    case 'customer':
    default:
      return 'home';
  }
};
