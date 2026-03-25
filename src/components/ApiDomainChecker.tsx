import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from '../context/ModalContext';
import { PRIMARY_API_URL } from '../config/api';

export const ApiDomainChecker: React.FC = () => {
  const { t } = useTranslation();
  const { showConfirm } = useModal();

  useEffect(() => {
    const timer = setTimeout(() => {
      // Check if the domain is not its base
      if (!PRIMARY_API_URL.startsWith('https://elbooklets.com')) {
        showConfirm({
          title: t('common.api_connection_title', 'API Connection'),
          message: t('common.api_connected_to', { url: PRIMARY_API_URL }),
          confirmLabel: t('common.ok'),
          onConfirm: () => {},
        });
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, [t, showConfirm]);

  return null;
};
