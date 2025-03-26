import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ImageLibraryOptions, launchImageLibrary } from 'react-native-image-picker';
import { useAuth } from '../../components/AuthContext';
import styles from './ProfileStyles';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { Picker } from '@react-native-picker/picker';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

interface User {
  id: string;
  email: string;
  name?: string;
  occupation?: string;
  phone?: string;
  location?: string;
  profileImage?: string;
  imageFile?: { uri: string; type: string; name: string } | null;
}

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

const Profile: React.FC<Props> = ({ navigation: { navigate } }) => {
  const { user, setUserData } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [occupation, setOccupation] = useState(user?.occupation || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [location, setLocation] = useState(user?.location || '');
  const [profileImage, setProfileImage] = useState<string | undefined>(user?.profileImage ?? undefined);
  const [imageFile, setImageFile] = useState<{ uri: string; type: string; name: string } | null>(null);
  const [countryCode, setCountryCode] = useState('+216');

  const displayName = user?.name || 'Your Name';
  const displayLocation = location || 'Your Location';
  const displayEmail = user?.email || 'Email Address';

  const requestStoragePermission = async () => {
    if (Platform.OS !== 'android') return true; // No need for permission on iOS (handled by Info.plist)

    const permission = Platform.Version >= 33
      ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
      : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;

    const result = await check(permission);
    if (result === RESULTS.GRANTED) {
      return true;
    }

    const requestResult = await request(permission);
    return requestResult === RESULTS.GRANTED;
  };

  const selectImage = async () => {
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Storage permission is required to select an image.');
      return;
    }

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
        const asset = response.assets[0];
        if (asset.uri) {
          setProfileImage(asset.uri);
          setImageFile({
            uri: asset.uri,
            type: asset.type || 'image/jpeg',
            name: asset.fileName || `profile-${Date.now()}.jpg`,
          });
          Alert.alert('Success', 'Profile image selected. Save to upload.');
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
      phone: `${countryCode}${phone}`,
      location,
      profileImage: imageFile ? imageFile.uri : profileImage,
      imageFile,
    };

    try {
      await setUserData(updatedUserData);
      Alert.alert('Success', 'Profile updated successfully!');
      setImageFile(null);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  };

  const cancelEdit = () => {
    navigate('Tabs');
  };

  const countryCodes = [
    { label: '🇹🇳 Tunisia (+216)', value: '+216' },
    { label: '🇺🇸 United States (+1)', value: '+1' },
    { label: '🇬🇧 United Kingdom (+44)', value: '+44' },
    { label: '🇫🇷 France (+33)', value: '+33' },
  ];

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
        <Text style={styles.infoText}>
          <Icon name="location-outline" size={16} /> Location: {displayLocation}
        </Text>
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
          <View style={styles.phoneInputContainer}>
            <Picker
              selectedValue={countryCode}
              style={styles.countryPicker}
              itemStyle={{ color: '#000' }}
              onValueChange={(value) => setCountryCode(value)}
            >
              {countryCodes.map((country) => (
                <Picker.Item
                  key={country.value}
                  label={country.label}
                  value={country.value}
                />
              ))}
            </Picker>
            <TextInput
              style={styles.phoneInput}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
            />
          </View>
        </View>
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