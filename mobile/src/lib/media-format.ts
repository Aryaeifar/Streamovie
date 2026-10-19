import type {Source} from '../types/media';

export function asText(...values: unknown[]): string {
  const value = values.find(x => (typeof x === 'string' && x.trim()) || typeof x === 'number');
  return value == null ? '' : String(value).trim();
}

export function sourcesFrom(raw: Record<string, any>): Source[] {
  const values = Array.isArray(raw.sources) ? raw.sources : [];
  return values.flatMap((source: Record<string, any>) => {
    const url = asText(source?.url, source?.link, source?.src);
    const quality = asText(source?.quality, source?.resolution, source?.label) || 'Download';
    if (!url || /trailer|teaser|تیزر/i.test(quality)) return [];
    return [{quality, url}];
  });
}

export function parseDescription(value: string): {overview: string; fields: {label: string; value: string}[]} {
  const fields: {label: string; value: string}[] = [];
  let overview = '';
  const knownLabels: Record<string, string> = {
    'نام پارسی': 'Persian title', 'سایر عناوین': 'Other titles', 'کارگردان': 'Director',
    'ستارگان': 'Cast', 'پخش از شبکه': 'Network', 'وضعیت سریال': 'Status',
  };
  for (const part of value.replace(/\r\n/g, '\n').split(/\n\s*\n/)) {
    const separator = part.indexOf(':');
    if (separator < 0) {
      if (!overview && part.trim()) overview = part.trim();
      continue;
    }
    const label = part.slice(0, separator).replace(/\s+/g, ' ').trim();
    const text = part.slice(separator + 1).replace(/[ \t]+/g, ' ').trim();
    if (!text) continue;
    if (/خلاصه/.test(label)) overview = text;
    else if (knownLabels[label]) fields.push({label: knownLabels[label], value: text});
  }
  return {overview, fields};
}
