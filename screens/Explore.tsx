import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import FontSize from '../constants/FontSize';
import Colors from '../constants/Colors';
import Spacing from '../constants/Spacing';

// Define navigation types
type RootStackParamList = {
  Explore: undefined;
  Home: undefined;
  Tabs:undefined;
  Login:undefined;
  Register:undefined;
};


type Props = NativeStackScreenProps<RootStackParamList, "Explore">;

const Explore: React.FC<Props> = ({ navigation: { navigate } }) => {


  return (
    <View style={styles.container}>
      {/* Logo with overlay */}
      <View style={styles.logoContainer}>
        <Image source={require('../assets/logo1.png')} style={styles.logo} />
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

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d3d3d3',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    width: 350,
    height: 380,
    resizeMode: 'contain',
  },
  logoSubText: {
    position: 'absolute',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0057D9',
    top: 90,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 18,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    fontSize: 15,
    color: '#555',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#3b30ff',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
export default Explore;



