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
  RefreshControl
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export default function ControlScreen() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ipAddress, setIpAddress] = useState(DEFAULT_IP);
  const [isConnected, setIsConnected] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [moistureHistory, setMoistureHistory] = useState<number[]>([]);

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

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.connectionCard}>
        <Text style={styles.title}>Connection Settings</Text>
        <View style={styles.ipInputContainer}>
          <TextInput
            style={styles.ipInput}
            value={ipAddress}
            onChangeText={handleIpChange}
            placeholder="Enter ESP32 IP Address"
            keyboardType="numeric"
          />
          <View style={[styles.connectionIndicator, { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }]} />
        </View>
        <Text style={styles.connectionStatus}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </Text>
        {lastUpdate && (
          <Text style={styles.lastUpdate}>
            Last Update: {lastUpdate.toLocaleTimeString()}
          </Text>
        )}
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.title}>System Status</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : status ? (
          <>
            <View style={styles.statusItem}>
              <Text style={styles.label}>Moisture Level:</Text>
              <View style={styles.valueContainer}>
                <Text style={[styles.value, { color: getMoistureStatus(status.moistureLevel).color }]}>
                  {status.moistureLevel}
                </Text>
                <Text style={[styles.moistureStatus, { color: getMoistureStatus(status.moistureLevel).color }]}>
                  {getMoistureStatus(status.moistureLevel).text}
                </Text>
              </View>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.label}>Pump Status:</Text>
              <Text style={[styles.value, status.pumpStatus ? styles.onText : styles.offText]}>
                {status.pumpStatus ? 'ON' : 'OFF'}
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.label}>Mode:</Text>
              <Text style={styles.value}>{status.autoMode ? 'AUTO' : 'MANUAL'}</Text>
            </View>
          </>
        ) : null}
      </View>

      <View style={styles.controlCard}>
        <Text style={styles.title}>Pump Control</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.button, styles.startButton]} 
            onPress={handleStartPump}
            disabled={loading || !isConnected}
          >
            <Text style={styles.buttonText}>Start Pump</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.stopButton]} 
            onPress={handleStopPump}
            disabled={loading || !isConnected}
          >
            <Text style={styles.buttonText}>Stop Pump</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.controlCard}>
        <Text style={styles.title}>Operation Mode</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.button, styles.modeButton]} 
            onPress={() => handleSetMode('AUTO')}
            disabled={loading || !isConnected}
          >
            <Text style={styles.buttonText}>Auto Mode</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.modeButton]} 
            onPress={() => handleSetMode('MANUAL')}
            disabled={loading || !isConnected}
          >
            <Text style={styles.buttonText}>Manual Mode</Text>
          </TouchableOpacity>
        </View>
      </View>

      {moistureHistory.length > 0 && (
        <View style={styles.historyCard}>
          <Text style={styles.title}>Moisture History</Text>
          <View style={styles.historyContainer}>
            {moistureHistory.map((level, index) => (
              <View key={index} style={styles.historyItem}>
                <Text style={[styles.historyValue, { color: getMoistureStatus(level).color }]}>
                  {level}
                </Text>
                <Text style={styles.historyTime}>
                  {new Date(Date.now() - (moistureHistory.length - 1 - index) * 5000).toLocaleTimeString()}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  connectionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ipInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ipInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
    fontSize: 16,
  },
  connectionIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  connectionStatus: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  lastUpdate: {
    fontSize: 14,
    color: '#999',
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  controlCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  valueContainer: {
    alignItems: 'flex-end',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
  },
  moistureStatus: {
    fontSize: 14,
    marginTop: 2,
  },
  onText: {
    color: '#4CAF50',
  },
  offText: {
    color: '#F44336',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  modeButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#F44336',
    fontSize: 16,
    textAlign: 'center',
  },
  historyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyContainer: {
    marginTop: 8,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  historyValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  historyTime: {
    fontSize: 14,
    color: '#666',
  },
});
