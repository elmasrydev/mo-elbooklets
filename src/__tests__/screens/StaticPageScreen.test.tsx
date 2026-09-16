import React from 'react';
import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '../helpers/renderWithProviders';
import StaticPageScreen from '../../screens/StaticPageScreen';
import { StaticPageDocument } from '../../generated/graphql';

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  const navigationMock = jest.requireActual('../__mocks__/navigation');
  return {
    ...actual,
    useNavigation: navigationMock.useNavigation,
    useRoute: () => ({ params: { slug: 'refund-policy' } }),
  };
});

const request = { query: StaticPageDocument, variables: { slug: 'refund-policy' } };

// Must mirror StaticPage's full selection set, or Apollo drops the result.
const page = (overrides = {}) => ({
  __typename: 'Page',
  id: '6',
  slug: 'refund-policy',
  is_active: true,
  content_en: '1. Free Trial — No Charge\n•\tYou were charged in error',
  content_ar: '١. الفترة التجريبية — مجانية تماماً',
  ...overrides,
});

describe('StaticPageScreen', () => {
  it('shows the page in the UI language', async () => {
    renderWithProviders(<StaticPageScreen />, {
      apolloMocks: [{ request, result: { data: { page: page() } } }],
    });

    expect(await screen.findByText('1. Free Trial — No Charge')).toBeTruthy();
    expect(screen.getByText('You were charged in error')).toBeTruthy();
    expect(screen.queryByText('١. الفترة التجريبية — مجانية تماماً')).toBeNull();
  });

  // Demo has no refund-policy page at all; an unpublished page must not leak.
  it.each([
    ['the environment has no such page', null],
    ['the page is unpublished', page({ is_active: false })],
  ])('says the page is unavailable when %s', async (_case, payload) => {
    renderWithProviders(<StaticPageScreen />, {
      apolloMocks: [{ request, result: { data: { page: payload } } }],
    });

    expect(await screen.findByText('static_pages.unavailable')).toBeTruthy();
  });

  it('offers a retry when the page cannot be loaded', async () => {
    renderWithProviders(<StaticPageScreen />, {
      apolloMocks: [{ request, error: new Error('Network request failed') }],
    });

    expect(await screen.findByText('static_pages.load_error')).toBeTruthy();
  });
});
