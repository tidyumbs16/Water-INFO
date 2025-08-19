// screens/HomeScreen.tsx
import { PermissionsAndroid, Platform } from 'react-native';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, ImageBackground, Dimensions, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';




const { width, height } = Dimensions.get('window');
const API_BASE_URL = 'http://192.168.6.131:3001';

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

  // ฟังก์ชันขออนุญาต Location
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 23) {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);
        if (
          granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.ACCESS_COARSE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log('Location permission granted');
        } else {
          console.log('Location permission denied');
        }
      } catch (err) {
        console.warn('Failed to request permission ', err);
      }
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const overallResponse = await fetch(`${API_BASE_URL}/api/overall-sensor-summary`);
      const overallData = await overallResponse.json();

      if (overallResponse.ok) {
        setOverallSummary(overallData);
      } else {
        setError(overallData.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลภาพรวมเซนเซอร์');
      }

      const districtResponse = await fetch(`${API_BASE_URL}/api/districts-with-sensor-summary`);
      const districtData = await districtResponse.json();

      if (districtResponse.ok) {
        setDistrictSummary(districtData);
      } else {
        setError(prev => prev ? `${prev}\n${districtData.message}` : districtData.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลสรุปเขต');
      }
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  fetch('http://192.168.6.131:3001/api/overall-sensor-summary')
    .then((res) => res.json())
    .then((data) => {
      console.log('API data:', data);
      setOverallSummary(data);
    })
    .catch((error) => {
      console.error('Fetch error:', error);
    })
    .finally(() => setLoading(false));
}, []);


  const renderStatusCard = (title: string, value: number | string, bgColor: string, textColor: string) => (
    <View style={[styles.statusCard, { backgroundColor: bgColor }]}>
      <Text style={[styles.statusCardTitle, { color: textColor }]}>{title}</Text>
      <Text style={[styles.statusCardValue, { color: textColor }]}>{value}</Text>
    </View>
  );

  const renderDistrictItem = ({ item }: { item: any }) => (
   <View style={styles.districtItem}>
    <Text style={styles.districtName}>{item.name}</Text>  {/* แก้จาก item.district_name เป็น item.name */}
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
      source={require('../assets/bg_blue3.png')}
      style={styles.backgroundContainer}
      resizeMode="cover"
    >
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.mainTitle}>AquaFlow</Text>
          <Text style={styles.subtitle}>ระบบติดตามคุณภาพน้ำ</Text>
        </View>

        {overallSummary && (
          <View style={styles.statusGrid}>
            {renderStatusCard('เขตทั้งหมด', overallSummary.totalDistricts, '#dbeafe', '#1e40af')}
            {renderStatusCard('เซนเซอร์ปกติ', overallSummary.normalSensors + overallSummary.activeSensors, '#dcfce7', '#16a34a')}
            {renderStatusCard('เฝ้าระวัง', overallSummary.warningSensors, '#fef3c7', '#d97706')}
            {renderStatusCard(
              'ผิดปกติ',
              overallSummary.criticalSensors + overallSummary.errorSensors + overallSummary.offlineSensors + overallSummary.inactiveSensors + overallSummary.maintenanceSensors + overallSummary.calibratingSensors,
              '#fecaca',
              '#dc2626'
            )}

          </View>
        )}

        {overallSummary && (
          <View style={styles.qualityCard}>
            <Text style={styles.cardTitle}>ค่าเฉลี่ยคุณภาพน้ำโดยรวม</Text>
            <View style={styles.qualityGrid}>
              <View style={styles.qualityItem}>
                <Text style={styles.qualityLabel}>pH</Text>
                <Text style={styles.qualityValue}> {overallSummary.averageOverallPH !== undefined ? overallSummary.averageOverallPH : 'N/A'}</Text>
              </View>
              <View style={styles.qualityItem}>
                <Text style={styles.qualityLabel}>อุณหภูมิ</Text>
                <Text style={styles.qualityValue}> {overallSummary.averageOverallTemperature !== undefined ? overallSummary.averageOverallTemperature : 'N/A'}°C</Text>
              </View>
              <View style={styles.qualityItem}>
                <Text style={styles.qualityLabel}>ความขุ่น</Text>
                <Text style={styles.qualityValue}> {overallSummary.averageOverallTurbidity !== undefined ? overallSummary.averageOverallTurbidity : 'N/A'} NTU</Text>
              </View>
              <View style={styles.qualityItem}>
                <Text style={styles.qualityLabel}>DO</Text>
                <Text style={styles.qualityValue}> {overallSummary.averageOverallDO !== undefined ? overallSummary.averageOverallDO: 'N/A'} mg/L</Text>
              </View>
            </View>
          </View>       
        )}

        <TouchableOpacity
          style={styles.navigationButton}
          onPress={() => navigation.navigate('Selected')}
          activeOpacity={0.8}
        >
          <Text style={styles.navigationButtonText}>เลือกเขตประปา</Text>
          <Text style={styles.navigationButtonSubtext}>ดูข้อมูลแบบละเอียด</Text>
        </TouchableOpacity>

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
    backgroundColor: "#d0f0ff", // ฟ้าน้ำทะเลอ่อนๆ
  },
  scrollContainer: {
    flex: 1,
  },

  // Header
  headerContainer: {
    alignItems: "center",
    paddingTop: height * 0.08,
    paddingBottom: 32,
    paddingHorizontal: 20,
    backgroundColor: "rgba(0, 137, 255, 0.10)", // ฟ้าใสๆ ด้านหลัง
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  mainTitle: {
    fontSize: 36,
    fontWeight: "900",
    color: "#27AEB9", // น้ำเงินเข้ม
    textAlign: "center",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: "#27AEB9",
    textAlign: "center",
    marginTop: 4,
    fontWeight: "500",
  },

  // Status Cards
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 12,
  },
  statusCard: {
    flex: 1,
    minWidth: "40%",
    backgroundColor: "rgba(173, 216, 230, 0.3)", // สีฟ้าอ่อนใส
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    elevation: 1,
    shadowColor: "#3399ff",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  statusCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
    color: "#0563af",
  },
  statusCardValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#01497c",
    textAlign: "center",
  },

  // Quality Card
  qualityCard: {
    backgroundColor: "rgba(224, 242, 254, 0.8)", // ฟ้าอ่อน โปร่งแสง
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#3399ff",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0277bd",
    marginBottom: 16,
    textAlign: "center",
  },
  qualityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  qualityItem: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "rgba(187, 222, 251, 0.6)", // ฟ้าอ่อนกว่า
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderLeftWidth: 4,
    borderLeftColor: "#0288d1",
  },
  qualityLabel: {
    fontSize: 14,
    color: "#01579b",
    fontWeight: "600",
    marginBottom: 4,
  },
  qualityValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#013a63",
  },

  // Navigation Button
  navigationButton: {
    backgroundColor: "#039be5", // ฟ้าน้ำทะเลเข้ม
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
    elevation: 6,
    shadowColor: "#0288d1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  navigationButtonText: {
    color: "#e1f5fe",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  navigationButtonSubtext: {
    color: "#b3e5fc",
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
  },

  // Districts
  districtsCard: {
    backgroundColor: "rgba(187, 222, 251, 0.7)",
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#3399ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  districtItem: {
    backgroundColor: "rgba(224, 242, 254, 0.85)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#0288d1",
  },
  districtName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#01579b",
    marginBottom: 12,
  },
  sensorStatusRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  sensorStatus: {
    alignItems: "center",
  },
  sensorNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0277bd",
  },
  sensorLabel: {
    fontSize: 12,
    color: "#01579b",
    fontWeight: "500",
    marginTop: 2,
  },
  districtDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  districtDetail: {
    fontSize: 12,
    color: "#0277bd",
    fontWeight: "500",
  },

  // Notifications
  notificationCard: {
    backgroundColor: "#f4f4f4",
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#aed581",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
  },
  notificationContent: {
    alignItems: "center",
    paddingVertical: 20,
  },
  noNotificationText: {
    fontSize: 16,
    color: "#e51c23",
    fontWeight: "500",
  },
  notificationSubtext: {
    fontSize: 14,
    color: "#e51c23",
    marginTop: 4,
  },

  // Loading & Error States
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#d0f0ff",
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#0ea5e9",
    fontWeight: "600",
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#bae6fd",
    margin: 20,
    padding: 24,
    borderRadius: 20,
    shadowColor: "#0284c7",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0369a1",
  },
  errorText: {
    fontSize: 16,
    color: "#064663",
    marginTop: 12,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: "#0288d1", // ฟ้าน้ำเข้ม
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 16,
    elevation: 3,
  },
  retryButtonText: {
    color: "#e1f5fe", // ฟ้าอ่อน
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
});


export default HomeScreen;

