/**
 * Push Notification Service for Chawp Vendor App
 * Handles registration, permissions, and notification handling
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../config/supabase';

// Configure how notifications are displayed when app is in foreground
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (error) {
  console.log('Notification handler not available in Expo Go');
}

export async function registerForPushNotifications() {
  let token = null;

  // Skip registration in Expo Go (SDK 53+)
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('vendor-orders', {
        name: 'New Orders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FFA500',
        sound: 'default',
      });
      
      await Notifications.setNotificationChannelAsync('vendor-updates', {
        name: 'Vendor Updates',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#FFA500',
      });
    }

    if (Device.isDevice || Platform.OS === 'web') {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push notification permission');
        return null;
      }
      
      try {
        // Get FCM token (works for standalone apps)
        token = (await Notifications.getDevicePushTokenAsync()).data;
        console.log('Vendor FCM Push Token:', token);
        
        // Save token to database
        const { data: { user } } = await supabase.auth.getUser();
        if (user && token) {
          await savePushToken(token, user.id);
        }
      } catch (error) {
        console.error('Error getting push token:', error);
      }
    }
  } catch (error) {
    console.log('Push notifications not available in Expo Go. Use development build for full functionality.');
    console.log('Error:', error.message);
  }

  return token;
}

export async function savePushToken(token, userId) {
  if (!token || !userId) {
    console.log('Missing token or userId for saving');
    return;
  }

  try {
    console.log('Saving vendor push token for user:', userId);
    
    // Get device info
    const deviceInfo = {
      brand: Device.brand || 'unknown',
      model: Device.modelName || 'unknown',
      os: Device.osName || 'unknown',
      osVersion: Device.osVersion || 'unknown'
    };
    
    // Save to device_tokens table with device type 'vendor'
    console.log('Saving push token to device_tokens for vendor app...');
    const { error: deviceError } = await supabase
      .from('chawp_device_tokens')
      .upsert({
        user_id: userId,
        push_token: token,
        device_type: 'vendor',
        device_info: deviceInfo
      }, {
        onConflict: 'user_id,device_type,push_token'
      });
    
    if (deviceError) {
      console.error('Error saving to device_tokens:', deviceError);
    } else {
      console.log('Push token saved to device_tokens successfully');
    }
    
    // Save to user profiles table (vendors are also users with role='vendor')
    const { error } = await supabase
      .from('chawp_user_profiles')
      .update({
        push_token: token,
        push_token_updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Error saving vendor push token:', error);
      throw error;
    }
    
    console.log('Vendor push token saved successfully to chawp_user_profiles');
  } catch (error) {
    console.error('Error saving vendor push token:', error);
  }
}

export function setupNotificationListeners(onNotificationReceived, onNotificationTapped) {
  const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
    console.log('Vendor notification received:', notification);
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }
  });

  const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('Vendor notification tapped:', response);
    if (onNotificationTapped) {
      onNotificationTapped(response);
    }
  });

  return {
    notificationListener,
    responseListener,
    remove: () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    },
  };
}

export async function sendLocalNotification(title, body, data = {}) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
      priority: 'high',
    },
    trigger: null,
  });
}
