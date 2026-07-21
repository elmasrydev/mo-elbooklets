import { addCity, addSchool } from '../../services/locationService';
import { apolloClient } from '../../lib/apollo';
import { NAME_MAX_LENGTH } from '../../utils/validators';

jest.mock('../../lib/apollo', () => ({ apolloClient: { mutate: jest.fn() } }));
jest.mock('../../utils/logger', () => ({ logError: jest.fn() }));

const mockMutate = apolloClient.mutate as jest.Mock;

describe('locationService', () => {
  // resetAllMocks, not clearAllMocks: clearAllMocks leaves any unconsumed
  // mockResolvedValueOnce queued, so a test that short-circuits before calling
  // the API silently hands its queued value to the next test.
  beforeEach(() => jest.resetAllMocks());

  describe('addCity', () => {
    it('returns the created city and trims the name', async () => {
      const city = { id: '142', name_ar: 'حي', name_en: 'حي', governorate_id: '5' };
      mockMutate.mockResolvedValueOnce({ data: { addCity: city } });

      const res = await addCity('5', '  حي  ');

      expect(res).toEqual(city);
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { governorate_id: '5', name: 'حي' } }),
      );
    });

    it('returns null without calling the API when governorate or name is missing', async () => {
      expect(await addCity('', 'Newtown')).toBeNull();
      expect(await addCity('5', '   ')).toBeNull();
      expect(mockMutate).not.toHaveBeenCalled();
    });

    // BKLT-318 — the UI hides the add row for these, so this is the backstop for
    // a caller that skips that check.
    it('returns null without calling the API for a name outside the name policy', async () => {
      expect(await addCity('5', '<script>alert(1)</script>')).toBeNull();
      expect(await addCity('5', "Newtown'; DROP TABLE cities;--")).toBeNull();
      expect(await addCity('5', 'a')).toBeNull();
      expect(await addCity('5', 'a'.repeat(NAME_MAX_LENGTH + 1))).toBeNull();
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('returns null on GraphQL errors', async () => {
      mockMutate.mockResolvedValueOnce({ errors: [{ message: 'boom' }] });
      expect(await addCity('5', 'Newtown')).toBeNull();
    });

    it('returns null when the request throws', async () => {
      mockMutate.mockRejectedValueOnce(new Error('network'));
      expect(await addCity('5', 'Newtown')).toBeNull();
    });
  });

  describe('addSchool', () => {
    it('returns the created school and forwards a trimmed governorate', async () => {
      const school = { id: '9', name: 'مدرسة', name_en: null, is_verified: false };
      mockMutate.mockResolvedValueOnce({ data: { addSchool: school } });

      const res = await addSchool('  مدرسة  ', '  القاهرة  ');

      expect(res).toEqual(school);
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { name: 'مدرسة', governorate: 'القاهرة' } }),
      );
    });

    it('sends governorate: null when omitted', async () => {
      mockMutate.mockResolvedValueOnce({
        data: { addSchool: { id: '9', name: 'Al Nasr', name_en: null, is_verified: false } },
      });
      await addSchool('Al Nasr');
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { name: 'Al Nasr', governorate: null } }),
      );
    });

    it('returns null without calling the API for an empty name', async () => {
      expect(await addSchool('   ')).toBeNull();
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('returns null without calling the API for a name outside the name policy', async () => {
      expect(await addSchool('<script>alert(1)</script>')).toBeNull();
      expect(await addSchool('Al Nasr😀')).toBeNull();
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('returns null on GraphQL errors', async () => {
      mockMutate.mockResolvedValueOnce({ errors: [{ message: 'x' }] });
      expect(await addSchool('Al Nasr')).toBeNull();
    });

    it('returns null when the request throws', async () => {
      mockMutate.mockRejectedValueOnce(new Error('network'));
      expect(await addSchool('Al Nasr')).toBeNull();
    });
  });
});
