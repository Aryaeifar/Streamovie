import type {Locale} from '../types/media';
export const tr = (locale: Locale, en: string, fa: string) => locale === 'fa' ? fa : en;
