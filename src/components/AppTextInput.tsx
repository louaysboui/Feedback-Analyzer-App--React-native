import {
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  TouchableOpacity,
} from "react-native";
import React, { useState } from "react";
import Colors from "../constants/Colors";
import Font from "../constants/Font";
import FontSize from "../constants/FontSize";
import Spacing from "../constants/Spacing";
import Ionicons from "react-native-vector-icons/Ionicons"; // Add this import for the eye icon

// Extend TextInputProps to include a custom prop for password fields
interface AppTextInputProps extends TextInputProps {
  isPassword?: boolean; // New prop to identify password fields
}

const AppTextInput: React.FC<AppTextInputProps> = ({ isPassword, ...otherProps }) => {
  const [focused, setFocused] = useState<boolean>(false);
  const [secureText, setSecureText] = useState<boolean>(true); // State to toggle password visibility

  return (
    <View style={styles.container}>
      <TextInput
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholderTextColor={Colors.darkText}
        secureTextEntry={isPassword ? secureText : false} // Use secureText state for password fields
        style={[
          {
            fontFamily: Font["poppins-regular"],
            fontSize: FontSize.small,
            padding: Spacing * 2,
            backgroundColor: Colors.lightPrimary,
            borderRadius: Spacing,
            marginVertical: Spacing,
            flex: 1, // Ensure the input takes up available space
          },
          focused && {
            borderWidth: 3,
            borderColor: Colors.primary,
            shadowOffset: { width: 4, height: Spacing },
            shadowColor: Colors.primary,
            shadowOpacity: 0.2,
            shadowRadius: Spacing,
          },
        ]}
        {...otherProps}
      />
      {isPassword && (
        <TouchableOpacity
          onPress={() => setSecureText(!secureText)}
          style={styles.eyeIcon}
        >
          <Ionicons
            name={secureText ? "eye-off" : "eye"}
            size={Spacing * 2}
            color={Colors.darkText}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  eyeIcon: {
    position: "absolute",
    right: Spacing * 2, // Position the icon inside the input field on the right
  },
});

export default AppTextInput;