export const mockNavigate = jest.fn();
export const mockPopTo = jest.fn();
export const mockSetParams = jest.fn();
export const mockGoBack = jest.fn();
export const mockReset = jest.fn();
export const mockCanGoBack = jest.fn(() => true);
export const mockDispatch = jest.fn();
/** Returns an unsubscribe function, like the real `addListener`. */
export const mockAddListener = jest.fn((_event: string, _listener: (event: unknown) => void) =>
  jest.fn(),
);

export const useNavigation = () => ({
  navigate: mockNavigate,
  popTo: mockPopTo,
  setParams: mockSetParams,
  goBack: mockGoBack,
  reset: mockReset,
  canGoBack: mockCanGoBack,
  dispatch: mockDispatch,
  addListener: mockAddListener,
});

export const useRoute = () => ({
  params: {},
});
