import React, { useState } from 'react';
import { useModal } from '../context/ModalContext';
import { ConfirmModal } from './ConfirmModal';

export const GlobalModalHandler: React.FC = () => {
  const { isModalVisible, modalConfig, hideModal, getModalGeneration, inputValue, setInputValue } =
    useModal();
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    // A handler may open ANOTHER modal — a failed delete reporting its error,
    // for example. Hiding unconditionally in `finally` would wipe that one out
    // the instant it appeared, so the action looked like it had silently worked.
    const generation = getModalGeneration();
    try {
      setIsLoading(true);
      if (modalConfig?.onConfirm) {
        await modalConfig.onConfirm(inputValue);
      }
    } catch (error) {
      console.error('❌ [GlobalModalHandler] Error in onConfirm:', error);
    } finally {
      setIsLoading(false);
      if (getModalGeneration() === generation) hideModal();
    }
  };

  const handleCancel = () => {
    if (modalConfig?.onCancel) {
      modalConfig.onCancel();
    }
    hideModal();
  };

  return (
    <ConfirmModal
      visible={isModalVisible && !!modalConfig}
      title={modalConfig?.title || ''}
      message={modalConfig?.message || ''}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      confirmLabel={modalConfig?.confirmLabel}
      cancelLabel={modalConfig?.cancelLabel}
      confirmVariant={modalConfig?.confirmVariant}
      isLoading={isLoading}
      showCancel={modalConfig?.showCancel}
      dismissible={modalConfig?.dismissible}
      backButtonCloseDisabled={modalConfig?.backButtonCloseDisabled}
      countdown={modalConfig?.countdown}
      hasInput={modalConfig?.hasInput}
      inputPlaceholder={modalConfig?.inputPlaceholder}
      inputValue={inputValue}
      onInputChange={setInputValue}
    />
  );
};
