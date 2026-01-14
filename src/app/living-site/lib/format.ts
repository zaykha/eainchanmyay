export function formatCurrency(value?: number, currency?: string) {
  if (value === undefined || value === null) return "Contact for price";
  const code = currency?.trim() || "MMK";
  const rounded = Math.round(value);

  if (code.toUpperCase() === "MMK") {
    return formatMmk(rounded);
  }

  const formatter = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  });
  return `${code.toUpperCase()} ${formatter.format(rounded)}`;
}

export function formatMmk(value: number) {
  const absValue = Math.abs(value);
  const formatter = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  });

  if (absValue >= 100000) {
    const lakhs = value / 100000;
    const decimals = lakhs >= 100 ? 0 : lakhs >= 10 ? 1 : 2;
    const lakhFormatter = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    });
    return `MMK ${lakhFormatter.format(lakhs)} Lakh`;
  }

  return `MMK ${formatter.format(value)}`;
}
