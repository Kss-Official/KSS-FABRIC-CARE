/**
 * Date Filter Utilities for Fabricare Laundrix
 * Provides dynamic calculations and matching for real date ranges (Today, Tomorrow, Yesterday, Last Week, etc.)
 */

export const getStartOfDay = (d = new Date()) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const getEndOfDay = (d = new Date()) => {
  const date = new Date(d);
  date.setHours(23, 59, 59, 999);
  return date;
};

/**
 * Robust date parser supporting ISO strings (YYYY-MM-DD), RFC strings,
 * formatted dates (24 Oct 2026, 24-Oct-2026), relative keywords (Today, Tomorrow, Yesterday),
 * and numeric timestamps.
 * Crucially parses YYYY-MM-DD in LOCAL timezone to prevent UTC timezone date-shifting bugs.
 */
export const parseFlexibleDate = (val) => {
  if (val == null || val === '') return null;

  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : new Date(val.getTime());
  }

  if (typeof val === 'number') {
    if (isNaN(val)) return null;
    const d = new Date(val > 1e11 ? val : val * 1000);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof val === 'string') {
    const s = val.trim();
    if (!s) return null;

    const lower = s.toLowerCase();
    if (lower.startsWith('today')) {
      return getStartOfDay(new Date());
    }
    if (lower.startsWith('tomorrow')) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return getStartOfDay(d);
    }
    if (lower.startsWith('yesterday')) {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return getStartOfDay(d);
    }

    // 1. ISO string with explicit timezone offset or Zulu indicator (e.g., 2026-10-23T18:09:32.495981+05:30 or 2026-10-22 20:30:00Z)
    // Supports either 'T' or space as time separator, and preserves native browser timezone translation
    if (/^\d{4}-\d{1,2}-\d{1,2}[T\s][^\s]+(?:Z|[+-]\d{2}(?::?\d{2})?)$/i.test(s)) {
      const d = new Date(s.replace(' ', 'T'));
      if (!isNaN(d.getTime())) return d;
    }

    // 2. ISO format without timezone: YYYY-MM-DD or YYYY-MM-DD[T\s]HH:mm:ss
    // Parse strictly in local timezone to avoid UTC midnight date-shifting bugs on date-only strings
    const isoDateMatch = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
    if (isoDateMatch) {
      const year = parseInt(isoDateMatch[1], 10);
      const month = parseInt(isoDateMatch[2], 10) - 1;
      const day = parseInt(isoDateMatch[3], 10);
      const hour = isoDateMatch[4] ? parseInt(isoDateMatch[4], 10) : 0;
      const min = isoDateMatch[5] ? parseInt(isoDateMatch[5], 10) : 0;
      const sec = isoDateMatch[6] ? parseInt(isoDateMatch[6], 10) : 0;
      const d = new Date(year, month, day, hour, min, sec);
      if (!isNaN(d.getTime())) return d;
    }

    // 3. Day-Month-Year with month name (e.g., "23 Oct 2026 12:39 PM", "24-Oct-2026", "24 October 2026")
    const months = { jan:0, feb:1, mar:2, apr:3, may:4, jun:5, jul:6, aug:7, sep:8, oct:9, nov:10, dec:11 };
    const dmyMatch = s.match(/(?:^|[A-Za-z]+,\s*)(\d{1,2})[\s-]+([A-Za-z]{3,9})(?:[\s-]+(\d{4}))?(?:[,\s]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?(?:\s*(am|pm))?)?/i);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const monStr = dmyMatch[2].substring(0, 3).toLowerCase();
      if (months[monStr] !== undefined) {
        const month = months[monStr];
        const year = dmyMatch[3] ? parseInt(dmyMatch[3], 10) : new Date().getFullYear();
        let hour = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 0;
        const min = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0;
        const sec = dmyMatch[6] ? parseInt(dmyMatch[6], 10) : 0;
        const ampm = dmyMatch[7]?.toLowerCase();
        if (ampm === 'pm' && hour < 12) hour += 12;
        if (ampm === 'am' && hour === 12) hour = 0;
        const d = new Date(year, month, day, hour, min, sec);
        if (!isNaN(d.getTime())) return d;
      }
    }

    // 4. Month-Day-Year with month name (e.g., "Oct 23, 2026 02:30 PM", "October 23, 2026")
    const mdyMatch = s.match(/^([A-Za-z]{3,9})[\s-]+(\d{1,2})(?:,?\s+(\d{4}))?(?:[,\s]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?(?:\s*(am|pm))?)?/i);
    if (mdyMatch) {
      const monStr = mdyMatch[1].substring(0, 3).toLowerCase();
      if (months[monStr] !== undefined) {
        const month = months[monStr];
        const day = parseInt(mdyMatch[2], 10);
        const year = mdyMatch[3] ? parseInt(mdyMatch[3], 10) : new Date().getFullYear();
        let hour = mdyMatch[4] ? parseInt(mdyMatch[4], 10) : 0;
        const min = mdyMatch[5] ? parseInt(mdyMatch[5], 10) : 0;
        const sec = mdyMatch[6] ? parseInt(mdyMatch[6], 10) : 0;
        const ampm = mdyMatch[7]?.toLowerCase();
        if (ampm === 'pm' && hour < 12) hour += 12;
        if (ampm === 'am' && hour === 12) hour = 0;
        const d = new Date(year, month, day, hour, min, sec);
        if (!isNaN(d.getTime())) return d;
      }
    }

    // 5. Numeric Day-Month-Year (e.g. "23-10-2026", "23/10/2026 03:45 PM")
    const dmyNumeric = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:[,\s]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?(?:\s*(am|pm))?)?/i);
    if (dmyNumeric) {
      const day = parseInt(dmyNumeric[1], 10);
      const month = parseInt(dmyNumeric[2], 10) - 1;
      const year = parseInt(dmyNumeric[3], 10);
      let hour = dmyNumeric[4] ? parseInt(dmyNumeric[4], 10) : 0;
      const min = dmyNumeric[5] ? parseInt(dmyNumeric[5], 10) : 0;
      const sec = dmyNumeric[6] ? parseInt(dmyNumeric[6], 10) : 0;
      const ampm = dmyNumeric[7]?.toLowerCase();
      if (ampm === 'pm' && hour < 12) hour += 12;
      if (ampm === 'am' && hour === 12) hour = 0;
      const d = new Date(year, month, day, hour, min, sec);
      if (!isNaN(d.getTime())) return d;
    }

    // 6. Fallback direct parse (RFC, standard locale string)
    const direct = new Date(s);
    if (!isNaN(direct.getTime()) && direct.getFullYear() > 2000) {
      return direct;
    }
  }

  return null;
};

