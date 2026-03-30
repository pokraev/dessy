import type { LeafletFormatId } from '@/types/project';

export type TemplateCategory = 'Sale' | 'Event' | 'Restaurant' | 'Real Estate' | 'Corporate' | 'Fitness' | 'Beauty' | 'Education';

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  'Sale', 'Event', 'Restaurant', 'Real Estate', 'Corporate', 'Fitness', 'Beauty', 'Education'
];

export interface TemplateEntry {
  id: string;
  name: string;
  category: TemplateCategory;
  format: LeafletFormatId;
  pageCount: number;
  canvasJSON: object;       // single-page: the page canvas JSON; multi-page: first page canvas JSON
  allPagesJSON?: object[];  // multi-page only: array of canvas JSONs, one per page
}

// English templates
import saleFlyer01 from '@/templates/sale-flyer-01.json';
import saleBanner02 from '@/templates/sale-banner-02.json';
import eventPoster01 from '@/templates/event-poster-01.json';
import restaurantMenu01 from '@/templates/restaurant-menu-01.json';
import realEstateFlyer01 from '@/templates/real-estate-flyer-01.json';
import corporateBrochure01 from '@/templates/corporate-brochure-01.json';
import fitnessFlyer01 from '@/templates/fitness-flyer-01.json';
import beautySalon01 from '@/templates/beauty-salon-01.json';
import educationFlyer01 from '@/templates/education-flyer-01.json';
import eventInvitation02 from '@/templates/event-invitation-02.json';

// Bulgarian templates
import saleFlyer01Bg from '@/templates/bg/sale-flyer-01.json';
import saleBanner02Bg from '@/templates/bg/sale-banner-02.json';
import eventPoster01Bg from '@/templates/bg/event-poster-01.json';
import restaurantMenu01Bg from '@/templates/bg/restaurant-menu-01.json';
import realEstateFlyer01Bg from '@/templates/bg/real-estate-flyer-01.json';
import corporateBrochure01Bg from '@/templates/bg/corporate-brochure-01.json';
import fitnessFlyer01Bg from '@/templates/bg/fitness-flyer-01.json';
import beautySalon01Bg from '@/templates/bg/beauty-salon-01.json';
import educationFlyer01Bg from '@/templates/bg/education-flyer-01.json';
import eventInvitation02Bg from '@/templates/bg/event-invitation-02.json';

interface TemplateDefinition {
  id: string;
  name: string;
  category: TemplateCategory;
  format: LeafletFormatId;
  pageCount: number;
  canvasJSON: Record<string, object>;  // keyed by language code
}

const TEMPLATE_DEFS: TemplateDefinition[] = [
  { id: 'sale-flyer-01',        name: 'Sale Flyer',         category: 'Sale',        format: 'A4',     pageCount: 1, canvasJSON: { en: saleFlyer01, bg: saleFlyer01Bg } },
  { id: 'sale-banner-02',       name: 'Sale Banner',        category: 'Sale',        format: 'DL',     pageCount: 1, canvasJSON: { en: saleBanner02, bg: saleBanner02Bg } },
  { id: 'event-poster-01',      name: 'Event Poster',       category: 'Event',       format: 'A4',     pageCount: 1, canvasJSON: { en: eventPoster01, bg: eventPoster01Bg } },
  { id: 'restaurant-menu-01',   name: 'Restaurant Menu',    category: 'Restaurant',  format: 'A4',     pageCount: 1, canvasJSON: { en: restaurantMenu01, bg: restaurantMenu01Bg } },
  { id: 'real-estate-flyer-01', name: 'Property Listing',   category: 'Real Estate', format: 'A4',     pageCount: 1, canvasJSON: { en: realEstateFlyer01, bg: realEstateFlyer01Bg } },
  { id: 'corporate-brochure-01',name: 'Corporate Brochure', category: 'Corporate',   format: 'bifold', pageCount: 2, canvasJSON: { en: corporateBrochure01, bg: corporateBrochure01Bg } },
  { id: 'fitness-flyer-01',     name: 'Gym Promo',          category: 'Fitness',     format: 'A5',     pageCount: 1, canvasJSON: { en: fitnessFlyer01, bg: fitnessFlyer01Bg } },
  { id: 'beauty-salon-01',      name: 'Beauty Services',    category: 'Beauty',      format: 'DL',     pageCount: 1, canvasJSON: { en: beautySalon01, bg: beautySalon01Bg } },
  { id: 'education-flyer-01',   name: 'School Enrollment',  category: 'Education',   format: 'A4',     pageCount: 1, canvasJSON: { en: educationFlyer01, bg: educationFlyer01Bg } },
  { id: 'event-invitation-02',  name: 'Gala Invitation',    category: 'Event',       format: 'A5',     pageCount: 1, canvasJSON: { en: eventInvitation02, bg: eventInvitation02Bg } },
];

export function getTemplates(lang: string): TemplateEntry[] {
  return TEMPLATE_DEFS.map((def) => ({
    id: def.id,
    name: def.name,
    category: def.category,
    format: def.format,
    pageCount: def.pageCount,
    canvasJSON: def.canvasJSON[lang] ?? def.canvasJSON.en,
  }));
}

// Default export for backwards compatibility
export const TEMPLATES: TemplateEntry[] = getTemplates('en');
