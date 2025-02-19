import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Fonts } from '@/constants/Styles';
import { router } from 'expo-router';
import axios from 'axios';
import * as Location from 'expo-location';

interface WeatherData {
  last_updated: string;
  last_updated_epoch: number;
  temp_c: number;
  temp_f: number;
  feelslike_c: number;
  feelslike_f: number;
  windchill_c: number;
  windchill_f: number;
  heatindex_c: number;
  heatindex_f: number;
  dewpoint_c: number;
  dewpoint_f: number;
  condition: {
    text: string;
    icon: string;
    code: number;
  };
  wind_mph: number;
  wind_kph: number;
  wind_degree: number;
  wind_dir: string;
  pressure_mb: number;
  pressure_in: number;
  precip_mm: number;
  precip_in: number;
  humidity: number;
  cloud: number;
  is_day: number;
  uv: number;
  gust_mph: number;
  gust_kph: number;
}

export default function HomeScreen() {
  const [userName, setUserName] = useState('');
  const [greeting, setGreeting] = useState('');
  const [weather, setWeather] = useState<WeatherData>({
    last_updated: '',
    last_updated_epoch: 0,
    temp_c: 0,
    temp_f: 0,
    feelslike_c: 0,
    feelslike_f: 0,
    windchill_c: 0,
    windchill_f: 0,
    heatindex_c: 0,
    heatindex_f: 0,
    dewpoint_c: 0,
    dewpoint_f: 0,
    condition: {
      text: '',
      icon: '',
      code: 0
    },
    wind_mph: 0,
    wind_kph: 0,
    wind_degree: 0,
    wind_dir: '',
    pressure_mb: 0,
    pressure_in: 0,
    precip_mm: 0,
    precip_in: 0,
    humidity: 0,
    cloud: 0,
    is_day: 1,
    uv: 0,
    gust_mph: 0,
    gust_kph: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserProfile();
    setTimeBasedGreeting();
    getWeatherData();
  }, []);

  const setTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting('Good\nMorning');
    } else if (hour >= 12 && hour < 17) {
      setGreeting('Good\nAfternoon');
    } else if (hour >= 17 && hour < 21) {
      setGreeting('Good\nEvening');
    } else {
      setGreeting('Good\nNight');
    }
  };

  const getUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      const name = user.email.split('@')[0];
      setUserName(name.charAt(0).toUpperCase() + name.slice(1));
    }
  };

  const getWeatherData = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const response = await axios.get(
        `https://api.weatherapi.com/v1/current.json?key=24fdd594707942af856134318251602&q=${latitude},${longitude}&aqi=no`
      );

      console.log('Full weather data:', response.data.current);
      setWeather(response.data.current);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching weather:', error);
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.mainContent}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <MaterialCommunityIcons name="account" size={60} color="#4444FF" />
          </View>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.name}>{userName}</Text>
          </View>

          <View style={styles.weatherContainer}>
            <View style={styles.mainWeatherCard}>
              <View style={styles.weatherHeader}>
                <MaterialCommunityIcons 
                  name={weather.is_day ? "weather-sunny" : "weather-night"} 
                  size={40} 
                  color="#4444FF" 
                />
                <Text style={styles.weatherCondition}>
                  {loading ? 'Loading...' : weather.condition?.text}
                </Text>
              </View>
              <Text style={styles.mainTemp}>
                {loading ? '--' : `${weather.temp_c.toFixed(1)}°C`}
              </Text>
              <Text style={styles.feelsLike}>
                Feels like {loading ? '--' : `${weather.feelslike_c.toFixed(1)}°C`}
              </Text>
            </View>

            <View style={styles.weatherStatsGrid}>
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="water-percent" size={24} color="#4444FF" />
                <Text style={styles.statValue}>
                  {loading ? '--' : `${weather.humidity}%`}
                </Text>
                <Text style={styles.statLabel}>Humidity</Text>
              </View>

              <View style={styles.statCard}>
                <MaterialCommunityIcons name="weather-windy" size={24} color="#4444FF" />
                <Text style={styles.statValue}>
                  {loading ? '--' : `${weather.wind_kph} km/h`}
                </Text>
                <Text style={styles.statLabel}>Wind</Text>
              </View>

              <View style={styles.statCard}>
                <MaterialCommunityIcons name="compass" size={24} color="#4444FF" />
                <Text style={styles.statValue}>
                  {loading ? '--' : weather.wind_dir}
                </Text>
                <Text style={styles.statLabel}>Direction</Text>
              </View>

              <View style={styles.statCard}>
                <MaterialCommunityIcons name="weather-cloudy" size={24} color="#4444FF" />
                <Text style={styles.statValue}>
                  {loading ? '--' : `${weather.cloud}%`}
                </Text>
                <Text style={styles.statLabel}>Cloud Cover</Text>
              </View>

              <View style={styles.statCard}>
                <MaterialCommunityIcons name="white-balance-sunny" size={24} color="#4444FF" />
                <Text style={styles.statValue}>
                  {loading ? '--' : weather.uv}
                </Text>
                <Text style={styles.statLabel}>UV Index</Text>
              </View>

              <View style={styles.statCard}>
                <MaterialCommunityIcons name="eye" size={24} color="#4444FF" />
                <Text style={styles.statValue}>
                  {loading ? '--' : `${weather.wind_kph} km`}
                </Text>
                <Text style={styles.statLabel}>Visibility</Text>
              </View>
            </View>
          </View>

          <View style={styles.deviceCard}>
            <View style={styles.deviceInfo}>
              <MaterialCommunityIcons name="wifi-check" size={24} color="#4444FF" />
              <View style={styles.deviceTexts}>
                <Text style={styles.deviceTitle}>Device Status</Text>
                <Text style={styles.deviceStatus}>Connected</Text>
              </View>
            </View>
            <View style={styles.statusDot} />
          </View>
        </ScrollView>
      </View>

      <View style={styles.navbar}>
        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <MaterialCommunityIcons name="home" size={28} color="#4444FF" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(auth)/control')}>
          <MaterialCommunityIcons name="white-balance-sunny" size={28} color="#666" />
          <Text style={styles.navText}>Control</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(auth)/settings')}>
          <MaterialCommunityIcons name="cog" size={28} color="#666" />
          <Text style={styles.navText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8FF',
  },
  mainContent: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 0,
  },
  header: {
    backgroundColor: '#EEEEFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#4444FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    padding: 40,
    paddingTop: 60,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4444FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  content: {
    padding: 0,
  },
  greetingContainer: {
    marginBottom: 32,
  },
  greeting: {
    fontSize: 40,
    fontFamily: Fonts.bold,
    color: '#4444FF',
    lineHeight: 48,
  },
  name: {
    fontSize: 32,
    fontFamily: Fonts.bold,
    color: '#333',
    marginTop: 8,
  },
  weatherContainer: {
    marginBottom: 24,
  },
  mainWeatherCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4444FF',
    shadowColor: '#4444FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weatherCondition: {
    fontSize: 18,
    fontFamily: Fonts.medium,
    color: '#333',
  },
  mainTemp: {
    fontSize: 48,
    fontFamily: Fonts.bold,
    color: '#4444FF',
    marginVertical: 8,
  },
  feelsLike: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: '#666',
  },
  weatherStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4444FF',
    shadowColor: '#4444FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statValue: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#666',
    marginTop: 4,
  },
  deviceCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#4444FF',
    shadowColor: '#4444FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deviceTexts: {
    marginLeft: 8,
  },
  deviceTitle: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: '#333',
  },
  deviceStatus: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#666',
    marginTop: 2,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
  },
  navbar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: '#EEEEFF',
    justifyContent: 'space-between',
    shadowColor: '#4444FF',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#666',
    marginTop: 4,
  },
});