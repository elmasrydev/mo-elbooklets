import { renderHook } from '@testing-library/react-native';

import { useSubjectTextAlign } from '../../hooks/useSubjectTextAlign';

const mockIsRTL = { current: true };
jest.mock('../../context/LanguageContext', () => ({
  useLanguage: () => ({ isRTL: mockIsRTL.current }),
}));

// The backend often omits Subject.language. Treating that as English made
// Arabic content mismatch the Arabic UI, so quiz/study screens rendered Arabic
// lesson names against the wrong edge.
describe('useSubjectTextAlign', () => {
  const render = (language?: string | null, sample?: string | null) =>
    renderHook(() => useSubjectTextAlign(language, sample)).result.current;

  describe('in an Arabic (RTL) interface', () => {
    beforeEach(() => (mockIsRTL.current = true));

    it('treats an unlabelled Arabic subject as Arabic, not English', () => {
      expect(render(null, 'دراسات إجتماعية')).toMatchObject({
        contentAlign: 'left',
        contentRowDirection: 'row',
        isContentRTL: false,
      });
    });

    it('still flags English content as a direction mismatch', () => {
      expect(render(null, 'Social Studies')).toMatchObject({
        contentAlign: 'right',
        contentRowDirection: 'row-reverse',
        isContentRTL: true,
      });
    });

    it('prefers an explicit language over the sample text', () => {
      expect(render('en', 'دراسات إجتماعية').contentAlign).toBe('right');
      expect(render('ar', 'Social Studies').contentAlign).toBe('left');
    });

    it('falls back to the app direction when nothing identifies the content', () => {
      expect(render(null, null).contentAlign).toBe('left');
    });
  });

  describe('in an English (LTR) interface', () => {
    beforeEach(() => (mockIsRTL.current = false));

    it('flags an unlabelled Arabic subject as a mismatch', () => {
      expect(render(null, 'دراسات إجتماعية')).toMatchObject({
        contentAlign: 'right',
        contentRowDirection: 'row-reverse',
      });
    });

    it('leaves English content on the default path', () => {
      expect(render(null, 'Social Studies').contentAlign).toBe('left');
    });
  });
});
