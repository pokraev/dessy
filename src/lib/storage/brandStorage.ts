import type { SavedBrand } from '@/types/brand';

const BRANDS_KEY = 'dessy-saved-brands';
const ACTIVE_BRAND_KEY = 'dessy-active-brand-id';

export function getSavedBrands(): SavedBrand[] {
  try {
    const raw = localStorage.getItem(BRANDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBrand(brand: SavedBrand): void {
  const brands = getSavedBrands();
  const idx = brands.findIndex((b) => b.id === brand.id);
  brand.updatedAt = new Date().toISOString();
  if (idx >= 0) {
    brands[idx] = brand;
  } else {
    brands.push(brand);
  }
  localStorage.setItem(BRANDS_KEY, JSON.stringify(brands));
}

export function deleteBrand(id: string): void {
  const brands = getSavedBrands().filter((b) => b.id !== id);
  localStorage.setItem(BRANDS_KEY, JSON.stringify(brands));
  if (getActiveBrandId() === id) {
    localStorage.removeItem(ACTIVE_BRAND_KEY);
  }
}

export function getActiveBrandId(): string | null {
  return localStorage.getItem(ACTIVE_BRAND_KEY);
}

export function setActiveBrandId(id: string | null): void {
  if (id) {
    localStorage.setItem(ACTIVE_BRAND_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_BRAND_KEY);
  }
}
