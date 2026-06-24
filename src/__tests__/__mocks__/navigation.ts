export const mockNavigate = jest.fn();
export const mockPush = jest.fn();
export const mockGoBack = jest.fn();
export const mockReset = jest.fn();
export const mockCanGoBack = jest.fn(() => true);
export const mockDispatch = jest.fn();

export const useNavigation = () => ({
  navigate: mockNavigate,
  push: mockPush,
  goBack: mockGoBack,
  reset: mockReset,
  canGoBack: mockCanGoBack,
  dispatch: mockDispatch,
});

export const useRoute = () => ({
  params: {},
});
