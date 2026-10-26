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

/**
 * Checks whether an order matches a given status filter category
 * (e.g. 'ALL', 'PENDING', 'PROCESSING', 'DELIVERY', 'COMPLETED', 'CANCELLED')
 * Supports multiple status fields, case-insensitivity, and varied backend/realtime conventions.
 */
export const isOrderMatchingStatus = (order, filterKey) => {
  if (!order) return false;
  if (!filterKey || filterKey === 'ALL' || filterKey === 'all') return true;

  const target = String(filterKey).toUpperCase().trim();

  // Extract all potential status / stage fields
  const rawStat = String(
    order.status || 
    order.raw_status || 
    order.rawStatus || 
    order.order_status || 
    order.orderStatus || 
    ''
  ).toUpperCase().trim();

  const rawStage = String(
    order.stage || 
    order.currentLaundryStep || 
    order.processing_stage || 
    order.delivery_status || 
    ''
  ).toUpperCase().trim();

  const isCancelled = Boolean(
    order.is_cancelled || 
    order.isCancelled || 
    rawStat.includes('CANCEL') || 
    rawStat.includes('REJECT')
  );

  // 1. CANCELLED
  if (target === 'CANCELLED') {
    return isCancelled;
  }

  // If order is cancelled, do not match any active operational category
  if (isCancelled) return false;

  // 2. COMPLETED (Delivered / Fulfilled)
  if (target === 'COMPLETED') {
    return (
      rawStat === 'DELIVERED' ||
      rawStat === 'COMPLETED' ||
      rawStat === 'SUCCESS' ||
      rawStat === 'FULFILLED' ||
      rawStage === 'DELIVERED' ||
      rawStage === 'COMPLETED' ||
      (rawStat.includes('DELIVER') && !rawStat.includes('OUT') && !rawStat.includes('READY') && !rawStat.includes('FOR') && !rawStat.includes('ASSIGN'))
    );
  }

  // 3. DELIVERY (Ready for delivery, assigned to delivery agent, out for delivery, in transit)
  if (target === 'DELIVERY') {
    return (
      rawStat === 'READY_FOR_DELIVERY' ||
      rawStat === 'READY' ||
      rawStat === 'PACKED' ||
      rawStat === 'DISPATCHED' ||
      rawStat === 'OUT_FOR_DELIVERY' ||
      rawStat === 'DELIVERY_ASSIGNED' ||
      rawStat === 'DELIVERY_IN_PROGRESS' ||
      rawStat === 'NEARBY' ||
      rawStat === 'IN_TRANSIT' ||
      rawStat.includes('READY') ||
      rawStat.includes('OUT_FOR_DELIVERY') ||
      rawStat.includes('OUT FOR DELIVERY') ||
      rawStat.includes('DELIVERY ASSIGNED') ||
      rawStage === 'READY' ||
      rawStage === 'READY_FOR_DELIVERY' ||
      rawStage === 'OUT_FOR_DELIVERY' ||
      rawStage === 'DELIVERY'
    );
  }

  // 4. PROCESSING (Picked up, received at hub, cleaning, washing, drying, ironing, inspecting, quality check)
  if (target === 'PROCESSING') {
    return (
      rawStat === 'PICKED_UP' ||
      rawStat === 'PICKED UP' ||
      rawStat === 'CLOTHES COLLECTED' ||
      rawStat === 'DROPPED_OFF_AT_LAUNDRY' ||
      rawStat === 'RECEIVED_BY_LAUNDRY' ||
      rawStat === 'RECEIVED_AT_LAUNDRY' ||
      rawStat === 'RECEIVED' ||
      rawStat === 'HUB_RECEIVED' ||
      rawStat === 'RECEIVED AT HUB' ||
      rawStat === 'INSPECTION' ||
      rawStat === 'INSPECT' ||
      rawStat === 'IN_PROCESS' ||
      rawStat === 'IN PROCESS' ||
      rawStat === 'IN_CLEANING' ||
      rawStat === 'IN CLEANING' ||
      rawStat === 'PROCESSING' ||
      rawStat === 'WASHING' ||
      rawStat === 'WASH' ||
      rawStat === 'DRYING' ||
      rawStat === 'DRY' ||
      rawStat === 'IRONING' ||
      rawStat === 'STEAM IRON' ||
      rawStat === 'FOLDING' ||
      rawStat === 'QUALITY_CHECK' ||
      rawStat === 'QC' ||
      rawStat === 'PACKING' ||
      rawStat.includes('CLEAN') ||
      rawStat.includes('WASH') ||
      rawStat.includes('PROCESS') ||
      rawStat.includes('INSPECT') ||
      rawStat.includes('IRON') ||
      rawStage === 'IN_PROCESS' ||
      rawStage === 'CLEANING' ||
      rawStage === 'PROCESSING' ||
      rawStage === 'INSPECT' ||
      rawStage === 'WASH'
    );
  }

  // 5. PENDING (Booking placed, payment pending, awaiting pickup or pickup assigned/scheduled)
  if (target === 'PENDING') {
    return (
      rawStat === 'PENDING' ||
      rawStat === 'PENDING_REVIEW' ||
      rawStat === 'PAYMENT_PENDING' ||
      rawStat === 'PLACED' ||
      rawStat === 'ORDER PLACED' ||
      rawStat === 'BOOKING_CONFIRMED' ||
      rawStat === 'BOOKING CONFIRMED' ||
      rawStat === 'CONFIRMED' ||
      rawStat === 'ACCEPTED' ||
      rawStat === 'PICKUP_ASSIGNED' ||
      rawStat === 'PICKUP_SCHEDULED' ||
      rawStat === 'PICKUP_IN_PROGRESS' ||
      rawStat === 'PENDING PICKUP' ||
      rawStat === 'ASSIGNED' ||
      rawStat.includes('PENDING') ||
      rawStat.includes('PLACED') ||
      rawStat.includes('PICKUP') ||
      rawStage === 'PLACED' ||
      rawStage === 'PENDING' ||
      rawStage === 'PICKUP'
    );
  }

  return rawStat === target;
};

