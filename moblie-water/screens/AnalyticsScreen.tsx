import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

const API_BASE_URL = 'http://192.168.7.118:3001';

interface District { id: string; name: string; }
type NumArr = number[];

const safeAvg = (arr: NumArr) =>
  arr.length ? Number((arr.reduce((a, b) => a + (Number(b) || 0), 0) / arr.length).toFixed(2)) : 0;
const safeMax = (arr: NumArr) => (arr.length ? Math.max(...arr) : 0);
const safeMin = (arr: NumArr) => (arr.length ? Math.min(...arr) : 0);

// helper: clamp
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const AnalyticsScreen: React.FC = () => {
  const { width: winWidth } = useWindowDimensions();

  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const [labels, setLabels] = useState<string[]>([]);
  const [quality, setQuality] = useState<number[]>([]);
  const [volume, setVolume] = useState<number[]>([]);
  const [pressure, setPressure] = useState<number[]>([]);
  const [efficiency, setEfficiency] = useState<number[]>([]);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // โหลดเขต
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/districts`);
        const json = await res.json();
        setDistricts(json);
        if (json.length > 0) setSelectedDistrict(json[0].id);
      } catch (err) {
        console.error('❌ Failed to fetch districts:', err);
        setError('โหลดรายชื่อเขตไม่สำเร็จ');
      }
    })();
  }, []);

  const fetchGraphData = useCallback(async () => {
    if (!selectedDistrict || !date) return;
    setError(null);
    setLoading(true);
    try {
      const selectedDateStr = format(date, 'yyyy-MM-dd');
      const res = await fetch(
        `${API_BASE_URL}/api/district-graph/${selectedDistrict}?date=${selectedDateStr}`
      );
      const json = await res.json();
      setLabels(json.labels || []);
      setQuality(json.quality || []);
      setVolume(json.volume || []);
      setPressure(json.pressure || []);
      setEfficiency(json.efficiency || []);
    } catch (err) {
      console.error('❌ Failed to fetch graph data:', err);
      setError('โหลดข้อมูลกราฟไม่สำเร็จ');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDistrict, date]);

  // โหลดข้อมูลกราฟเมื่อเปลี่ยนเขต/วันที่
  useEffect(() => { fetchGraphData(); }, [fetchGraphData]);

  // ลดจำนวน label บนแกน X (memo เพื่อลดงาน render)
  const reducedLabels = useMemo(
    () => labels.map((label, index) => (index % 5 === 0 ? label : '')),
    [labels]
  );

  // สถิติ (memo)
  const qualityStats = useMemo(
    () => ({ avg: safeAvg(quality), max: safeMax(quality), min: safeMin(quality) }),
    [quality]
  );
  const volumeStats = useMemo(
    () => ({ avg: safeAvg(volume), max: safeMax(volume), min: safeMin(volume) }),
    [volume]
  );
  const pressureStats = useMemo(
    () => ({ avg: safeAvg(pressure), max: safeMax(pressure), min: safeMin(pressure) }),
    [pressure]
  );
  const efficiencyStats = useMemo(
    () => ({ avg: safeAvg(efficiency), max: safeMax(efficiency), min: safeMin(efficiency) }),
    [efficiency]
  );

  // กว้างของกราฟ: ไม่น้อยกว่าจอ (หัก padding) และไม่เกิน 2000
  const chartWidth = useMemo(() => {
    const base = labels.length * 56; // 56px ต่อจุด = แตะพอดีมือถือ
    return clamp(base, winWidth - 32, 2000);
  }, [labels.length, winWidth]);

  // Pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchGraphData();
  }, [fetchGraphData]);

  // การ์ดสรุป
  const StatsCard = ({
    titleTH, titleEN, color, stats, unit,
  }: {
    titleTH: string; titleEN: string; color: string;
    stats: { avg: number; max: number; min: number }; unit?: string;
  }) => (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <Text style={styles.cardTitle}>
        {titleTH} <Text style={styles.cardTitleEN}>({titleEN})</Text>
      </Text>
      <View style={styles.cardRow}><Text style={styles.cardLabel}>Avg</Text>
        <Text style={styles.cardValue}>{stats.avg}{unit ? ` ${unit}` : ''}</Text></View>
      <View style={styles.cardRow}><Text style={styles.cardLabel}>Max</Text>
        <Text style={styles.cardValue}>{stats.max}{unit ? ` ${unit}` : ''}</Text></View>
      <View style={styles.cardRow}><Text style={styles.cardLabel}>Min</Text>
        <Text style={styles.cardValue}>{stats.min}{unit ? ` ${unit}` : ''}</Text></View>
    </View>
  );

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>📊 รายงานกราฟข้อมูลน้ำ</Text>

      {/* 🔽 Picker เขต */}
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={selectedDistrict}
          onValueChange={(itemValue) => setSelectedDistrict(itemValue)}
        >
          {districts.map((d) => (
            <Picker.Item key={d.id} label={d.name} value={d.id} />
          ))}
        </Picker>
      </View>

      {/* 📅 Date picker */}
      <TouchableOpacity style={styles.datePickerContainer} onPress={() => setShowPicker(true)}>
        <Text style={styles.dateText}>📅 วันที่: {format(date, 'yyyy-MM-dd')}</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(_, selectedDate) => {
            setShowPicker(false);
            if (selectedDate) setDate(selectedDate);
          }}
        />
      )}

      {/* 📈 Chart */}
      {loading ? (
        <ActivityIndicator size="large" color="#38bdf8" style={{ marginTop: 20 }} />
      ) : error ? (
        <Text style={styles.noData}>⚠️ {error}</Text>
      ) : labels.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 24 }}>
          <LineChart
            data={{
              labels: reducedLabels,
              datasets: [
                { data: quality.length > 1 ? quality : [0, ...quality], color: () => '#3b82f6', strokeWidth: 2 },
                { data: volume.length > 1 ? volume : [0, ...volume], color: () => '#10b981', strokeWidth: 2 },
                { data: pressure.length > 1 ? pressure : [0, ...pressure], color: () => '#f59e0b', strokeWidth: 2 },
                { data: efficiency.length > 1 ? efficiency : [0, ...efficiency], color: () => '#ef4444', strokeWidth: 2 },
              ],
              legend: ['คุณภาพน้ำ', 'ปริมาณน้ำ', 'แรงดัน', 'ประสิทธิภาพ'],
            }}
            width={chartWidth}
            height={300}
            chartConfig={{
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(30, 64, 175, ${opacity})`,
              labelColor: () => '#334155',
              propsForDots: { r: '3', strokeWidth: '2', stroke: '#38bdf8' },
            }}
            bezier
            style={{ borderRadius: 16 }}
          />
        </ScrollView>
      ) : (
        <Text style={styles.noData}>⚠️ ไม่มีข้อมูลสำหรับเขตนี้ในวันที่เลือก</Text>
      )}

      {/* 🧾 Summary */}
      {labels.length > 0 && !error && (
        <>
          <Text style={styles.sectionTitle}>สรุปค่าหลัก (Summary)</Text>
          <View style={styles.cardsWrap}>
            <StatsCard titleTH="คุณภาพน้ำ" titleEN="Water Quality" color="#3b82f6" stats={qualityStats} />
            <StatsCard titleTH="ปริมาณน้ำ" titleEN="Volume" color="#10b981" stats={volumeStats} />
            <StatsCard titleTH="แรงดัน" titleEN="Pressure" color="#f59e0b" stats={pressureStats} />
            <StatsCard titleTH="ประสิทธิภาพ" titleEN="Efficiency" color="#ef4444" stats={efficiencyStats} unit="%" />
          </View>
        </>
      )}
    </ScrollView>
  );
};

export default AnalyticsScreen;

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#e2f2fc', flexGrow: 1 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1e40af', textAlign: 'center', marginBottom: 16 },
  pickerWrapper: { borderRadius: 10, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff', marginBottom: 20 },
  datePickerContainer: {
    backgroundColor: '#dbeafe', padding: 14, borderRadius: 24, alignItems: 'center',
    marginBottom: 16, borderWidth: 1, borderColor: '#94a3b8',
  },
  dateText: { color: '#0284c7', fontSize: 16 },
  noData: { textAlign: 'center', marginTop: 20, color: '#ef4444', fontSize: 16 },
  sectionTitle: { marginTop: 20, marginBottom: 8, fontSize: 16, fontWeight: '700', color: '#0f172a' },
  cardsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // ใช้ margin แทน gap เพื่อรองรับ RN เก่า
    marginHorizontal: -6,
  },
  card: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    marginHorizontal: 6,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  cardTitleEN: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  cardLabel: { fontSize: 13, color: '#475569' },
  cardValue: { fontSize: 13, fontWeight: '700', color: '#111827' },
});
