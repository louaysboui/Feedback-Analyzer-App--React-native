import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, TextInput, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ImageLibraryOptions, launchImageLibrary } from 'react-native-image-picker';
import { useAuth } from '../../components/AuthContext';
import styles from './ProfileStyles';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';

interface User {
  id: string;
  email: string;
  name?: string;
  occupation?: string;
  phone?: string;
  location?: string;
  profileImage?: string;
}

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

const Profile: React.FC<Props> = ({ navigation: { navigate } }) => {
  const { user, setUserData } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [occupation, setOccupation] = useState(user?.occupation || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [location, setLocation] = useState(user?.location || '');
  const [profileImage, setProfileImage] = useState<string | undefined>(user?.profileImage ?? undefined);

  const displayName = user?.name || 'Your Name';
  const displayLocation = location || 'Your Location';
  const displayEmail = user?.email || 'Email Address';

  const selectImage = () => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      quality: 1 as const,
      maxWidth: 300,
      maxHeight: 300,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image selection');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
        Alert.alert('Error', 'Failed to select an image. Please try again.');
      } else if (response.assets && response.assets.length > 0) {
        const source = response.assets[0].uri;
        if (source) {
          setProfileImage(source);
          Alert.alert('Success', 'Profile image updated locally.');
        } else {
          Alert.alert('Error', 'No image selected.');
        }
      } else {
        Alert.alert('Error', 'Unexpected error occurred. Please try again.');
      }
    });
  };

  const saveProfile = async () => {
    if (!user || !user.id || !user.email) {
      Alert.alert('Error', 'Cannot save profile: User ID or email is missing.');
      return;
    }

    const updatedUserData: Partial<User> = {
      name,
      occupation,
      phone,
      location,
      profileImage,
    };

    try {
      await setUserData(updatedUserData);
      Alert.alert('Success', 'Save complete!');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  };

  const cancelEdit = () => {
    navigate('Tabs');
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.image} key={profileImage} />
        ) : (
          <Icon name="person-circle-outline" size={100} color="#ccc" />
        )}
        <TouchableOpacity style={styles.editIcon} onPress={selectImage}>
          <Icon name="camera" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.viewDetailsContainer}>
        <Text style={styles.nameText}>{displayName}</Text>
        <Text style={styles.infoText}><Icon name="location-outline" size={16} /> Location: {displayLocation}</Text>
        <Text style={styles.infoText}>Email: {displayEmail}</Text>
      </View>
      <View style={styles.editDetailsContainer}>
        <View style={styles.inputRow}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
          />
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.label}>Occupation</Text>
          <TextInput
            style={styles.input}
            value={occupation}
            onChangeText={setOccupation}
            placeholder="Enter your occupation"
          />
        </View>
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
        <View style={styles.inputRow}>
          <Text style={styles.label}> Location</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Enter your location"
          />
        </View>
      </View>
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