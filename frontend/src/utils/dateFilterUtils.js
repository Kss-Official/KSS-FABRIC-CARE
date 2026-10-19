/**
 * Date Filter Utilities for Fabricare Laundrix
 * Provides dynamic calculations and matching for real date ranges (Today, Yesterday, Last Week, etc.)
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

export const formatDisplayDate = (d = new Date(), options = {}) => {
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
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

  const yesterdayRef = new Date(now);
  yesterdayRef.setDate(yesterdayRef.getDate() - 1);
  const yesterdayStart = getStartOfDay(yesterdayRef);
  const yesterdayEnd = getEndOfDay(yesterdayRef);

  const lastWeekStart = new Date(now);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  lastWeekStart.setHours(0, 0, 0, 0);

  const last30DaysStart = new Date(now);
  last30DaysStart.setDate(last30DaysStart.getDate() - 30);
  last30DaysStart.setHours(0, 0, 0, 0);

  return {
    today: { start: todayStart, end: todayEnd },
    yesterday: { start: yesterdayStart, end: yesterdayEnd },
    lastWeek: { start: lastWeekStart, end: todayEnd },
    last30Days: { start: last30DaysStart, end: todayEnd }
  };
};

/**
 * Parse date from an entity by checking various standard date properties
 */
export const extractEntityDate = (entity, customFields = []) => {
  if (!entity) return null;

  const candidateFields = [
    ...customFields,
    'date',
    'createdAt',
    'created_at',
    'placedAt',
    'placed_at',
    'joinedAt',
    'joined_at',
    'joinDate',
    'join_date',
    'report_date',
    'pickupTime',
    'pickup_time',
    'deliveryTime',
    'delivery_time',
    'timestamp',
    'completedAt',
    'deliveredAt',
    'updatedAt'
  ];

  for (const field of candidateFields) {
    const val = entity[field];
    if (val == null || val === '') continue;

    // Direct timestamp number
    if (typeof val === 'number') {
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d;
    }

    if (typeof val === 'string') {
      // 1. Direct parse (ISO or RFC)
      const parsedDirect = new Date(val);
      if (!isNaN(parsedDirect.getTime()) && parsedDirect.getFullYear() > 2000) {
        return parsedDirect;
      }

      // 2. Extract substrings like "23 Sep 2026" or "19 Oct 2026"
      const match = val.match(/(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})/);
      if (match) {
        const d = new Date(match[1]);
        if (!isNaN(d.getTime())) return d;
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
 * - 'yesterday' / 'YESTERDAY'
 * - 'last-week' / 'LAST_WEEK' / '7days' / '7DAYS'
 * - 'last-30' / 'this-month'
 * - Or a formatted date string matching the entity's date
 */
export const filterMatchesDate = (entity, rangeKey, customFields = []) => {
  if (!rangeKey || rangeKey === 'all' || rangeKey === 'ALL' || rangeKey === 'all-time') {
    return true;
  }

  const entityDate = extractEntityDate(entity, customFields);
  if (!entityDate) return false;

  const ranges = getActiveDateRanges();
  const time = entityDate.getTime();
  const normKey = String(rangeKey).toLowerCase().replace(/[\s_-]+/g, '');

  if (normKey === 'today') {
    return time >= ranges.today.start.getTime() && time <= ranges.today.end.getTime();
  }

  if (normKey === 'yesterday') {
    return time >= ranges.yesterday.start.getTime() && time <= ranges.yesterday.end.getTime();
  }

  if (normKey === 'lastweek' || normKey === '7days' || normKey === 'thisweek') {
    return time >= ranges.lastWeek.start.getTime() && time <= ranges.lastWeek.end.getTime();
  }

  if (normKey === 'last30' || normKey === 'last30days' || normKey === 'thismonth') {
    return time >= ranges.last30Days.start.getTime() && time <= ranges.last30Days.end.getTime();
  }

  // Exact date match (e.g., specific string like "Tuesday, 23 Sep 2026" or "23 Sep 2026")
  const specificDate = new Date(rangeKey);
  if (!isNaN(specificDate.getTime())) {
    const sStart = getStartOfDay(specificDate).getTime();
    const sEnd = getEndOfDay(specificDate).getTime();
    return time >= sStart && time <= sEnd;
  }

  return true;
};
