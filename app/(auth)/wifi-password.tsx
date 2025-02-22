import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Fonts } from '@/constants/Styles';
import WifiManager from 'react-native-wifi-reborn';
import { Ionicons } from '@expo/vector-icons';

export default function WifiPasswordScreen() {
  const { ssid, bssid } = useLocalSearchParams<{ ssid: string; bssid: string }>();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    if (password.length < 8) {
      Alert.alert('Invalid Password', 'Password must be at least 8 characters long');
      return;
    }

    setConnecting(true);
    try {
      const connectionPromise = WifiManager.connectToProtectedSSID(ssid, password, false, false);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timed out')), 15000)
      );

      await Promise.race([connectionPromise, timeoutPromise]);
      router.push('/(auth)/connected');
    } catch (error: any) {
      console.error('Error connecting to network:', error);
      let errorMessage = 'Please check your password and try again';
      
      if (error.message.includes('timeout')) {
        errorMessage = 'Connection timed out. Please ensure you are within range of the network and try again.';
      } else if (error.message.includes('authentication failed')) {
        errorMessage = 'Incorrect password. Please try again.';
      }

      Alert.alert('Connection Failed', errorMessage);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connect to Network</Text>
      <View style={styles.underline} />

      <View style={styles.formContainer}>
        <Text style={styles.networkName}>{ssid}</Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter WiFi Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoFocus
          />
          <TouchableOpacity
            style={styles.showPasswordButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={24}
              color="#4444FF"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, connecting && styles.buttonDisabled]}
            onPress={handleConnect}
            disabled={connecting}
          >
            <Text style={styles.buttonText}>
              {connecting ? 'Connecting...' : 'Connect'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8FF',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontFamily: Fonts.bold,
    color: '#4444FF',
    textAlign: 'center',
    marginTop: 24,
  },
  underline: {
    height: 3,
    backgroundColor: '#4444FF',
    width: 120,
    alignSelf: 'center',
    marginTop: 8,
    borderRadius: 1.5,
  },
  formContainer: {
    marginTop: 32,
  },
  networkName: {
    fontSize: 24,
    fontFamily: Fonts.medium,
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#4444FF',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 18,
    fontFamily: Fonts.regular,
  },
  showPasswordButton: {
    padding: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    flex: 1,
    backgroundColor: '#4444FF',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#4444FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontFamily: Fonts.bold,
    textAlign: 'center',
  },
}); 