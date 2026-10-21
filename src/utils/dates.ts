import { format, parseISO, isValid, addDays as dateFnsAddDays, subDays as dateFnsSubDays } from 'date-fns';

/**
 * Returns today's local date string formatted as YYYY-MM-DD
 */
export function getTodayStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a YYYY-MM-DD date into a readable string like "Mon, 19 Oct 2026"
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return format(date, 'EEE, dd MMM yyyy');
  } catch {
    return dateStr;
  }
}

/**
 * Formats a YYYY-MM-DD date into a full string like "Monday, 19 October 2026"
 */
export function formatFullDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return format(date, 'EEEE, dd MMMM yyyy');
  } catch {
    return dateStr;
  }
}

/**
 * Formats an ISO timestamp or date string into readable time "04:30 PM"
 */
export function formatTime(isoStr: string | null | undefined): string {
  if (!isoStr) return '--:--';
  try {
    const date = parseISO(isoStr);
    if (!isValid(date)) return isoStr.slice(11, 16) || isoStr;
    return format(date, 'hh:mm a');
  } catch {
    return '--:--';
  }
}

/**
 * Formats an ISO timestamp into "19 Oct, 04:30 PM"
 */
export function formatDateTime(isoStr: string | null | undefined): string {
  if (!isoStr) return '--';
  try {
    const date = parseISO(isoStr);
    if (!isValid(date)) return isoStr;
    return format(date, 'dd MMM yyyy, hh:mm a');
  } catch {
    return isoStr;
  }
}

/**
 * Returns true if dateStr is strictly before today (past day)
 */
export function isPastDate(dateStr: string): boolean {
  return dateStr < getTodayStr();
}

/**
 * Returns true if dateStr is today
 */
export function isToday(dateStr: string): boolean {
  return dateStr === getTodayStr();
}

/**
 * Adds or subtracts days from a YYYY-MM-DD date string
 */
export function shiftDate(dateStr: string, deltaDays: number): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const result = deltaDays >= 0 ? dateFnsAddDays(date, deltaDays) : dateFnsSubDays(date, Math.abs(deltaDays));
    const rYear = result.getFullYear();
    const rMonth = String(result.getMonth() + 1).padStart(2, '0');
    const rDay = String(result.getDate()).padStart(2, '0');
    return `${rYear}-${rMonth}-${rDay}`;
  } catch {
    return dateStr;
  }
}
