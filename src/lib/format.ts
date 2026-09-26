export function parseQuantityInput(value: string): number | null {
  return value.trim() ? parseFloat(value.replace(',', '.')) : null;
}
