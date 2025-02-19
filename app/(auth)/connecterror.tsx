import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Svg, Path, Circle } from 'react-native-svg';
import { router } from 'expo-router';
import { Fonts } from '@/constants/Styles';

export default function ConnectionErrorScreen() {
  return (
    <View style={styles.container}>
      <Svg width={150} height={150} viewBox="0 0 100 100">
        {/* WiFi waves */}
        <Path
          d="M20 60 Q50 30 80 60"
          stroke="black"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M30 70 Q50 50 70 70"
          stroke="black"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M40 80 Q50 70 60 80"
          stroke="black"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
        />
        {/* Error circle with X */}
        <Circle cx="75" cy="75" r="15" fill="black" />
        <Path
          d="M68 68 L82 82 M82 68 L68 82"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </Svg>

      <Text style={styles.title}>Connection Error</Text>

      <TouchableOpacity 
        style={styles.button} 
        onPress={() => router.back()}
      >
        <Text style={styles.buttonText}>Try Again</Text>
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
    fontSize: 28,
    fontFamily: Fonts.bold,
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
    fontFamily: Fonts.bold,
    textAlign: 'center',
  },
});