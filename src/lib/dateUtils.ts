import { TFunction } from 'i18next';

export const getTimeAgo = (dateString: string, t: TFunction, language: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return t('time.just_now');
  if (diffInSeconds < 3600) return t('time.minutes_ago', { count: Math.floor(diffInSeconds / 60) });
  if (diffInSeconds < 86400) return t('time.hours_ago', { count: Math.floor(diffInSeconds / 3600) });
  if (diffInSeconds < 604800) return t('time.days_ago', { count: Math.floor(diffInSeconds / 86400) });
  
  return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });
};

export const formatDate = (dateString: string, language: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};
