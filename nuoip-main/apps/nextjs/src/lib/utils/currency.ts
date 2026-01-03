export function roundedCurrency(amountCents: number): string {
  if (!Number.isFinite(amountCents)) {
    return '0.00'
  }

  return (amountCents / 100).toFixed(2)
}
