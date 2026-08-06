import {
  derivePaymentPhase,
  isExternalScheme,
  isPaymobReturnUrl,
  parsePendingPayment,
  POLL_MAX_ATTEMPTS,
  referenceFromReturnUrl,
} from '../../utils/paymobCheckout';

describe('isPaymobReturnUrl', () => {
  // The host differs per environment and the path carries the web app's locale,
  // so only the path segment can be relied on.
  it.each([
    'https://elbooklets.com/en/checkout/paymob/return?ref=els-pi-1',
    'https://prs.elbooklets.com/ar/checkout/paymob/return',
    'http://demo.elbooklets.com/checkout/paymob/return?ref=x&other=1',
    'https://elbooklets.com/en/checkout/paymob/return#done',
  ])('recognizes %s', (url) => {
    expect(isPaymobReturnUrl(url)).toBe(true);
  });

  it.each([
    'https://accept.paymob.com/unifiedcheckout/?publicKey=x',
    'https://elbooklets.com/en/checkout',
    'https://elbooklets.com/en/checkout/paymob',
    '',
    null,
    undefined,
  ])('does not recognize %s', (url) => {
    expect(isPaymobReturnUrl(url as string)).toBe(false);
  });
});

describe('referenceFromReturnUrl', () => {
  it('reads the reference from the query', () => {
    expect(referenceFromReturnUrl('https://x.com/checkout/paymob/return?ref=els-pi-abc')).toBe(
      'els-pi-abc',
    );
  });

  it('reads it when other params come first', () => {
    expect(referenceFromReturnUrl('https://x.com/r?lang=ar&ref=els-pi-abc')).toBe('els-pi-abc');
  });

  it('ignores a trailing fragment', () => {
    expect(referenceFromReturnUrl('https://x.com/r?ref=els-pi-abc#done')).toBe('els-pi-abc');
  });

  it.each(['https://x.com/checkout/paymob/return', 'https://x.com/r?ref=', '', null])(
    'returns null for %s',
    (url) => {
      expect(referenceFromReturnUrl(url as string)).toBeNull();
    },
  );
});

describe('isExternalScheme', () => {
  // 3-D Secure steps and wallet apps hand off through their own schemes; the
  // webview cannot render those.
  it.each(['myapp://pay', 'intent://wallet#Intent;end', 'tel:123'])(
    'treats %s as external',
    (url) => {
      expect(isExternalScheme(url)).toBe(true);
    },
  );

  it.each(['https://accept.paymob.com/x', 'http://x.com', 'about:blank', '', null])(
    'keeps %s in the webview',
    (url) => {
      expect(isExternalScheme(url as string)).toBe(false);
    },
  );
});

describe('derivePaymentPhase', () => {
  it('succeeds on completed', () => {
    expect(derivePaymentPhase('completed', 1)).toBe('success');
  });

  it('fails on failed, however early', () => {
    expect(derivePaymentPhase('failed', 1)).toBe('failed');
  });

  it('keeps confirming while attempts remain', () => {
    expect(derivePaymentPhase('pending', 1)).toBe('confirming');
    expect(derivePaymentPhase('pending', POLL_MAX_ATTEMPTS - 1)).toBe('confirming');
  });

  // Running out of attempts is not a failure: the webhook may just be late, and
  // pay-later methods resolve hours afterwards.
  it('goes soft-pending once the window is used up', () => {
    expect(derivePaymentPhase('pending', POLL_MAX_ATTEMPTS)).toBe('still_pending');
  });

  // An unknown reference is treated as pending rather than an error.
  it('treats a null status as pending', () => {
    expect(derivePaymentPhase(null, 1)).toBe('confirming');
    expect(derivePaymentPhase(null, POLL_MAX_ATTEMPTS)).toBe('still_pending');
  });
});

describe('parsePendingPayment', () => {
  it('reads a stored record', () => {
    const raw = JSON.stringify({ reference: 'els-pi-1', planLabel: 'Full term', startedAt: 42 });
    expect(parsePendingPayment(raw)).toEqual({
      reference: 'els-pi-1',
      planLabel: 'Full term',
      startedAt: 42,
    });
  });

  it('fills in missing optional fields', () => {
    expect(parsePendingPayment(JSON.stringify({ reference: 'els-pi-1' }))).toEqual({
      reference: 'els-pi-1',
      planLabel: '',
      startedAt: 0,
    });
  });

  // A corrupt entry must not strand the student behind a recovery prompt for a
  // payment that can never be confirmed.
  it.each([
    null,
    '',
    'not json',
    '{}',
    JSON.stringify({ reference: '' }),
    JSON.stringify({ reference: 5 }),
  ])('returns null for %s', (raw) => {
    expect(parsePendingPayment(raw as string | null)).toBeNull();
  });
});
