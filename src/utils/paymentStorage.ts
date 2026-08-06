import AsyncStorage from '@react-native-async-storage/async-storage';
import { parsePendingPayment, PendingPaymentRecord } from './paymobCheckout';
import { logError } from './logger';

/**
 * The one payment fact worth surviving a restart: a checkout that was opened but
 * never resolved on this device. It only exists after a real checkout started,
 * and it holds no card data — just the reference needed to ask the server how
 * that attempt ended. Payment *permission* is deliberately never stored.
 */
export const PENDING_PAYMENT_KEY = 'pending_payment_ref';

export const savePendingPayment = async (record: PendingPaymentRecord): Promise<void> => {
  try {
    await AsyncStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(record));
  } catch (error) {
    // Losing the breadcrumb only costs the recovery prompt, so it must not take
    // the checkout down with it.
    logError('Could not store the pending payment reference', error);
  }
};

export const readPendingPayment = async (): Promise<PendingPaymentRecord | null> => {
  try {
    return parsePendingPayment(await AsyncStorage.getItem(PENDING_PAYMENT_KEY));
  } catch (error) {
    logError('Could not read the pending payment reference', error);
    return null;
  }
};

export const clearPendingPayment = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(PENDING_PAYMENT_KEY);
  } catch (error) {
    logError('Could not clear the pending payment reference', error);
  }
};
