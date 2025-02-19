import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Fonts } from '@/constants/Styles';

export default function WelcomeScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/(auth)/register'); 
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>IRRIGATION</Text>
        <Text style={styles.title}>MATE</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4444FF',
    padding: 20,
    justifyContent: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 42,
    fontFamily: Fonts.bold,
    color: 'white',
    textAlign: 'center',
    letterSpacing: 2,
  },
});