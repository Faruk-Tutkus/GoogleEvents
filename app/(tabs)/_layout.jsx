import { Redirect, Stack, Tabs } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#4A4947',
          borderTopColor: '#3A3937',
          height: 60,
        },
        tabBarActiveTintColor: '#F5F5F5',
        tabBarInactiveTintColor: '#888',
        headerShown: false,
      }}
    >
      {/* Home Tab */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" color={color} size={size} />
          ),
        }}
      />

      {/* Map Tab */}
      <Tabs.Screen
        name="mapScreen"
        options={{
          title: 'Harita',
          tabBarIcon: ({ color, size }) => (
            <Icon name="map-marker" color={color} size={size} />
          ),
        }}
      />
      
      {/* Map Tab */}
      <Tabs.Screen
        name="eventDetailScreen"
        options={{
          title: 'Etkinlik Detay',
          tabBarIcon: ({ color, size }) => (
            <Icon name="map-marker" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
