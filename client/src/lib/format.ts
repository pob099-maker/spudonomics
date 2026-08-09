export function formatCurrency(value: number | null | undefined, opts: { maxFractionDigits?: number } = {}): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: opts.maxFractionDigits ?? 0,
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number | null | undefined, opts: { maxFractionDigits?: number } = {}): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-AU", {
    maximumFractionDigits: opts.maxFractionDigits ?? 2,
  }).format(value);
}
