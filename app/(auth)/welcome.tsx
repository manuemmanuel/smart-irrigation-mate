import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';

export default function SetupScreen() {
  const [wifiEnabled, setWifiEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

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
            onValueChange={setWifiEnabled}
            trackColor={{ false: '#D1D1D1', true: '#4444FF' }}
            ios_backgroundColor="#D1D1D1"
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingText}>ENABLE NOTIFICATION</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
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
    fontWeight: 'bold',
    color: '#4444FF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
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
    fontWeight: '600',
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
    fontWeight: 'bold',
  },
});
