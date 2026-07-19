import {
  isValidPersonName,
  isValidPlaceName,
  sanitizePersonName,
  NAME_MAX_LENGTH,
  PLACE_NAME_MIN_LENGTH,
  PERSON_NAME_MIN_LENGTH,
} from '../../utils/validators';

/** Name policy for people and user-suggested place names (BKLT-318). */
describe('isValidPlaceName', () => {
  it('accepts Arabic and English names', () => {
    expect(isValidPlaceName('القاهرة')).toBe(true);
    expect(isValidPlaceName('Cairo')).toBe(true);
    expect(isValidPlaceName('Ebrahim Sayed')).toBe(true);
    expect(isValidPlaceName('محمد عبد المعطي')).toBe(true);
  });

  it('accepts the punctuation that real Egyptian place names need', () => {
    expect(isValidPlaceName('Kafr El-Sheikh')).toBe(true);
    expect(isValidPlaceName('Sharm El-Sheikh')).toBe(true);
    expect(isValidPlaceName("El-Ma'adi")).toBe(true);
    expect(isValidPlaceName('St. Catherine')).toBe(true);
  });

  it('accepts digits — 6th of October and 10th of Ramadan are real cities', () => {
    expect(isValidPlaceName('6th of October City')).toBe(true);
    expect(isValidPlaceName('10th of Ramadan')).toBe(true);
    expect(isValidPlaceName('مدينة ٦ أكتوبر')).toBe(true);
  });

  it('accepts Arabic diacritics and accented Latin', () => {
    expect(isValidPlaceName('مُحَمَّد')).toBe(true);
    expect(isValidPlaceName('Béni Suef')).toBe(true);
  });

  it('rejects markup and query-injection shapes', () => {
    expect(isValidPlaceName('<script>alert(1)</script>')).toBe(false);
    expect(isValidPlaceName("Cairo'; DROP TABLE cities;--")).toBe(false);
    expect(isValidPlaceName('Cairo<b>')).toBe(false);
    expect(isValidPlaceName('{{7*7}}')).toBe(false);
    expect(isValidPlaceName('Cairo\\Giza')).toBe(false);
  });

  it('rejects emoji and other non-name characters', () => {
    expect(isValidPlaceName('Cairo😀')).toBe(false);
    expect(isValidPlaceName('Cairo@Giza')).toBe(false);
    expect(isValidPlaceName('Cairo/Giza')).toBe(false);
  });

  it('requires at least one letter', () => {
    expect(isValidPlaceName('123')).toBe(false);
    expect(isValidPlaceName('...')).toBe(false);
    expect(isValidPlaceName('٦٦')).toBe(false);
  });

  it('rejects punctuation at an edge or doubled up', () => {
    expect(isValidPlaceName('-Cairo')).toBe(false);
    expect(isValidPlaceName('Cairo-')).toBe(false);
    expect(isValidPlaceName('.Cairo')).toBe(false);
    expect(isValidPlaceName('Cairo--Giza')).toBe(false);
    expect(isValidPlaceName('Cairo..Giza')).toBe(false);
  });

  it('rejects a stretch or diacritic with no base letter', () => {
    expect(isValidPlaceName('ــ')).toBe(false); // tatweel only
    expect(isValidPlaceName('ٰٰ')).toBe(false); // combining marks only
  });

  it('rejects the math symbols that sit inside the Latin-1 block', () => {
    expect(isValidPlaceName('Cairo×')).toBe(false); // U+00D7
    expect(isValidPlaceName('A÷B')).toBe(false); // U+00F7
  });

  it('enforces the length bounds against trimmed input', () => {
    expect(isValidPlaceName('a'.repeat(PLACE_NAME_MIN_LENGTH - 1))).toBe(false);
    expect(isValidPlaceName(` ${'a'.repeat(PLACE_NAME_MIN_LENGTH - 1)} `)).toBe(false);
    expect(isValidPlaceName('a'.repeat(PLACE_NAME_MIN_LENGTH))).toBe(true);
    expect(isValidPlaceName('a'.repeat(NAME_MAX_LENGTH))).toBe(true);
    expect(isValidPlaceName('a'.repeat(NAME_MAX_LENGTH + 1))).toBe(false);
  });

  it('is not affected by a previous call (no leaked regex lastIndex)', () => {
    // A /g regex reused with .test() alternates true/false across calls — guard
    // against that regression by asserting the same input twice.
    expect(isValidPlaceName('Cairo<b>')).toBe(false);
    expect(isValidPlaceName('Cairo<b>')).toBe(false);
    expect(isValidPlaceName('Cairo')).toBe(true);
    expect(isValidPlaceName('Cairo')).toBe(true);
  });
});

// A person's name differs from a place name in exactly one way: no digits.
// "6th of October City" is a city; "Ebrahim2" is not a name.
describe('isValidPersonName', () => {
  it('accepts ordinary Arabic and English names', () => {
    expect(isValidPersonName('Ebrahim Sayed')).toBe(true);
    expect(isValidPersonName('محمد عبد المعطي')).toBe(true);
    expect(isValidPersonName("Sarah O'Brien")).toBe(true);
    expect(isValidPersonName('Jean-Luc')).toBe(true);
  });

  it('rejects digits, unlike a place name', () => {
    expect(isValidPersonName('123')).toBe(false);
    expect(isValidPersonName('Ebrahim2')).toBe(false);
    expect(isValidPersonName('محمد٣')).toBe(false);
    // …the same strings are fine for a city.
    expect(isValidPlaceName('6th of October City')).toBe(true);
  });

  it('rejects markup and letter-less input', () => {
    expect(isValidPersonName('<script>alert(1)</script>')).toBe(false);
    expect(isValidPersonName('...')).toBe(false);
    expect(isValidPersonName('Ali😀')).toBe(false);
  });

  it('requires at least the person-name minimum', () => {
    expect(isValidPersonName('a'.repeat(PERSON_NAME_MIN_LENGTH - 1))).toBe(false);
    expect(isValidPersonName('a'.repeat(PERSON_NAME_MIN_LENGTH))).toBe(true);
  });
});

describe('sanitizePersonName', () => {
  it('strips disallowed characters, digits included', () => {
    expect(sanitizePersonName('<script>Ali</script>')).toBe('scriptAliscript');
    expect(sanitizePersonName('Ali😀')).toBe('Ali');
    expect(sanitizePersonName('محمد@123')).toBe('محمد');
  });

  it('keeps hyphens, apostrophes and periods', () => {
    expect(sanitizePersonName('Kafr El-Sheikh')).toBe('Kafr El-Sheikh');
    expect(sanitizePersonName("El-Ma'adi")).toBe("El-Ma'adi");
    expect(sanitizePersonName('St. Catherine')).toBe('St. Catherine');
  });

  it('collapses runs of whitespace but keeps a single trailing space typable', () => {
    expect(sanitizePersonName('Kafr   El   Sheikh')).toBe('Kafr El Sheikh');
    expect(sanitizePersonName('Kafr ')).toBe('Kafr ');
  });

  it('caps length', () => {
    expect(sanitizePersonName('a'.repeat(200))).toHaveLength(NAME_MAX_LENGTH);
  });
});
