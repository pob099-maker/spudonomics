// Money and quantity formatting, with one rule: a figure that does not exist
// renders as an em dash, never as zero. Zero is a real answer and has to stay
// distinguishable from "the source never said".

const MONEY = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});

const MONEY_PRECISE = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 2,
});

export const UNKNOWN = "—";

export function money(value: number | null, precise = false): string {
  if (value === null || !Number.isFinite(value)) return UNKNOWN;
  return precise ? MONEY_PRECISE.format(value) : MONEY.format(value);
}

export function tonnes(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return UNKNOWN;
  return `${value.toFixed(1)} t/ha`;
}

export function perTonne(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return UNKNOWN;
  return `${MONEY_PRECISE.format(value)}/t`;
}
