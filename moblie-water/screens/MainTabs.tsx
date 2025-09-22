import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesome5 } from '@expo/vector-icons';

// Screens
import HomeScreen from '../screens/HomeScreen';
import SelectedScreen from '../screens/Selected';


export type RootTabParamList = {
  Home: undefined;
  Selected: undefined;
  Notifications: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#0284c7',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          height: 70,
          paddingBottom: 6,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: string = 'home';
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Selected') iconName = 'chart-line';
          else if (route.name === 'Notifications') iconName = 'bell';
          else if (route.name === 'Profile') iconName = 'user';
          return <FontAwesome5 name={iconName as any} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'หน้าหลัก' }} />
      <Tab.Screen name="Selected" component={SelectedScreen} options={{ title: 'ตรวจสอบเขต' }} />
    </Tab.Navigator>
  );
}
