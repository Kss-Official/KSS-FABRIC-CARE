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

/**
 * Format Order ID to match standard 'FC-XXXXX' pattern (e.g. 'FC-75668')
 * Preserves raw underlying ID data while ensuring uniform display format across
 * Admin Portal and Customer Portal.
 */
export const formatOrderId = (rawId) => {
  if (rawId === null || rawId === undefined) return '';
  const str = String(rawId).trim();
  if (!str) return '';

  // Already in exact FC-XXXXX format (e.g. FC-75668, FC-10463)
  if (/^FC-\d{5}$/i.test(str)) {
    return str.toUpperCase();
  }

  // Handle #FC-XXXXX or FC-XXXX
  const hashFcHyphen = str.match(/^#?FC-(\d+)$/i);
  if (hashFcHyphen) {
    const digits = hashFcHyphen[1].padStart(5, '0').slice(-5);
    return `FC-${digits}`;
  }

  // Handle #LDX10285 or LDX10285 -> FC-10285
  const ldxMatch = str.match(/^#?LDX(\d+)/i);
  if (ldxMatch) {
    const digits = ldxMatch[1].padStart(5, '0').slice(-5);
    return `FC-${digits}`;
  }

  // Handle #FC10285 or FC10285 -> FC-10285
  const fcMatch = str.match(/^#?FC(\d+)/i);
  if (fcMatch) {
    const digits = fcMatch[1].padStart(5, '0').slice(-5);
    return `FC-${digits}`;
  }

  // Handle pure numeric strings/numbers (e.g. 75668, 1, 10285)
  if (/^\d+$/.test(str)) {
    return `FC-${str.padStart(5, '0').slice(-5)}`;
  }

  // Handle embedded 4 or 5 digit numbers in string (e.g. #ORD10285 -> FC-10285)
  const embeddedNum = str.match(/\d{4,5}/);
  if (embeddedNum) {
    return `FC-${embeddedNum[0].padStart(5, '0').slice(-5)}`;
  }

  // For arbitrary hex/alphanumeric IDs (e.g. Firebase push key '-Oabc123' or '#FC8F71E'):
  // Deterministic 5-digit number hash so the same ID always formats to the exact same FC-XXXXX
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const fiveDigitCode = 10000 + (Math.abs(hash) % 90000);
  return `FC-${fiveDigitCode}`;
};

