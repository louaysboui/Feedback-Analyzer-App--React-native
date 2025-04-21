import React, { useState } from 'react';
import { Text, Pressable, Animated, StyleSheet } from 'react-native';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean; // Add the disabled prop
}

const CustomButton: React.FC<CustomButtonProps> = ({ title, onPress }) => {
  const [scale] = useState(new Animated.Value(0));

  const handlePressIn = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scale, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.button}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            borderRadius: 24,
            backgroundColor: 'rgba(150, 93, 233, 1)',
            transform: [{ scaleX: scale }],
            opacity: scale.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.5],
            }),
          },
        ]}
      />
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'relative',
    overflow: 'hidden',
    height: 48,
    paddingHorizontal: 1,
    borderRadius: 24,
    backgroundColor: '#3d3a4e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    zIndex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    borderRadius: 24,
    backgroundColor: 'rgba(150, 93, 233, 1)',
    transform: [{ scaleX: 0 }],
  },
});

export default CustomButton;
