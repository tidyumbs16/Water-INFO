import "react-native-gesture-handler";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

// ---- Screens ----
import Main from "./screens/Main";
import LoadingScreen from "./screens/LoadingScreen";
import StationDetailScreen from "./screens/StationDetailScreen";
import RegionDetailScreen from "./screens/RegionDetailScreen";
import MainTabs from "./screens/MainTabs";
import AnalyticsScreen from "./screens/AnalyticsScreen";

export type StationDetailParams = {
  districtId: string;
  districtName: string;
};

export type RootStackParamList = {
  Main: undefined;
  LoadingScreen: undefined;
  Tabs: undefined;
  RegionDetail: undefined;
  StationDetail: StationDetailParams;
  Analytics: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Main">
        <Stack.Screen name="Main" component={Main} options={{ headerShown: false }} />
        <Stack.Screen name="LoadingScreen" component={LoadingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="RegionDetail" component={RegionDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="StationDetail"
          component={StationDetailScreen}
          initialParams={{ districtId: "", districtName: "" }}
          options={{ title: "รายละเอียดเขตประปา" }}
        />
        <Stack.Screen name="Analytics" component={AnalyticsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
