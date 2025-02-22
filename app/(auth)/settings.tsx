import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  email: string;
}

export default function SettingsScreen() {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [updatedProfile, setUpdatedProfile] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      let { data, error } = await supabase
        .from('app_user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Create profile if it doesn't exist
        const newProfile = {
          id: user.id,
          email: user.email,
          username: user.email?.split('@')[0] || 'user',
          full_name: '',
          avatar_url: null
        };
        
        const { data: insertedProfile, error: insertError } = await supabase
          .from('app_user_profiles')
          .insert(newProfile)
          .select()
          .single();

        if (insertError) throw insertError;
        data = insertedProfile;
      } else if (error) throw error;

      setProfile(data);
      setUpdatedProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    }
  };

  const handleUpdateProfile = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('app_user_profiles')
        .update(updatedProfile)
        .eq('id', profile.id);

      if (error) throw error;
      setProfile({ ...profile, ...updatedProfile });
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setLoading(true);
        const base64FileData = result.assets[0].base64;
        const filePath = `${profile?.id}/avatar.png`;

        // Upload directly without bucket check
        const { error: uploadError } = await supabase.storage
          .from('user_avatars_2024')
          .upload(filePath, decode(base64FileData), {
            contentType: 'image/png',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('user_avatars_2024')
          .getPublicUrl(filePath);

        const { error: updateError } = await supabase
          .from('app_user_profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', profile?.id);

        if (updateError) throw updateError;

        setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
        Alert.alert('Success', 'Avatar updated successfully');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Error', 'Failed to upload avatar');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleAvatarUpload} style={styles.avatarContainer}>
            {profile?.avatar_url ? (
              <Image 
                source={{ uri: profile.avatar_url }} 
                style={styles.avatar}
              />
            ) : (
              <MaterialCommunityIcons name="account" size={40} color="#4444FF" />
            )}
            <View style={styles.avatarOverlay}>
              <MaterialCommunityIcons name="camera" size={20} color="white" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Profile Information</Text>
            <TouchableOpacity 
              onPress={() => editing ? handleUpdateProfile() : setEditing(true)}
              disabled={loading}
            >
              <MaterialCommunityIcons 
                name={editing ? "check" : "pencil"} 
                size={24} 
                color="#4444FF" 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={editing ? updatedProfile.username : profile?.username}
              onChangeText={(text) => setUpdatedProfile(prev => ({ ...prev, username: text }))}
              editable={editing}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={editing ? updatedProfile.full_name : profile?.full_name}
              onChangeText={(text) => setUpdatedProfile(prev => ({ ...prev, full_name: text }))}
              editable={editing}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.emailText}>{profile?.email}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.signOutButton} 
          onPress={handleSignOut}
        >
          <MaterialCommunityIcons name="logout" size={24} color="#FF4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.navbar}>
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => router.push('/(auth)/home')}
        >
          <MaterialCommunityIcons name="home" size={28} color="#666" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => router.push('/(auth)/control')}
        >
          <MaterialCommunityIcons name="white-balance-sunny" size={28} color="#666" />
          <Text style={styles.navText}>Control</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="cog" size={28} color="#4444FF" />
          <Text style={styles.navText}>Settings</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4444FF" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#EEEEFF',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#4444FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
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
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4444FF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  section: {
    padding: 20,
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Aeonik-Medium',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'Aeonik-Regular',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    color: '#333',
    fontFamily: 'Aeonik-Regular',
  },
  emailText: {
    fontSize: 16,
    color: '#333',
    padding: 12,
    fontFamily: 'Aeonik-Regular',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    margin: 15,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FF4444',
  },
  signOutText: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Aeonik-Medium',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
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
});
