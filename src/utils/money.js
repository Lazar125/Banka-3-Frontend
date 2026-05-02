// Backend stores money as integer minor units (RSD para, USD/EUR/CHF cents).
// Display layer always converts before showing the number to a human.

const FRACTION_DIGITS = 2;
const MINOR_PER_MAJOR = 100;

export function minorToMajor(minor) {
  if (minor == null || Number.isNaN(Number(minor))) return null;
  return Number(minor) / MINOR_PER_MAJOR;
}

export function majorToMinor(major) {
  if (major == null || major === "" || Number.isNaN(Number(major))) return null;
  return Math.round(Number(major) * MINOR_PER_MAJOR);
}

export function formatMoney(minor, currency) {
  const major = minorToMajor(minor);
  if (major == null) return "—";
  const formatted = new Intl.NumberFormat("sr-RS", {
    minimumFractionDigits: FRACTION_DIGITS,
    maximumFractionDigits: FRACTION_DIGITS,
  }).format(major);
  return currency ? `${formatted} ${currency}` : formatted;
}

export function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return new Intl.NumberFormat("sr-RS").format(Number(value));
}
