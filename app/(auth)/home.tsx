import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function HomeScreen() {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    getUserProfile();
  }, []);

  const getUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      const name = user.email.split('@')[0];
      setUserName(name.charAt(0).toUpperCase() + name.slice(1));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <MaterialIcons name="person" size={60} color="#666" />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.greeting}>Good{'\n'}Morning</Text>
        <Text style={styles.name}>{userName}</Text>

        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>Device</Text>
          <Text style={styles.statusText}>Connected</Text>
          <View style={styles.statusDot} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    height: '30%',
    backgroundColor: '#00E5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  greeting: {
    fontSize: 40,
    fontFamily: 'serif',
    lineHeight: 45,
  },
  name: {
    fontSize: 40,
    fontFamily: 'serif',
    marginTop: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 25,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 16,
    marginRight: 5,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    marginLeft: 5,
  },
});