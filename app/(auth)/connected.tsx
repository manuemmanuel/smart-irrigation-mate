import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Fonts } from '@/constants/Styles';

export default function ConnectedScreen() {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.iconContainer,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          }
        ]}
      >
        <MaterialCommunityIcons 
          name="wifi-check" 
          size={120} 
          color="#4444FF"
          style={styles.icon}
        />
      </Animated.View>

      <Animated.View style={{ opacity: opacityAnim }}>
        <Text style={styles.title}>Device Connected</Text>
        <Text style={styles.subtitle}>Your device is now ready to use</Text>
      </Animated.View>

      <TouchableOpacity 
        style={styles.button} 
        onPress={() => router.push('/(auth)/home')}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8FF',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 200,
    height: 200,
    backgroundColor: '#EEEEFF',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 80,
    shadowColor: '#4444FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  icon: {
    shadowColor: '#4444FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  title: {
    fontSize: 32,
    fontFamily: Fonts.bold,
    color: '#4444FF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#4444FF',
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 40,
    width: '100%',
    marginBottom: 40,
    shadowColor: '#4444FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontFamily: Fonts.bold,
    textAlign: 'center',
  },
});
