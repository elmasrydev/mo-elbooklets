import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  ReactNode,
} from 'react';
import { useApolloClient, useQuery } from '@apollo/client/react';
import { MyCurriculumDocument, SaveCurriculumDocument } from '../generated/graphql';
import { useAuth } from './AuthContext';
import { useAppForeground } from '../hooks/useAppForeground';
import { isDocumentRejection } from '../utils/graphqlErrors';
import { logError } from '../utils/logger';
import { CurriculumInput } from '../utils/curriculum';

/**
 * The signed-in student's Baccalaureate track and electives, and whether the
 * server still wants them (contract: `mobile-baccalaureate-tracks-and-electives.md`
 * §5–§6). Fetched once for the whole app, like `TrialStatusContext`, and for
 * the same reason: the fields are deployed on PRS only (2026-10-26), so they
 * live in their own document and this provider **fails open** — `needsCurriculum`
 * is `null` for a parent, a signed-out session, or a backend without the
 * fields, and `null` never gates anything.
 */
export interface CurriculumContextValue {
  /** `true` gates the app behind `CurriculumSetupScreen`; `null` = unknown, no gate. */
  needsCurriculum: boolean | null;
  specialityId: string | null;
  speciality: { id: string; name: string } | null;
  electiveSubjects: readonly { id: string; name: string }[];
  loading: boolean;
  refresh: () => Promise<void>;
  /**
   * Save the track and the FULL elective list together (the list replaces the
   * student's picks). Throws the GraphQL error on refusal — callers read the
   * per-field validation message. On success the subject/lesson caches are
   * dropped so every list re-asks the server, which filters by the new picks.
   */
  save: (input: CurriculumInput) => Promise<void>;
}

const FALLBACK: CurriculumContextValue = {
  needsCurriculum: null,
  specialityId: null,
  speciality: null,
  electiveSubjects: [],
  loading: false,
  refresh: async () => {},
  save: async () => {},
};

/** Defaults to "unknown" when no provider is mounted (unit renders), never throws. */
const CurriculumContext = createContext<CurriculumContextValue>(FALLBACK);

/**
 * Root fields whose answer changes with the picks: the subject-filtered lists
 * (contract §6), Home's per-subject wheel, and the completeness summary behind
 * Profile's ring. Evicted rather than refetched by name — in gate mode none of
 * them has a mounted observer, and whoever mounts next re-asks the server.
 */
const STALE_AFTER_SAVE = [
  'subjectsForUserGrade',
  'lessonsForSubject',
  'todaySchedule',
  'wheelOfSuccess',
  'profileCompleteness',
];

export const CurriculumProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, userRole } = useAuth();
  const client = useApolloClient();
  const isStudent = userRole === 'student' && !!user?.id;

  const { data, loading, error, refetch } = useQuery(MyCurriculumDocument, {
    skip: !isStudent,
    // A backend without the fields rejects the whole operation; `all` keeps
    // that from bubbling up as an unhandled render error.
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
  });

  // A validation-phase rejection means the fields are not deployed here and
  // no retry will change it; an execution failure stays retryable (see the
  // same latch in TrialStatusContext).
  const unsupportedByBackend = useRef(false);
  if (error && isDocumentRejection(error)) unsupportedByBackend.current = true;

  const refresh = useCallback(async () => {
    // `refetch()` ignores `skip`, so it must be gated too.
    if (!isStudent || unsupportedByBackend.current) return;
    try {
      await refetch();
    } catch (refetchError) {
      logError('Curriculum refresh failed', refetchError);
    }
  }, [isStudent, refetch]);

  useAppForeground(refresh);

  // A system change drops any elective the new system lacks, and an admin
  // grade move clears everything (contract §6): re-ask whenever either changes
  // for the SAME account. `educational_system.id` rather than `_id`: the shared
  // UpdateProfile document returns only the object, so after an in-app system
  // change the id field on `user` is the stale one. A sign-in/out changes the
  // account id instead, and `skip` toggling already fetches for it.
  const accountId = user?.id ?? null;
  const profileKey = `${user?.grade_id ?? ''}:${user?.educational_system?.id ?? ''}`;
  const seen = useRef({ accountId, profileKey });
  useEffect(() => {
    const changedWithinAccount =
      seen.current.accountId === accountId && seen.current.profileKey !== profileKey;
    seen.current = { accountId, profileKey };
    if (changedWithinAccount) void refresh();
  }, [accountId, profileKey, refresh]);

  const save = useCallback(
    async (input: CurriculumInput) => {
      await client.mutate({ mutation: SaveCurriculumDocument, variables: { input } });
      for (const fieldName of STALE_AFTER_SAVE) {
        client.cache.evict({ id: 'ROOT_QUERY', fieldName });
      }
      client.cache.gc();
      // `needsCurriculum` cannot ride on the mutation's result (see
      // curriculum.graphql), so re-read it: the gate flips once this lands,
      // and save() resolves only then, so the Save button stays busy until it does.
      await refresh();
    },
    [client, refresh],
  );

  const me = data?.me;
  const completeness = data?.profileCompleteness;
  const value = useMemo<CurriculumContextValue>(
    () => ({
      needsCurriculum: completeness ? completeness.needsCurriculum : null,
      specialityId: me?.speciality_id ?? null,
      speciality: me?.speciality ?? null,
      electiveSubjects: me?.elective_subjects ?? [],
      loading,
      refresh,
      save,
    }),
    [me, completeness, loading, refresh, save],
  );

  return <CurriculumContext.Provider value={value}>{children}</CurriculumContext.Provider>;
};

export const useCurriculum = (): CurriculumContextValue => useContext(CurriculumContext);
