// screens/StationDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Dimensions, Alert } from 'react-native'; // Removed Image as it's not used
import { RouteProp, useRoute } from '@react-navigation/native';
import { MapPin, Info, Thermometer, Droplet, Gauge, Activity, TrendingUp, TrendingDown, Clock } from 'lucide-react-native';

// Define Types for Navigation Stack (must match RootStackParamList in App.tsx)
type RootStackParamList = {
  Home: undefined;
  DistrictSelection: undefined;
  StationDetail: { districtId: string; districtName: string }; // This screen receives districtId and districtName
  // Add other screens you have
};

// Type for this screen's Route
type StationDetailScreenRouteProp = RouteProp<RootStackParamList, 'StationDetail'>;

// Interface for District data (from districts table)
interface DistrictData {
  id: string;
  district_name: string;
  province: string;
  region: string;
  city?: string;
  contact?: string;
  capacity?: string;
  status?: string; // District status, e.g., 'active', 'inactive'
}

// Interface for latest Metrics data of a District (from district_metrics table)
interface DistrictMetrics {
  id: string;
  district_id: string;
  water_quality: string; // e.g., 'Good', 'Fair', 'Poor'
  water_volume: number; // Water volume
  pressure: number; // Water pressure
  efficiency: number; // Efficiency
  quality_trend: 'up' | 'down' | 'stable'; // Water quality trend
  volume_trend: 'up' | 'down' | 'stable'; // Water volume trend
  pressure_trend: 'up' | 'down' | 'stable'; // Water pressure trend
  efficiency_trend: 'up' | 'down' | 'stable'; // Efficiency trend
  created_at: string; // Date/time of data recording
}

const { width } = Dimensions.get('window'); // For Responsive Sizing

// *** IMPORTANT: If running on a physical device, change this to your computer's IP Address ***
const API_BASE_URL = 'http://192.168.6.131:3001';

