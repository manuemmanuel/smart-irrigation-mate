import React from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet, Platform, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import NetInfo from '@react-native-community/netinfo';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '@/constants/Styles';

export default function SetupScreen() {
  const [step, setStep] = useState(1);
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
    if (step === 1) {
      setStep(2);
    } else {
      router.push('/(auth)/select');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.stepIndicator}>
        <Text style={styles.stepText}>Step {step} of 2</Text>
        <View style={styles.stepDots}>
          <View style={[styles.dot, step === 1 && styles.activeDot]} />
          <View style={[styles.dot, step === 2 && styles.activeDot]} />
        </View>
      </View>

      {step === 1 ? (
        <View style={styles.contentContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="settings-outline" size={150} color="#4444FF" />
          </View>

          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>Let's setup your device</Text>

          <View style={styles.settingsContainer}>
            <View style={styles.settingItem}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingText}>TURN ON WIFI</Text>
                <Text style={styles.settingDescription}>Required for device connection</Text>
              </View>
              <Switch
                value={wifiEnabled}
                onValueChange={handleWifiToggle}
                trackColor={{ false: '#D1D1D1', true: '#4444FF' }}
                ios_backgroundColor="#D1D1D1"
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingText}>ENABLE NOTIFICATION</Text>
                <Text style={styles.settingDescription}>Get important device updates</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: '#D1D1D1', true: '#4444FF' }}
                ios_backgroundColor="#D1D1D1"
              />
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.contentContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="search-circle" size={150} color="#4444FF" />
          </View>

          <Text style={styles.title}>Search For Devices</Text>
          <Text style={styles.subtitle}>Follow these steps to connect</Text>

          <View style={styles.instructionsContainer}>
            <View style={styles.instructionItem}>
              <View style={styles.instructionNumber}>
                <Text style={styles.numberText}>1</Text>
              </View>
              <Text style={styles.instruction}>
                Connect the IOT and your device to the same network
              </Text>
            </View>

            <View style={styles.instructionItem}>
              <View style={styles.instructionNumber}>
                <Text style={styles.numberText}>2</Text>
              </View>
              <Text style={styles.instruction}>
                Ensure the IOT device is within range of your WiFi router
              </Text>
            </View>
          </View>
        </View>
      )}

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
    paddingTop: 60,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
  },
  stepIndicator: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  stepText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: '#4444FF',
    marginBottom: 8,
  },
  stepDots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D1D1',
  },
  activeDot: {
    backgroundColor: '#4444FF',
    width: 24,
  },
  iconContainer: {
    marginBottom: 24,
    height: 150,
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
    marginBottom: 32,
  },
  settingsContainer: {
    width: '100%',
    gap: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#4444FF',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#666',
  },
  instructionsContainer: {
    width: '100%',
    gap: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#4444FF',
    gap: 16,
  },
  instructionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(68, 68, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: '#4444FF',
  },
  instruction: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    fontFamily: Fonts.regular,
  },
  button: {
    backgroundColor: '#4444FF',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontFamily: Fonts.bold,
  },
});
