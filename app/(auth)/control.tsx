import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  TextInput,
  Alert,
  RefreshControl,
  Switch
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import init, { Paho } from 'react_native_mqtt';
import { useTheme } from '@/components/ThemeProvider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Fonts } from '@/constants/Styles';

// Default configuration
const DEFAULT_IP = "192.168.1.100";
const STATUS_ENDPOINT = (ip: string) => `http://${ip}/status`;
const PUMP_START_ENDPOINT = (ip: string) => `http://${ip}/pump/start`;
const PUMP_STOP_ENDPOINT = (ip: string) => `http://${ip}/pump/stop`;
const MODE_ENDPOINT = (ip: string) => `http://${ip}/mode`;

interface SystemStatus {
  moistureLevel: number;
  pumpStatus: boolean;
  autoMode: boolean;
}

export default function ControlPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ipAddress, setIpAddress] = useState(DEFAULT_IP);
  const [isConnected, setIsConnected] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [moistureHistory, setMoistureHistory] = useState<number[]>([]);
  const theme = useTheme();

  // Load saved IP address on component mount
  useEffect(() => {
    loadSavedIpAddress();
  }, []);

  const loadSavedIpAddress = async () => {
    try {
      const savedIp = await AsyncStorage.getItem('esp32_ip_address');
      if (savedIp) {
        setIpAddress(savedIp);
        fetchStatus(savedIp);
      }
    } catch (err) {
      console.error('Error loading saved IP:', err);
    }
  };

  const saveIpAddress = async (ip: string) => {
    try {
      await AsyncStorage.setItem('esp32_ip_address', ip);
    } catch (err) {
      console.error('Error saving IP:', err);
    }
  };

  const validateIpAddress = (ip: string) => {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    return ipRegex.test(ip);
  };

  const handleIpChange = async (newIp: string) => {
    if (validateIpAddress(newIp)) {
      setIpAddress(newIp);
      await saveIpAddress(newIp);
      fetchStatus(newIp);
    } else {
      Alert.alert('Invalid IP', 'Please enter a valid IP address');
    }
  };

  const fetchStatus = async (ip: string) => {
    try {
      setLoading(true);
      const response = await axios.get(STATUS_ENDPOINT(ip), { timeout: 5000 });
      setStatus(response.data);
      setError(null);
      setIsConnected(true);
      setLastUpdate(new Date());
      
      // Update moisture history
      setMoistureHistory(prev => {
        const newHistory = [...prev, response.data.moistureLevel];
        return newHistory.slice(-10); // Keep last 10 readings
      });
    } catch (err) {
      setError('Failed to fetch status from ESP32');
      setIsConnected(false);
      console.error('Status fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const sendCommand = async (endpoint: string, params?: any) => {
    try {
      setLoading(true);
      const response = await axios.post(endpoint, null, { params, timeout: 5000 });
      if (response.status === 200) {
        await fetchStatus(ipAddress);
      }
    } catch (err) {
      setError('Failed to send command');
      console.error('Command error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => fetchStatus(ipAddress), 5000);
      return () => clearInterval(interval);
    }
  }, [isConnected, ipAddress]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchStatus(ipAddress);
  }, [ipAddress]);

  const handleStartPump = () => sendCommand(PUMP_START_ENDPOINT(ipAddress));
  const handleStopPump = () => sendCommand(PUMP_STOP_ENDPOINT(ipAddress));
  const handleSetMode = (mode: 'AUTO' | 'MANUAL') => sendCommand(MODE_ENDPOINT(ipAddress), { mode });

  const getMoistureStatus = (level: number) => {
    if (level > 2900) return { text: 'Very Dry', color: '#F44336' };
    if (level > 2700) return { text: 'Dry', color: '#FF9800' };
    if (level > 2500) return { text: 'Moist', color: '#4CAF50' };
    return { text: 'Very Moist', color: '#2196F3' };
  };

  const toggleMode = () => {
    if (status) {
      handleSetMode(status.autoMode ? 'MANUAL' : 'AUTO');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.mainContent}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => router.back()}
            >
              <MaterialCommunityIcons name="arrow-left" size={20} color="#4444FF" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>Irrigation Control</Text>
            
            <View style={styles.iconButton} />
          </View>
          <View style={styles.connectionStatus}>
            <View style={[
              styles.statusDot,
              { backgroundColor: isConnected ? '#4CAF50' : '#FF4444' }
            ]} />
            <Text style={[
              styles.statusText,
              { color: isConnected ? '#4CAF50' : '#FF4444' }
            ]}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
        </View>

        <View style={[styles.mainDeviceCard, { marginBottom: 16 }]}>
          <Text style={styles.label}>Device IP Address</Text>
          <TextInput
            style={styles.ipInput}
            value={ipAddress}
            onChangeText={handleIpChange}
            placeholder="Enter ESP32 IP Address"
            keyboardType="numeric"
          />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {loading ? (
            <View style={[styles.mainDeviceCard, { alignItems: 'center', justifyContent: 'center' }]}>
              <ActivityIndicator size="large" color="#4444FF" />
            </View>
          ) : error ? (
            <View style={[styles.mainDeviceCard, { alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={[styles.value, { color: '#FF4444' }]}>{error}</Text>
            </View>
          ) : (
            <View style={styles.mainDeviceCard}>
              <View style={styles.statusContainer}>
                <MaterialCommunityIcons name="water-percent" size={24} color="#4444FF" />
                <View style={styles.statusTextContainer}>
                  <Text style={styles.label}>Moisture Level</Text>
                  <Text style={[styles.value, { color: theme.theme.colors.text }]}>
                    {status?.moistureLevel} ({status ? getMoistureStatus(status.moistureLevel).text : 'N/A'})
                  </Text>
                </View>
              </View>

              <View style={styles.statusContainer}>
                <MaterialCommunityIcons 
                  name={status?.pumpStatus ? "water-pump" : "water-pump-off"} 
                  size={24} 
                  color={status?.pumpStatus ? '#4CAF50' : '#FF4444'} 
                />
                <View style={styles.statusTextContainer}>
                  <Text style={styles.label}>Pump Status</Text>
                  <Text style={[styles.value, { color: status?.pumpStatus ? '#4CAF50' : '#FF4444' }]}>
                    {status?.pumpStatus ? 'Running' : 'Stopped'}
                  </Text>
                </View>
              </View>

              <View style={styles.statusContainer}>
                <MaterialCommunityIcons 
                  name={status?.autoMode ? "auto-fix" : "hand-pointing-right"} 
                  size={24} 
                  color="#4444FF" 
                />
                <View style={styles.statusTextContainer}>
                  <Text style={styles.label}>Operation Mode</Text>
                  <Switch
                    value={status?.autoMode ?? false}
                    onValueChange={toggleMode}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={status?.autoMode ? '#4444FF' : '#f4f3f4'}
                  />
                </View>
              </View>

              {!status?.autoMode && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: status?.pumpStatus ? 'rgba(255, 68, 68, 0.1)' : 'rgba(68, 68, 255, 0.1)' }]}
                  onPress={() => status?.pumpStatus ? handleStopPump() : handleStartPump()}
                >
                  <Text style={[styles.actionButtonText, { color: status?.pumpStatus ? '#FF4444' : '#4444FF' }]}>
                    {status?.pumpStatus ? 'Stop Pump' : 'Start Pump'}
                  </Text>
                  <MaterialCommunityIcons 
                    name={status?.pumpStatus ? "stop-circle" : "play-circle"} 
                    size={24} 
                    color={status?.pumpStatus ? '#FF4444' : '#4444FF'} 
                  />
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </View>

      <View style={styles.navbar}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(auth)/home')}>
          <MaterialCommunityIcons name="home" size={28} color="#666" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="white-balance-sunny" size={28} color="#4444FF" />
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
    fontFamily: Fonts.medium,
    color: '#4444FF',
    letterSpacing: 0.3,
    flex: 1,
    textAlign: 'center',
  },
  iconButton: {
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  statusTextContainer: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: '#333',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
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
  ipInput: {
    borderWidth: 1,
    borderColor: '#EEEEFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: '#333',
    backgroundColor: '#FFFFFF',
  },
});
