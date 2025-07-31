// screens/Main.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageBackground, Dimensions } from 'react-native';
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App"; // Import RootStackParamList from App.tsx

const { width, height } = Dimensions.get('window');

export default function Main() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleGoToHome = () => {
    navigation.navigate("Home"); 
  };

  return (
    <ImageBackground
      source={require('../assets/bg.blue.png')}
      style={styles.backgroundContainer}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Image
            source={require('../assets/logoicon.png')} 
            style={styles.logo} 
          />
          <Text style={styles.welcomeText}>AquaFlow</Text> 
          <Text style={styles.subtitle}>ระบบติดตามคุณภาพน้ำ</Text> 
          <TouchableOpacity 
            style={styles.startButton} 
            onPress={handleGoToHome}
            activeOpacity={0.8}
          >
            <Text style={styles.startButtonText}>เริ่มต้นใช้งาน</Text> 
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)', // ปรับความทึบแสงของ overlay
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: "center",
    padding: 30, // เพิ่ม padding
    backgroundColor: 'rgba(255,255,255,0.2)', // พื้นหลังโปร่งแสง
    borderRadius: 20, // มุมโค้งมน
    paddingVertical: 50, // เพิ่ม padding แนวตั้ง
    paddingHorizontal: 30,
    marginHorizontal: 20,
    // เพิ่มเงาให้ดูมีมิติมากขึ้น คล้ายกับ card ใน HomeScreen
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 12,
  },
  logo: { // ปรับขนาดและสไตล์ของโลโก้
    width: width * 0.4, // ใช้สัดส่วนของหน้าจอ
    height: width * 0.4,
    resizeMode: 'contain',
    marginBottom: 30, // เพิ่มระยะห่าง
    // เพิ่มเงาให้โลโก้ดูโดดเด่น
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  welcomeText: {
    fontSize: 40, // ขนาดใหญ่ขึ้น
    fontWeight: "900", // น้ำหนักตัวอักษรหนามาก
    color: "#FFFFFF",
    marginBottom: 10, // ปรับระยะห่าง
    textAlign: "center",
    textShadowColor: 'rgba(0,0,0,0.5)', // เงาข้อความ
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
    letterSpacing: 1.5, // เพิ่มระยะห่างระหว่างตัวอักษร
  },
  subtitle: {
    fontSize: 20, // ขนาดใหญ่ขึ้น
    color: "rgba(255,255,255,0.9)", // สีขาวโปร่งแสงเล็กน้อย
    marginBottom: 50, // เพิ่มระยะห่าง
    textAlign: "center",
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    fontWeight: '500', // น้ำหนักตัวอักษรปานกลาง
  },
  startButton: {
    backgroundColor: 'rgba(14,165,233,0.9)', // สีฟ้าหลักของแอป
    paddingHorizontal: 60, // เพิ่ม padding
    paddingVertical: 18,
    borderRadius: 30, // มุมโค้งมนมาก
    elevation: 8, // เงาที่เด่นชัดขึ้น
    shadowColor: '#0ea5e9', // สีเงาเป็นสีฟ้า
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    marginTop: 20,
    borderWidth: 1, // เพิ่มขอบเล็กน้อย
    borderColor: 'rgba(255,255,255,0.3)', // สีขอบโปร่งแสง
  },
  startButtonText: {
    color: "#ffffff", // สีข้อความเป็นสีขาว
    fontSize: 22, // ขนาดใหญ่ขึ้น
    fontWeight: "700", // น้ำหนักตัวอักษรหนา
    textAlign: "center",
    letterSpacing: 0.5, // เพิ่มระยะห่างตัวอักษร
  },
});