/**
 * Rounds a number to 2 decimal places
 */
export function r2(num: number): number {
  return Math.round((Number(num) || 0) * 100) / 100;
}

/**
 * Formats a number to Indian Rupee (INR) currency display
 */
export function formatINR(amount: number, showDecimals: boolean = true): string {
  const rounded = r2(amount);
  const isNegative = rounded < 0;
  const absVal = Math.abs(rounded);

  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(absVal);

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Clean plain number string formatter with commas (e.g. 12,345.50)
 */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(r2(amount));
}
