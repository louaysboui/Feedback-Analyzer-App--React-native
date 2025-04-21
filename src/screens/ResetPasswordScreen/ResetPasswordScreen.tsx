import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../../../lib/supabase'; // adjust path
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from "../../../App";

type Props = NativeStackScreenProps<RootStackParamList, "ResetPassword">;

const ResetPasswordScreen: React.FC<Props> = ({ navigation: { navigate } }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleResetPassword = async () => {
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }
        if (!newPassword) {
            Alert.alert('Error', 'Please enter a new password');
            return;
        }
        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        setLoading(false);
        if (error) {
            Alert.alert('Error', error.message);
        } else {
            Alert.alert('Success', 'Password updated successfully');
            navigate('Login');
        }
    };

    useEffect(() => {
        console.log('ResetPasswordScreen loaded');
    }, []);

    return (
        <View style={{ padding: 20 }}>
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
            >
                <Text style={{ color: 'white', textAlign: 'center' }}>Update Password</Text>
            </TouchableOpacity>
        </View>
    );
};

export default ResetPasswordScreen;