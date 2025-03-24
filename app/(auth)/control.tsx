import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import mqtt from '@taoqf/react-native-mqtt';
import { useTheme } from '@/components/ThemeProvider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

// MQTT Configuration
const MQTT_BROKER = 'mqtt.eclipseprojects.io';
const MQTT_PORT = 1883;
const MQTT_TOPIC_STATUS = 'smart-irr/status';
const MQTT_TOPIC_CONTROL = 'smart-irr/control';
const MQTT_TOPIC_MODE = 'smart-irr/mode/set';

interface IrrigationStatus {
  moistureLevel: number;
  pumpStatus: boolean;
  autoMode: boolean;
}

export default function ControlPage() {
  const { theme } = useTheme();
  const [client, setClient] = useState<any>(null);
  const [status, setStatus] = useState<IrrigationStatus>({
    moistureLevel: 0,
    pumpStatus: false,
    autoMode: false,
  });
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize MQTT client
    const mqttClient = mqtt.connect(`mqtt://${MQTT_BROKER}:${MQTT_PORT}`);

    mqttClient.on('connect', () => {
      console.log('Connected to MQTT broker');
      setIsConnected(true);
      mqttClient.subscribe(MQTT_TOPIC_STATUS);
    });

    mqttClient.on('close', () => {
      setIsConnected(false);
    });

    mqttClient.on('offline', () => {
      setIsConnected(false);
    });

    mqttClient.on('message', (topic, message) => {
      if (topic === MQTT_TOPIC_STATUS) {
        try {
          const data = JSON.parse(message.toString());
          setStatus(data);
        } catch (error) {
          console.error('Error parsing MQTT message:', error);
        }
      }
    });

    mqttClient.on('error', (error) => {
      console.error('MQTT Error:', error);
    });

    setClient(mqttClient);

    return () => {
      mqttClient.end();
    };
  }, []);

  const sendCommand = (command: string) => {
    if (client && client.connected) {
      client.publish(MQTT_TOPIC_CONTROL, command);
    }
  };

  const toggleMode = () => {
    if (client && client.connected) {
      const newMode = status.autoMode ? 'MANUAL' : 'AUTO';
      client.publish(MQTT_TOPIC_MODE, newMode);
    }
  };

  const getMoistureStatus = () => {
    const level = status.moistureLevel;
    if (level > 2900) return 'Very Dry';
    if (level > 2800) return 'Dry';
    if (level > 2700) return 'Moist';
    return 'Very Moist';
  };

  return (
    <View style={styles.container}>
      <View style={styles.mainContent}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Irrigation Control</Text>
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
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.mainDeviceCard}>
            <View style={styles.statusContainer}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Moisture Level:</Text>
              <Text style={[styles.value, { color: theme.colors.text }]}>
                {status.moistureLevel} ({getMoistureStatus()})
              </Text>
            </View>

            <View style={styles.statusContainer}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Pump Status:</Text>
              <Text style={[styles.value, { color: status.pumpStatus ? '#4CAF50' : '#FF4444' }]}>
                {status.pumpStatus ? 'Running' : 'Stopped'}
              </Text>
            </View>

            <View style={styles.statusContainer}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Mode:</Text>
              <Switch
                value={status.autoMode}
                onValueChange={toggleMode}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={status.autoMode ? '#4444FF' : '#f4f3f4'}
              />
              <Text style={[styles.value, { color: theme.colors.text }]}>
                {status.autoMode ? 'Automatic' : 'Manual'}
              </Text>
            </View>

            {!status.autoMode && (
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.connectButton, { backgroundColor: status.pumpStatus ? 'rgba(255, 68, 68, 0.1)' : 'rgba(68, 68, 255, 0.1)' }]}
                  onPress={() => sendCommand(status.pumpStatus ? 'stop' : 'start')}
                >
                  <Text style={[styles.connectButtonText, { color: status.pumpStatus ? '#FF4444' : '#4444FF' }]}>
                    {status.pumpStatus ? 'Stop Pump' : 'Start Pump'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Aeonik-Medium',
    color: '#4444FF',
    letterSpacing: 0.3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
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
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Aeonik-Regular',
    marginRight: 8,
    color: '#333',
  },
  value: {
    fontSize: 16,
    fontFamily: 'Aeonik-Medium',
    color: '#333',
  },
  buttonContainer: {
    marginTop: 20,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
  },
  connectButtonText: {
    fontSize: 16,
    fontFamily: 'Aeonik-Medium',
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
    fontFamily: 'Aeonik-Medium',
    color: '#666',
    marginTop: 4,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Aeonik-Medium',
  },
});
