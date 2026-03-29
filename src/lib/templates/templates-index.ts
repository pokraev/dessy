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

export const TEMPLATES: TemplateEntry[] = [
  { id: 'sale-flyer-01',       name: 'Sale Flyer',        category: 'Sale',        format: 'A4',     pageCount: 1, canvasJSON: saleFlyer01 },
  { id: 'sale-banner-02',      name: 'Sale Banner',       category: 'Sale',        format: 'DL',     pageCount: 1, canvasJSON: saleBanner02 },
  { id: 'event-poster-01',     name: 'Event Poster',      category: 'Event',       format: 'A4',     pageCount: 1, canvasJSON: eventPoster01 },
  { id: 'restaurant-menu-01',  name: 'Restaurant Menu',   category: 'Restaurant',  format: 'A4',     pageCount: 1, canvasJSON: restaurantMenu01 },
  { id: 'real-estate-flyer-01',name: 'Property Listing',  category: 'Real Estate', format: 'A4',     pageCount: 1, canvasJSON: realEstateFlyer01 },
  { id: 'corporate-brochure-01',name: 'Corporate Brochure',category: 'Corporate',  format: 'bifold', pageCount: 2, canvasJSON: corporateBrochure01 },
  { id: 'fitness-flyer-01',    name: 'Gym Promo',         category: 'Fitness',     format: 'A5',     pageCount: 1, canvasJSON: fitnessFlyer01 },
  { id: 'beauty-salon-01',     name: 'Beauty Services',   category: 'Beauty',      format: 'DL',     pageCount: 1, canvasJSON: beautySalon01 },
  { id: 'education-flyer-01',  name: 'School Enrollment', category: 'Education',   format: 'A4',     pageCount: 1, canvasJSON: educationFlyer01 },
  { id: 'event-invitation-02', name: 'Gala Invitation',   category: 'Event',       format: 'A5',     pageCount: 1, canvasJSON: eventInvitation02 },
];
