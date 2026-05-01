import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { InventoryItem } from '../app/(tabs)/_layout';
import { getDaysUntilExpiry } from './expiryUtils';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get notification permission!');
      return;
    }
  }

  return token;
}

export async function scheduleDailyExpiryNotifications(inventory: InventoryItem[]) {
  // First, cancel all previously scheduled notifications
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Find critical items (0 to 3 days until expiry, not deleted)
  const criticalItems = inventory.filter(item => {
    if (item.is_deleted === 1) return false;
    const days = getDaysUntilExpiry(item.exp);
    return days >= 0 && days <= 3;
  });

  if (criticalItems.length === 0) {
    return; // Nothing to notify about
  }

  const itemNames = criticalItems.map(item => item.name).join(', ');
  const title = `🚨 Expiring Soon!`;
  let body = `You have ${criticalItems.length} item(s) expiring soon: ${itemNames}. Use them today!`;
  
  if (body.length > 100) {
      body = `You have ${criticalItems.length} item(s) expiring soon, including ${criticalItems[0].name}. Use them today!`;
  }

  // Schedule a daily repeating notification at 9:00 AM
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger: {
      seconds: 24 * 60 * 60, // Every 24 hours
      repeats: true,
      channelId: 'default',
    } as any,
  });
}
