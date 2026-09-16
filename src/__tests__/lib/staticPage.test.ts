import { parseStaticPage, pickLocalizedBody } from '../../utils/staticPage';

// Every line shape below is copied from the live CMS pages (2026-09-12).
describe('parseStaticPage', () => {
  it('reads a bullet-and-tab line as a bullet, without the marker', () => {
    expect(parseStaticPage('•\tUnlimited AI-generated practice quizzes')).toEqual([
      { kind: 'bullet', text: 'Unlimited AI-generated practice quizzes' },
    ]);
  });

  it.each([
    [
      '3.\tOur team will respond within 2 business days',
      '3',
      'Our team will respond within 2 business days',
    ],
    ['٣.\tفريقنا سيرد خلال يومي عمل', '٣', 'فريقنا سيرد خلال يومي عمل'],
  ])('reads number-dot-TAB as a step and keeps its number as written: %s', (line, marker, text) => {
    expect(parseStaticPage(line)).toEqual([{ kind: 'step', marker, text }]);
  });

  it('reads number-dot-SPACE as a section heading, in either numeral system', () => {
    for (const line of ['1. Acceptance of Terms', '٢. الخدمة', '١ . القبول بالشروط']) {
      expect(parseStaticPage(line)).toEqual([{ kind: 'heading', text: line }]);
    }
  });

  it("reads About Us's short unnumbered lines as headings", () => {
    expect(parseStaticPage('Our Story\nقصتنا')).toEqual([
      { kind: 'heading', text: 'Our Story' },
      { kind: 'heading', text: 'قصتنا' },
    ]);
  });

  it('keeps short lines with a colon or closing punctuation as paragraphs', () => {
    const lines = [
      'Email: support@elbooklets.com',
      'You have the right to:',
      'No hidden fees.',
      'هل ده هيساعد الطالب؟',
    ];
    expect(parseStaticPage(lines.join('\n')).map((block) => block.kind)).toEqual([
      'paragraph',
      'paragraph',
      'paragraph',
      'paragraph',
    ]);
  });

  it('keeps a long unpunctuated line as a paragraph', () => {
    const line = 'We started in Egypt and we are building for every student who feels the pressure';
    expect(parseStaticPage(line)).toEqual([{ kind: 'paragraph', text: line }]);
  });

  it('drops blank and whitespace-only lines, including CRLF endings', () => {
    expect(parseStaticPage('\r\nOur Story\r\n \r\n\t\r\n•\tResults First\r\n')).toEqual([
      { kind: 'heading', text: 'Our Story' },
      { kind: 'bullet', text: 'Results First' },
    ]);
  });

  it('drops an opening heading that repeats the page title', () => {
    expect(parseStaticPage('Refund Policy\n1. Free Trial', 'refund policy')).toEqual([
      { kind: 'heading', text: '1. Free Trial' },
    ]);
  });

  it('keeps the opening heading when it is not the title', () => {
    expect(parseStaticPage('Our Story\nText follows here.', 'About Us')).toEqual([
      { kind: 'heading', text: 'Our Story' },
      { kind: 'paragraph', text: 'Text follows here.' },
    ]);
  });
});

describe('pickLocalizedBody', () => {
  it('uses the UI language when it has content', () => {
    expect(pickLocalizedBody('ar', { en: 'English', ar: 'عربي' })).toEqual({
      text: 'عربي',
      language: 'ar',
    });
  });

  it('falls back to the other language when the preferred one is missing or blank', () => {
    expect(pickLocalizedBody('ar', { en: 'English', ar: null })).toEqual({
      text: 'English',
      language: 'en',
    });
    expect(pickLocalizedBody('en', { en: '  \n ', ar: 'عربي' })).toEqual({
      text: 'عربي',
      language: 'ar',
    });
  });

  it('returns null when neither language has content', () => {
    expect(pickLocalizedBody('en', { en: '', ar: undefined })).toBeNull();
  });
});
