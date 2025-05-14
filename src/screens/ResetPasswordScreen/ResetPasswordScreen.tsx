import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Linking } from 'react-native';
import { supabase } from '../../../lib/supabase'; // adjust path as needed
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

const ResetPasswordScreen: React.FC<Props> = ({ navigation: { navigate } }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ Step 1: Capture deep link URL and extract access_token
  useEffect(() => {
    const getTokenFromUrl = (url: string) => {
      const regex = /access_token=([^&]+)/;
      const match = url.match(regex);
      return match ? decodeURIComponent(match[1]) : null;
    };

    const handleInitialUrl = async () => {
      const url = await Linking.getInitialURL();
      if (url) {
        const token = getTokenFromUrl(url);
        if (token) {
          setAccessToken(token);
          const { error } = await supabase.auth.setSession({
            access_token: token,
            refresh_token: '', // Leave blank; only access_token is needed for reset
          });
          if (error) {
            Alert.alert('Session Error', error.message);
          } else {
            console.log('Session set with access token');
          }
        }
      }
    };

    handleInitialUrl();
  }, []);

  // ✅ Step 2: Handle the password update
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill out both fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!accessToken) {
      Alert.alert('Error', 'Missing access token');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Password updated');
      navigate('Login');
    }
  };

  return (
    <View style={{ padding: 20, marginTop: 50 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Reset Password</Text>

      <TextInput
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10 }}
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder="New Password"
        secureTextEntry
      />
      <TextInput
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 20 }}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Confirm Password"
        secureTextEntry
      />

      <TouchableOpacity
        onPress={handleResetPassword}
        style={{ backgroundColor: 'blue', padding: 15, borderRadius: 5 }}
        disabled={loading}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          {loading ? 'Updating...' : 'Update Password'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ResetPasswordScreen;
