import { View, Text, TouchableOpacity, StyleSheet, FlatList, Platform, Animated } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import WifiManager from 'react-native-wifi-reborn';
import * as Location from 'expo-location';
import { Fonts } from '@/constants/Styles';

interface WifiNetwork {
  SSID: string;
  BSSID: string;
  strength: number;
  isSecured: boolean;
}

const SkeletonItem = () => (
  <View style={styles.networkItem}>
    <View style={styles.networkInfo}>
      <View style={[styles.skeletonLine, { width: '70%', height: 20, marginBottom: 8 }]} />
      <View style={[styles.skeletonLine, { width: '40%', height: 16 }]} />
    </View>
    <View style={[styles.skeletonCircle, { width: 24, height: 24 }]} />
  </View>
);

export default function SelectDeviceScreen() {
  const [wifiNetworks, setWifiNetworks] = useState<WifiNetwork[]>([]);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    if (Platform.OS === 'android') {
      requestPermissionsAndScan();
    }
  }, []);

  const requestPermissionsAndScan = async () => {
    try {
      // Request location permission (required for WiFi scanning on Android)
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Location permission is required to scan for WiFi networks');
        return;
      }
      scanWifiNetworks();
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  const scanWifiNetworks = async () => {
    if (Platform.OS === 'ios') {
      alert('WiFi scanning is not available on iOS');
      return;
    }

    try {
      setScanning(true);
      // Mock data for development
      const mockNetworks = [
        { SSID: 'WiFi Network 1', BSSID: '00:00:00:00:00:01', strength: 80, isSecured: true },
        { SSID: 'WiFi Network 2', BSSID: '00:00:00:00:00:02', strength: 65, isSecured: false },
        { SSID: 'WiFi Network 3', BSSID: '00:00:00:00:00:03', strength: 45, isSecured: true },
      ];
      
      if (__DEV__) {
        // Use mock data in development
        setWifiNetworks(mockNetworks);
      } else {
        // Use real WiFi scanning in production
        const networks = await WifiManager.loadWifiList();
        const formattedNetworks = networks.map(network => ({
          SSID: network.SSID,
          BSSID: network.BSSID,
          strength: Math.abs(network.level),
          isSecured: network.capabilities.includes('WPA')
        }));
        setWifiNetworks(formattedNetworks);
      }
    } catch (error) {
      console.error('Error scanning WiFi:', error);
      // Set mock data on error
      setWifiNetworks([
        { SSID: 'Test Network 1', BSSID: '00:00:00:00:00:01', strength: 80, isSecured: true },
        { SSID: 'Test Network 2', BSSID: '00:00:00:00:00:02', strength: 65, isSecured: false },
        { SSID: 'Test Network 3', BSSID: '00:00:00:00:00:03', strength: 45, isSecured: true },
      ]);
    } finally {
      setScanning(false);
    }
  };

  const handleNetworkSelect = async (network: WifiNetwork) => {
    try {
      // Attempt to connect to the network
      // Note: This will only work for open networks
      // For secured networks, you'll need to prompt for password
      if (Platform.OS === 'android') {
        await WifiManager.connectToProtectedSSID(network.SSID, '', false, false);
        router.push('/(auth)/connected');
      }
    } catch (error) {
      console.error('Error connecting to network:', error);
      router.push('/(auth)/connecterror');
    }
  };

  const renderWifiNetwork = ({ item }: { item: WifiNetwork }) => (
    <TouchableOpacity 
      style={styles.networkItem}
      onPress={() => handleNetworkSelect(item)}
    >
      <View style={styles.networkInfo}>
        <Text style={styles.networkName}>{item.SSID || 'Unknown Network'}</Text>
        <View style={styles.networkDetails}>
          <Text style={styles.securityText}>
            {item.isSecured ? '🔒' : '🔓'}
          </Text>
          <View style={styles.signalStrength}>
            <Ionicons 
              name="wifi" 
              size={16} 
              color={item.strength > 60 ? '#4CAF50' : item.strength > 30 ? '#FFC107' : '#FF5722'} 
            />
            <Text style={styles.strengthText}>{item.strength}%</Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#666" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Device</Text>
      <View style={styles.underline} />

      <View style={styles.deviceList}>
        {scanning ? (
          <FlatList
            data={[1,2,3,4,5]} // Number of skeleton items to show
            renderItem={() => <SkeletonItem />}
            keyExtractor={(item) => item.toString()}
            style={styles.networkList}
            contentContainerStyle={styles.networkListContent}
          />
        ) : (
          <FlatList
            data={wifiNetworks}
            renderItem={renderWifiNetwork}
            keyExtractor={item => item.BSSID}
            style={styles.networkList}
            contentContainerStyle={styles.networkListContent}
          />
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => router.push('/(auth)/connected')}
        >
          <Text style={styles.buttonText}>Skip</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={() => scanWifiNetworks()}
        >
          <Text style={styles.buttonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8FF',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontFamily: Fonts.bold,
    color: '#4444FF',
    textAlign: 'center',
    marginTop: 24,
  },
  underline: {
    height: 3,
    backgroundColor: '#4444FF',
    width: 120,
    alignSelf: 'center',
    marginTop: 8,
    borderRadius: 1.5,
  },
  deviceList: {
    flex: 1,
    marginTop: 32,
  },
  networkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#4444FF',
    shadowColor: '#4444FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  networkInfo: {
    flex: 1,
  },
  networkName: {
    fontSize: 18,
    fontFamily: Fonts.medium,
    marginBottom: 6,
    color: '#333',
  },
  networkDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  securityText: {
    marginRight: 12,
    fontSize: 16,
  },
  signalStrength: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEEEFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  strengthText: {
    marginLeft: 6,
    color: '#666',
    fontFamily: Fonts.regular,
    fontSize: 14,
  },
  skeletonLine: {
    backgroundColor: '#E1E9EE',
    borderRadius: 8,
    overflow: 'hidden',
  },
  skeletonCircle: {
    backgroundColor: '#E1E9EE',
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
    paddingBottom: 16,
  },
  button: {
    flex: 1,
    backgroundColor: '#4444FF',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
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
  networkList: {
    flex: 1,
  },
  networkListContent: {
    paddingHorizontal: 2,
    paddingBottom: 20,
  },
});
