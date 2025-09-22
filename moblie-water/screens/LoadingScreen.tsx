  // screens/LoadingScreen.tsx
  import React from 'react';
  import { View, Text, ActivityIndicator, StyleSheet, ImageBackground } from 'react-native';


  const API_BASE_URL = '3000'; 
  const LoadingScreen: React.FC = () => {
    return (
      
      <ImageBackground
        source={require('../assets/bg_blue3.png')} // Ensure this path is correct
        style={styles.backgroundContainer}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>กำลังโหลดข้อมูล AquaNext...</Text>
          <Text style={styles.subText}>โปรดรอสักครู่</Text>
        </View>
      </ImageBackground>
    );
  };

  export default LoadingScreen;

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
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
    },
    loadingText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginTop: 20,
      textAlign: 'center',
    },
    subText: {
      fontSize: 16,
      color: '#E0E0E0',
      marginTop: 10,
      textAlign: 'center',
    },
  });


