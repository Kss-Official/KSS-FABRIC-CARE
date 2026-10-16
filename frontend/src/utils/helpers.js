/**
 * Helpers for money, dates, statuses and formatting
 */

export const paiseToRupees = (paise) => {
  if (paise === null || paise === undefined) return '₹0';
  const rupees = Number(paise) / 100;
  return `₹${rupees % 1 === 0 ? rupees.toFixed(0) : rupees.toFixed(2)}`;
};

export const paiseToAmount = (paise) => {
  if (paise === null || paise === undefined) return 0;
  return Number(paise) / 100;
};

export const rupeesToPaise = (rupees) => {
  if (rupees === null || rupees === undefined) return 0;
  return Math.round(Number(rupees) * 100);
};

export const formatDate = (isoStr, includeTime = true) => {
  if (!isoStr) return '-';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '-';
    if (!includeTime) {
      return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return d.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return String(isoStr);
  }
};

export const STATUS_LABELS = {
  PAYMENT_PENDING: 'Payment Pending',
  PLACED: 'Order Placed',
  PICKUP_SCHEDULED: 'Pickup Scheduled',
  PICKED_UP: 'Picked Up',
  RECEIVED: 'Received at Laundry',
  INSPECTION: 'Inspection',
  WASHING: 'Washing',
  DRYING: 'Drying',
  IRONING: 'Ironing',
  FOLDING: 'Folding',
  QUALITY_CHECK: 'Quality Check',
  PACKING: 'Packing',
  READY_FOR_DELIVERY: 'Ready for Delivery',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled'
};

export const statusToLabel = (status) => {
  if (!status) return 'Unknown';
  return STATUS_LABELS[status] || status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

export const getInitials = (name) => {
  if (!name) return 'CU';
  const clean = String(name).replace(/[^a-zA-Z0-9\s_]/g, '').trim();
  const parts = clean.split(/[\s_]+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.substring(0, 2).toUpperCase() || 'CU';
};
