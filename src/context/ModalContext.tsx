import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';

export interface ConfirmModalConfig {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  showCancel?: boolean;
  dismissible?: boolean;
  backButtonCloseDisabled?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ModalContextType {
  showConfirm: (config: ConfirmModalConfig) => void;
  hideModal: () => void;
  isModalVisible: boolean;
  modalConfig: ConfirmModalConfig | null;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<ConfirmModalConfig | null>(null);

  const showConfirm = useCallback((config: ConfirmModalConfig) => {
    setModalConfig(config);
    setIsModalVisible(true);
  }, []);

  const hideModal = useCallback(() => {
    setIsModalVisible(false);
    setTimeout(() => {
      setModalConfig(null);
    }, 200);
  }, []);

  const value = useMemo(() => ({
    showConfirm,
    hideModal,
    isModalVisible,
    modalConfig
  }), [showConfirm, hideModal, isModalVisible, modalConfig]);

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
