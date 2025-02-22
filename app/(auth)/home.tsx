import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Fonts } from '@/constants/Styles';
import { router } from 'expo-router';
import axios from 'axios';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';

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

interface UserProfile {
  username: string;
  avatar_url: string | null;
}

function HomeScreen() {
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [location, setLocation] = useState<string>('');
  const [connectedNetwork, setConnectedNetwork] = useState<string | null>(null);

  useEffect(() => {
    getUserProfile();
    setTimeBasedGreeting();
    getWeatherData();
    checkDeviceConnection();
    getCurrentLocation();
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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;

      // Fetch profile from app_user_profiles
      const { data: profile, error } = await supabase
        .from('app_user_profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(profile);

      // Set username from profile or email
      const displayName = profile?.username || user.email.split('@')[0];
      setUserName(displayName.charAt(0).toUpperCase() + displayName.slice(1));
    } catch (error) {
      console.error('Error fetching profile:', error);
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

  const checkDeviceConnection = async () => {
    try {
      const netInfo = await NetInfo.fetch();
      setDeviceConnected(netInfo.type === 'wifi' && netInfo.isConnected);
      if (netInfo.type === 'wifi' && netInfo.details?.ssid) {
        setConnectedNetwork(netInfo.details.ssid);
      } else {
        setConnectedNetwork(null);
      }
    } catch (error) {
      console.error('Error checking device connection:', error);
      setDeviceConnected(false);
      setConnectedNetwork(null);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocation('Location access denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      try {
        // Try reverse geocoding first
        const [address] = await Location.reverseGeocodeAsync({
          latitude,
          longitude
        });

        if (address) {
          const locationString = address.city 
            ? `${address.city}, ${address.region || address.country}`
            : address.region 
              ? `${address.region}, ${address.country}`
              : address.country || 'Unknown location';
          setLocation(locationString);
        }
      } catch (geocodeError) {
        // If reverse geocoding fails, display coordinates in a readable format
        console.log('Geocoding failed:', geocodeError);
        const roundedLat = latitude.toFixed(4);
        const roundedLong = longitude.toFixed(4);
        setLocation(`${roundedLat}°, ${roundedLong}°`);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setLocation('Location unavailable');
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([
      getUserProfile(),
      getWeatherData()
    ]);
    setTimeBasedGreeting();
  };

  return (
    <View style={styles.container}>
      <View style={styles.mainContent}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={() => router.push('/(auth)/settings')}
            >
              {userProfile?.avatar_url ? (
                <Image 
                  source={{ uri: userProfile.avatar_url }} 
                  style={styles.avatar}
                />
              ) : (
                <MaterialCommunityIcons name="account" size={20} color="#4444FF" />
              )}
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>IrrigationMate</Text>
            
            <TouchableOpacity 
              style={styles.refreshButton} 
              onPress={refreshData}
              disabled={loading}
            >
              <MaterialCommunityIcons 
                name="refresh" 
                size={20} 
                color="#4444FF" 
                style={[styles.refreshIcon, loading && styles.rotating]}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.locationContainer}>
            <MaterialCommunityIcons 
              name="map-marker" 
              size={20} 
              color="#4444FF" 
            />
            <Text style={styles.locationText}>
              {location || 'Fetching location...'}
            </Text>
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
            <View style={styles.mainDeviceCard}>
              <View style={styles.deviceHeader}>
                <View style={[
                  styles.iconContainer,
                  deviceConnected ? styles.iconContainerConnected : styles.iconContainerDisconnected
                ]}>
                  <MaterialCommunityIcons 
                    name={deviceConnected ? "wifi-check" : "wifi-off"} 
                    size={24} 
                    color={deviceConnected ? "#4444FF" : "#FF4444"} 
                  />
                </View>
                <View style={styles.headerTexts}>
                  <Text style={styles.deviceTitle}>Device Status</Text>
                  <View style={styles.statusContainer}>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: deviceConnected ? '#4CAF50' : '#FF4444' }
                    ]} />
                    <Text style={[
                      styles.deviceStatus,
                      { color: deviceConnected ? '#4CAF50' : '#FF4444' }
                    ]}>
                      {deviceConnected ? 'Connected' : 'Disconnected'}
                    </Text>
                  </View>
                </View>
              </View>

              {deviceConnected && connectedNetwork && (
                <View style={styles.networkInfoContainer}>
                  <MaterialCommunityIcons 
                    name="wifi" 
                    size={20} 
                    color="#666" 
                  />
                  <Text style={styles.networkName}>{connectedNetwork}</Text>
                </View>
              )}

              {!deviceConnected && (
                <TouchableOpacity 
                  style={styles.connectButton}
                  onPress={() => router.push('/(auth)/select')}
                >
                  <Text style={styles.connectButtonText}>Connect Device</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#4444FF" />
                </TouchableOpacity>
              )}
            </View>
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

export default HomeScreen;

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
    backgroundColor: 'rgba(238, 238, 255, 0.95)',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#4444FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    paddingTop: 48,
    paddingBottom: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(68, 68, 255, 0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Aeonik-Medium',
    color: '#4444FF',
    letterSpacing: 0.3,
    flex: 1,
    textAlign: 'center',
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4444FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: 'rgba(68, 68, 255, 0.15)',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4444FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: 'rgba(68, 68, 255, 0.15)',
  },
  refreshIcon: {
    opacity: 0.9,
  },
  rotating: {
    opacity: 0.6,
    transform: [{ rotate: '45deg' }],
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
    marginBottom: 24,
  },
  mainDeviceCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#4444FF',
    shadowColor: '#4444FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  headerTexts: {
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerConnected: {
    backgroundColor: 'rgba(68, 68, 255, 0.1)',
  },
  iconContainerDisconnected: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
  deviceTitle: {
    fontSize: 18,
    fontFamily: Fonts.medium,
    color: '#333',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  deviceStatus: {
    fontSize: 16,
    fontFamily: Fonts.regular,
  },
  networkInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8FF',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  networkName: {
    fontSize: 15,
    fontFamily: Fonts.medium,
    color: '#666',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(68, 68, 255, 0.1)',
    padding: 12,
    borderRadius: 12,
  },
  connectButtonText: {
    color: '#4444FF',
    fontSize: 16,
    fontFamily: Fonts.medium,
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
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingHorizontal: 16,
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: '#666',
    textAlign: 'center',
  },
});