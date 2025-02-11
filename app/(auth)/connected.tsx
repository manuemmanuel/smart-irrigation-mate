import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { router } from 'expo-router';

export default function ConnectedScreen() {
  return (
    <View style={styles.container}>
      <Svg width={200} height={200} viewBox="0 0 200 200">
        <Path
          d="M100 50 A50 50 0 1 1 50 100 L150 100 A50 50 0 1 1 100 150"
          stroke="#4444FF"
          strokeWidth="2"
          fill="none"
        />
        <Path
          d="M75 75 A25 25 0 1 1 125 125"
          stroke="#4444FF"
          strokeWidth="2"
          fill="none"
        />
      </Svg>

      <Text style={styles.title}>Device Connected</Text>

      <TouchableOpacity 
        style={styles.button} 
        onPress={() => router.push('/(auth)/home')}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4444FF',
    marginTop: 40,
    marginBottom: 40,
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
