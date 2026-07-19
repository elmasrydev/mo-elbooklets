/**
 * City / School "add your own" mutations.
 *
 * Both use `firstOrCreate` semantics on the backend, so they're safe & idempotent:
 * an existing record is returned unchanged, otherwise a new one is created. Auth is
 * required — Apollo's auth link attaches the stored token automatically.
 *
 * Each helper resolves to the created/existing record, or `null` on any failure
 * (network error or GraphQL error), so callers can show a single "couldn't add"
 * message without inspecting the transport.
 */
import { apolloClient } from '../lib/apollo';
import { AddCityDocument, AddSchoolDocument } from '../generated/graphql';
import { logError } from '../utils/logger';
import { isValidPlaceName } from '../utils/validators';

export interface AddedCity {
  id: string;
  name_ar: string;
  name_en: string;
  governorate_id: string;
}

export interface AddedSchool {
  id: string;
  name: string;
  name_en: string | null;
  is_verified: boolean;
}

/** Create (or fetch) a city under a governorate. Returns null on failure. */
export const addCity = async (governorateId: string, name: string): Promise<AddedCity | null> => {
  const trimmed = name.trim();
  if (!governorateId) return null;
  // Last line of defence (BKLT-318): the UI already hides the add row for an
  // invalid name, so reaching here means a caller skipped that check — log it,
  // otherwise the bypass is invisible.
  if (!isValidPlaceName(trimmed)) {
    logError('addCity rejected an invalid name', trimmed);
    return null;
  }
  try {
    const result = await apolloClient.mutate({
      mutation: AddCityDocument,
      variables: { governorate_id: governorateId, name: trimmed },
    });
    if (result.error) {
      logError('addCity GraphQL error', result.error);
      return null;
    }
    return result.data?.addCity ?? null;
  } catch (err) {
    logError('addCity request failed', err);
    return null;
  }
};

/** Create (or fetch) a school by name. Returns null on failure. */
export const addSchool = async (
  name: string,
  governorate?: string,
): Promise<AddedSchool | null> => {
  const trimmed = name.trim();
  if (!isValidPlaceName(trimmed)) {
    logError('addSchool rejected an invalid name', trimmed);
    return null;
  }
  try {
    const result = await apolloClient.mutate({
      mutation: AddSchoolDocument,
      variables: { name: trimmed, governorate: governorate?.trim() || null },
    });
    if (result.error) {
      logError('addSchool GraphQL error', result.error);
      return null;
    }
    return result.data?.addSchool ?? null;
  } catch (err) {
    logError('addSchool request failed', err);
    return null;
  }
};
