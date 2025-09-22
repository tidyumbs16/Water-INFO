import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated, Dimensions, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5 } from "@expo/vector-icons";

// ---- กำหนด type เบื้องต้นของเส้นทางที่ใช้จริง ----
type RootStackParamList = {
  Tabs: undefined;
  Home?: undefined;
};

// ✅ ฮุกนำทางแบบ require runtime เพื่อหลบ ESM/CJS conflict
type NavLike = {
  navigate: (screen: keyof RootStackParamList | string, params?: any) => void;
  goBack: () => void;
};
function useNav(): NavLike {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useNavigation } = require("@react-navigation/native");
  return useNavigation();
}

// Splash / Welcome Screen for AquaFlow
export default function AquaFlowSplash() {
  const { width, height } = Dimensions.get("window");
  const navigation = useNav();

  // Floating animations
  const float1 = useRef(new Animated.Value(0)).current;
  const float2 = useRef(new Animated.Value(0)).current;
  const float3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const floatAnimation = (value: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: -10,
            duration: 2000,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    floatAnimation(float1, 0);
    floatAnimation(float2, 400);
    floatAnimation(float3, 800);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.phoneContainer}>
        <LinearGradient
          colors={["#dbeafe", "#bfdbfe", "#e0f7fa"]}
          style={{ flex: 1, padding: 24, justifyContent: "space-between" }}
        >
          {/* Header / Logo */}
          <View style={{ alignItems: "center", marginTop: 80 }}>
            <FontAwesome5 name="tint" size={70} color="#3b82f6" style={{ marginBottom: 20 }} />
            <Text style={{ fontSize: 44, fontWeight: "900", color: "#1e3a8a" }}>AquaFlow</Text>
            <Text style={{ fontSize: 18, color: "#334155", textAlign: "center", marginTop: 8 }}>
              ระบบติดตามคุณภาพน้ำอัจฉริยะ
            </Text>
          </View>

          {/* Animated Icons */}
          <View style={styles.card}>
            <View style={{ flexDirection: "row", justifyContent: "center" }}>
              <Animated.View style={{ transform: [{ translateY: float1 }], marginHorizontal: 20 }}>
                <FontAwesome5 name="water" size={60} color="#0284c7" />
              </Animated.View>

              <Animated.View style={{ transform: [{ translateY: float3 }], marginHorizontal: 20 }}>
                <FontAwesome5 name="seedling" size={60} color="#10b981" />
              </Animated.View>
            </View>
          </View>

          {/* Action Section */}
          <View style={{ alignItems: "center", marginBottom: 100 }}>
            <TouchableOpacity
              style={{ borderRadius: 30, overflow: "hidden", width: "80%", marginBottom: 16 }}
              activeOpacity={0.9}
              onPress={() => navigation.navigate("Tabs")}
            >
              <LinearGradient
                colors={["#3b82f6", "#0ea5e9"]}
                style={{ paddingVertical: 16, alignItems: "center" }}
              >
                <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>เริ่มต้นใช้งาน</Text>
              </LinearGradient>
            </TouchableOpacity>
            <Text style={{ color: "#475569", fontSize: 14 }}>
              ยินดีต้อนรับสู่ AquaFlow!
            </Text>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },
  phoneContainer: {
    width: Dimensions.get("window").width * 0.95,
    height: Dimensions.get("window").height * 0.95,
    maxWidth: 450,
    maxHeight: 900,
    borderRadius: 40,
    overflow: "hidden",
    backgroundColor: "#dbeafe",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 32,
    alignItems: "center",
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  navigationButton: {
    borderRadius: 30,
    overflow: "hidden",
    width: "80%",
    marginBottom: 16,
  },
});
