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

/**
 * Calculates the exact and true order total consistently across all portals and views.
 * Matches the accurate calculation from Invoice & Bill:
 * 1. Accurately sums item line totals / quantities * rates.
 * 2. Removes any unintended express fee addition (e.g. ₹100 / 10000 paise).
 * 3. Handles both paise and INR units seamlessly.
 */
export const calculateOrderTotal = (order, fixedDecimals = false) => {
  if (!order || typeof order !== 'object') return fixedDecimals ? '0.00' : '0';

  const formatResult = (num) => {
    const val = Number(num);
    if (isNaN(val)) return fixedDecimals ? '0.00' : '0';
    if (fixedDecimals) return val.toFixed(2);
    return val % 1 === 0 ? val.toFixed(0) : val.toFixed(2);
  };

  // 1. Check items (array or object map)
  let itemsList = [];
  if (Array.isArray(order.items) && order.items.length > 0) {
    itemsList = order.items;
  } else if (order.items && typeof order.items === 'object') {
    itemsList = Object.entries(order.items).map(([k, val]) => {
      if (typeof val === 'object' && val !== null) {
        return { ...val, id: val.id || k };
      }
      return { id: k, item_name: k, quantity: Number(val) || 1 };
    });
  }

  if (itemsList.length > 0) {
    let itemsSum = 0;
    let hasValidAmount = false;

    for (const it of itemsList) {
      if (!it) continue;
      const qty = Number(it.quantity || it.qty || 1);

      let lineTotal = it.lineTotal ?? it.total_price ?? it.total;
      if (lineTotal != null && !isNaN(Number(lineTotal))) {
        let num = Number(lineTotal);
        if (num >= 1000 || (num >= 500 && num % 100 === 0)) num /= 100;
        if (num > 0) {
          itemsSum += num;
          hasValidAmount = true;
          continue;
        }
      }

      let price = it.unitPrice ?? it.unit_price ?? it.rate ?? it.price;
      if (price != null && !isNaN(Number(price))) {
        let num = Number(price);
        if (num >= 1000 || (num >= 500 && num % 100 === 0)) num /= 100;
        if (num > 0) {
          itemsSum += num * qty;
          hasValidAmount = true;
        }
      }
    }

    if (hasValidAmount && itemsSum > 0) {
      return formatResult(itemsSum);
    }
  }

  // 2. Fallback to subtotal if available (subtotal does not contain unintended express charge additions)
  const sub = order.subtotal ?? order.subtotal_amount;
  if (sub != null && !isNaN(Number(sub)) && Number(sub) > 0) {
    let numSub = Number(sub);
    if (numSub >= 1000 || (numSub >= 500 && numSub % 100 === 0)) numSub /= 100;
    return formatResult(numSub);
  }

  // 3. Fallback to order total / total_amount / amount, removing any expressCharge addition
  const rawTot = order.total ?? order.total_amount ?? order.amount ?? order.totalPaise;
  if (rawTot != null && !isNaN(Number(rawTot)) && Number(rawTot) > 0) {
    let numTot = Number(rawTot);
    if (numTot >= 1000 || (numTot >= 500 && numTot % 100 === 0)) numTot /= 100;

    // Deduct expressCharge if explicitly present
    const expCharge = Number(order.expressCharge || 0);
    if (expCharge > 0) {
      numTot -= (expCharge >= 1000 ? expCharge / 100 : expCharge);
    }
    return formatResult(Math.max(0, numTot));
  }

  const est = order.estimatedTotal ?? order.estimated_amount;
  if (est != null && !isNaN(Number(est)) && Number(est) > 0) {
    return formatResult(est);
  }

  return fixedDecimals ? '0.00' : '0';
};

export const getOrderNumericAmount = (order) => {
  const str = calculateOrderTotal(order);
  return parseFloat(str) || 0;
};

