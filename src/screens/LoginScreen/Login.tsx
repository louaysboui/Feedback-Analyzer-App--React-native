import { View, Text, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import React, { useRef } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Colors from '../../constants/Colors';
import { RootStackParamList } from '../../../App';
import FontSize from '../../constants/FontSize';
import Spacing from '../../constants/Spacing';
import AppTextInput from '../../components/AppTextInput';
import { supabase } from "../../../lib/supabase"; // Adjust the path as necessary
import { useAuth } from '../../components/AuthContext';

type User = {
  id: string;
  email: string;
  name: string;
};

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

const LoginScreen: React.FC<Props> = ({ navigation: { navigate } }) => {
  const { setAuth } = useAuth();
  const emailRef = useRef("");
  const passwordRef = useRef("");
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<{ email?: string; password?: string }>({});  

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
      };
      setAuth(userData); // This will persist the user in AsyncStorage via AuthContext
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
        // Remove password error if validation passes
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
      // Regular email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        emailError = "Invalid email format";
      }
    }
  
    // Update state: if there's an error, set it; otherwise, remove the email error.
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
            onBlur={() => validateEmail(emailRef.current)} // Trigger validation on leaving input
            />
            {errors.email && (
            <Text style={{ color: "red", marginLeft: 10 }}>{errors.email}</Text>
            )}
          <AppTextInput
            placeholder="Password"
            secureTextEntry
             onChangeText={(text) => (passwordRef.current = text)}
            onBlur={() => validatePassword(passwordRef.current)}
              />
            {errors.password && <Text style={{ color: "red", marginLeft: 10 }}>{errors.password}</Text>}
        </View>

        <View>
          <Text
            style={{
              fontFamily: 'Poppins-SemiBold',
              fontSize: FontSize.small,
              color: Colors.primary,
              alignSelf: "flex-end",
            }}
          >
            Forgot your password ?
          </Text>
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
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;