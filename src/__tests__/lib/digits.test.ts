import { normalizeDigits, digitsOnly } from '../../utils/digits';

describe('normalizeDigits', () => {
  it('converts Arabic-Indic digits to ASCII', () => {
    expect(normalizeDigits('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789');
  });

  it('converts Extended Arabic-Indic (Persian/Urdu) digits to ASCII', () => {
    expect(normalizeDigits('۰۱۲۳۴۵۶۷۸۹')).toBe('0123456789');
  });

  it('leaves ASCII digits and other characters untouched', () => {
    expect(normalizeDigits('01039890331')).toBe('01039890331');
    expect(normalizeDigits('+2 (010)')).toBe('+2 (010)');
    expect(normalizeDigits('')).toBe('');
  });

  it('normalizes digits inside mixed Arabic text', () => {
    expect(normalizeDigits('الرمز ٢٥٨٩٦٣')).toBe('الرمز 258963');
  });

  it('is stable across repeated calls on the shared global regexes', () => {
    expect(normalizeDigits('٦٥٤٣٢١')).toBe('654321');
    expect(normalizeDigits('٦٥٤٣٢١')).toBe('654321');
  });
});

describe('digitsOnly', () => {
  it('keeps an Arabic-Indic OTP code instead of deleting it', () => {
    // The bug this exists to prevent: a bare replace(/[^0-9]/g, '') returns ''.
    expect(digitsOnly('٢٥٨٩٦٣')).toBe('258963');
  });

  it('strips separators and letters from a typed mobile number', () => {
    expect(digitsOnly('+2 010-3989 0331')).toBe('201039890331');
    expect(digitsOnly('٠١٠ ٣٩٨٩ ٠٣٣١')).toBe('01039890331');
  });

  it('returns an empty string when there is nothing numeric', () => {
    expect(digitsOnly('abc')).toBe('');
    expect(digitsOnly('')).toBe('');
  });
});
