import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { ChevronRight } from "lucide-react-native";

// --- Types ---
type RootStackParamList = {
  Stations: undefined;
  RegionDetail: { regionName: string };
};

type NavigationProp = StackNavigationProp<RootStackParamList, "Stations">;

interface Region {
  id: string;
  name: string;
}

const API_BASE_URL = "http://192.168.7.118:3001"; // ✅ ชี้ไปยัง backend จริง

const SelectedScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ ดึงข้อมูลจาก API จริง /api/mobile-regions
  const fetchRegions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/mobile-regions`);
      const data = await res.json();
      setRegions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error fetching regions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegions();
  }, [fetchRegions]);

  const renderRegionItem = ({ item }: { item: Region }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate("RegionDetail", {
          regionName: item.name,
        })
      }
    >
      <View style={styles.cardContent}>
        <Text style={styles.regionName}>{item.name}</Text>
        <ChevronRight size={20} color="#0ea5e9" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>เลือกภูมิภาค</Text>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0ea5e9" />
        </View>
      ) : (
        <FlatList
          data={regions}
          keyExtractor={(item) => item.id}
          renderItem={renderRegionItem}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ color: "#6b7280" }}>ไม่พบข้อมูลภาค</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#1f2937", marginBottom: 20 },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#0ea5e9",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  regionName: { fontSize: 18, fontWeight: "700", color: "#1f2937" },
});

export default SelectedScreen;
