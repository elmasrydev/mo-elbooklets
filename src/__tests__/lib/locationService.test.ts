import { addCity, addSchool } from '../../services/locationService';
import { tryFetchWithFallback } from '../../config/api';
import { NAME_MAX_LENGTH } from '../../utils/validators';

jest.mock('../../config/api', () => ({ tryFetchWithFallback: jest.fn() }));
jest.mock('../../utils/logger', () => ({ logError: jest.fn() }));

const mockFetch = tryFetchWithFallback as jest.Mock;

describe('locationService', () => {
  // resetAllMocks, not clearAllMocks: clearAllMocks leaves any unconsumed
  // mockResolvedValueOnce queued, so a test that short-circuits before calling
  // the API silently hands its queued value to the next test.
  beforeEach(() => jest.resetAllMocks());

  describe('addCity', () => {
    it('returns the created city and trims the name', async () => {
      const city = { id: '142', name_ar: 'حي', name_en: 'حي', governorate_id: '5' };
      mockFetch.mockResolvedValueOnce({ data: { addCity: city } });

      const res = await addCity('5', '  حي  ');

      expect(res).toEqual(city);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('addCity'), {
        governorate_id: '5',
        name: 'حي',
      });
    });

    it('returns null without calling the API when governorate or name is missing', async () => {
      expect(await addCity('', 'Newtown')).toBeNull();
      expect(await addCity('5', '   ')).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    // BKLT-318 — the UI hides the add row for these, so this is the backstop for
    // a caller that skips that check.
    it('returns null without calling the API for a name outside the name policy', async () => {
      expect(await addCity('5', '<script>alert(1)</script>')).toBeNull();
      expect(await addCity('5', "Newtown'; DROP TABLE cities;--")).toBeNull();
      expect(await addCity('5', 'a')).toBeNull();
      expect(await addCity('5', 'a'.repeat(NAME_MAX_LENGTH + 1))).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('returns null on GraphQL errors', async () => {
      mockFetch.mockResolvedValueOnce({ errors: [{ message: 'boom' }] });
      expect(await addCity('5', 'Newtown')).toBeNull();
    });

    it('returns null when the request throws', async () => {
      mockFetch.mockRejectedValueOnce(new Error('network'));
      expect(await addCity('5', 'Newtown')).toBeNull();
    });
  });

  describe('addSchool', () => {
    it('returns the created school and forwards a trimmed governorate', async () => {
      const school = { id: '9', name: 'مدرسة', name_en: null, is_verified: false };
      mockFetch.mockResolvedValueOnce({ data: { addSchool: school } });

      const res = await addSchool('  مدرسة  ', '  القاهرة  ');

      expect(res).toEqual(school);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('addSchool'), {
        name: 'مدرسة',
        governorate: 'القاهرة',
      });
    });

    it('sends governorate: null when omitted', async () => {
      mockFetch.mockResolvedValueOnce({
        data: { addSchool: { id: '9', name: 'Al Nasr', name_en: null, is_verified: false } },
      });
      await addSchool('Al Nasr');
      expect(mockFetch).toHaveBeenCalledWith(expect.any(String), {
        name: 'Al Nasr',
        governorate: null,
      });
    });

    it('returns null without calling the API for an empty name', async () => {
      expect(await addSchool('   ')).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('returns null without calling the API for a name outside the name policy', async () => {
      expect(await addSchool('<script>alert(1)</script>')).toBeNull();
      expect(await addSchool('Al Nasr😀')).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('returns null on GraphQL errors', async () => {
      mockFetch.mockResolvedValueOnce({ errors: [{ message: 'x' }] });
      expect(await addSchool('Al Nasr')).toBeNull();
    });

    it('returns null when the request throws', async () => {
      mockFetch.mockRejectedValueOnce(new Error('network'));
      expect(await addSchool('Al Nasr')).toBeNull();
    });
  });
});
