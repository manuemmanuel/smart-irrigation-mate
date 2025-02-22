import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet, Alert, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/Styles';
import mqtt from 'precompiled-mqtt';

interface MQTTStatus {
  connected: boolean;
  pumpState: boolean;
  autoMode: boolean;
}

export default function ManualControlScreen() {
  const [mqttStatus, setMqttStatus] = useState<MQTTStatus>({
    connected: false,
    pumpState: false,
    autoMode: false,
  });
  const [client, setClient] = useState<mqtt.MqttClient | null>(null);

  useEffect(() => {
    connectMQTT();
    return () => {
      if (client) {
        client.end();
      }
    };
  }, []);

  const connectMQTT = async () => {
    try {
      const mqttClient = mqtt.connect('mqtt://your-broker-address:1883', {
        clientId: `mobile_${Math.random().toString(16).slice(3)}`,
      });

      mqttClient.on('connect', () => {
        setMqttStatus(prev => ({ ...prev, connected: true }));
        mqttClient.subscribe('pump/status');
        mqttClient.subscribe('pump/mode');
      });

      mqttClient.on('message', (topic, message) => {
        const payload = message.toString();
        if (topic === 'pump/status') {
          setMqttStatus(prev => ({ ...prev, pumpState: payload === 'ON' }));
        } else if (topic === 'pump/mode') {
          setMqttStatus(prev => ({ ...prev, autoMode: payload === 'AUTO' }));
        }
      });

      mqttClient.on('error', (err) => {
        console.error('MQTT Error:', err);
        Alert.alert('Connection Error', 'Failed to connect to the device');
      });

      setClient(mqttClient);
    } catch (error) {
      console.error('MQTT Connection Error:', error);
      Alert.alert('Connection Error', 'Failed to connect to the device');
    }
  };

  const togglePump = () => {
    if (!client?.connected) {
      Alert.alert('Error', 'Device not connected');
      return;
    }
    const newState = !mqttStatus.pumpState;
    client.publish('pump/control', newState ? 'ON' : 'OFF');
  };

  const toggleAutoMode = () => {
    if (!client?.connected) {
      Alert.alert('Error', 'Device not connected');
      return;
    }
    const newMode = !mqttStatus.autoMode;
    client.publish('pump/mode/set', newMode ? 'AUTO' : 'MANUAL');
    setMqttStatus(prev => ({ ...prev, autoMode: newMode }));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Pump Control</Text>

      {/* Connection Status */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[
            styles.iconContainer,
            { backgroundColor: mqttStatus.connected ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 68, 68, 0.1)' }
          ]}>
            <MaterialCommunityIcons 
              name={mqttStatus.connected ? "wifi-check" : "wifi-off"} 
              size={24} 
              color={mqttStatus.connected ? "#4CAF50" : "#FF4444"} 
            />
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.cardTitle}>Connection Status</Text>
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusDot,
                { backgroundColor: mqttStatus.connected ? "#4CAF50" : "#FF4444" }
              ]} />
              <Text style={[
                styles.statusText,
                { color: mqttStatus.connected ? "#4CAF50" : "#FF4444" }
              ]}>
                {mqttStatus.connected ? "Connected" : "Disconnected"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Pump Status and Control */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[
            styles.iconContainer,
            { backgroundColor: mqttStatus.pumpState ? 'rgba(68, 68, 255, 0.1)' : 'rgba(102, 102, 102, 0.1)' }
          ]}>
            <MaterialCommunityIcons 
              name="pump" 
              size={24} 
              color={mqttStatus.pumpState ? "#4444FF" : "#666"} 
            />
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.cardTitle}>Pump Status</Text>
            <Text style={[
              styles.pumpStatusText,
              { color: mqttStatus.pumpState ? "#4444FF" : "#666" }
            ]}>
              {mqttStatus.pumpState ? "Running" : "Stopped"}
            </Text>
          </View>
        </View>

        <View style={styles.controlContainer}>
          <TouchableOpacity 
            style={[
              styles.controlButton,
              mqttStatus.pumpState && styles.controlButtonActive,
              (!mqttStatus.connected || mqttStatus.autoMode) && styles.controlButtonDisabled
            ]}
            onPress={togglePump}
            disabled={!mqttStatus.connected || mqttStatus.autoMode}
          >
            <Text style={[
              styles.controlButtonText,
              mqttStatus.pumpState && styles.controlButtonTextActive
            ]}>
              {mqttStatus.pumpState ? "STOP PUMP" : "START PUMP"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Operation Mode */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[
            styles.iconContainer,
            { backgroundColor: mqttStatus.autoMode ? 'rgba(68, 68, 255, 0.1)' : 'rgba(102, 102, 102, 0.1)' }
          ]}>
            <MaterialCommunityIcons 
              name="auto-fix" 
              size={24} 
              color={mqttStatus.autoMode ? "#4444FF" : "#666"} 
            />
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.cardTitle}>Operation Mode</Text>
            <Text style={styles.modeDescription}>
              {mqttStatus.autoMode ? "Automatic Control" : "Manual Control"}
            </Text>
          </View>
          <Switch
            value={mqttStatus.autoMode}
            onValueChange={toggleAutoMode}
            trackColor={{ false: '#D1D1D1', true: '#4444FF' }}
            thumbColor={mqttStatus.autoMode ? '#FFFFFF' : '#FFFFFF'}
            ios_backgroundColor="#D1D1D1"
            disabled={!mqttStatus.connected}
            style={styles.modeSwitch}
          />
        </View>
      </View>

      {/* Settings Button */}
      <TouchableOpacity 
        style={styles.settingsButton}
        onPress={() => Alert.alert('Settings', 'Settings page coming soon')}
      >
        <View style={styles.settingsContent}>
          <View style={styles.settingsLeft}>
            <Ionicons name="settings-outline" size={24} color="#4444FF" />
            <View>
              <Text style={styles.settingsTitle}>Device Settings</Text>
              <Text style={styles.settingsSubtitle}>Configure MQTT and network settings</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#4444FF" />
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8FF',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontFamily: Fonts.bold,
    color: '#4444FF',
    marginBottom: 24,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(68, 68, 255, 0.1)',
    shadowColor: '#4444FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  cardTitle: {
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
  statusText: {
    fontSize: 16,
    fontFamily: Fonts.regular,
  },
  pumpStatusText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
  },
  controlContainer: {
    marginTop: 20,
  },
  controlButton: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#4444FF',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: '#4444FF',
  },
  controlButtonDisabled: {
    opacity: 0.5,
  },
  controlButtonText: {
    color: '#4444FF',
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
  controlButtonTextActive: {
    color: 'white',
  },
  modeDescription: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#666',
  },
  modeSwitch: {
    marginLeft: 'auto',
  },
  settingsButton: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(68, 68, 255, 0.1)',
    shadowColor: '#4444FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 8,
  },
  settingsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  settingsTitle: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: '#4444FF',
  },
  settingsSubtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#666',
  },
});
