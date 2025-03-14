import {
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import React, { useRef } from "react";
import Spacing from "../../constants/Spacing";
import FontSize from "../../constants/FontSize";
import Colors from "../../constants/Colors";
import Ionicons from "react-native-vector-icons/Ionicons";
import AppTextInput from "../../components/AppTextInput";
import { supabase } from "../../../lib/supabase"; // Adjust the path as necessary
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../App";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

const RegisterScreen: React.FC <Props>= ({navigation:{navigate}}) => {
  // Using refs to capture user input
  const nameRef = useRef("");
  const emailRef = useRef("");
  const passwordRef = useRef("");
  const confirmPasswordRef = useRef("");
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<{ email?: string; password?: string }>({});

  const handleSignUp = async () => {
    const name = nameRef.current.trim();
    const email = emailRef.current.trim();
    const password = passwordRef.current.trim();
    const confirmPassword = confirmPasswordRef.current.trim();

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setLoading(true);
  const { data: { session }, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  setLoading(false);

  if (error) {
    Alert.alert("Sign up Error", error.message);
  } else {
    // Resend verification email after successful signup
    const { data, error: sendError } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    if (sendError) {
      console.error('Error resending verification email:', sendError.message);
    } else {
      console.log('Verification email resent successfully');
    }

    Alert.alert("Success", "Sign up successful! Please check your email to verify your account.");
  }
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
  
  



  return (
    <SafeAreaView>
      <View style={{ padding: Spacing * 2 }}>
        <View style={{ alignItems: "center" }}>
          <Text
            style={{
              fontSize: FontSize.xLarge,
              color: Colors.primary,
              fontFamily: "Poppins-Bold",
              marginVertical: Spacing * 2,
            }}
          >
            Create account
          </Text>
          <Text
            style={{
              fontFamily: "Poppins-Regular",
              fontSize: FontSize.small,
              maxWidth: "80%",
              textAlign: "center",
              marginBottom: Spacing,
            }}
          >
            Create an account so you can analyze your feedback
          </Text>
        </View>

        {/* Input Fields */}
        <View style={{ marginVertical: Spacing }}>
          <AppTextInput
            placeholder="Name"
            onChangeText={(text) => (nameRef.current = text)}
          />
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
          <AppTextInput
            placeholder="Confirm Password"
            secureTextEntry
            onChangeText={(text) => (confirmPasswordRef.current = text)}
          />
        </View>

        {/* Sign up button */}
        <TouchableOpacity
          onPress={handleSignUp}
          style={{
            padding: Spacing * 2,
            backgroundColor: Colors.primary,
            marginVertical: Spacing,
            borderRadius: Spacing,
            shadowColor: Colors.primary,
            shadowOffset: { width: 0, height: Spacing },
            shadowOpacity: 0.3,
            shadowRadius: Spacing,
          }}
        >
          <Text
            style={{
              fontFamily: "Poppins-Bold",
              color: Colors.onPrimary,
              textAlign: "center",
              fontSize: FontSize.large,
            }}
          >
            Sign up
          </Text>
        </TouchableOpacity>

        {/* Already have an account? */}
        <TouchableOpacity onPress={() => navigate("Login")} style={{ padding: Spacing }}>
          <Text
            style={{
              fontFamily: "Poppins-SemiBold",
              color: Colors.text,
              textAlign: "center",
              fontSize: FontSize.small,
            }}
          >
            Already have an account
          </Text>
        </TouchableOpacity>

        {/* Or continue with */}
        <View style={{ marginVertical: Spacing }}>
          <Text
            style={{
              fontFamily: "Poppins-SemiBold",
              color: Colors.primary,
              textAlign: "center",
              fontSize: FontSize.small,
              marginBottom: Spacing / 2,
            }}
          >
            Or continue with
          </Text>
          <View
            style={{
              marginTop: Spacing / 2,
              flexDirection: "row",
              justifyContent: "center",
            }}
          >
            <TouchableOpacity
              style={{
                padding: Spacing / 1.5,
                backgroundColor: Colors.gray,
                borderRadius: Spacing / 2,
                marginHorizontal: Spacing / 2,
              }}
            >
              <Ionicons
                name="logo-google"
                color={Colors.text}
                size={Spacing * 1.5}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                padding: Spacing / 1.5,
                backgroundColor: Colors.gray,
                borderRadius: Spacing / 2,
                marginHorizontal: Spacing / 2,
              }}
            >
              <Ionicons
                name="logo-apple"
                color={Colors.text}
                size={Spacing * 1.5}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                padding: Spacing / 1.5,
                backgroundColor: Colors.gray,
                borderRadius: Spacing / 2,
                marginHorizontal: Spacing / 2,
              }}
            >
              <Ionicons
                name="logo-facebook"
                color={Colors.text}
                size={Spacing * 1.5}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default RegisterScreen;