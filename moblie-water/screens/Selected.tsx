// screens/DistrictSelectionScreen.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, FlatList } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MapPin, ChevronRight, Filter } from 'lucide-react-native'; // สำหรับไอคอน

// กำหนด Types สำหรับ Navigation Stack
// ตรวจสอบ RootStackParamList ใน App.tsx ของคุณให้มี DistrictSelection และ StationDetail
type RootStackParamList = {
  Home: undefined;
  DistrictSelection: undefined; // หน้านี้ไม่ต้องรับ params
  StationDetail: { districtId: string; districtName: string };
  // เพิ่มหน้าจออื่นๆ ที่คุณมี
};

type DistrictSelectionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'DistrictSelection'>;

// Interface สำหรับข้อมูล District (จากตาราง districts)
interface DistrictData {
  id: string;
  district_name: string; // ชื่อเขต
  province: string;
  region: string;
  city?: string;
  contact?: string;
  capacity?: string;
  status?: string;
}

const { width } = Dimensions.get('window'); // สำหรับ Responsive Sizing

// *** สำคัญ: หากรันบนอุปกรณ์จริง ให้เปลี่ยนเป็น IP Address ของเครื่องคอมพิวเตอร์คุณ (เช่น 'http://192.168.1.xxx:3001') ***
const API_BASE_URL = 'http://192.168.6.131:3001'; 