/**
 * Clean & format Indian phone number:
 * 1. Strictly max 10 digits
 * 2. Starts with 6, 7, 8, or 9
 * 3. Strips non-digits
 * 4. Strips leading +91 or 91 if present
 * 5. Returns formatted string e.g. "+91 98765 43210" or empty
 */
export const formatIndianPhoneNumber = (val) => {
  if (!val) return '';
  let raw = String(val).trim();
  if (raw.startsWith('+91')) {
    raw = raw.slice(3).trim();
  } else if (raw.startsWith('+')) {
    raw = raw.slice(1).trim();
  } else if (raw.startsWith('91') && raw.length > 10) {
    raw = raw.slice(2).trim();
  }

  let digits = raw.replace(/\D/g, '');
  if (digits.length > 0 && !/^[6-9]/.test(digits)) {
    digits = digits.replace(/^[^6-9]+/, '');
  }
  digits = digits.slice(0, 10);

  if (!digits) return '';
  if (digits.length > 5) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return `+91 ${digits}`;
};

/**
 * Validates if the phone number is a complete 10-digit number starting with 6-9
 */
export const isValidIndianPhoneNumber = (val) => {
  if (!val) return false;
  let raw = String(val).trim();
  if (raw.startsWith('+91')) {
    raw = raw.slice(3).trim();
  } else if (raw.startsWith('+')) {
    raw = raw.slice(1).trim();
  } else if (raw.startsWith('91') && raw.length > 10) {
    raw = raw.slice(2).trim();
  }
  const digits = raw.replace(/\D/g, '');
  return /^[6-9]\d{9}$/.test(digits);
};

/**
 * Universal order search matching helper across:
 * - Order ID / Number / Code (FC-XXXXX or raw ID)
 * - Dates (created_at, pickup_date, delivery_date in any locale/format: 28 Oct 2026, 10/26/2026, 26/10/2026, Oct, 2026, etc.)
 * - Time slots (pickup_time_slot, delivery_time_slot)
 * - Services (Wash & Fold, Dry Cleaning, etc.)
 * - Customer details & address
 * - Total amount / Price
 * - Payment status & Order status
 */
