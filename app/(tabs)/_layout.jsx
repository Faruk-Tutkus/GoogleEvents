import { Redirect, Stack, Tabs } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import TabBar from "../../components/TabBar";

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#4A4947" },
      }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="eventDetailScreen" options={{ title: "Etkinlikler" }} />
      <Tabs.Screen name="mapScreen" options={{ title: "Harita" }} />
      <Tabs.Screen name="profileSettings" options={{ title: "Profil" }} />
    </Tabs>
  );
}
