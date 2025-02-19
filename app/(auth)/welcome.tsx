import { View, Text, TouchableOpacity, Switch, StyleSheet, Platform, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import NetInfo from '@react-native-community/netinfo';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Linking from 'expo-linking';
import { Fonts } from '@/constants/Styles';

export default function SetupScreen() {
  const [wifiEnabled, setWifiEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    checkWifiStatus();
    checkNotificationStatus();
    // Subscribe to WiFi state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      setWifiEnabled(state.type === 'wifi');
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const checkWifiStatus = async () => {
    const state = await NetInfo.fetch();
    setWifiEnabled(state.type === 'wifi');
  };

  const checkNotificationStatus = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setNotificationsEnabled(status === 'granted');
  };

  const handleWifiToggle = async () => {
    if (Platform.OS === 'android') {
      try {
        await IntentLauncher.startActivityAsync(
          IntentLauncher.ActivityAction.WIRELESS_SETTINGS
        );
      } catch (error) {
        alert('Unable to open WiFi settings');
      }
    } else {
      // iOS
      Alert.alert(
        'WiFi Settings',
        'Please enable WiFi from your device settings',
        [
          {
            text: 'Open Settings',
            onPress: () => Linking.openSettings(),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    }
  };

  const handleNotificationToggle = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        setNotificationsEnabled(status === 'granted');
        
        if (status !== 'granted') {
          Alert.alert(
            'Permissions Required',
            'Please enable notifications from device settings to receive important updates',
            [
              {
                text: 'Open Settings',
                onPress: () => Platform.OS === 'ios' 
                  ? Linking.openSettings()
                  : IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.APPLICATION_SETTINGS),
              },
              {
                text: 'Cancel',
                style: 'cancel',
              },
            ]
          );
        }
      } else {
        // If already granted, open settings to let user disable
        Platform.OS === 'ios' 
          ? Linking.openSettings()
          : IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.APPLICATION_SETTINGS);
      }
    } catch (error) {
      alert('Unable to access notification settings');
    }
  };

  const handleNext = () => {
    router.push('/(auth)/scan');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.subtitle}>Let's setup your device</Text>

      <View style={styles.settingsContainer}>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>TURN ON WIFI</Text>
          <Switch
            value={wifiEnabled}
            onValueChange={handleWifiToggle}
            trackColor={{ false: '#D1D1D1', true: '#4444FF' }}
            ios_backgroundColor="#D1D1D1"
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingText}>ENABLE NOTIFICATION</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleNotificationToggle}
            trackColor={{ false: '#D1D1D1', true: '#4444FF' }}
            ios_backgroundColor="#D1D1D1"
          />
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8FF',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontFamily: Fonts.bold,
    color: '#4444FF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: '#666',
    textAlign: 'center',
    marginBottom: 60,
  },
  settingsContainer: {
    gap: 20,
    marginBottom: 60,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#4444FF',
  },
  settingText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
  },
  button: {
    backgroundColor: '#4444FF',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontFamily: Fonts.bold,
  },
});
