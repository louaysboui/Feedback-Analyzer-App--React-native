import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, TextInput, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useAuth } from '../../components/AuthContext';
import styles from './ProfileStyles';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';





type Props = NativeStackScreenProps<RootStackParamList, "Profile">;


const Profile: React.FC<Props> = ({ navigation: { navigate } }) => {
  const { user } = useAuth();

  // State for editable fields, initialized with user data or empty strings
  const [name, setName] = useState(user?.name || '');
  const [occupation, setOccupation] = useState(user?.occupation || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [location, setLocation] = useState(user?.location || '');
  const [profileImage, setProfileImage] = useState(user?.profileImage || null);

  // Function to select a profile image from the device
  const selectImage = () => {
    launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const source = response.assets[0].uri;
        if (source) {
          setProfileImage(source);
        }
        // TODO: Upload the image to your server
      }
    });
  };

  // Function to save profile changes
  const saveProfile = () => {
    // TODO: Implement actual saving logic (e.g., update auth context or send to server)
    console.log('Saving profile:', { name, occupation, phone, location, profileImage });
    Alert.alert('Success', 'Profile saved successfully');
  };

  // Function to cancel and return to the home screen
  const cancelEdit = () => {
    navigate('Tabs'); // Assumes 'Tabs' is the home screen route
  };

  return (
    <View style={styles.container}>
      {/* Profile Image Section */}
      <View style={styles.imageContainer}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.image} />
        ) : (
          <Icon name="person-circle-outline" size={100} color="#ccc" />
        )}
        <TouchableOpacity style={styles.editIcon} onPress={selectImage}>
          <Icon name="camera" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* User Details Section with Labels and Editable Fields */}
      <View style={styles.detailsContainer}>
        {/* Name Field */}
        <View style={styles.inputRow}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
          />
        </View>

        {/* Occupation Field */}
        <View style={styles.inputRow}>
          <Text style={styles.label}>Occupation</Text>
          <TextInput
            style={styles.input}
            value={occupation}
            onChangeText={setOccupation}
            placeholder="Enter your occupation"
          />
        </View>

        {/* Phone Number Field */}
        <View style={styles.inputRow}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
          />
        </View>

        {/* Location Field */}
        <View style={styles.inputRow}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Enter your location"
          />
        </View>
      </View>

      {/* Save and Cancel Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={cancelEdit}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Profile;