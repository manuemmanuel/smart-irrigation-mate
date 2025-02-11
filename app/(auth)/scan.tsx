import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';

export default function SearchDeviceScreen() {
  return (
    <View style={styles.container}>
      <Image 
        source={require('../../assets/images/magnifier.png')} 
        style={styles.image}
        // Fallback to icon if image not available
        onError={(e) => console.log('Image failed to load')}
      />

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
  image: {
    width: 150,
    height: 150,
    marginBottom: 30,
    tintColor: '#4444FF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
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
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
