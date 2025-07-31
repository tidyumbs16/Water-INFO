// App.tsx (หรือไฟล์ที่คุณกำหนด RootStackParamList)

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import หน้าจอต่างๆ
import HomeScreen from './screens/HomeScreen';
import StationDetailScreen from './screens/StationDetailScreen';
import LoadingScreen from './screens/LoadingScreen';

import Main from './screens/Main';
import Selected from './screens/Selected'

// Define the params type for StationDetail route
export type StationDetailParams = {
  districtId: string;
  districtName: string;
};

export type RootStackParamList = {
  Main: undefined;
  LoadingScreen: undefined;
  Home: undefined;
  Selected: undefined;
  StationDetail: StationDetailParams;
};

const Stack = createStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Main">
         <Stack.Screen name="Main" component={Main} options={{ headerShown: false }} />
        <Stack.Screen name="LoadingScreen"component={LoadingScreen}options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen}  options={{headerShown: false}}/>
       <Stack.Screen  name="Selected" component={Selected} options={{ title: 'เลือกเขตประปา' }} />
        <Stack.Screen name="StationDetail" component={StationDetailScreen} initialParams={{ districtId: '', districtName: '' }}options={{ title: 'รายละเอียดเขตประปา' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
