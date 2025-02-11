import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SelectDeviceScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Device</Text>
      <View style={styles.underline} />

      <View style={styles.deviceList}>
        <TouchableOpacity style={styles.arrowButton}>
          <Ionicons name="chevron-back" size={32} color="black" />
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => router.push('/(auth)/connecterror')}
        >
          <Text style={styles.buttonText}>Skip</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={() => router.push('/(auth)/connected')}
        >
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4444FF',
    textAlign: 'center',
    marginTop: 20,
  },
  underline: {
    height: 2,
    backgroundColor: '#4444FF',
    width: 150,
    alignSelf: 'center',
    marginTop: 5,
  },
  deviceList: {
    flex: 1,
    justifyContent: 'center',
  },
  arrowButton: {
    padding: 10,
  },
  buttonContainer: {
    gap: 15,
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