const StationDetailScreen: React.FC = () => {
  const route = useRoute<StationDetailScreenRouteProp>();
  const { districtId, districtName } = route.params;

  const [districtDetails, setDistrictDetails] = useState<DistrictData | null>(null);
  const [latestMetrics, setLatestMetrics] = useState<DistrictMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDistrictData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch District Details
        console.log(`Fetching district details for ID: ${districtId}`);
        const districtResponse = await fetch(`${API_BASE_URL}/api/districts/${districtId}`);
        if (!districtResponse.ok) {
          const errorText = await districtResponse.text();
          throw new Error(`Failed to fetch district details: ${districtResponse.status} ${errorText}`);
        }
        const districtData: DistrictData = await districtResponse.json();
        setDistrictDetails(districtData);
        console.log('District details fetched:', districtData.district_name);

        // 2. Fetch Latest Metrics for this District
        console.log(`Fetching latest metrics for district ID: ${districtId}`);
        const metricsResponse = await fetch(`${API_BASE_URL}/api/district_metrics/latest?districtId=${districtId}`);
        if (!metricsResponse.ok) {
          if (metricsResponse.status === 404) {
            console.warn(`No latest metrics found for district ID ${districtId}.`);
            setLatestMetrics(null); // Set to null if no metrics found
          } else {
            const errorText = await metricsResponse.text();
            throw new Error(`Failed to fetch latest metrics: ${metricsResponse.status} ${errorText}`);
          }
        } else {
          const metricsData: DistrictMetrics = await metricsResponse.json();
          setLatestMetrics(metricsData);
          console.log('Latest metrics fetched:', metricsData);
        }

      } catch (err: any) {
        console.error('API Error fetching district or metrics data:', err);
        setError(`ไม่สามารถโหลดข้อมูลรายละเอียดของ ${districtName} ได้: ${err.message}`);
        // Alert.alert('ข้อผิดพลาด', `ไม่สามารถโหลดข้อมูลรายละเอียดของ ${districtName} ได้: ${err.message}`); // Removed redundant Alert
      } finally {
        setLoading(false);
      }
    };

    fetchDistrictData();
  }, [districtId, districtName]); // Dependency array: re-run if districtId or districtName changes

  // Helper function to get the color based on status
  const getStatusColor = (status: string | undefined | null) => {
    switch (status?.toLowerCase()) { // Convert to lower case for consistent comparison
      case 'active':
      case 'good':
        return '#16a34a'; // Green
      case 'inactive':
      case 'critical':
      case 'poor':
      case 'error':
      case 'offline':
        return '#dc2626'; // Red
      case 'warning':
      case 'fair':
      case 'calibrating':
        return '#d97706'; // Orange/Yellow
      case 'maintenance':
        return '#6b7280'; // Gray
      default:
        return '#475569'; // Default dark gray
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable' | undefined) => {
    switch (trend) {
      case 'up': return <TrendingUp size={18} color="#16a34a" />; // Green for Up
      case 'down': return <TrendingDown size={18} color="#dc2626" />; // Red for Down
      case 'stable': return <Activity size={18} color="#94a3b8" />; // Gray for Stable
      default: return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>กำลังโหลดข้อมูลของ {districtName}...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>เกิดข้อผิดพลาด</Text>
        <Text style={styles.errorText}>{error}</Text>
        {/* You might add a retry button here if you want it on this screen as well */}
        {/* <TouchableOpacity style={styles.retryButton} onPress={fetchDistrictData}>
          <Text style={styles.retryButtonText}>ลองใหม่</Text>
        </TouchableOpacity> */}
      </View>
    );
  }

  if (!districtDetails) {
    return (
      <View style={styles.noDataContainerFallback}>
        <Info size={40} color="#94a3b8" />
        <Text style={styles.noDataTextFallback}>ไม่พบข้อมูลรายละเอียดสำหรับเขตนี้</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View style={styles.header}>
        <MapPin size={32} color="#0ea5e9" />
        <Text style={styles.headerTitle}>{districtDetails.district_name}</Text>
        <Text style={styles.headerSubtitle}>{districtDetails.city} {districtDetails.province} : {districtDetails.region}</Text>
      </View>

      {/* District Info Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>ข้อมูลเขตประปา</Text>
        <View style={styles.infoRow}>
          <Info size={20} color="#64748b" style={styles.infoIcon} />
          <Text style={styles.infoLabel}>สถานะ:</Text>
          <Text style={[styles.infoValue, { color: getStatusColor(districtDetails.status) }]}>
            {districtDetails.status || 'ไม่ระบุ'}
          </Text>
        </View>
        {districtDetails.contact && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}><Info size={20} color="#64748b" style={styles.infoIcon} /> ติดต่อ:</Text>
            <Text style={styles.infoValue}>{districtDetails.contact}</Text>
          </View>
        )}
        {districtDetails.capacity && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}><Info size={20} color="#64748b" style={styles.infoIcon} /> กำลังการผลิต:</Text>
            <Text style={styles.infoValue}>{districtDetails.capacity}</Text>
          </View>
        )}
      </View>

      {/* Latest Metrics Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>ข้อมูลล่าสุด (Metrics)</Text>
        {latestMetrics ? (
          <View>
            <View style={styles.metricItem}>
              <Droplet size={22} color="#0ea5e9" />
              <Text style={styles.metricLabel}>คุณภาพน้ำ:</Text>
              <Text style={[{ color: getStatusColor(latestMetrics.water_quality) }, styles.metricValue]}>{latestMetrics.water_quality}</Text>
              {getTrendIcon(latestMetrics.quality_trend)}
            </View>
            <View style={styles.metricItem}>
              <Gauge size={22} color="#16a34a" />
              <Text style={styles.metricLabel}>ปริมาณน้ำ:</Text>
              <Text style={styles.metricValue}>{latestMetrics.water_volume} m³</Text>
              {getTrendIcon(latestMetrics.volume_trend)}
            </View>
            <View style={styles.metricItem}>
              <Gauge size={22} color="#d97706" />
              <Text style={styles.metricLabel}>แรงดันน้ำ:</Text>
              <Text style={styles.metricValue}>{latestMetrics.pressure} bar</Text>
              {getTrendIcon(latestMetrics.pressure_trend)}
            </View>
            <View style={styles.metricItem}>
              <Activity size={22} color="#dc2626" />
              <Text style={styles.metricLabel}>ประสิทธิภาพ:</Text>
              <Text style={styles.metricValue}>{latestMetrics.efficiency}%</Text>
              {getTrendIcon(latestMetrics.efficiency_trend)}
            </View>
            <View style={[styles.metricItem, { marginTop: 15, justifyContent: 'flex-start' }]}>
              <Clock size={16} color="#94a3b8" />
              <Text style={styles.lastUpdateText}>อัปเดตล่าสุด: {new Date(latestMetrics.created_at).toLocaleString('th-TH')}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.noDataContainer}>
            <Info size={30} color="#94a3b8" />
            <Text style={styles.noDataText}>ไม่พบข้อมูล Metrics ล่าสุดสำหรับเขตนี้</Text>
            <Text style={styles.noDataTextSmall}>(อาจยังไม่มีการบันทึกข้อมูล)</Text>
          </View>
        )}
      </View>
      <View style={{ height: 30 }} />{/* Spacer at the bottom */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // Light gray background consistent with previous screens
    padding: 16, // Consistent padding
  },
  
  // Loading & Error States (Consistent with HomeScreen & DistrictSelectionScreen)
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#0ea5e9',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  // Removed retryButton styles as it's commented out in the UI for now.
  // You can uncomment them if you decide to add the button back.

  // Header Section
  header: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)', // Consistent card background
    borderRadius: 20, // Consistent border radius
    paddingVertical: 30, // Increased padding
    paddingHorizontal: 16,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerTitle: {
    fontSize: 32, // Larger title
    fontWeight: '800', // Bolder
    color: '#1f2937', // Darker text
    marginTop: 10,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748b', // Softer gray
    marginTop: 5,
    textAlign: 'center',
    fontWeight: '500', // Slightly bolder
  },

  // Card styles (Consistent with previous screens)
  card: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20, // Consistent border radius
    padding: 20,
    marginBottom: 16, // Consistent margin
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700', // Bolder
    color: '#1f2937', // Darker text
    marginBottom: 16, // Consistent margin
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0', // Lighter border color
    paddingBottom: 10,
  },

  // Info Rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10, // Increased spacing
    paddingVertical: 4, // Added padding for better touch area/spacing
  },
  infoIcon: {
    marginRight: 10,
  },
  infoLabel: {
    fontSize: 16,
    color: '#475569', // Darker label text
    fontWeight: '600', // Bolder label
    marginRight: 8, // Space between label and value
  },
  infoValue: {
    fontSize: 16,
    color: '#334155', // Default value color
    fontWeight: '600',
    flexShrink: 1, // Allow text to wrap
  },
  // statusText is now a regular style object (color set dynamically)
  statusText: {
    fontWeight: '700', // Make status bolder
  },

  // Metric Rows
  metricItem: { // Renamed from metricRow for clarity
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12, // Consistent spacing
    backgroundColor: '#f8fafc', // Light background for each metric item
    borderRadius: 12, // Rounded corners for metric items
    padding: 12, // Padding inside each metric item
    borderLeftWidth: 4, // Left border for visual emphasis
    borderLeftColor: '#0ea5e9', // Consistent blue color
  },
  metricLabel: {
    fontSize: 16,
    color: '#475569',
    fontWeight: '600',
    marginLeft: 10,
    flex: 1,
  },
  metricValue: {
    fontSize: 18, // Slightly larger value
    fontWeight: '700', // Bolder
    color: '#334155', // Default color, dynamic color applied over this
    marginRight: 8,
  },
  lastUpdateText: {
    fontSize: 13,
    color: '#94a3b8', // Consistent subtle gray
    fontStyle: 'italic',
    marginLeft: 8, // Adjusted margin
  },

  // No Data Containers
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#f1f5f9', // Lighter background for no data
    borderRadius: 12, // Rounded corners
    padding: 20,
  },
  noDataText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
  noDataTextSmall: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 5,
    textAlign: 'center',
  },
  // Fallback for when districtDetails is null
  noDataContainerFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 24,
  },
  noDataTextFallback: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 15,
    fontWeight: '600',
  },
});

export default StationDetailScreen;