export const matchesOrderSearch = (order, searchQuery, servicesString = '') => {
  if (!order) return false;
  const term = (searchQuery || '').trim().toLowerCase();
  if (!term) return true;

  // 1. Order ID & Code
  const rawId = String(order.order_number || order.code || order.order_id || order.id || '').toLowerCase();
  const formattedId = formatOrderId(order.order_number || order.code || order.order_id || order.id).toLowerCase();
  if (rawId.includes(term) || formattedId.includes(term)) return true;

  // 2. Services
  const services = String(servicesString || order.service || '').toLowerCase();
  if (services.includes(term)) return true;

  // 3. Customer name & address
  const custName = String(order.customer_name || order.customerName || order.customer?.name || '').toLowerCase();
  const addr = String(order.pickup_address || (typeof order.address === 'string' ? order.address : '') || '').toLowerCase();
  if (custName.includes(term) || addr.includes(term)) return true;

  // 4. Status & Payment
  const status = String(order.status || '').toLowerCase();
  const payment = String(order.payment_status || (order.isPaid ? 'paid' : 'pending') || '').toLowerCase();
  if (status.includes(term) || payment.includes(term)) return true;

  // 5. Amount
  const amount = String(order.total_amount || order.estimated_amount || order.total || order.amount || '').toLowerCase();
  if (amount && (amount.includes(term) || `₹${amount}`.includes(term))) return true;

  // 6. Dates Matching (Searchable date strings)
  const dateStrings = [];

  // Add raw string fields directly
  const rawFields = [
    order.pickup_date,
    order.pickupDate,
    order.delivery_date,
    order.deliveryDate,
    order.pickup_time_slot,
    order.pickup_slot,
    order.pickupTime,
    order.delivery_time_slot,
    order.delivery_slot,
    order.deliveryTime
  ];
  rawFields.forEach(f => {
    if (f && typeof f === 'string') {
      dateStrings.push(f.toLowerCase().trim());
    }
  });

  // Collect potential date sources for comprehensive parsing
  const dateSources = [
    order.created_at,
    order.createdAt,
    order.placedAt,
    order.pickup_date,
    order.pickupDate,
    order.delivery_date,
    order.deliveryDate
  ];

  dateSources.forEach(val => {
    if (!val) return;
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const monthNum = d.getMonth() + 1;
      const monthPadded = String(monthNum).padStart(2, '0');
      const dayNum = d.getDate();
      const dayPadded = String(dayNum).padStart(2, '0');
      const monthShort = d.toLocaleString('en-US', { month: 'short' }).toLowerCase();
      const monthLong = d.toLocaleString('en-US', { month: 'long' }).toLowerCase();

      dateStrings.push(d.toLocaleDateString().toLowerCase()); // default locale
      dateStrings.push(d.toLocaleDateString('en-GB').toLowerCase()); // 26/10/2026
      dateStrings.push(d.toLocaleDateString('en-US').toLowerCase()); // 10/26/2026
      dateStrings.push(d.toLocaleDateString('en-IN').toLowerCase()); // 26/10/2026

      dateStrings.push(`${dayNum} ${monthShort} ${year}`); // 26 oct 2026
      dateStrings.push(`${dayPadded} ${monthShort} ${year}`); // 26 oct 2026
      dateStrings.push(`${dayNum} ${monthShort}`); // 26 oct
      dateStrings.push(`${monthShort} ${dayNum}`); // oct 26
      dateStrings.push(`${monthShort} ${year}`); // oct 2026
      dateStrings.push(`${dayNum} ${monthLong} ${year}`); // 26 october 2026
      dateStrings.push(`${monthLong} ${dayNum}`); // october 26
      dateStrings.push(monthLong); // october
      dateStrings.push(monthShort); // oct

      dateStrings.push(`${dayPadded}/${monthPadded}/${year}`);
      dateStrings.push(`${monthPadded}/${dayPadded}/${year}`);
      dateStrings.push(`${dayNum}/${monthNum}/${year}`);
      dateStrings.push(`${monthNum}/${dayNum}/${year}`);
      dateStrings.push(`${year}-${monthPadded}-${dayPadded}`);
      dateStrings.push(`${dayPadded}-${monthPadded}-${year}`);
      dateStrings.push(`${monthPadded}-${dayPadded}-${year}`);
      dateStrings.push(`${dayPadded}/${monthPadded}`);
      dateStrings.push(`${monthPadded}/${dayPadded}`);
      dateStrings.push(`${dayPadded}-${monthPadded}`);
      dateStrings.push(`${monthPadded}-${dayPadded}`);
    }
  });

  // Test date matching
  // Direct inclusion
  if (dateStrings.some(dStr => dStr && dStr.includes(term))) return true;

  // Normalized slashes/dashes
  const normalizedTerm = term.replace(/[\-.,]/g, '/');
  if (dateStrings.some(dStr => dStr && dStr.replace(/[\-.,]/g, '/').includes(normalizedTerm))) return true;

  // Token matching (e.g. "28 Oct" or "Oct 28" or "28 10")
  const cleanTerm = term.replace(/[\-.,/]/g, ' ').replace(/\s+/g, ' ').trim();
  const termTokens = cleanTerm.split(' ').filter(Boolean);
  if (termTokens.length > 0) {
    const isMatched = dateStrings.some(dStr => {
      const cleanD = dStr.replace(/[\-.,/]/g, ' ').replace(/\s+/g, ' ');
      return termTokens.every(tok => cleanD.includes(tok));
    });
    if (isMatched) return true;
  }

  return false;
};


