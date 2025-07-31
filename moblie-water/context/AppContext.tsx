// context/AppContext.tsx
import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react'; // Import useCallback

// Define the base URL for your backend API
// IMPORTANT: This URL should point to your Node.js Backend API.
// If running on Android Emulator, use 'http://10.0.2.2:[YOUR_BACKEND_PORT]/api'
// If running on physical device, use 'http://[YOUR_COMPUTER_IP_ADDRESS]:[YOUR_BACKEND_PORT]/api'
// Example: 'http://192.168.6.117:3001/api' (based on your provided IP)
const BASE_API_URL = 'http://192.168.6.117:3001/api'; 

// Define types for water quality data overview
interface WaterData {
  averagepH: number;
  averageTemperature: number;
  averageTurbidity: number;
  averageDO?: number; // Make optional if not always available in overview
}

// Define type for station information
interface Station {
  id: string;
  name: string;
  region: string;
  province: string;
}

// Define type for detailed station data
interface StationDetailData {
  id: string;
  name: string;
  currentpH: number | null; // Allow null
  currentTemperature: number | null; // Allow null
  currentTurbidity: number | null; // Allow null
  currentDO: number | null; // Dissolved Oxygen, Allow null
  historicalData: { date: string; pH: number; temperature: number; turbidity: number; DO: number }[]; // Historical data
  lastUpdated: string | null; // Last updated date and time, Allow null
}

// Define type for notification data
interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  stationId?: string; // Optional station ID related to the notification
  isCritical?: boolean; // Indicates if it's a critical notification
}

// Define type for the AppContext API to be exported
export interface AppContextType {
  waterData: WaterData | null; // Water quality overview data
  stations: Station[]; // List of all stations
  selectedStationId: string | null; // ID of the selected station
  stationData: StationDetailData | null; // Detailed data of the selected station
  notifications: Notification[]; // List of notifications
  isInitialDataLoaded: boolean; // Status indicating if initial data has been loaded

  fetchWaterData: () => Promise<void>; // Function to fetch overview data
  fetchStations: () => Promise<void>; // Function to fetch station list
  setSelectedStationId: (id: string | null) => void; // Function to set the selected station
  fetchStationData: (stationId: string) => Promise<void>; // Function to fetch detailed station data
  fetchNotifications: () => Promise<void>; // Function to fetch notifications
}

// Create Context with initial values
export const AppContext = createContext<AppContextType>({
  waterData: null,
  stations: [],
  selectedStationId: null,
  stationData: null,
  notifications: [],
  isInitialDataLoaded: false, // Initial state
  fetchWaterData: async () => {},
  fetchStations: async () => {},
  setSelectedStationId: () => {},
  fetchStationData: async () => {},
  fetchNotifications: async () => {},
});

// Define type for AppProvider Props
interface AppProviderProps {
  children: ReactNode; // Child components to be wrapped by the Provider
}

// Create AppProvider component to manage state and pass values via Context
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [waterData, setWaterData] = useState<WaterData | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [stationData, setStationData] = useState<StationDetailData | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false); // This state will be used in App.tsx

  // Function to fetch water quality overview data from API
  const fetchWaterData = useCallback(async () => { // ใช้ useCallback
    try {
      const response = await fetch(`${BASE_API_URL}/water-overview`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: WaterData = await response.json();
      setWaterData(data);
    } catch (error) {
      console.error("Error fetching water data:", error);
      // You can add logic here to display an error message in the UI
    }
  }, []); // Dependencies: empty array because it only uses setters and constant BASE_API_URL

  // Function to fetch station list from API
  const fetchStations = useCallback(async () => { // ใช้ useCallback
    try {
      const response = await fetch(`${BASE_API_URL}/stations`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Station[] = await response.json();
      setStations(data);
    } catch (error) {
      console.error("Error fetching stations:", error);
    }
  }, []); // Dependencies: empty array

  // Function to fetch detailed data for a specific station from API
  const fetchStationData = useCallback(async (stationId: string) => { // ใช้ useCallback
    try {
      const response = await fetch(`${BASE_API_URL}/stations/${stationId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: StationDetailData = await response.json();
      setStationData(data);
    } catch (error) {
      console.error(`Error fetching station data for ${stationId}:`, error);
    }
  }, []); // Dependencies: empty array

  // Function to fetch notifications from API
  const fetchNotifications = useCallback(async () => { // ใช้ useCallback
    try {
      const response = await fetch(`${BASE_API_URL}/notifications`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Notification[] = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, []); // Dependencies: empty array

  // useEffect to load all initial data when the Provider is mounted for the first time
  useEffect(() => {
    const loadInitialData = async () => {
      // Fetch all necessary initial data
      await Promise.all([
        fetchStations(),
        fetchWaterData(),
        fetchNotifications(),
      ]);
      setIsInitialDataLoaded(true); // Set to true when all data is loaded
    };
    loadInitialData();
  }, [fetchStations, fetchWaterData, fetchNotifications]); // Dependencies: include memoized fetch functions

  // Provide state and functions via Context.Provider
  return (
    <AppContext.Provider
      value={{
        waterData,
        stations,
        selectedStationId,
        stationData,
        notifications,
        isInitialDataLoaded,
        fetchWaterData,
        fetchStations,
        setSelectedStationId,
        fetchStationData,
        fetchNotifications,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
