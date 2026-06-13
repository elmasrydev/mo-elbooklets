/**
 * Pure logic for the student-side parental-linking slot cards.
 *
 * Extracted from useParentLinking so it can be unit-tested without mocking Apollo.
 * The student has two linking slots; this maps backend link requests to the two
 * slot view-states (sorted so accepted/pending win the two visible slots).
 */
import { ParentLinkRequest, ParentSlot, SlotState } from '../types/parenting';

/** Map a single request to its visual slot state. */
export const getSlotState = (request: ParentLinkRequest): SlotState => {
  if (request.status === 'accepted') return 'accepted';
  if (request.status === 'rejected') return 'rejected';
  if (request.status === 'pending') {
    return request.initiated_by === 'student' ? 'pending_outgoing' : 'pending_incoming';
  }
  return 'empty';
};

/**
 * Build exactly two slots from the request list: sort accepted-first, then
 * pending, then rejected; take the first two; pad with empty slots.
 */
export const buildSlots = (requests: ParentLinkRequest[] = []): [ParentSlot, ParentSlot] => {
  const order: Record<ParentLinkRequest['status'], number> = {
    accepted: 0,
    pending: 1,
    rejected: 2,
  };
  const sorted = [...requests].sort((a, b) => order[a.status] - order[b.status]);

  const slots: ParentSlot[] = sorted.slice(0, 2).map((req) => ({
    state: getSlotState(req),
    request: req,
  }));

  while (slots.length < 2) {
    slots.push({ state: 'empty' });
  }

  return slots as [ParentSlot, ParentSlot];
};
