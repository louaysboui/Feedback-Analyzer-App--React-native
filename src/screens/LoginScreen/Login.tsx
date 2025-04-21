import { View, Text, SafeAreaView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import React, { useRef, useState } from 'react'; // Add useState to manage modal visibility
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Colors from '../../constants/Colors';
import { RootStackParamList } from '../../../App';
import FontSize from '../../constants/FontSize';
import Spacing from '../../constants/Spacing';
import AppTextInput from '../../components/AppTextInput';
import { supabase } from "../../../lib/supabase";
import { useAuth } from '../../components/AuthContext';

type User = {
  id: string;
  email: string;
  name: string;
  occupation: string;
  phone: string;
  location: string;
  profileImage?: string;
};

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

const LoginScreen: React.FC<Props> = ({ navigation: { navigate } }) => {
  const { setAuth } = useAuth();
  const emailRef = useRef("");
  const passwordRef = useRef("");
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<{ email?: string; password?: string }>({});
  // Add state for modal visibility and email input
  const [isForgotPasswordModalVisible, setIsForgotPasswordModalVisible] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');

  const handleLogin = async () => {
    const email = emailRef.current.trim();
    const password = passwordRef.current.trim();

    if (!email || !password) {
      Alert.alert("Login", "Please fill all the fields!");
      return;
    }

    setLoading(true);
    const { data: { session }, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      Alert.alert("Sign in Error", error.message);
    } else if (session?.user) {
      const userData: User = {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata?.name || '',
        occupation: session.user.user_metadata?.occupation || '',
        phone: session.user.user_metadata?.phone || '',
        location: session.user.user_metadata?.location || '',
        profileImage: session.user.user_metadata?.profileImage || '',
      };
      setAuth(userData);
      navigate("Tabs");
    }
  };

  const validatePassword = (password: string) => {
    let passwordError = "";
    if (password.length < 8) {
      passwordError = "Error: Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(password)) {
      passwordError = "Error: Password must contain at least one uppercase letter";
    } else if (!/[0-9]/.test(password)) {
      passwordError = "Error: Password must contain at least one number";
    }

    setErrors((prevErrors) => {
      const updatedErrors = { ...prevErrors };
      if (passwordError) {
        updatedErrors.password = passwordError;
      } else {
        delete updatedErrors.password;
      }
      return updatedErrors;
    });

    return passwordError === "";
  };

  const validateEmail = (email: string) => {
    let emailError = "";
    if (!email.includes("@")) {
      emailError = "Error: '@' is required";
    } else if (!email.includes(".")) {
      emailError = "Error: '.' is required";
    } else if (email.length < 5) {
      emailError = "Error: Email is too short";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        emailError = "Invalid email format";
      }
    }

    setErrors((prevErrors) => {
      const updatedErrors = { ...prevErrors };
      if (emailError) {
        updatedErrors.email = emailError;
      } else {
        delete updatedErrors.email;
      }
      return updatedErrors;
    });

    return emailError === "";
  };

  // Add handler for "Forgot your password?" click
  const handleForgotPassword = () => {
    setIsForgotPasswordModalVisible(true);
  };

  // Add handler to send reset email
  const handleSendResetEmail = async () => {
    if (!forgotPasswordEmail.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
      redirectTo: 'myapp://reset-password',
    });
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Password reset email sent');
      setIsForgotPasswordModalVisible(false);
      setForgotPasswordEmail(''); // Reset email input
    }
  };

  return (
    <SafeAreaView>
      <View style={{ padding: Spacing * 2 }}>
        <View style={{ alignItems: "center" }}>
          <Text
            style={{
              fontSize: FontSize.xLarge,
              color: Colors.primary,
              fontFamily: 'Poppins-Bold',
              marginVertical: Spacing * 3,
            }}
          >
            Login here
          </Text>
          <Text
            style={{
              fontFamily: 'Poppins-SemiBold',
              fontSize: FontSize.large,
              maxWidth: "60%",
              textAlign: "center",
            }}
          >
            Welcome back you've been missed!
          </Text>
        </View>

        {/* Input Fields */}
        <View style={{ marginVertical: Spacing * 3 }}>
          <AppTextInput
            placeholder="Email"
            onChangeText={(text) => (emailRef.current = text)}
            onBlur={() => validateEmail(emailRef.current)}
          />
          {errors.email && (
            <Text style={{ color: "red", marginLeft: 10 }}>{errors.email}</Text>
          )}
          <AppTextInput
            placeholder="Password"
            isPassword
            onChangeText={(text) => (passwordRef.current = text)}
            onBlur={() => validatePassword(passwordRef.current)}
          />
          {errors.password && <Text style={{ color: "red", marginLeft: 10 }}>{errors.password}</Text>}
        </View>

        <View>
          <TouchableOpacity onPress={handleForgotPassword}>
            <Text
              style={{
                fontFamily: 'Poppins-SemiBold',
                fontSize: FontSize.small,
                color: Colors.primary,
                alignSelf: "flex-end",
              }}
            >
              Forgot your password?
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleLogin}
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
        >
          <Text
            style={{
              fontFamily: 'Poppins-Bold',
              color: Colors.onPrimary,
              textAlign: "center",
              fontSize: FontSize.large,
            }}
          >
            Sign in
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigate("Register")}
          style={{ padding: Spacing }}
        >
          <Text
            style={{
              fontStyle: 'italic',
              fontFamily: 'Poppins-SemiBold',
              color: Colors.text,
              textAlign: "center",
              fontSize: FontSize.small,
            }}
          >
            Create new account
          </Text>
        </TouchableOpacity>

        <View style={{ marginVertical: Spacing * 3 }}>
          <Text
            style={{
              fontFamily: 'Poppins-SemiBold',
              color: Colors.primary,
              textAlign: "center",
              fontSize: FontSize.small,
            }}
          >
            Or continue with
          </Text>

          <View
            style={{
              marginTop: Spacing,
              flexDirection: "row",
              justifyContent: "center",
            }}
          >
            <TouchableOpacity
              style={{
                padding: Spacing,
                backgroundColor: Colors.gray,
                borderRadius: Spacing / 2,
                marginHorizontal: Spacing,
              }}
            >
              <Ionicons
                name="logo-google"
                color={Colors.text}
                size={Spacing * 2}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                padding: Spacing,
                backgroundColor: Colors.gray,
                borderRadius: Spacing / 2,
                marginHorizontal: Spacing,
              }}
            >
              <Ionicons
                name="logo-apple"
                color={Colors.text}
                size={Spacing * 2}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                padding: Spacing,
                backgroundColor: Colors.gray,
                borderRadius: Spacing / 2,
                marginHorizontal: Spacing,
              }}
            >
              <Ionicons
                name="logo-facebook"
                color={Colors.text}
                size={Spacing * 2}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Place the Modal here, at the end of the SafeAreaView */}
        <Modal
          visible={isForgotPasswordModalVisible}
          animationType="slide"
          transparent={true}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10, width: '80%' }}>
              <Text style={{ fontSize: 18, marginBottom: 10 }}>Enter your email to reset password</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10 }}
                value={forgotPasswordEmail}
                onChangeText={setForgotPasswordEmail}
                placeholder="Email"
                keyboardType="email-address"
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <TouchableOpacity onPress={() => setIsForgotPasswordModalVisible(false)}>
                  <Text style={{ color: 'red' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSendResetEmail}>
                  <Text style={{ color: 'blue' }}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;