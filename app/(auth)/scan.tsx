import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '@/constants/Styles';

export default function SearchDeviceScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="search-circle" size={150} color="#4444FF" />
      </View>

      <Text style={styles.title}>Search For Devices</Text>

      <View style={styles.instructionsContainer}>
        <Text style={styles.instruction}>
          1. Connect the IOT and your device in same network.
        </Text>
        <Text style={styles.instruction}>
          2. The IOT device should be in the range of your WIFI router.
        </Text>
      </View>

      <TouchableOpacity 
        style={styles.button} 
        onPress={() => router.push('/(auth)/select')}
      >
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    color: '#4444FF',
    marginBottom: 40,
  },
  instructionsContainer: {
    width: '100%',
    marginBottom: 40,
    gap: 20,
  },
  instruction: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: '#333',
    fontFamily: Fonts.regular,
  },
  button: {
    backgroundColor: '#4444FF',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 40,
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontFamily: Fonts.bold,
    textAlign: 'center',
  },
});
