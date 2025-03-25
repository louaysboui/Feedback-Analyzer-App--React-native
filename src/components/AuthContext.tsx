import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { Alert } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';

interface User {
  id: string;
  email: string;
  name?: string;
  occupation?: string;
  phone?: string;
  location?: string;
  profileImage?: string;
  role?: string;
  imageFile?: { uri: string; type: string; name: string } | null;
}

interface AuthContextType {
  user: User | null;
  setAuth: (authUser: User | null) => void;
  setUserData: (userData: Partial<User>) => Promise<void>;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (error) throw error;
          const fullUser: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: userData.name || '',
            occupation: userData.occupation || '',
            phone: userData.phone || '',
            location: userData.location || '',
            profileImage: userData.profileImage || '',
            role: userData.role || 'user',
          };
          setUser(fullUser);
          await AsyncStorage.setItem('user', JSON.stringify(fullUser));

          const storedWelcome = await AsyncStorage.getItem('welcomeShown');
          if (!storedWelcome) {
            Alert.alert('Welcome', `Welcome, ${fullUser.name || 'User'}!`);
            await AsyncStorage.setItem('welcomeShown', 'true');
            setIsFirstLogin(false);
          } else {
            setIsFirstLogin(false);
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data: userData, error }) => {
            if (error) {
              console.error('Error fetching user data:', error);
              return;
            }
            const fullUser: User = {
              id: session.user.id,
              email: session.user.email || '',
              name: userData.name || '',
              occupation: userData.occupation || '',
              phone: userData.phone || '',
              location: userData.location || '',
              profileImage: userData.profileImage || '',
              role: userData.role || 'user',
            };
            setUser(fullUser);
            AsyncStorage.setItem('user', JSON.stringify(fullUser));
          });
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        AsyncStorage.removeItem('user');
        AsyncStorage.removeItem('welcomeShown');
        setIsFirstLogin(true);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const setAuth = async (authUser: User | null) => {
    setUser(authUser);
    if (authUser) {
      await AsyncStorage.setItem('user', JSON.stringify(authUser));
    } else {
      await AsyncStorage.removeItem('user');
    }
  };

  const setUserData = async (userData: Partial<User>) => {
    if (!user) {
      console.warn('Cannot update user data: No user is logged in.');
      return;
    }

    const updatedUser: User = { ...user, ...userData };
    setUser(updatedUser);
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

    // Handle profile image upload if provided
    let profileImageUrl = updatedUser.profileImage;
    if (updatedUser.imageFile) {
      try {
        const filePath = `profile-images/${updatedUser.imageFile.name}`;

        // Read the file using react-native-blob-util
        const fileData = await ReactNativeBlobUtil.fs.readFile(updatedUser.imageFile.uri, 'base64');
        const blob = new Blob([fileData], { type: updatedUser.imageFile.type, lastModified: Date.now() });

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('profile-images')
          .upload(filePath, blob, {
            contentType: updatedUser.imageFile.type,
            upsert: true, // Overwrite if the file already exists
          });

        if (uploadError) {
          console.error('Failed to upload profile image:', uploadError);
          throw uploadError;
        }

        // Get the public URL
        const { data } = supabase.storage
          .from('profile-images')
          .getPublicUrl(filePath);

        if (!data?.publicUrl) {
          throw new Error('Failed to get public URL for profile image');
        }

        profileImageUrl = data.publicUrl;
        updatedUser.profileImage = profileImageUrl;
      } catch (error) {
        console.error('Error uploading profile image:', error);
        throw error;
      }
    }

    // Update auth.users metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        name: updatedUser.name,
        occupation: updatedUser.occupation,
        phone: updatedUser.phone,
        location: updatedUser.location,
        profileImage: profileImageUrl,
      },
    });

    if (authError) {
      console.error('Failed to update user metadata in Supabase:', authError);
      throw authError;
    }

    // Update public.users table
    const { error: dbError } = await supabase
      .from('users')
      .update({
        name: updatedUser.name,
        email: updatedUser.email,
        occupation: updatedUser.occupation,
        phoneNumber: updatedUser.phone,
        location: updatedUser.location,
        image: profileImageUrl,
        role: updatedUser.role,
      })
      .eq('id', updatedUser.id);

    if (dbError) {
      console.error('Failed to update user data in public.users:', dbError);
      throw dbError;
    }

    // Update local state with the new profile image URL
    setUser(updatedUser);
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    await AsyncStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, setAuth, setUserData, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};