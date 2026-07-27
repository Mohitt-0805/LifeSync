/**
 * Formats a numeric amount into Indian Rupee (INR) format (e.g. ₹1,50,000 or ₹649)
 * @param {number|string} amount - Raw numeric value
 * @param {Object} options - Formatting options
 * @param {boolean} options.showSymbol - Include ₹ symbol prefix (default: true)
 * @param {number} options.maximumFractionDigits - Max decimal places (default: 2)
 * @param {boolean} options.compact - Compact notation e.g. ₹1.5L / ₹2.5K (default: false)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, options = {}) {
  const { showSymbol = true, maximumFractionDigits = 2, compact = false } = options;

  const num = Number(amount);
  if (isNaN(num)) {
    return showSymbol ? "₹0" : "0";
  }

  if (compact && Math.abs(num) >= 100000) {
    const lakhs = num / 100000;
    return `${showSymbol ? "₹" : ""}${lakhs.toFixed(1)}L`;
  }

  if (compact && Math.abs(num) >= 1000) {
    const thousands = num / 1000;
    return `${showSymbol ? "₹" : ""}${thousands.toFixed(1)}K`;
  }

  try {
    const formatted = new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: num % 1 === 0 ? 0 : maximumFractionDigits,
      minimumFractionDigits: 0,
    }).format(num);

    return showSymbol ? `₹${formatted}` : formatted;
  } catch (err) {
    // Fallback standard formatting
    const formatted = num.toLocaleString("en-IN");
    return showSymbol ? `₹${formatted}` : formatted;
  }
}

export const CURRENCY_SYMBOL = "₹";
export default formatCurrency;
