// 📄 HomeScreen.tsx (ESM/CJS-safe)
import type { RootStackParamList } from "../App";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from "react-native";

const screenWidth = Dimensions.get("window").width;
const API_BASE_URL = Platform.select({
  ios: "http://localhost:3001",
  android: "http://192.168.7.118:3001",
  default: "http://192.168.7.118:3001",
});

interface DashboardOverview {
  average_quality: number;
  average_volume: number;
  average_pressure: number;
  average_efficiency: number;
}

// ✅ ทำ nav hook ที่ใช้ require runtime เพื่อหลบ ESM/CJS
type RouteNames = keyof RootStackParamList;
interface NavLike {
  navigate: (screen: RouteNames, params?: any) => void;
  goBack: () => void;
}
function useNav(): NavLike {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useNavigation } = require("@react-navigation/native");
  return useNavigation();
}

const HomeScreen: React.FC = () => {
  const navigation = useNav();
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/overview`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const json = (await res.json()) as DashboardOverview;
        setData(json);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#ef4444" }}>ไม่สามารถโหลดข้อมูลได้</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.greeting}>Welcome to AquaFlow</Text>
        <Text style={styles.subGreeting}>ระบบติดตามคุณภาพน้ำ</Text>
      </View>

      {/* Overview Section */}
      <Text style={styles.sectionTitle}>Overview</Text>
      <View style={styles.overviewRow}>
        <OverviewCard title="ค่า pH" value={data.average_quality} delta="+0.2" />
        <OverviewCard title="ปริมาณ" value={`${data.average_volume} ลบ.ม.`} delta="+5" />
        <OverviewCard title="แรงดัน" value={`${data.average_pressure} bar`} delta="+0.3" />
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        <ActionButton title="Quick Report" icon="📋" />
        <ActionButton title="Export Data" icon="📤" />
      </View>

      {/* Main Menu */}
      <Text style={styles.sectionTitle}>Main Menu</Text>
      <MainMenuItem
        icon="📊"
        title="Analytics"
        description="View your data insights"
        onPress={() => navigation.navigate("Analytics")}
      />

      <MainMenuItem icon="📈" title="Reports" description="" />
    </ScrollView>
  );
};

interface OverviewCardProps {
  title: string;
  value: string | number;
  delta: string;
}

const OverviewCard: React.FC<OverviewCardProps> = ({ title, value, delta }) => (
  <View style={styles.overviewCard}>
    <Text style={styles.cardValue}>{value}</Text>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardDelta}>⬆ {delta}</Text>
  </View>
);

interface ActionButtonProps {
  title: string;
  icon: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({ title, icon }) => (
  <TouchableOpacity style={styles.actionButton}>
    <Text style={styles.actionIcon}>{icon}</Text>
    <Text style={styles.actionText}>{title}</Text>
  </TouchableOpacity>
);

interface MainMenuItemProps {
  icon: string;
  title: string;
  description: string;
  onPress?: () => void;
}

const MainMenuItem: React.FC<MainMenuItemProps> = ({ icon, title, description, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Text style={styles.menuIcon}>{icon}</Text>
    <View style={{ flex: 1 }}>
      <Text style={styles.menuTitle}>{title}</Text>
      <Text style={styles.menuDescription}>{description}</Text>
    </View>
    <Text style={styles.menuArrow}>➜</Text>
  </TouchableOpacity>
);

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#ebf8ff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ebf8ff",
  },
  headerSection: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0ea5e9",
  },
  subGreeting: {
    fontSize: 16,
    color: "#64748b",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e3a8a",
    marginBottom: 12,
    marginTop: 24,
  },
  overviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  overviewCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    width: "30%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardValue: {
    fontSize: 20,
    color: "#0ea5e9",
    fontWeight: "bold",
  },
  cardTitle: {
    fontSize: 14,
    color: "#1e293b",
  },
  cardDelta: {
    fontSize: 12,
    color: "#22c55e",
    marginTop: 4,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: "#0ea5e9",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
  },
  actionIcon: {
    fontSize: 20,
    color: "#fff",
    marginBottom: 4,
  },
  actionText: {
    color: "#fff",
    fontWeight: "bold",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 8,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e3a8a",
  },
  menuDescription: {
    fontSize: 14,
    color: "#475569",
  },
  menuArrow: {
    fontSize: 18,
    color: "#1e3a8a",
  },
});
