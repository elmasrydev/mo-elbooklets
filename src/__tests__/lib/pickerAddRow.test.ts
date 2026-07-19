import { shouldOfferAddNew, shouldWarnInvalidName } from '../../utils/pickerAddRow';

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

  // BKLT-318 — the typed text becomes a row other users will see, so it has to
  // pass the shared name policy before we offer to create it. The policy itself
  // is covered in nameValidation.test.ts; one representative input is enough to
  // pin that this function defers to it.
  it('does not offer add for text outside the name policy', () => {
    expect(shouldOfferAddNew(cities, '<script>alert(1)</script>')).toBe(false);
  });
});

describe('shouldWarnInvalidName', () => {
  const cities = [{ id: '1', name: 'Cairo', name_ar: 'القاهرة', name_en: 'Cairo' }];

  it('warns when the typed text is long enough but not a valid name', () => {
    expect(shouldWarnInvalidName(cities, '<script>')).toBe(true);
    expect(shouldWarnInvalidName(cities, 'Newtown😀')).toBe(true);
  });

  it('stays quiet while the user is still typing', () => {
    expect(shouldWarnInvalidName(cities, '')).toBe(false);
    expect(shouldWarnInvalidName(cities, '<')).toBe(false);
  });

  it('stays quiet for valid text', () => {
    expect(shouldWarnInvalidName(cities, 'Newtown')).toBe(false);
  });

  // A row created before BKLT-318 can hold a name the policy now rejects. The
  // user can still select it, so telling them their input is malformed while
  // the matching row sits right above would be wrong.
  it('stays quiet when a legacy row already has that exact (policy-invalid) name', () => {
    const legacy = [{ id: '7', name: 'Cairo/Giza', name_ar: 'Cairo/Giza', name_en: 'Cairo/Giza' }];
    expect(shouldWarnInvalidName(legacy, 'Cairo/Giza')).toBe(false);
    // …but an unmatched policy-invalid string still warns.
    expect(shouldWarnInvalidName(legacy, 'Cairo/Qalyub')).toBe(true);
  });
});
