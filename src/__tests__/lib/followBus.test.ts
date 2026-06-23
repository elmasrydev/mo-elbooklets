import { emitFollowChange, subscribeFollowChange } from '../../utils/followBus';

describe('followBus', () => {
  it('notifies subscribers of follow changes', () => {
    const calls: [string, boolean][] = [];
    const unsub = subscribeFollowChange((id, f) => calls.push([id, f]));
    emitFollowChange('42', true);
    emitFollowChange('7', false);
    expect(calls).toEqual([
      ['42', true],
      ['7', false],
    ]);
    unsub();
  });

  it('stops notifying after unsubscribe', () => {
    let count = 0;
    const unsub = subscribeFollowChange(() => {
      count += 1;
    });
    emitFollowChange('1', true);
    unsub();
    emitFollowChange('1', false);
    expect(count).toBe(1);
  });

  it('supports multiple independent subscribers', () => {
    let a = 0;
    let b = 0;
    const unsubA = subscribeFollowChange(() => {
      a += 1;
    });
    const unsubB = subscribeFollowChange(() => {
      b += 1;
    });
    emitFollowChange('1', true);
    expect(a).toBe(1);
    expect(b).toBe(1);
    unsubA();
    unsubB();
  });
});
