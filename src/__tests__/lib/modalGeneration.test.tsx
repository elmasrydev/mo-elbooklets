import React from 'react';
import { Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';

import { ModalProvider, useModal } from '../../context/ModalContext';

/**
 * A handler that reports a failure by opening a SECOND modal from inside the
 * first one's `onConfirm` used to be wiped out: GlobalModalHandler hides the
 * modal in its `finally`, which lands after the new one was shown — so a failed
 * delete looked exactly like a successful one (BKLT-323 review finding).
 *
 * The generation counter is what lets the handler tell "still my modal" from
 * "onConfirm opened another", so it only hides in the first case.
 */

let api: ReturnType<typeof useModal>;
const Probe = () => {
  api = useModal();
  return <Text>{api.isModalVisible ? 'visible' : 'hidden'}</Text>;
};

const renderProbe = () =>
  render(
    <ModalProvider>
      <Probe />
    </ModalProvider>,
  );

describe('modal generation', () => {
  it('advances on every showConfirm', () => {
    renderProbe();
    const start = api.getModalGeneration();

    act(() => api.showConfirm({ title: 'a', message: 'a', onConfirm: () => {} }));
    expect(api.getModalGeneration()).toBe(start + 1);

    act(() => api.showConfirm({ title: 'b', message: 'b', onConfirm: () => {} }));
    expect(api.getModalGeneration()).toBe(start + 2);
  });

  it('lets a caller detect that onConfirm opened a replacement modal', async () => {
    renderProbe();

    // Mirrors GlobalModalHandler.handleConfirm: capture, await, compare.
    act(() =>
      api.showConfirm({
        title: 'delete',
        message: 'sure?',
        onConfirm: () => {},
      }),
    );
    const captured = api.getModalGeneration();

    // The failing action reports its error by opening another modal.
    await act(async () => {
      api.showConfirm({ title: 'error', message: 'could not delete', onConfirm: () => {} });
    });

    expect(api.getModalGeneration()).not.toBe(captured);
    // …so the handler must NOT hide, and the error stays on screen.
    expect(screen.getByText('visible')).toBeTruthy();
    expect(api.modalConfig?.message).toBe('could not delete');
  });

  it('is unchanged when onConfirm opens nothing, so the handler still hides', async () => {
    renderProbe();

    act(() => api.showConfirm({ title: 'ok', message: 'done', onConfirm: () => {} }));
    const captured = api.getModalGeneration();

    await act(async () => {
      /* a handler that succeeds and shows nothing */
    });

    expect(api.getModalGeneration()).toBe(captured);
  });
});
