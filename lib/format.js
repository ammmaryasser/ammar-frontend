// Formatting helpers — EGP currency, Western digits always.

export function formatEGP(amount) {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount)} EGP`;
}

export function formatNum(n) {
  return new Intl.NumberFormat("en-US").format(n);
}
