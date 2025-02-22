import { View, Text, TouchableOpacity, StyleSheet, FlatList, Platform, Animated, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import WifiManager from 'react-native-wifi-reborn';
import * as Location from 'expo-location';
import { Fonts } from '@/constants/Styles';
import NetInfo from '@react-native-community/netinfo';

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
  const [currentNetwork, setCurrentNetwork] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'android') {
      checkCurrentConnectionAndScan();
    }
  }, []);

  const checkCurrentConnectionAndScan = async () => {
    try {
      const netInfo = await NetInfo.fetch();
      if (netInfo.type === 'wifi' && netInfo.details?.ssid) {
        setCurrentNetwork(netInfo.details.ssid);
      }
      requestPermissionsAndScan();
    } catch (error) {
      console.error('Error checking current connection:', error);
    }
  };

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
      Alert.alert('Not Supported', 'WiFi scanning is not available on iOS');
      return;
    }

    try {
      setScanning(true);
      
      // Check if WiFi is enabled
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isWifiEnabled) {
        Alert.alert('WiFi Required', 'Please enable WiFi to scan for networks');
        return;
      }

      // Request location permission (required for WiFi scanning)
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is required to scan WiFi networks');
        return;
      }

      // Scan for networks
      const networks = await WifiManager.loadWifiList();
      
      const formattedNetworks = networks.map(network => ({
        SSID: network.SSID,
        BSSID: network.BSSID,
        strength: Math.min(Math.abs(network.level), 100), // Convert dBm to percentage
        isSecured: network.capabilities.includes('WPA') || 
                   network.capabilities.includes('WEP') || 
                   network.capabilities.includes('PSK'),
      }));

      // Sort networks by signal strength
      const sortedNetworks = formattedNetworks
        .filter(network => network.SSID) // Remove networks with empty SSID
        .sort((a, b) => b.strength - a.strength);

      setWifiNetworks(sortedNetworks);
    } catch (error) {
      console.error('Error scanning WiFi:', error);
      Alert.alert('Error', 'Failed to scan WiFi networks. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const handleNetworkSelect = async (network: WifiNetwork) => {
    try {
      if (network.isSecured) {
        // For secured networks, navigate to a password input screen
        router.push({
          pathname: '/(auth)/wifi-password' as const,
          params: { ssid: network.SSID, bssid: network.BSSID }
        });
      } else {
        // For open networks, try to connect directly
        await WifiManager.connectToProtectedSSID(network.SSID, '', false, false);
        router.push('/(auth)/connected');
      }
    } catch (error) {
      console.error('Error connecting to network:', error);
      Alert.alert('Error', 'Failed to connect to network');
    }
  };

  const handleSkip = async () => {
    try {
      const netInfo = await NetInfo.fetch();
      
      if (netInfo.type === 'wifi' && netInfo.isConnected) {
        // Device is connected to WiFi
        router.push('/(auth)/connected');
      } else {
        // Device is not connected
        router.push('/(auth)/connecterror');
      }
    } catch (error) {
      console.error('Error checking connection:', error);
      // If there's an error checking connection, assume not connected
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

      {currentNetwork && (
        <View style={styles.currentConnection}>
          <View style={styles.connectionHeader}>
            <Ionicons 
              name="wifi" 
              size={24} 
              color="#4444FF"
            />
            <View style={styles.headerTexts}>
              <Text style={styles.currentConnectionTitle}>Current Connection</Text>
              <Text style={styles.currentConnectionNetwork}>{currentNetwork}</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={() => router.push('/(auth)/connected')}
          >
            <View style={styles.buttonContent}>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.continueButtonText}>Continue with Current Network</Text>
                <Text style={styles.buttonSubtext}>Device is already connected</Text>
              </View>
              <View style={styles.arrowContainer}>
                <Ionicons name="arrow-forward" size={20} color="#4444FF" />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}

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
          style={[styles.button, styles.skipButton]} 
          onPress={handleSkip}
        >
          <Text style={[styles.buttonText, styles.skipButtonText]}>Skip</Text>
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
  currentConnection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 24,
    marginTop: 16,
    borderWidth: 2,
    borderColor: 'rgba(68, 68, 255, 0.1)',
    shadowColor: '#4444FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  connectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTexts: {
    marginLeft: 16,
    flex: 1,
  },
  currentConnectionTitle: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: '#4444FF',
    opacity: 0.8,
  },
  currentConnectionNetwork: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: '#333',
    marginTop: 4,
  },
  continueButton: {
    backgroundColor: '#F8F8FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(68, 68, 255, 0.15)',
    overflow: 'hidden',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  buttonTextContainer: {
    flex: 1,
  },
  continueButtonText: {
    color: '#4444FF',
    fontSize: 16,
    fontFamily: Fonts.medium,
    marginBottom: 4,
  },
  buttonSubtext: {
    color: '#666',
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(68, 68, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#4444FF',
  },
  skipButtonText: {
    color: '#4444FF',
  },
});
