import { getSlotState, buildSlots } from '../../utils/parentSlots';
import { ParentLinkRequest } from '../../types/parenting';

const req = (
  id: string,
  status: ParentLinkRequest['status'],
  initiated_by: ParentLinkRequest['initiated_by'] = 'parent',
): ParentLinkRequest => ({
  id,
  status,
  initiated_by,
  parent: { name: 'P', mobile: '01000000000' },
  created_at: '2026-06-14T00:00:00.000Z',
});

describe('getSlotState', () => {
  it('maps a parent-initiated pending request to pending_incoming (student must approve)', () => {
    expect(getSlotState(req('1', 'pending', 'parent'))).toBe('pending_incoming');
  });

  it('maps a student-initiated pending request to pending_outgoing', () => {
    expect(getSlotState(req('1', 'pending', 'student'))).toBe('pending_outgoing');
  });

  test.each([
    ['accepted', 'accepted'],
    ['rejected', 'rejected'],
  ] as const)('maps %s status to %s state', (status, expected) => {
    expect(getSlotState(req('1', status))).toBe(expected);
  });
});

describe('buildSlots', () => {
  it('always returns exactly two slots, padding with empty', () => {
    expect(buildSlots([])).toEqual([{ state: 'empty' }, { state: 'empty' }]);
    expect(buildSlots(undefined as any)).toHaveLength(2);

    const one = buildSlots([req('1', 'pending', 'parent')]);
    expect(one).toHaveLength(2);
    expect(one[0].state).toBe('pending_incoming');
    expect(one[1]).toEqual({ state: 'empty' });
  });

  it('sorts accepted first, then pending, then rejected', () => {
    const slots = buildSlots([
      req('r', 'rejected'),
      req('p', 'pending', 'parent'),
      req('a', 'accepted'),
    ]);
    // Only the first two survive the 2-slot cap: accepted then pending.
    expect(slots[0].request?.id).toBe('a');
    expect(slots[0].state).toBe('accepted');
    expect(slots[1].request?.id).toBe('p');
    expect(slots[1].state).toBe('pending_incoming');
  });

  it('does not drop a fresh pending request when an accepted link already fills a slot (flow-09 regression)', () => {
    // A reused student already linked (accepted) gets a new incoming request.
    const slots = buildSlots([req('old', 'accepted'), req('new', 'pending', 'parent')]);
    const pending = slots.find((s) => s.state === 'pending_incoming');
    expect(pending).toBeDefined();
    expect(pending?.request?.id).toBe('new');
  });
});
