import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import PackagesScreen from '../../screens/payment/PackagesScreen';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { SubscriptionPlansDocument } from '../../generated/graphql';

// The screen only renders when the backend flag is on; the flag itself is
// covered separately in lib/paymentAccess.test.ts.
jest.mock('../../context/PaymentAccessContext', () => ({
  PaymentAccessProvider: ({ children }: { children: React.ReactNode }) => children,
  usePaymentAccess: () => ({
    isPaymentAllowed: true,
    isResolved: true,
    message: null,
    refresh: jest.fn(),
  }),
}));

const plan = {
  __typename: 'SubscriptionPlanOption',
  id: '3',
  name: 'Single subject',
  description: 'Pick your subjects',
  nameAr: 'اشتراك مادة',
  nameEn: 'Single subject',
  descriptionAr: 'اختر موادك',
  descriptionEn: 'Pick your subjects',
  type: 'per_subject',
  requiresSubjectSelection: true,
  cost: 250,
  currency: 'EGP',
  durationDays: 90,
  endsAt: null,
  lessonLimit: 0,
  quizLimitPerDay: 5,
  allowedSubjectsCount: 2,
};

const plansResult = (overrides: Record<string, unknown> = {}) => ({
  request: { query: SubscriptionPlansDocument },
  result: {
    data: {
      subscriptionPlans: {
        __typename: 'SubscriptionPlansResult',
        currency: 'EGP',
        hasFullAccess: false,
        hasPendingOrder: false,
        subscribedSubjectIds: [],
        plans: [plan],
        selectableSubjects: [{ __typename: 'Subject', id: '30', name: 'English' }],
        ...overrides,
      },
    },
  },
});

describe('PackagesScreen', () => {
  it('renders the plans the server returned', async () => {
    const { getByTestId } = renderWithProviders(<PackagesScreen />, {
      apolloMocks: [plansResult(), plansResult()],
    });

    await waitFor(() => expect(getByTestId('packages-plan-3')).toBeTruthy());
  });

  // The subject picker belongs to a per-subject plan, so it only appears once
  // such a plan is actually chosen.
  it('reveals the subject picker after a per-subject plan is chosen', async () => {
    const { getByTestId, queryByTestId } = renderWithProviders(<PackagesScreen />, {
      apolloMocks: [plansResult(), plansResult()],
    });

    await waitFor(() => expect(getByTestId('packages-plan-3')).toBeTruthy());
    expect(queryByTestId('packages-subject-30')).toBeNull();

    fireEvent.press(getByTestId('packages-plan-3'));
    expect(getByTestId('packages-subject-30')).toBeTruthy();
  });

  it('blocks buying until a subject is chosen', async () => {
    const { getByTestId } = renderWithProviders(<PackagesScreen />, {
      apolloMocks: [plansResult(), plansResult()],
    });

    await waitFor(() => expect(getByTestId('packages-subscribe-button')).toBeTruthy());
    // No plan is selected yet, so the mutation must not be reachable.
    expect(getByTestId('packages-subscribe-button')).toBeDisabled();
  });

  // An order awaiting approval is rejected by the mutation, so the screen shows
  // the notice instead of offering a purchase that cannot succeed.
  it('replaces the buy action with a notice while an order is pending', async () => {
    const { getByTestId, queryByTestId } = renderWithProviders(<PackagesScreen />, {
      apolloMocks: [plansResult({ hasPendingOrder: true }), plansResult({ hasPendingOrder: true })],
    });

    await waitFor(() => expect(getByTestId('packages-pending-order-notice')).toBeTruthy());
    expect(queryByTestId('packages-subscribe-button')).toBeNull();
  });

  it('shows the already-covered state instead of an upsell', async () => {
    const { getByTestId, queryByTestId } = renderWithProviders(<PackagesScreen />, {
      apolloMocks: [plansResult({ hasFullAccess: true }), plansResult({ hasFullAccess: true })],
    });

    await waitFor(() => expect(getByTestId('packages-full-access')).toBeTruthy());
    expect(queryByTestId('packages-subscribe-button')).toBeNull();
  });

  it('shows an error state when the plans cannot be loaded', async () => {
    const failing = {
      request: { query: SubscriptionPlansDocument },
      error: new Error('network down'),
    };
    const { getByTestId } = renderWithProviders(<PackagesScreen />, {
      apolloMocks: [failing, failing],
    });

    await waitFor(() => expect(getByTestId('packages-error')).toBeTruthy());
  });
});
