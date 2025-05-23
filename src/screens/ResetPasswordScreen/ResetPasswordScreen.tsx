import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Linking, SafeAreaView } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import AppTextInput from '../../components/AppTextInput';
import Colors from '../../constants/Colors';
import FontSize from '../../constants/FontSize';
import Spacing from '../../constants/Spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

const ResetPasswordScreen: React.FC<Props> = ({ navigation, route }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});

  // Handle deep link URL and extract access_token and refresh_token from fragment
  const getTokensFromUrl = (url: string) => {
    console.log('Processing URL:', url);
    const regexAccessToken = /access_token=([^&]+)/;
    const regexRefreshToken = /refresh_token=([^&]+)/;
    const matchAccessToken = url.match(regexAccessToken);
    const matchRefreshToken = url.match(regexRefreshToken);
    return {
      accessToken: matchAccessToken ? decodeURIComponent(matchAccessToken[1]) : null,
      refreshToken: matchRefreshToken ? decodeURIComponent(matchRefreshToken[1]) : null,
    };
  };

  const handleUrl = async (url: string | null) => {
    if (url) {
      const { accessToken, refreshToken } = getTokensFromUrl(url);
      console.log('Extracted access token:', accessToken);
      console.log('Extracted refresh token:', refreshToken);
      if (accessToken && refreshToken) {
        setAccessToken(accessToken);
        setRefreshToken(refreshToken);
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          console.log('Session error:', error.message);
          Alert.alert('Session Error', error.message);
        } else {
          console.log('Session set with access token');
        }
      } else {
        console.log('Missing access token or refresh token in URL');
        Alert.alert('Error', 'Invalid reset link');
      }
    } else {
      console.log('No URL provided');
    }
  };

  useEffect(() => {
    const deepLinkUrl = route.params?.deepLinkUrl;
    if (deepLinkUrl) {
      handleUrl(deepLinkUrl);
    }

    const handleInitialUrl = async () => {
      const url = await Linking.getInitialURL();
      console.log('Initial URL:', url);
      if (url && !deepLinkUrl) {
        handleUrl(url);
      }
    };
    handleInitialUrl();

    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('Received dynamic URL:', url);
      handleUrl(url);
    });

    return () => subscription.remove();
  }, [route.params?.deepLinkUrl]);

  // Password validation (same as LoginScreen)
  const validatePassword = (password: string) => {
    let passwordError = '';
    if (password.length < 8) {
      passwordError = 'Error: Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(password)) {
      passwordError = 'Error: Password must contain at least one uppercase letter';
    } else if (!/[0-9]/.test(password)) {
      passwordError = 'Error: Password must contain at least one number';
    }

    setErrors((prevErrors) => {
      const updatedErrors = { ...prevErrors };
      if (passwordError) {
        updatedErrors.newPassword = passwordError;
      } else {
        delete updatedErrors.newPassword;
      }
      return updatedErrors;
    });

    return passwordError === '';
  };

  const validateConfirmPassword = (confirm: string) => {
    let confirmError = '';
    if (confirm !== newPassword) {
      confirmError = 'Error: Passwords do not match';
    }

    setErrors((prevErrors) => {
      const updatedErrors = { ...prevErrors };
      if (confirmError) {
        updatedErrors.confirmPassword = confirmError;
      } else {
        delete updatedErrors.confirmPassword;
      }
      return updatedErrors;
    });

    return confirmError === '';
  };

  const handleResetPassword = async () => {
    const isNewPasswordValid = validatePassword(newPassword);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill out both fields');
      return;
    }

    if (!isNewPasswordValid || !isConfirmPasswordValid) {
      return;
    }

    if (!accessToken || !refreshToken) {
      Alert.alert('Error', 'Missing access token or refresh token');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Password updated');
      await supabase.auth.signOut();
      navigation.navigate('Login');
    }
  };

  return (
    <SafeAreaView>
      <View style={{ padding: Spacing * 2 }}>
        <View style={{ alignItems: 'center' }}>
          <Text
            style={{
              fontSize: FontSize.xLarge,
              color: Colors.primary,
              fontFamily: 'Poppins-Bold',
              marginVertical: Spacing * 3,
            }}
          >
            Reset Password
          </Text>
          <Text
            style={{
              fontFamily: 'Poppins-SemiBold',
              fontSize: FontSize.large,
              maxWidth: '60%',
              textAlign: 'center',
            }}
          >
            Enter your new password below
          </Text>
        </View>

        {/* Input Fields */}
        <View style={{ marginVertical: Spacing * 3 }}>
          <AppTextInput
            placeholder="New Password"
            isPassword
            onChangeText={(text) => {
              setNewPassword(text);
              validatePassword(text);
            }}
            onBlur={() => validatePassword(newPassword)}
          />
          {errors.newPassword && (
            <Text style={{ color: 'red', marginLeft: 10 }}>{errors.newPassword}</Text>
          )}
          <AppTextInput
            placeholder="Confirm Password"
            isPassword
            onChangeText={(text) => {
              setConfirmPassword(text);
              validateConfirmPassword(text);
            }}
            onBlur={() => validateConfirmPassword(confirmPassword)}
          />
          {errors.confirmPassword && (
            <Text style={{ color: 'red', marginLeft: 10 }}>{errors.confirmPassword}</Text>
          )}
        </View>

        <TouchableOpacity
          onPress={handleResetPassword}
          style={{
            padding: Spacing * 2,
            backgroundColor: Colors.primary,
            marginVertical: Spacing * 3,
            borderRadius: Spacing,
            shadowColor: Colors.primary,
            shadowOffset: { width: 0, height: Spacing },
            shadowOpacity: 0.3,
            shadowRadius: Spacing,
          }}
          disabled={loading}
        >
          <Text
            style={{
              fontFamily: 'Poppins-Bold',
              color: Colors.onPrimary,
              textAlign: 'center',
              fontSize: FontSize.large,
            }}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ResetPasswordScreen;