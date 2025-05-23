import React from 'react';
import { View, Text, Switch, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { useTheme } from '../../components/ThemeContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { supabase } from '../../../lib/supabase';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Colors from '../../constants/Colors';
import Spacing from '../../constants/Spacing';
import FontSize from '../../constants/FontSize';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const Settings: React.FC<Props> = ({ navigation }) => {
  const { theme, toggleTheme, themeStyles } = useTheme();

  const handleChangePassword = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user || !user.email) {
        Alert.alert('Error', 'Please log in to change your password');
        navigation.navigate('Login');
        return;
      }

      const redirectTo = 'myapp://reset-password';
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo,
      });

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Success', 'Password reset email sent. Check your inbox.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Unexpected error');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeStyles.backgroundColor }}>
      <View style={{ padding: Spacing * 2 }}>
        {/* Dark Mode Switch */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: Spacing * 2,
            borderBottomWidth: 1,
            borderBottomColor: Colors.gray,
          }}
        >
          <Text style={{ color: themeStyles.textColor, fontSize: FontSize.medium, fontFamily: 'Poppins-SemiBold' }}>
            Dark Mode
          </Text>
          <Switch
            value={theme === 'dark'}
            onValueChange={toggleTheme}
            trackColor={themeStyles.switchTrackColor}
            thumbColor={themeStyles.switchThumbColor}
          />
        </View>

        {/* List of Options */}
        <View style={{ marginTop: Spacing * 2 }}>
          <TouchableOpacity
            onPress={handleChangePassword}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: Spacing * 1.5,
              paddingHorizontal: Spacing,
              backgroundColor: themeStyles.backgroundColor,
              borderRadius: Spacing,
              marginBottom: Spacing,
              shadowColor: Colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Ionicons
              name="lock-closed-outline"
              size={Spacing * 2.5}
              color={Colors.primary}
              style={{ marginRight: Spacing * 1.5 }}
            />
            <Text
              style={{
                color: themeStyles.textColor,
                fontSize: FontSize.medium,
                fontFamily: 'Poppins-SemiBold',
              }}
            >
              Change Password
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Settings;