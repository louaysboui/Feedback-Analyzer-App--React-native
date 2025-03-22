import React from 'react';
import { View, Text, Switch } from 'react-native';
import { useTheme } from '../../components/ThemeContext';

const Settings = () => {
  const { theme, toggleTheme, themeStyles } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: themeStyles.backgroundColor, padding: 20 }}>
      <Text style={{ color: themeStyles.headerColor, fontSize: 24, marginBottom: 20 }}>Settings</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Text style={{ color: themeStyles.textColor }}>Dark Mode</Text>
        <Switch
          value={theme === 'dark'}
          onValueChange={toggleTheme}
          trackColor={themeStyles.switchTrackColor}
          thumbColor={themeStyles.switchThumbColor}
        />
      </View>
    </View>
  );
};

export default Settings;