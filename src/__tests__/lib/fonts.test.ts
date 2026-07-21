import { isArabicText, resolveFontFamily, ARABIC_FONT } from '../../config/fonts';

// BKLT-312: Arabic text must resolve the Arabic family regardless of the app's
// UI language — Lexend has no Arabic glyphs, so getting this wrong renders
// tofu/system-font for Arabic names and labels (screenshot i1).
describe('isArabicText', () => {
  it.each([
    ['أحمد محمد', true],
    ['تمت المشاركة مع زملائك', true],
    ['ﻣﺤﻤﺪ', true], // presentation forms
    ['Khaled agamy', false],
    ['Review', false],
    ['Malek 1', false],
  ])('detects %s -> %s', (text, expected) => {
    expect(isArabicText(text)).toBe(expected);
  });

  it('treats empty/absent text as non-Arabic', () => {
    expect(isArabicText('')).toBe(false);
    expect(isArabicText(undefined)).toBe(false);
    expect(isArabicText(null)).toBe(false);
  });
});

describe('resolveFontFamily', () => {
  it('returns a weight-suffixed Arabic family for Arabic text', () => {
    expect(resolveFontFamily('700', true)).toBe(`${ARABIC_FONT}-Bold`);
    expect(resolveFontFamily('600', true)).toBe(`${ARABIC_FONT}-SemiBold`);
    expect(resolveFontFamily('normal', true)).toBe(`${ARABIC_FONT}-Regular`);
  });

  it('clamps weights above Bold to the heaviest shipped face', () => {
    expect(resolveFontFamily('900', true)).toBe(`${ARABIC_FONT}-Bold`);
  });

  it('never returns an Arabic family for Latin text', () => {
    expect(resolveFontFamily('700', false)).not.toContain(ARABIC_FONT);
  });
});
