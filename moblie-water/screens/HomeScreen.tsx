// screens/HomeScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, ImageBackground, Dimensions, FlatList, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

const { width, height } = Dimensions.get('window');
const API_BASE_URL = 'http://192.168.6.131:3001';

// กำหนด interface สำหรับ overallSummary
interface OverallSummary {
  totalDistricts: number;
  normalSensors: number;
  activeSensors: number;
  warningSensors: number;
  criticalSensors: number;
  errorSensors: number;
  offlineSensors: number;
  inactiveSensors: number;
  maintenanceSensors: number;
  calibratingSensors: number;
  averageOverallPH: number | string;
  averageOverallTemperature: number | string;
  averageOverallTurbidity: number | string;
  averageOverallDO: number | string;
}

type RootStackParamList = {
  Home: undefined;
  Selected: undefined;
};

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Home'>>();
  const [overallSummary, setOverallSummary] = useState<OverallSummary | null>(null);
  const [districtSummary, setDistrictSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ฟังก์ชันสำหรับดึงข้อมูลจาก Backend
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching overall sensor summary...');
      const overallResponse = await fetch(`${API_BASE_URL}/api/overall-sensor-summary`);
      const overallData = await overallResponse.json();

      if (overallResponse.ok) {
        setOverallSummary(overallData);
        console.log('Overall summary fetched successfully:', overallData);
      } else {
        setError(overallData.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลภาพรวมเซนเซอร์');
        console.error('Error fetching overall summary:', overallResponse.status, overallData);
      }

      console.log('Fetching districts with sensor summary...');
      const districtResponse = await fetch(`${API_BASE_URL}/api/districts-with-sensor-summary`);
      const districtData = await districtResponse.json();

      if (districtResponse.ok) {
        setDistrictSummary(districtData);
        console.log('District summary fetched successfully:', districtData);
      } else {
        setError(prev => prev ? `${prev}\n${districtData.message}` : districtData.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลสรุปเขต');
        console.error('Error fetching district summary:', districtResponse.status, districtData);
      }

    } catch (err: any) {
      console.error('Network or server error during data fetch:', err);
      setError(err.message || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ');
    } finally {
      setLoading(false);
      console.log('Data fetching process finished.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ฟังก์ชันสำหรับแสดงผล Card สถานะ
  const renderStatusCard = (title: string, value: number | string, bgColor: string, textColor: string) => (
    <View style={[styles.statusCard, { backgroundColor: bgColor }]}>
      <Text style={[styles.statusCardTitle, { color: textColor }]}>{title}</Text>
      <Text style={[styles.statusCardValue, { color: textColor }]}>{value}</Text>
    </View>
  );

  // ฟังก์ชันสำหรับแสดงผลแต่ละรายการเขตใน FlatList
  const renderDistrictItem = ({ item }: { item: any }) => (
    <View style={styles.districtItem}>
      <Text style={styles.districtName}>{item.district_name}</Text>
      <View style={styles.sensorStatusRow}>
        <View style={styles.sensorStatus}>
          <Text style={styles.sensorNumber}>{item.normal_active_sensors || 0}</Text>
          <Text style={styles.sensorLabel}>ปกติ</Text>
        </View>
        <View style={styles.sensorStatus}>
          <Text style={[styles.sensorNumber, { color: '#f59e0b' }]}>{item.warning_sensors || 0}</Text>
          <Text style={styles.sensorLabel}>เฝ้าระวัง</Text>
        </View>
        <View style={styles.sensorStatus}>
          <Text style={[styles.sensorNumber, { color: '#ef4444' }]}>{item.problematic_sensors || 0}</Text>
          <Text style={styles.sensorLabel}>ผิดปกติ</Text>
        </View>
      </View>
      <View style={styles.districtDetailsRow}>
        <Text style={styles.districtDetail}>
          ค่าเฉลี่ย: {item.avg_value_in_district ? parseFloat(item.avg_value_in_district).toFixed(2) : 'N/A'}
        </Text>
        <Text style={styles.districtDetail}>
          {item.last_update_in_district ? new Date(item.last_update_in_district).toLocaleDateString('th-TH') : 'N/A'}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>เกิดข้อผิดพลาด</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
          <Text style={styles.retryButtonText}>ลองใหม่</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('../assets/bg.blue.png')}
      style={styles.backgroundContainer}
      resizeMode="cover"
    >
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.mainTitle}>AquaFlow</Text>
          <Text style={styles.subtitle}>ระบบติดตามคุณภาพน้ำ</Text>
        </View>

        {/* Status Cards Grid */}
        {overallSummary && (
          <View style={styles.statusGrid}>
            {renderStatusCard('เขตทั้งหมด', overallSummary.totalDistricts, '#dbeafe', '#1e40af')}
            {renderStatusCard('เซนเซอร์ปกติ', overallSummary.normalSensors + overallSummary.activeSensors, '#dcfce7', '#16a34a')}
            {renderStatusCard('เฝ้าระวัง', overallSummary.warningSensors, '#fef3c7', '#d97706')}
            {renderStatusCard('ผิดปกติ', overallSummary.criticalSensors + overallSummary.errorSensors + overallSummary.offlineSensors + overallSummary.inactiveSensors + overallSummary.maintenanceSensors + overallSummary.calibratingSensors, '#fecaca', '#dc2626')}
          </View>
        )}

        {/* Water Quality Summary */}
        {overallSummary && (
          <View style={styles.qualityCard}>
            <Text style={styles.cardTitle}>ค่าเฉลี่ยคุณภาพน้ำโดยรวม</Text>
            <View style={styles.qualityGrid}>
              <View style={styles.qualityItem}>
                <Text style={styles.qualityLabel}>pH</Text>
                <Text style={styles.qualityValue}>{overallSummary.averageOverallPH || 'N/A'}</Text>
              </View>
              <View style={styles.qualityItem}>
                <Text style={styles.qualityLabel}>อุณหภูมิ</Text>
                <Text style={styles.qualityValue}>{overallSummary.averageOverallTemperature || 'N/A'}°C</Text>
              </View>
              <View style={styles.qualityItem}>
                <Text style={styles.qualityLabel}>ความขุ่น</Text>
                <Text style={styles.qualityValue}>{overallSummary.averageOverallTurbidity || 'N/A'} NTU</Text>
              </View>
              <View style={styles.qualityItem}>
                <Text style={styles.qualityLabel}>DO</Text>
                <Text style={styles.qualityValue}>{overallSummary.averageOverallDO || 'N/A'} mg/L</Text>
              </View>
            </View>
          </View>
        )}

        {/* Navigation Button */}
        <TouchableOpacity
          style={styles.navigationButton}
          onPress={() => navigation.navigate('Selected')}
          activeOpacity={0.8}
        >
          <Text style={styles.navigationButtonText}>เลือกเขตประปา</Text>
          <Text style={styles.navigationButtonSubtext}>ดูข้อมูลแบบละเอียด</Text>
        </TouchableOpacity>

        {/* Districts List */}
        {districtSummary.length > 0 && (
          <View style={styles.districtsCard}>
            <Text style={styles.cardTitle}>ข้อมูลโดยสรุปเขตประปา</Text>
            <FlatList
              data={districtSummary}
              renderItem={renderDistrictItem}
              keyExtractor={(item: any) => item.district_id?.toString() || Math.random().toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {/* Notifications Card */}
        <View style={styles.notificationCard}>
          <Text style={styles.cardTitle}>การแจ้งเตือน</Text>
          <View style={styles.notificationContent}>
            <Text style={styles.noNotificationText}>ไม่มีการแจ้งเตือนใหม่</Text>
            <Text style={styles.notificationSubtext}>ระบบทำงานปกติ</Text>
          </View>
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  
  // Loading & Error States
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
  retryButton: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
    elevation: 2,
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Header
  headerContainer: {
    alignItems: 'center',
    paddingTop: height * 0.08,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  mainTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },

  // Status Cards
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 12,
  },
  statusCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    opacity: 0.8,
  },
  statusCardValue: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },

  // Quality Card
  qualityCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  qualityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  qualityItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  qualityLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  qualityValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1f2937',
  },

  // Navigation Button
  navigationButton: {
    backgroundColor: 'rgba(14,165,233,0.9)',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 6,
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  navigationButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  navigationButtonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },

  // Districts
  districtsCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  districtItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  districtName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  sensorStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  sensorStatus: {
    alignItems: 'center',
  },
  sensorNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#16a34a',
  },
  sensorLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginTop: 2,
  },
  districtDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  districtDetail: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },

  // Notifications
  notificationCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  notificationContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noNotificationText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  notificationSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
});

export default HomeScreen;