import { shouldOfferAddNew } from '../../utils/pickerAddRow';

describe('shouldOfferAddNew', () => {
  const cities = [
    { id: '1', name: 'Cairo', name_ar: 'القاهرة', name_en: 'Cairo' },
    { id: '2', name: 'Giza', name_ar: 'الجيزة', name_en: 'Giza' },
  ];

  it('does not offer add for input shorter than 2 chars (after trim)', () => {
    expect(shouldOfferAddNew(cities, '')).toBe(false);
    expect(shouldOfferAddNew(cities, 'a')).toBe(false);
    expect(shouldOfferAddNew(cities, '   ')).toBe(false);
  });

  it('offers add when nothing matches the typed text', () => {
    expect(shouldOfferAddNew(cities, 'Newtown')).toBe(true);
    expect(shouldOfferAddNew(cities, 'حي جديد')).toBe(true);
  });

  it('does NOT offer add when an exact name matches (case-insensitive, trimmed)', () => {
    expect(shouldOfferAddNew(cities, 'Cairo')).toBe(false);
    expect(shouldOfferAddNew(cities, '  cairo ')).toBe(false);
    expect(shouldOfferAddNew(cities, 'القاهرة')).toBe(false);
    expect(shouldOfferAddNew(cities, 'Giza')).toBe(false);
  });

  it('matches against name_ar or name_en, not just the display name', () => {
    const data = [{ id: '9', name: 'العاصمة', name_ar: 'العاصمة', name_en: 'Capital' }];
    expect(shouldOfferAddNew(data, 'Capital')).toBe(false);
    expect(shouldOfferAddNew(data, 'العاصمة')).toBe(false);
    expect(shouldOfferAddNew(data, 'Other')).toBe(true);
  });

  it('offers add against an empty list when the input is long enough', () => {
    expect(shouldOfferAddNew([], 'Anything')).toBe(true);
    expect(shouldOfferAddNew([], 'x')).toBe(false);
  });

  it('handles items with missing name fields without throwing', () => {
    const data = [{ id: '1' }, { id: '2', name: 'Real' }];
    expect(shouldOfferAddNew(data, 'Real')).toBe(false);
    expect(shouldOfferAddNew(data, 'Ghost')).toBe(true);
  });

  it('offers add when the typed text is only a partial (substring) match', () => {
    // "Cai" is a prefix of "Cairo" but not an exact match → still addable.
    expect(shouldOfferAddNew(cities, 'Cai')).toBe(true);
  });
});
