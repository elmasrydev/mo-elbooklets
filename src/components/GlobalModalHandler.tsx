import React, { useState } from 'react';
import { useModal } from '../context/ModalContext';
import { ConfirmModal } from './ConfirmModal';

export const GlobalModalHandler: React.FC = () => {
  const { isModalVisible, modalConfig, hideModal } = useModal();
  const [isLoading, setIsLoading] = useState(false);

  if (!modalConfig) {
    return null;
  }

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      if (modalConfig.onConfirm) {
        await modalConfig.onConfirm();
      }
    } catch (error) {
      console.error('❌ [GlobalModalHandler] Error in onConfirm:', error);
    } finally {
      setIsLoading(false);
      hideModal();
    }
  };

  const handleCancel = () => {
    if (modalConfig.onCancel) {
      modalConfig.onCancel();
    }
    hideModal();
  };

  return (
    <ConfirmModal
      visible={isModalVisible}
      title={modalConfig.title}
      message={modalConfig.message}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      confirmLabel={modalConfig.confirmLabel}
      cancelLabel={modalConfig.cancelLabel}
      confirmVariant={modalConfig.confirmVariant}
      isLoading={isLoading}
      showCancel={modalConfig.showCancel}
      dismissible={modalConfig.dismissible}
      backButtonCloseDisabled={modalConfig.backButtonCloseDisabled}
      countdown={modalConfig.countdown}
    />
  );
};
