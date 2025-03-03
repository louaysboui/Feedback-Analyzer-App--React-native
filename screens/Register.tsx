import {
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import React, { useRef } from "react";
import Spacing from "../constants/Spacing";
import FontSize from "../constants/FontSize";
import Colors from "../constants/Colors";
import Ionicons from "react-native-vector-icons/Ionicons";
import AppTextInput from "../components/AppTextInput";
import { supabase } from "../lib/supabase"; // Adjust the path as necessary

const RegisterScreen: React.FC = () => {
  // Using refs to capture user input
  const nameRef = useRef("");
  const emailRef = useRef("");
  const passwordRef = useRef("");
  const confirmPasswordRef = useRef("");
  const [loading, setLoading] = React.useState(false);

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
      options:  { data: { name } },
    });
    setLoading(false);
    console.log("session:", session);
    console.log("error:", error);
    if (error) {
      Alert.alert("Sign up Error", error.message);
    } else {
      Alert.alert("Success", "Sign up successful!");
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
          />
          <AppTextInput
            placeholder="Password"
            secureTextEntry
            onChangeText={(text) => (passwordRef.current = text)}
          />
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
        <TouchableOpacity onPress={() => {}} style={{ padding: Spacing }}>
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
