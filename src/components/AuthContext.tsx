import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { Alert } from 'react-native';

interface User {
  id: string;
  email: string;
  name?: string;
  occupation?: string;
  phone?: string;
  location?: string;
  profileImage?: string;
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
          const userData: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || '',
            occupation: session.user.user_metadata?.occupation || '',
            phone: session.user.user_metadata?.phone || '',
            location: session.user.user_metadata?.location || '',
            profileImage: session.user.user_metadata?.profileImage || '',
          };
          setUser(userData);
          await AsyncStorage.setItem('user', JSON.stringify(userData));

          const storedWelcome = await AsyncStorage.getItem('welcomeShown');
          if (!storedWelcome) {
            Alert.alert('Welcome', `Welcome, ${userData.name || 'User'}!`);
            await AsyncStorage.setItem('welcomeShown', 'true');
            setIsFirstLogin(false);
          } else {
            setIsFirstLogin(false); // Ensure subsequent app opens don’t trigger
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
        const userData: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || '',
          occupation: session.user.user_metadata?.occupation || '',
          phone: session.user.user_metadata?.phone || '',
          location: session.user.user_metadata?.location || '',
          profileImage: session.user.user_metadata?.profileImage || '',
        };
        setUser(userData);
        AsyncStorage.setItem('user', JSON.stringify(userData));
        // Welcome alert is handled in initializeAuth, not here
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

    const { error } = await supabase.auth.updateUser({
      data: {
        name: updatedUser.name,
        occupation: updatedUser.occupation,
        phone: updatedUser.phone,
        location: updatedUser.location,
        profileImage: updatedUser.profileImage,
      },
    });

    if (error) {
      console.error('Failed to update user metadata in Supabase:', error);
      throw error;
    }
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