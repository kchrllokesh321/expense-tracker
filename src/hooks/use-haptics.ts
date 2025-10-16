import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export const useHaptics = () => {
  const triggerImpact = async (style: ImpactStyle = ImpactStyle.Medium) => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style });
      } catch (error) {
        console.warn('Haptics not available:', error);
      }
    }
  };

  const triggerNotification = async (type: 'success' | 'warning' | 'error' = 'success') => {
    if (Capacitor.isNativePlatform()) {
      try {
        let notificationType: NotificationType;
        switch (type) {
          case 'success':
            notificationType = NotificationType.Success;
            break;
          case 'warning':
            notificationType = NotificationType.Warning;
            break;
          case 'error':
            notificationType = NotificationType.Error;
            break;
          default:
            notificationType = NotificationType.Success;
        }
        await Haptics.notification({ type: notificationType });
      } catch (error) {
        console.warn('Haptics not available:', error);
      }
    }
  };

  const triggerSelection = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.selectionStart();
        await Haptics.selectionChanged();
        await Haptics.selectionEnd();
      } catch (error) {
        console.warn('Haptics not available:', error);
      }
    }
  };

  return {
    triggerImpact,
    triggerNotification,
    triggerSelection,
  };
};