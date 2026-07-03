/**
 * City / School "add your own" mutations.
 *
 * Both use `firstOrCreate` semantics on the backend, so they're safe & idempotent:
 * an existing record is returned unchanged, otherwise a new one is created. Auth is
 * required — `tryFetchWithFallback` attaches the stored token automatically.
 *
 * Each helper resolves to the created/existing record, or `null` on any failure
 * (network error or GraphQL error), so callers can show a single "couldn't add"
 * message without inspecting the transport.
 */
import { tryFetchWithFallback } from '../config/api';
import { logError } from '../utils/logger';

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

const ADD_CITY_MUTATION = `
  mutation AddCity($governorate_id: ID!, $name: String!) {
    addCity(governorate_id: $governorate_id, name: $name) {
      id
      name_ar
      name_en
      governorate_id
    }
  }
`;

const ADD_SCHOOL_MUTATION = `
  mutation AddSchool($name: String!, $governorate: String) {
    addSchool(name: $name, governorate: $governorate) {
      id
      name
      name_en
      is_verified
    }
  }
`;

/** Create (or fetch) a city under a governorate. Returns null on failure. */
export const addCity = async (governorateId: string, name: string): Promise<AddedCity | null> => {
  const trimmed = name.trim();
  if (!governorateId || !trimmed) return null;
  try {
    const result = await tryFetchWithFallback(ADD_CITY_MUTATION, {
      governorate_id: governorateId,
      name: trimmed,
    });
    if (result?.errors?.length) {
      logError('addCity GraphQL error', result.errors);
      return null;
    }
    return result?.data?.addCity ?? null;
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
  if (!trimmed) return null;
  try {
    const result = await tryFetchWithFallback(ADD_SCHOOL_MUTATION, {
      name: trimmed,
      governorate: governorate?.trim() || null,
    });
    if (result?.errors?.length) {
      logError('addSchool GraphQL error', result.errors);
      return null;
    }
    return result?.data?.addSchool ?? null;
  } catch (err) {
    logError('addSchool request failed', err);
    return null;
  }
};
