import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";

const API_BASE_URL = "http://192.168.7.118:3001";

// --- Types ---
interface DataItem {
  id: string;
  title: string;
  value: string;
  unit: string;
  status: "ดี" | "เฝ้าระวัง" | "อันตราย";
  details: string;
}

// ✅ ทำ hook navigation/route แบบ require runtime
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

const StationDetailScreen: React.FC = () => {
  const navigation = useNav();
  const route = useRout() as { params: { districtId: string; districtName: string } };
  const { districtId, districtName } = route.params;

  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DataItem[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const toggleCard = (id: string) => {
    setExpandedCardId(expandedCardId === id ? null : id);
  };

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/mobile-districts_daily_metrics/${districtId}`);
      const rawData = await res.json();
      const item = Array.isArray(rawData) && rawData.length ? rawData[0] : undefined;
      if (!item) {
        setMetrics([]);
        setLastUpdated("");
        return;
      }

      const transformed: DataItem[] = [
        {
          id: "pressure",
          title: "แรงดันน้ำ",
          value: safeToString(item.pressure),
          unit: "บาร์",
          status: convertToStatus(item.pressure_trend),
          details: `วัดเมื่อ ${item.date ?? "-"} • trend = ${safeToString(item.pressure_trend)}`,
        },
        {
          id: "water_volume",
          title: "ปริมาณน้ำ",
          value: safeToString(item.water_volume),
          unit: "ลบ.ม.",
          status: convertToStatus(item.volume_trend),
          details: `วัดเมื่อ ${item.date ?? "-"} • trend = ${safeToString(item.volume_trend)}`,
        },
        {
          id: "efficiency",
          title: "ประสิทธิภาพ",
          value: safeToString(item.efficiency),
          unit: "%",
          status: convertToStatus(item.efficiency_trend),
          details: `วัดเมื่อ ${item.date ?? "-"} • trend = ${safeToString(item.efficiency_trend)}`,
        },
        {
          id: "water_quality",
          title: "คุณภาพน้ำ",
          value: safeToString(item.water_quality),
          unit: "",
          status: convertToStatus(item.quality_trend),
          details: `วัดเมื่อ ${item.date ?? "-"} • trend = ${safeToString(item.quality_trend)}`,
        },
      ];

      setMetrics(transformed);
      setLastUpdated(item.date ?? "");
    } catch (err) {
      setError("โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [districtId]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchMetrics();
    } finally {
      setRefreshing(false);
    }
  }, [fetchMetrics]);

  const overallStatus = useMemo(() => getOverallStatus(metrics), [metrics]);
  const overallText = useMemo(() => overallStatusText(overallStatus), [overallStatus]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.headerTitle}>{districtName}</Text>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#0ea5e9" />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={{ color: "#ef4444", fontWeight: "600" }}>{error}</Text>
            <TouchableOpacity onPress={fetchMetrics} style={{ marginTop: 10 }}>
              <Text style={{ color: "#0ea5e9" }}>ลองใหม่</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {/* สถานะรวม */}
            <View style={[styles.statusCard, { backgroundColor: statusCardBg(overallStatus) }]}>
              <View style={styles.statusHeader}>
                <Text style={styles.statusTitle}>สถานะปัจจุบัน</Text>
                <View
                  style={[styles.statusIndicator, { backgroundColor: getStatusColor(overallStatus) }]}
                />
              </View>
              <Text style={[styles.statusText, { color: "#1f2937" }]}>{overallText}</Text>
              {!!lastUpdated && (
                <Text style={styles.updatedAt}>อัปเดตล่าสุด: {lastUpdated}</Text>
              )}
            </View>

            {/* metrics cards */}
            {metrics.map((item) => (
              <View key={item.id} style={styles.detailCard}>
                <TouchableOpacity style={styles.cardHeader} onPress={() => toggleCard(item.id)}>
                  <View style={styles.cardHeaderLeft}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <View
                      style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}
                    >
                      <Text style={styles.statusBadgeText}>{item.status}</Text>
                    </View>
                  </View>
                  {expandedCardId === item.id ? (
                    <ChevronUp size={20} color="#64748b" />
                  ) : (
                    <ChevronDown size={20} color="#64748b" />
                  )}
                </TouchableOpacity>
                {expandedCardId === item.id && (
                  <View style={styles.cardBody}>
                    <View style={styles.valueContainer}>
                      <Text style={styles.valueText}>{item.value}</Text>
                      {!!item.unit && <Text style={styles.unitText}>{item.unit}</Text>}
                    </View>
                    <Text style={styles.detailText}>{item.details}</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

export default StationDetailScreen;

// ---- helpers เดิม ๆ ----
function convertToStatus(trend: any): "ดี" | "เฝ้าระวัง" | "อันตราย" {
  if (trend == null) return "เฝ้าระวัง";
  const t = typeof trend === "string" ? trend.toLowerCase() : trend;
  if (typeof t === "string") {
    if (t.includes("good") || t.includes("ok") || t.includes("normal") || t.includes("ดี"))
      return "ดี";
    if (t.includes("warn") || t.includes("watch") || t.includes("เฝ้า")) return "เฝ้าระวัง";
    if (t.includes("bad") || t.includes("danger") || t.includes("critical") || t.includes("อันตราย"))
      return "อันตราย";
    return "เฝ้าระวัง";
  }
  const num = Number(t);
  if (Number.isNaN(num)) return "เฝ้าระวัง";
  if (num >= 0.75) return "ดี";
  if (num >= 0.5) return "เฝ้าระวัง";
  return "อันตราย";
}

function getStatusColor(status: "ดี" | "เฝ้าระวัง" | "อันตราย"): string {
  switch (status) {
    case "ดี":
      return "#10b981";
    case "เฝ้าระวัง":
      return "#f59e0b";
    case "อันตราย":
      return "#ef4444";
    default:
      return "#6b7280";
  }
}

function statusCardBg(status: "ดี" | "เฝ้าระวัง" | "อันตราย"): string {
  if (status === "ดี") return "#dcfce7";
  if (status === "เฝ้าระวัง") return "#fef3c7";
  if (status === "อันตราย") return "#fee2e2";
  return "#f1f5f9";
}

function getOverallStatus(items: DataItem[]): "ดี" | "เฝ้าระวัง" | "อันตราย" {
  let worst: "ดี" | "เฝ้าระวัง" | "อันตราย" = "ดี";
  for (const it of items) {
    if (it.status === "อันตราย") return "อันตราย";
    if (it.status === "เฝ้าระวัง") worst = "เฝ้าระวัง";
  }
  return worst;
}

function overallStatusText(status: "ดี" | "เฝ้าระวัง" | "อันตราย"): string {
  switch (status) {
    case "ดี":
      return "ระบบปกติ ทุกอย่างทำงานได้ดี";
    case "เฝ้าระวัง":
      return "มีบางรายการต้องเฝ้าระวัง";
    case "อันตราย":
      return "มีรายการที่ต้องแก้ไขด่วน";
  }
}

function safeToString(v: any): string {
  if (v == null) return "-";
  if (typeof v === "number") {
    const isInt = Number.isInteger(v);
    return isInt ? String(v) : v.toFixed(2);
  }
  return String(v);
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },
  container: { flex: 1, padding: 16 },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1f2937",
    marginBottom: 16,
  },
  statusCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    alignItems: "center",
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginRight: 10,
  },
  statusIndicator: { width: 20, height: 20, borderRadius: 10 },
  statusText: { fontSize: 16, textAlign: "center" },
  updatedAt: { fontSize: 12, color: "#6b7280", marginTop: 6 },
  detailCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center" },
  cardTitle: { fontSize: 18, fontWeight: "700", color: "#1f2937", marginRight: 10 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { color: "#fff", fontWeight: "600", fontSize: 12 },
  cardBody: { paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: "#e2e8f0" },
  valueContainer: { flexDirection: "row", alignItems: "baseline", marginVertical: 10 },
  valueText: { fontSize: 32, fontWeight: "800", color: "#1f2937" },
  unitText: { fontSize: 16, color: "#4b5563", marginLeft: 5 },
  detailText: { fontSize: 14, color: "#6b7280", marginTop: 5 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