const SelectedScreen: React.FC = () => {
  const navigation = useNavigation<DistrictSelectionScreenNavigationProp>();

  const [allDistricts, setAllDistricts] = useState<DistrictData[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDistricts = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching all districts from backend...');
        const response = await fetch(`${API_BASE_URL}/api/districts`);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch districts: ${response.status} ${errorText}`);
        }
        const data: DistrictData[] = await response.json();
        setAllDistricts(data);
        console.log('Districts fetched successfully:', data.length);

        // Extract unique regions and provinces
        const uniqueRegions = Array.from(new Set(data.map(d => d.region).filter(Boolean))).sort();
        setRegions(['', ...uniqueRegions]); // Add empty string for "All Regions"

        const uniqueProvinces = Array.from(new Set(data.map(d => d.province).filter(Boolean))).sort();
        setProvinces(['', ...uniqueProvinces]); // Add empty string for "All Provinces"

      } catch (err: any) {
        console.error('API Error fetching districts:', err);
        setError(`ไม่สามารถโหลดข้อมูลเขตได้: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchDistricts();
  }, []);

  // กรองจังหวัดตามภาคที่เลือก
  const filteredProvinces = useMemo(() => {
    if (!selectedRegion) {
      return provinces; // ถ้าไม่ได้เลือกภาค ให้แสดงทุกจังหวัด
    }
    const provincesInRegion = Array.from(new Set(
      allDistricts
        .filter(d => d.region === selectedRegion)
        .map(d => d.province)
        .filter(Boolean)
    )).sort();
    return ['', ...provincesInRegion];
  }, [selectedRegion, allDistricts, provinces]);

  // กรองเขตตามภาคและจังหวัดที่เลือก
  const filteredDistricts = useMemo(() => {
    return allDistricts.filter(district => {
      const matchesRegion = selectedRegion ? district.region === selectedRegion : true;
      const matchesProvince = selectedProvince ? district.province === selectedProvince : true;
      return matchesRegion && matchesProvince;
    });
  }, [allDistricts, selectedRegion, selectedProvince]);

  const handleDistrictSelect = (districtId: string, districtName: string) => {
    navigation.navigate('StationDetail', { districtId, districtName });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" /> 
        <Text style={styles.loadingText}>กำลังโหลดข้อมูลเขตประปา...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>เกิดข้อผิดพลาด</Text> 
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => { setSelectedRegion(''); setSelectedProvince(''); setAllDistricts([]); setRegions([]); setProvinces([]); setLoading(true); setError(null); }}>
          <Text style={styles.retryButtonText}>ลองใหม่</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>เลือกเขตประปา</Text>
      <View style={styles.filterContainer}>
        <View style={styles.pickerWrapper}>
          <Text style={styles.pickerLabel}>ภาค:</Text>
          <Picker
            selectedValue={selectedRegion}
            style={styles.picker}
            onValueChange={(itemValue) => {
              setSelectedRegion(itemValue);
              setSelectedProvince(''); 
            }}
          >
            {regions.map((region, index) => (
              <Picker.Item key={index} label={region || 'ทั้งหมด'} value={region} />
            ))}
          </Picker>
        </View>

        <View style={styles.pickerWrapper}>
          <Text style={styles.pickerLabel}>จังหวัด:</Text>
          <Picker
            selectedValue={selectedProvince}
            style={styles.picker}
            onValueChange={(itemValue) => setSelectedProvince(itemValue)}
            enabled={filteredProvinces.length > 1}
          >
            {filteredProvinces.map((province, index) => (
              <Picker.Item key={index} label={province || 'ทั้งหมด'} value={province} />
            ))}
          </Picker>
        </View>
      </View>

      <FlatList
        data={filteredDistricts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.districtItem} 
            onPress={() => handleDistrictSelect(item.id, item.district_name)}
          >
            <View style={styles.districtInfo}>
              <MapPin size={20} color="#0ea5e9" style={styles.districtIcon} /> 
              <View>
                <Text style={styles.districtName}>{item.district_name}</Text>
                <Text style={styles.districtLocation}>{item.province} : {item.region}</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#94a3b8" /> 
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyListContainer}>
            <Filter size={40} color="#94a3b8" /> 
            <Text style={styles.emptyListText}>ไม่พบเขตประปาตามตัวเลือก</Text>
          </View>
        }
        contentContainerStyle={filteredDistricts.length === 0 && styles.emptyListContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', 
    padding: 16,
  },

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
  errorTitle: { // เพิ่ม style นี้เข้ามา
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
  headerTitle: {
    fontSize: 28, // ปรับขนาด
    fontWeight: '800', // ปรับน้ำหนัก
    color: '#1f2937', // ปรับสี
    marginBottom: 24, // ปรับระยะห่าง
    textAlign: 'left', // ปรับจัดวาง
    marginTop: 20, // เพิ่มระยะห่างด้านบน
  },
  
  // Filter Container
  filterContainer: {
    backgroundColor: 'rgba(255,255,255,0.95)', // ใช้สีเดียวกับ card ของ HomeScreen
    borderRadius: 20, // ปรับความโค้ง
    padding: 20,
    marginBottom: 20,
    elevation: 4, // เพิ่มเงา
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  pickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0', // สีขอบอ่อนลง
    borderRadius: 12, // ปรับความโค้ง
    backgroundColor: '#f1f5f9', // สีพื้นหลัง picker
    overflow: 'hidden', // จัดการขอบ Picker
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569', // สีเข้มขึ้น
    paddingLeft: 16, // เพิ่มระยะห่าง
    paddingRight: 8, // เพิ่มระยะห่าง
  },
  picker: {
    flex: 1,
    height: 50,
    color: '#334155', // สีตัวอักษรเข้มขึ้น
  },
  
  // District Item
  districtItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.95)', // ใช้สีเดียวกับ card
    borderRadius: 20, // ปรับความโค้ง
    padding: 20,
    marginBottom: 12, // ปรับระยะห่าง
    elevation: 3, // เพิ่มเงา
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 5,
    borderLeftColor: '#0ea5e9', // สีฟ้าสดใส
  },
  districtInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  districtIcon: {
    marginRight: 12, // ปรับระยะห่าง
  },
  districtName: {
    fontSize: 18,
    fontWeight: '700', // ปรับน้ำหนัก
    color: '#1f2937', // ปรับสี
  },
  districtLocation: {
    fontSize: 14,
    color: '#64748b', // ปรับสี
    marginTop: 4, // ปรับระยะห่าง
  },
  
  // Empty List
  emptyListContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
    backgroundColor: 'rgba(255,255,255,0.95)', // ใช้สีเดียวกับ card
    borderRadius: 20, // ปรับความโค้ง
    marginTop: 20,
    elevation: 2, // เพิ่มเงา
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  emptyListText: {
    marginTop: 15,
    fontSize: 16,
    color: '#94a3b8', // ปรับสี
    textAlign: 'center',
    fontWeight: '500', // เพิ่มน้ำหนัก
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});

export default SelectedScreen;