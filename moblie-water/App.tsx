import "react-native-gesture-handler";
import React, { Suspense } from "react";

// ✅ โหลดเฉพาะไลบรารีที่เป็น ESM แบบ dynamic (แก้ CJS/ESM conflict)
const NavigationContainer = React.lazy(() =>
  import("@react-navigation/native").then((m) => ({
    default: m.NavigationContainer,
  }))
);

// ---- หน้าจอของโปรเจกต์ (import ปกติ, ไม่ต้องใส่ .tsx ต่อท้าย) ----
import Main from "./screens/Main";
import LoadingScreen from "./screens/LoadingScreen";
import StationDetailScreen from "./screens/StationDetailScreen";
import RegionDetailScreen from "./screens/RegionDetailScreen";
import MainTabs from "./screens/MainTabs";
import AnalyticsScreen from "./screens/AnalyticsScreen";

// ---- Types ของการนำทาง ----
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

// ✅ คอมโพเนนต์ที่ lazy-load @react-navigation/stack แล้วสร้าง Stack ให้เรา
const StackNavigator = React.lazy(async () => {
  const { createStackNavigator } = await import("@react-navigation/stack");
  const Stack = createStackNavigator<RootStackParamList>();

  const StackComponent: React.FC = () => (
    <Stack.Navigator initialRouteName="Main">
      {/* Splash / Welcome */}
      <Stack.Screen name="Main" component={Main} options={{ headerShown: false }} />

      {/* Loading */}
      <Stack.Screen
        name="LoadingScreen"
        component={LoadingScreen}
        options={{ headerShown: false }}
      />

      {/* Bottom Tabs */}
      <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />

      {/* Region Detail */}
      <Stack.Screen
        name="RegionDetail"
        component={RegionDetailScreen}
        options={{ headerShown: false }}
      />

      {/* Station Detail */}
      <Stack.Screen
        name="StationDetail"
        component={StationDetailScreen}
        initialParams={{ districtId: "", districtName: "" }}
        options={{ title: "รายละเอียดเขตประปา" }}
      />

      {/* Analytics */}
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />
    </Stack.Navigator>
  );

  return { default: StackComponent };
});

const App: React.FC = () => {
  return (
    // ใส่ fallback UI ตามชอบได้ (เช่น ActivityIndicator)
    <Suspense fallback={null}>
      <NavigationContainer>
        <StackNavigator />
      </NavigationContainer>
    </Suspense>
  );
};

export default App;
