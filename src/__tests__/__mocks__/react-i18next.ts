export const useTranslation = () => ({
  t: (key: string) => key,
  i18n: {
    changeLanguage: jest.fn(() => Promise.resolve()),
    language: 'en',
  },
});
