import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import FontSize from '../../constants/FontSize';
import Colors from '../../constants/Colors';
import Spacing from '../../constants/Spacing';
import { styles } from './ExploreStyles';


// Define navigation types
type RootStackParamList = {
  Explore: undefined;
  Home: undefined;
  Tabs: undefined;
  Login: undefined;
  Register: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, "Explore">;

const Explore: React.FC<Props> = ({ navigation: { navigate } }) => {
  return (
    <View style={styles.container}>
      {/* Logo with overlay */}
      <View style={styles.logoContainer}>
        <Image source={require('../../assets/images/logo1.png')} style={styles.logo} />
      </View>

      {/* Welcome Message */}
      <Text style={styles.welcomeText}>WELCOME TO FEEDBACK ANALYZER!</Text>

      {/* Description */}
      <Text style={styles.description}>
        UNDERSTAND EMOTIONS IN REAL-TIME!{'\n'}
        ✨ ENTER YOUR THOUGHTS, ANALYZE FEEDBACK,{'\n'}
        AND GAIN INSIGHTS INSTANTLY.{'\n'}
        LET’S MAKE EVERY WORD COUNT!
      </Text>

      {/* Get Started Button */}
      <View
        style={{
          paddingHorizontal: Spacing * 2,
          paddingTop: Spacing * 6,
          flexDirection: "row",
        }}
      >
        <TouchableOpacity
          onPress={() => navigate("Login")}
          style={{
            backgroundColor: Colors.primary,
            paddingVertical: Spacing * 1.5,
            paddingHorizontal: Spacing * 2,
            width: "48%",
            borderRadius: Spacing,
            shadowColor: Colors.primary,
            shadowOffset: {
              width: 0,
              height: Spacing,
            },
            shadowOpacity: 0.3,
            shadowRadius: Spacing,
          }}
        >
          <Text
            style={{
              fontFamily: 'poppins-bold',
              color: Colors.onPrimary,
              fontSize: FontSize.large,
              textAlign: "center",
            }}
          >
            Login
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigate("Register")}
          style={{
            paddingVertical: Spacing * 1.5,
            paddingHorizontal: Spacing * 2,
            width: "48%",
            borderRadius: Spacing,
            backgroundColor: Colors.darkgray,
            marginLeft: Spacing,
          }}
        >
          <Text
            style={{
              fontFamily: 'poppins-bold',
              color: Colors.text,
              fontSize: FontSize.large,
              textAlign: "center",
            }}
          >
            Register
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Explore;