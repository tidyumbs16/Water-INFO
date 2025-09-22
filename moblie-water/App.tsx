import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Stack screens
import Main from './screens/Main';
import LoadingScreen from './screens/LoadingScreen';
import StationDetailScreen from './screens/StationDetailScreen';
import RegionDetailScreen from './screens/RegionDetailScreen';
// Tab Navigator
import MainTabs from './screens/MainTabs';
import { Home } from 'lucide-react-native';
import AnalyticsScreen from './screens/AnalyticsScreen';

// Define the params type for StationDetail route
export type StationDetailParams = {
  districtId: string;
  districtName: string;
};

export type RootStackParamList = {
  Main: undefined;              // splash/welcome
  LoadingScreen: undefined; 
    Home: undefined;      // loading
  Tabs: undefined;       
  RegionDetail: undefined;       // 👈 bottom tab navigator
  StationDetail: StationDetailParams;
  Analytics: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Main">
        {/* Splash / Welcome */}
        <Stack.Screen name="Main" component={Main} options={{ headerShown: false }} />

        {/* Loading */}
        <Stack.Screen name="LoadingScreen" component={LoadingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={Home} options={{ headerShown: false }} />

        {/* Bottom Tabs (Home, Selected, Notifications, Profile) */}
        <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />

 <Stack.Screen name="RegionDetail" component={RegionDetailScreen} options={{ headerShown: false }} />
        {/* Station detail page */}
        <Stack.Screen
          name="StationDetail"
          component={StationDetailScreen}
          initialParams={{ districtId: '', districtName: '' }}
          options={{ title: 'รายละเอียดเขตประปา' }}
        />
        <Stack.Screen name="Analytics" component={AnalyticsScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