export const formatDisplayDate = (d = new Date(), options = {}) => {
  const date = d instanceof Date ? d : parseFlexibleDate(d);
  if (!date || isNaN(date.getTime())) return '';
  const { weekday = false } = options;
  if (weekday) {
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

/**
 * Returns dynamic date range bounds relative to reference date (default: now)
 */
export const getActiveDateRanges = (ref = new Date()) => {
  const now = new Date(ref);
  const todayStart = getStartOfDay(now);
  const todayEnd = getEndOfDay(now);

  const tomorrowRef = new Date(now);
  tomorrowRef.setDate(tomorrowRef.getDate() + 1);
  const tomorrowStart = getStartOfDay(tomorrowRef);
  const tomorrowEnd = getEndOfDay(tomorrowRef);

  const yesterdayRef = new Date(now);
  yesterdayRef.setDate(yesterdayRef.getDate() - 1);
  const yesterdayStart = getStartOfDay(yesterdayRef);
  const yesterdayEnd = getEndOfDay(yesterdayRef);

  // Current calendar week calculations
  const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  const daysSinceMonday = (dayOfWeek + 6) % 7;

  // Monday 00:00:00 of this week
  const thisWeekMon = new Date(now);
  thisWeekMon.setDate(thisWeekMon.getDate() - daysSinceMonday);
  thisWeekMon.setHours(0, 0, 0, 0);

  // Sunday 00:00:00 of this week
  const thisWeekSun = new Date(now);
  thisWeekSun.setDate(thisWeekSun.getDate() - dayOfWeek);
  thisWeekSun.setHours(0, 0, 0, 0);

  const thisWeekStart = thisWeekSun < thisWeekMon ? thisWeekSun : thisWeekMon;
  const thisWeekEnd = new Date(thisWeekStart);
  thisWeekEnd.setDate(thisWeekEnd.getDate() + 6);
  thisWeekEnd.setHours(23, 59, 59, 999);

  // PREVIOUS WEEK ("Last Week"):
  // Spans the previous calendar week prior to the start of this week.
  // End of previous week is the end of Sunday (23:59:59.999) before this week's Monday:
  const prevWeekSunEnd = new Date(thisWeekMon);
  prevWeekSunEnd.setMilliseconds(-1);

  // Start of previous week Monday (7 days before this week's Monday):
  const prevWeekMon = new Date(thisWeekMon);
  prevWeekMon.setDate(prevWeekMon.getDate() - 7);
  prevWeekMon.setHours(0, 0, 0, 0);

  // To also support Sunday-starting weeks (where Sunday is the 1st day of the week),
  // start from Sunday of previous week:
  const prevWeekSunStart = new Date(prevWeekMon);
  prevWeekSunStart.setDate(prevWeekSunStart.getDate() - 1);
  prevWeekSunStart.setHours(0, 0, 0, 0);

  const lastWeekStart = prevWeekSunStart;
  const lastWeekEnd = prevWeekSunEnd;

  // Rolling 7 days for '7days' / 'last7days'
  const rolling7DaysStart = new Date(now);
  rolling7DaysStart.setDate(rolling7DaysStart.getDate() - 7);
  rolling7DaysStart.setHours(0, 0, 0, 0);

  const last30DaysStart = new Date(now);
  last30DaysStart.setDate(last30DaysStart.getDate() - 30);
  last30DaysStart.setHours(0, 0, 0, 0);

  return {
    today: { start: todayStart, end: todayEnd },
    tomorrow: { start: tomorrowStart, end: tomorrowEnd },
    yesterday: { start: yesterdayStart, end: yesterdayEnd },
    thisWeek: { start: thisWeekStart, end: thisWeekEnd },
    lastWeek: { start: lastWeekStart, end: lastWeekEnd },
    last7Days: { start: rolling7DaysStart, end: todayEnd },
    last30Days: { start: last30DaysStart, end: todayEnd }
  };
};

export const toLocalIsoDate = (d = new Date()) => {
  const date = d instanceof Date ? d : parseFlexibleDate(d);
  if (!date || isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const dNum = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${dNum}`;
};

/**
 * Resolves the scheduled pickup date for an order.
 * Strictly extracts the pickup scheduling date from all known pickup date fields across
 * RTDB, Django backend, and local assignment states.
 * Under NO circumstances falls back to creation timestamps (createdAt, placedAt),
 * completion timestamps, or new Date().
 * Returns Date object in local midnight, or null if no pickup date is set.
 */
export const getOrderPickupDate = (order) => {
  if (!order) return null;

  // 1. Direct pickup date properties on order
  const pickupDateCandidates = [
    order.persistedPickupDate,
    order.pickupDate,
    order.pickup_date,
    order.scheduled_date,
    order.scheduledDate,
    order.dateText,
    order.date_text
  ];

  for (const candidate of pickupDateCandidates) {
    if (candidate != null && candidate !== '') {
      const parsed = parseFlexibleDate(candidate);
      if (parsed) return parsed;
    }
  }

  // 2. Nested pickup object on order: order.pickup?.date, order.pickup_slot?.date, order.pickupSchedule?.dateValue
  if (order.pickup && typeof order.pickup === 'object' && order.pickup.date) {
    const parsed = parseFlexibleDate(order.pickup.date);
    if (parsed) return parsed;
  }
  if (order.pickup_slot && typeof order.pickup_slot === 'object' && order.pickup_slot.date) {
    const parsed = parseFlexibleDate(order.pickup_slot.date);
    if (parsed) return parsed;
  }
  if (order.pickupSchedule && typeof order.pickupSchedule === 'object' && order.pickupSchedule.dateValue) {
    const parsed = parseFlexibleDate(order.pickupSchedule.dateValue);
    if (parsed) return parsed;
  }

  // 3. Check inside rawOrder or original backend record if available
  const raw = order.rawOrder || order._raw || order.order;
  if (raw && typeof raw === 'object') {
    const rawCandidates = [
      raw.persistedPickupDate,
      raw.pickupDate,
      raw.pickup_date,
      raw.scheduled_date,
      raw.scheduledDate,
      raw.dateText,
      raw.date_text
    ];
    for (const candidate of rawCandidates) {
      if (candidate != null && candidate !== '') {
        const parsed = parseFlexibleDate(candidate);
        if (parsed) return parsed;
      }
    }
    if (raw.pickup && typeof raw.pickup === 'object' && raw.pickup.date) {
      const parsed = parseFlexibleDate(raw.pickup.date);
      if (parsed) return parsed;
    }
    if (raw.pickup_slot && typeof raw.pickup_slot === 'object' && raw.pickup_slot.date) {
      const parsed = parseFlexibleDate(raw.pickup_slot.date);
      if (parsed) return parsed;
    }
    if (raw.pickupSchedule && typeof raw.pickupSchedule === 'object' && raw.pickupSchedule.dateValue) {
      const parsed = parseFlexibleDate(raw.pickupSchedule.dateValue);
      if (parsed) return parsed;
    }
  }

  // 4. Pickup time string containing a date prefix (e.g., "24 Oct 2026, 9:00 AM – 11:00 AM" or "2026-10-24, 09:00 AM")
  const timeStrings = [order.pickupTime, order.pickup_time, raw?.pickupTime, raw?.pickup_time];
  for (const timeStr of timeStrings) {
    if (typeof timeStr === 'string' && timeStr.trim()) {
      const parts = timeStr.split(/,|\bat\b/);
      if (parts.length > 0) {
        const datePart = parts[0].trim();
        // Check if datePart parses into a valid date and is not just a time slot like "09:00 AM – 11:00 AM"
        if (!/^\d{1,2}:\d{2}/.test(datePart)) {
          const parsed = parseFlexibleDate(datePart);
          if (parsed) return parsed;
        }
      }
    }
  }

  // 5. Check order.rawDate or order.date IF it is a valid date string and not a relative keyword
  const dateStrings = [order.rawDate, order.date];
  for (const dStr of dateStrings) {
    if (typeof dStr === 'string' && dStr.trim()) {
      const s = dStr.trim().toLowerCase();
      // Ignore non-date strings or relative keywords that might have been accidentally assigned
      if (s !== 'today' && s !== 'tomorrow' && s !== 'yesterday' && s !== 'all' && s !== '—' && s !== '-') {
        const parsed = parseFlexibleDate(dStr);
        if (parsed) return parsed;
      }
    }
  }

  // Never fall back to creation/update timestamps or current date
  return null;
};

/**
 * Specifically checks if an order's pickup date matches the given date range.
 * Strictly uses getOrderPickupDate(order) and will NEVER fall back to order creation
 * or update timestamps.
 */
export const filterMatchesPickupDate = (order, rangeKey) => {
  if (!rangeKey || rangeKey === 'all' || rangeKey === 'ALL' || rangeKey === 'all-time') {
    return true;
  }

  const pickupDate = getOrderPickupDate(order);
  if (!pickupDate) return false;

  const ranges = getActiveDateRanges();
  const time = pickupDate.getTime();

  // If rangeKey is an object with start and end
  if (typeof rangeKey === 'object' && rangeKey !== null && (rangeKey.start || rangeKey.end)) {
    const sStart = rangeKey.start ? getStartOfDay(parseFlexibleDate(rangeKey.start)).getTime() : 0;
    const sEnd = rangeKey.end ? getEndOfDay(parseFlexibleDate(rangeKey.end)).getTime() : Infinity;
    return time >= sStart && time <= sEnd;
  }

  const normKey = String(rangeKey).toLowerCase().replace(/[\s_-]+/g, '');

  if (normKey === 'today') {
    return time >= ranges.today.start.getTime() && time <= ranges.today.end.getTime();
  }

  if (normKey === 'tomorrow') {
    return time >= ranges.tomorrow.start.getTime() && time <= ranges.tomorrow.end.getTime();
  }

  if (normKey === 'yesterday') {
    return time >= ranges.yesterday.start.getTime() && time <= ranges.yesterday.end.getTime();
  }

  if (normKey === 'thisweek') {
    return time >= ranges.thisWeek.start.getTime() && time <= ranges.thisWeek.end.getTime();
  }

  if (normKey === 'lastweek' || normKey === 'previousweek' || normKey === 'prevweek') {
    return time >= ranges.lastWeek.start.getTime() && time <= ranges.lastWeek.end.getTime();
  }

  if (normKey === '7days' || normKey === 'last7days' || normKey === 'last7' || normKey === '7day') {
    return time >= ranges.last7Days.start.getTime() && time <= ranges.last7Days.end.getTime();
  }

  if (normKey === 'last30' || normKey === 'last30days' || normKey === 'thismonth') {
    return time >= ranges.last30Days.start.getTime() && time <= ranges.last30Days.end.getTime();
  }

  // Exact date match (e.g., "2026-10-24", "24 Oct 2026", "Tuesday, 23 Sep 2026")
  const specificDate = parseFlexibleDate(rangeKey);
  if (specificDate) {
    const sStart = getStartOfDay(specificDate).getTime();
    const sEnd = getEndOfDay(specificDate).getTime();
    return time >= sStart && time <= sEnd;
  }

  return true;
};

/**
 * Parse date from an entity by checking candidate fields first, then fallback to timestamps
 */
export const extractEntityDate = (entity, customFields = []) => {
  if (!entity) return null;

  // Primary candidate fields in order of scheduling priority
  const candidateFields = (Array.isArray(customFields) && customFields.length > 0)
    ? customFields
    : [
        'pickup_date',
        'pickupDate',
        'delivery_date',
        'deliveryDate',
        'rescheduled_date',
        'formatted_reschedule_date',
        'scheduled_date',
        'report_date',
        'rawDate',
        'date',
        'pickupTime',
        'pickup_time',
        'deliveryTime',
        'delivery_time'
      ];

  // 1. Direct fields on entity
  for (const field of candidateFields) {
    const val = entity[field];
    if (val != null && val !== '') {
      const parsed = parseFlexibleDate(val);
      if (parsed) return parsed;
    }
  }

  // 2. Nested objects on entity (e.g. entity.pickup?.date or entity.delivery?.date)
  if (entity.pickup && typeof entity.pickup === 'object') {
    if (entity.pickup.date) {
      const p = parseFlexibleDate(entity.pickup.date);
      if (p) return p;
    }
  }
  if (entity.delivery && typeof entity.delivery === 'object') {
    if (entity.delivery.date) {
      const p = parseFlexibleDate(entity.delivery.date);
      if (p) return p;
    }
  }

  // 3. Check inside rawOrder if available
  if (entity.rawOrder && typeof entity.rawOrder === 'object') {
    const ro = entity.rawOrder;
    for (const field of candidateFields) {
      const val = ro[field];
      if (val != null && val !== '') {
        const parsed = parseFlexibleDate(val);
        if (parsed) return parsed;
      }
    }
    if (ro.pickup && typeof ro.pickup === 'object' && ro.pickup.date) {
      const p = parseFlexibleDate(ro.pickup.date);
      if (p) return p;
    }
    if (ro.delivery && typeof ro.delivery === 'object' && ro.delivery.date) {
      const p = parseFlexibleDate(ro.delivery.date);
      if (p) return p;
    }
  }

  // 4. Fallback to order placement / creation timestamps ONLY if customFields is empty or explicitly includes timestamps
  const allowsTimestampFallback = customFields.length === 0 || customFields.some(f => 
    ['createdAt', 'created_at', 'placedAt', 'placed_at', 'timestamp', 'joinedAt', 'joinDate', 'completedAt', 'deliveredAt', 'updatedAt'].includes(f)
  );

  if (allowsTimestampFallback) {
    const timestampFields = [
      'createdAt',
      'created_at',
      'placedAt',
      'placed_at',
      'timestamp',
      'joinedAt',
      'joined_at',
      'joinDate',
      'join_date',
      'completedAt',
      'deliveredAt',
      'updatedAt'
    ];
    for (const field of timestampFields) {
      const val = entity[field] || (entity.rawOrder && entity.rawOrder[field]);
      if (val != null && val !== '') {
        const parsed = parseFlexibleDate(val);
        if (parsed) return parsed;
      }
    }
  }

  return null;
};

/**
 * Checks if an entity falls into the selected date range
 * Supported rangeKey values:
 * - 'all' / 'ALL' / 'all-time'
 * - 'today' / 'TODAY'
 * - 'tomorrow' / 'TOMORROW'
 * - 'yesterday' / 'YESTERDAY'
 * - 'thisweek' / 'THIS_WEEK'
 * - 'last-week' / 'LAST_WEEK' / '7days' / '7DAYS'
 * - 'last-30' / 'this-month'
 * - Specific formatted date string like "24 Oct 2026", "2026-10-24"
 * - Object with { start, end }
 */
export const filterMatchesDate = (entity, rangeKey, customFields = []) => {
  if (!rangeKey || rangeKey === 'all' || rangeKey === 'ALL' || rangeKey === 'all-time') {
    return true;
  }

  const entityDate = extractEntityDate(entity, customFields);
  if (!entityDate) return false;

  const ranges = getActiveDateRanges();
  const time = entityDate.getTime();

  // If rangeKey is an object with start and end
  if (typeof rangeKey === 'object' && rangeKey !== null && (rangeKey.start || rangeKey.end)) {
    const sStart = rangeKey.start ? getStartOfDay(parseFlexibleDate(rangeKey.start)).getTime() : 0;
    const sEnd = rangeKey.end ? getEndOfDay(parseFlexibleDate(rangeKey.end)).getTime() : Infinity;
    return time >= sStart && time <= sEnd;
  }

  const normKey = String(rangeKey).toLowerCase().replace(/[\s_-]+/g, '');

  if (normKey === 'today') {
    if (time >= ranges.today.start.getTime() && time <= ranges.today.end.getTime()) return true;
    const tStart = ranges.today.start;
    return (
      entityDate.getFullYear() === tStart.getFullYear() &&
      entityDate.getMonth() === tStart.getMonth() &&
      entityDate.getDate() === tStart.getDate()
    );
  }

  if (normKey === 'tomorrow') {
    if (time >= ranges.tomorrow.start.getTime() && time <= ranges.tomorrow.end.getTime()) return true;
    const tmStart = ranges.tomorrow.start;
    return (
      entityDate.getFullYear() === tmStart.getFullYear() &&
      entityDate.getMonth() === tmStart.getMonth() &&
      entityDate.getDate() === tmStart.getDate()
    );
  }

  if (normKey === 'yesterday') {
    if (time >= ranges.yesterday.start.getTime() && time <= ranges.yesterday.end.getTime()) return true;
    const yStart = ranges.yesterday.start;
    return (
      entityDate.getFullYear() === yStart.getFullYear() &&
      entityDate.getMonth() === yStart.getMonth() &&
      entityDate.getDate() === yStart.getDate()
    );
  }

  if (normKey === 'thisweek') {
    return time >= ranges.thisWeek.start.getTime() && time <= ranges.thisWeek.end.getTime();
  }

  if (normKey === 'lastweek' || normKey === 'previousweek' || normKey === 'prevweek') {
    return time >= ranges.lastWeek.start.getTime() && time <= ranges.lastWeek.end.getTime();
  }

  if (normKey === '7days' || normKey === 'last7days' || normKey === 'last7' || normKey === '7day') {
    return time >= ranges.last7Days.start.getTime() && time <= ranges.last7Days.end.getTime();
  }

  if (normKey === 'last30' || normKey === 'last30days' || normKey === 'thismonth') {
    return time >= ranges.last30Days.start.getTime() && time <= ranges.last30Days.end.getTime();
  }

  // Exact date match (e.g., "2026-10-24", "24 Oct 2026", "Tuesday, 23 Sep 2026")
  const specificDate = parseFlexibleDate(rangeKey);
  if (specificDate) {
    const sStart = getStartOfDay(specificDate).getTime();
    const sEnd = getEndOfDay(specificDate).getTime();
    return time >= sStart && time <= sEnd;
  }

  return true;
};
