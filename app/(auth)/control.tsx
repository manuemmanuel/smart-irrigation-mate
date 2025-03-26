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

// Add these constants at the top
const POLLING_INTERVAL = 10000; // Increase to 10 seconds
const CONNECTION_TIMEOUT = 8000; // 8 seconds timeout
const RETRY_DELAY = 5000; // 5 seconds between retries

// Update the constants
const LONG_POLLING_TIMEOUT = 30000; // 30 seconds
const KEEP_ALIVE_TIMEOUT = 60000; // 60 seconds

interface SystemStatus {
  moistureLevel: number;
  pumpStatus: boolean;
  autoMode: boolean;
}

// Create axios instance with persistent connection
const axiosInstance = axios.create({
  timeout: LONG_POLLING_TIMEOUT,
  headers: {
    'Connection': 'keep-alive',
    'Keep-Alive': `timeout=${KEEP_ALIVE_TIMEOUT}`,
  },
  // Prevent timeout from interrupting long polling
  httpAgent: new (require('http').Agent)({ keepAlive: true }),
  httpsAgent: new (require('https').Agent)({ keepAlive: true }),
});

export default function ControlPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ipAddress, setIpAddress] = useState(DEFAULT_IP);
  const [isConnected, setIsConnected] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [moistureHistory, setMoistureHistory] = useState<number[]>([]);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const MAX_RECONNECT_ATTEMPTS = 3;
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
    setIpAddress(newIp);
    if (newIp.length > 0 && validateIpAddress(newIp)) {
      setLoading(true);
      try {
        await saveIpAddress(newIp);
        await fetchStatus(newIp);
      } catch (err) {
        setError('Failed to connect to device');
      }
    }
  };

  const fetchStatus = async (ip: string, isReconnectAttempt = false) => {
    try {
      if (!isReconnectAttempt) {
        setLoading(true);
      }
      
      if (!validateIpAddress(ip)) {
        throw new Error('Invalid IP address format');
      }

      // Use long polling endpoint
      const response = await axiosInstance.get(STATUS_ENDPOINT(ip), {
        params: {
          lastUpdate: lastUpdate ? lastUpdate.getTime() : 0,
          timeout: LONG_POLLING_TIMEOUT,
        },
      });

      // Only update if we got new data
      if (response.data) {
        setStatus(response.data);
        setError(null);
        setIsConnected(true);
        setLastUpdate(new Date());
        setReconnectAttempts(0);
        
        setMoistureHistory(prev => {
          const newHistory = [...prev, response.data.moistureLevel];
          return newHistory.slice(-10);
        });
      }
    } catch (err: any) {
      console.log('Connection error:', err.message);
      
      // Handle connection errors
      if (err.message.includes('Network Error') || err.code === 'ECONNABORTED') {
        if (!isReconnectAttempt) {
          setError('Connection interrupted. Reconnecting...');
          setIsConnected(false);
          handleReconnect(ip);
        } else if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          handleReconnect(ip);
        } else {
          setError('Connection lost. Please check device and network connection.');
          setIsConnected(false);
          setStatus(null);
        }
      } else {
        setError(`Connection error: ${err.message}`);
        setIsConnected(false);
        setStatus(null);
      }
    } finally {
      if (!isReconnectAttempt) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  const handleReconnect = async (ip: string) => {
    setReconnectAttempts(prev => prev + 1);
    setTimeout(() => {
      fetchStatus(ip, true);
    }, RETRY_DELAY);
  };

  useEffect(() => {
    let isActive = true;
    let pollTimeoutId: NodeJS.Timeout;

    const pollStatus = async () => {
      if (!isActive || !isConnected || !validateIpAddress(ipAddress)) return;
      
      try {
        await fetchStatus(ipAddress);
        // Immediately start next long poll
        if (isActive) {
          pollTimeoutId = setTimeout(pollStatus, 100); // Small delay between polls
        }
      } catch (err) {
        console.error('Polling error:', err);
        if (isActive) {
          pollTimeoutId = setTimeout(pollStatus, 5000); // Retry after 5s on error
        }
      }
    };

    if (isConnected) {
      pollStatus();
    }

    return () => {
      isActive = false;
      if (pollTimeoutId) {
        clearTimeout(pollTimeoutId);
      }
    };
  }, [isConnected, ipAddress]);

  // Add network connectivity check
  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (validateIpAddress(ipAddress)) {
          await fetchStatus(ipAddress);
        }
      } catch (err) {
        console.error('Initial connection check failed:', err);
      }
    };

    checkConnection();
  }, [ipAddress]);

  const sendCommand = async (endpoint: string, body?: string) => {
    try {
      setLoading(true);
      console.log('Sending command:', endpoint, body); // Debug log

      const response = await axiosInstance.post(endpoint, body, { 
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });
      
      console.log('Response:', response.data); // Debug log
      
      if (response.status === 200) {
        await fetchStatus(ipAddress);
      }
    } catch (err: any) {
      console.error('Command error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      if (err.response?.data?.error) {
        setError(`Command failed: ${err.response.data.error}`);
      } else {
        setError('Failed to send command: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchStatus(ipAddress);
  }, [ipAddress]);

  const handleStartPump = () => sendCommand(PUMP_START_ENDPOINT(ipAddress));
  const handleStopPump = () => sendCommand(PUMP_STOP_ENDPOINT(ipAddress));
  const handleSetMode = (mode: 'AUTO' | 'MANUAL') => {
    // Send raw JSON string in the exact format ESP32 expects
    const requestBody = `{"mode":"${mode}"}`;  // This creates {"mode":"AUTO"} or {"mode":"MANUAL"}

    sendCommand(MODE_ENDPOINT(ipAddress), requestBody);
  };

  const getMoistureStatus = (level: number) => {
    if (level > 2900) return { text: 'Very Dry', color: '#F44336' };
    if (level > 2700) return { text: 'Dry', color: '#FF9800' };
    if (level > 2500) return { text: 'Moist', color: '#4CAF50' };
    return { text: 'Very Moist', color: '#2196F3' };
  };

  const toggleMode = () => {
    if (status) {
      // Explicitly set the mode
      const newMode = status.autoMode ? 'MANUAL' : 'AUTO';
      console.log('Toggling mode to:', newMode); // Debug log
      handleSetMode(newMode);
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

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingTop: 16 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={['#4444FF']}
            />
          }
        >
          <View style={[styles.mainDeviceCard, { marginBottom: 16 }]}>
            <View style={styles.ipHeader}>
              <View style={{ flex: 1, marginRight: 16 }}>
                <Text style={styles.label}>Device IP Address</Text>
                <TextInput
                  style={[styles.ipInput, !isConnected && { borderColor: '#FF4444' }]}
                  value={ipAddress}
                  onChangeText={handleIpChange}
                  placeholder="Enter ESP32 IP Address"
                  keyboardType="numeric"
                  editable={!loading}
                />
              </View>
              <MaterialCommunityIcons 
                name={isConnected ? "check-circle" : "ip-network"} 
                size={24} 
                color={isConnected ? '#4CAF50' : '#4444FF'} 
              />
            </View>
          </View>

          {loading ? (
            <View style={[styles.mainDeviceCard, { alignItems: 'center', justifyContent: 'center', minHeight: 200 }]}>
              <ActivityIndicator size="large" color="#4444FF" />
            </View>
          ) : error ? (
            <View style={[styles.mainDeviceCard, { alignItems: 'center', justifyContent: 'center', minHeight: 200 }]}>
              <MaterialCommunityIcons name="alert-circle" size={48} color="#FF4444" />
              <Text style={[styles.value, { color: '#FF4444', marginTop: 16 }]}>{error}</Text>
            </View>
          ) : (
            <View style={[styles.mainDeviceCard, styles.elevatedCard]}>
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
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#4444FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    paddingTop: 48,
    paddingBottom: 16,
    marginBottom: 16,
    borderWidth: 0,
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
    padding: 24,
    borderRadius: 20,
    borderWidth: 0,
    shadowColor: '#4444FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    minHeight: 100,
  },
  elevatedCard: {
    transform: [{ scale: 1.02 }],
    marginHorizontal: 4,
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
  ipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ipInput: {
    borderWidth: 1.5,
    borderColor: '#EEEEFF',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: '#333',
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    width: '100%',
    minWidth: 200,
  },
});
