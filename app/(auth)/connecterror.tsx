import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '@/constants/Styles';

export default function ConnectErrorScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="wifi-outline" size={64} color="#FF4444" />
        </View>
        
        <Text style={styles.title}>Not Connected</Text>
        <Text style={styles.description}>
          Your device is not connected to any network. Connect to continue using all features.
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.tryAgainButton]}
            onPress={() => router.push('/(auth)/select')}
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.continueButton]}
            onPress={() => router.push('/(auth)/home')}
          >
            <Text style={[styles.buttonText, styles.continueButtonText]}>
              Continue Without Connection
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    color: '#FF4444',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  button: {
    width: '100%',
    padding: 16,
    borderRadius: 28,
    alignItems: 'center',
    shadowColor: '#4444FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  tryAgainButton: {
    backgroundColor: '#4444FF',
  },
  continueButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#4444FF',
  },
  buttonText: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: 'white',
  },
  continueButtonText: {
    color: '#4444FF',
  },
});