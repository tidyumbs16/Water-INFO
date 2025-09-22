import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { ChevronRight, ChevronLeft } from "lucide-react-native";
import { Picker } from "@react-native-picker/picker";

const API_BASE_URL = "http://192.168.7.118:3001";

// --- Types (เฉพาะที่ใช้จริง) ---
type RootStackParamList = {
  RegionDetail: { regionName: string };
  StationDetail: { districtId: string; districtName: string };
};

// ✅ hooks นำทาง/อ่าน route แบบ require runtime (เลี่ยง ESM/CJS)
function useNav() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useNavigation } = require("@react-navigation/native");
  return useNavigation();
}
function useRout() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useRoute } = require("@react-navigation/native");
  return useRoute();
}

interface Province {
  id: string;
  name: string;
}

interface District {
  id: string;
  name: string;
  province: string;
  region: string;
  status: string;
}

const RegionDetailScreen: React.FC = () => {
  const navigation = useNav();
  const route = useRout() as { params: { regionName: string } };
  const { regionName } = route.params;

  const [selectedProvinceName, setSelectedProvinceName] = useState<string>("");
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(false);

  // 📌 Fetch provinces ตาม regionName
  const fetchProvinces = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/mobile-provinces?regionName=${encodeURIComponent(regionName)}`
      );
      const data = await res.json();
      setProvinces(data);
      if (data.length > 0) setSelectedProvinceName(data[0].name);
    } catch (err) {
      console.error("❌ Error fetching provinces:", err);
    }
  }, [regionName]);

  // 📌 Fetch districts ตาม selectedProvinceName
  const fetchDistricts = useCallback(async () => {
    if (!selectedProvinceName) return;
    try {
      setLoading(true);
      const res = await fetch(
        `${API_BASE_URL}/api/mobile-districts?provinceId=${encodeURIComponent(selectedProvinceName)}`
      );
      const data = await res.json();
      setDistricts(data);
    } catch (err) {
      console.error("❌ Error fetching districts:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedProvinceName]);

  useEffect(() => {
    fetchProvinces();
  }, [fetchProvinces]);

  useEffect(() => {
    fetchDistricts();
  }, [fetchDistricts]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ChevronLeft size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{regionName}</Text>
        </View>

        <Text style={styles.label}>เลือกจังหวัด:</Text>
        <Picker
          selectedValue={selectedProvinceName}
          onValueChange={(itemValue) => setSelectedProvinceName(itemValue)}
          enabled={!!provinces.length}
          style={styles.picker}
        >
          <Picker.Item label="-- เลือกจังหวัด --" value="" />
          {provinces.map((p) => (
            <Picker.Item key={p.id} label={p.name} value={p.name} />
          ))}
        </Picker>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#0ea5e9" />
          </View>
        ) : (
          <FlatList
            data={districts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() =>
                  navigation.navigate("StationDetail", {
                    districtId: item.id,
                    districtName: item.name,
                  })
                }
              >
                <View style={styles.cardContent}>
                  <View>
                    <Text style={styles.districtName}>{item.name}</Text>
                    <Text style={styles.districtLocation}>
                      {item.province} • {item.region}
                    </Text>
                  </View>
                  <ChevronRight size={20} color="#0ea5e9" />
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={{ color: "#6b7280" }}>
                  {!selectedProvinceName ? "กรุณาเลือกจังหวัด" : "ไม่พบเขตประปาในจังหวัดนี้"}
                </Text>
              </View>
            }
            style={styles.flatList}
            contentContainerStyle={districts.length === 0 && styles.flatListContent}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },
  container: { flex: 1, padding: 16 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#1f2937", marginLeft: 10, flexShrink: 1 },
  backButton: { padding: 5 },
  label: { fontSize: 16, fontWeight: "600", marginTop: 10, marginBottom: 4 },
  picker: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 16,
  },
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
  cardContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  districtName: { fontSize: 18, fontWeight: "700", color: "#1f2937" },
  districtLocation: { fontSize: 14, color: "#64748b" },
  flatList: { flex: 1 },
  flatListContent: { flex: 1, justifyContent: "center", alignItems: "center" },
  center: { justifyContent: "center", alignItems: "center" },
});

export default RegionDetailScreen;
