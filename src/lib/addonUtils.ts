// ADDONS_CART_MODEL_2026_08_04
import { SelectedAddon } from '../types';

export const EXCLUDED_CUSTOMIZATION_CATEGORIES = [
  'Adicionais',
  'Bebidas',
  'Sucos',
  'Cremes',
  'Sobremesas'
];

export function isCategoryExcludedFromCustomization(category?: string): boolean {
  if (!category) return false;
  return EXCLUDED_CUSTOMIZATION_CATEGORIES.includes(category.trim());
}

export function getBaseUnitPrice(item: { price: number; selectedOption?: { price: number } }): number {
  return item.selectedOption ? item.selectedOption.price : item.price;
}

export function getAddonsUnitTotal(selectedAddons?: SelectedAddon[]): number {
  if (!selectedAddons || selectedAddons.length === 0) return 0;
  return selectedAddons.reduce((sum, a) => sum + (a.price * a.quantity), 0);
}

export function getConfiguredUnitPrice(item: { price: number; selectedOption?: { price: number }; selectedAddons?: SelectedAddon[] }): number {
  return getBaseUnitPrice(item) + getAddonsUnitTotal(item.selectedAddons);
}

export function getItemLineTotal(item: { quantity: number; price: number; selectedOption?: { price: number }; selectedAddons?: SelectedAddon[] }): number {
  return getConfiguredUnitPrice(item) * item.quantity;
}

export function generateCartItemId(
  productId: string,
  selectedOption?: { name: string; price: number },
  selectedAddons?: SelectedAddon[]
): string {
  let id = productId;
  if (selectedOption) {
    id += `-opt-${selectedOption.name}`;
  }
  if (selectedAddons && selectedAddons.length > 0) {
    const activeAddons = selectedAddons
      .filter(a => a.quantity > 0)
      .sort((a, b) => a.id.localeCompare(b.id));
    if (activeAddons.length > 0) {
      const addonsStr = activeAddons.map(a => `${a.id}:${a.quantity}`).join(',');
      id += `-addons-[${addonsStr}]`;
    }
  }
  return id;
}
