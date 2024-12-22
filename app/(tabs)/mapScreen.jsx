import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import * as Linking from 'expo-linking';
import axios from 'axios';

const TICKETMASTER_API_KEY = 'UGiA3kpVaWCmHMp36mCf9wu7wnNbeZbF';

export default function MapScreen() {
  const [location, setLocation] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserLocation();
  }, []);

  // Kullanıcının konumunu al
  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Konum İzni Gerekli',
          'Yakındaki etkinlikleri gösterebilmek için konum erişimine izin vermelisiniz.',
          [{ text: 'Tamam' }]
        );
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const userLocation = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
      setLocation(userLocation);
      fetchNearbyEvents(loc.coords.latitude, loc.coords.longitude);
    } catch (error) {
      console.error('Konum alınırken hata:', error);
      Alert.alert('Hata', 'Konum alınırken bir hata oluştu.');
      setLoading(false);
    }
  };

  // API'den etkinlikleri çek
  const fetchNearbyEvents = async (latitude, longitude) => {
    try {
      const response = await axios.get(
        'https://app.ticketmaster.com/discovery/v2/events.json',
        {
          params: {
            apikey: TICKETMASTER_API_KEY,
            latlong: `${latitude},${longitude}`,
            radius: 200, // 20 km yarıçapında etkinlikler
            size: 20, // Maksimum 20 etkinlik
          },
        }
      );

      if (response.data._embedded && response.data._embedded.events) {
        const eventsData = response.data._embedded.events.map((event) => ({
          id: event.id,
          name: event.name,
          latitude: parseFloat(event._embedded.venues[0].location.latitude),
          longitude: parseFloat(event._embedded.venues[0].location.longitude),
          description: event.info || 'Etkinlik açıklaması mevcut değil.',
        }));

        setEvents(eventsData);
      } else {
        Alert.alert('Uyarı', 'Yakında etkinlik bulunamadı.');
      }
    } catch (error) {
      console.error('Etkinlik verisi alınamadı:', error);
      Alert.alert('Hata', 'Etkinlik verisi alınırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Yön tarifi için harita uygulamasını aç
  const openDirections = (latitude, longitude, name) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=walking`;
    Linking.openURL(url).catch((err) => console.error('Yön tarifi açılamadı:', err));
  };

  return (
    <View style={styles.container}>
      {loading || !location ? (
        <ActivityIndicator size="large" color="#4A90E2" />
      ) : (
        <MapView style={styles.map} initialRegion={location}>
          {/* Kullanıcının mevcut konumu */}
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="Mevcut Konumunuz"
            pinColor="blue"
          />

          {/* Etkinlik Noktaları */}
          {events.map((event) => (
            <Marker
              key={event.id}
              coordinate={{
                latitude: event.latitude,
                longitude: event.longitude,
              }}
              title={event.name}
              description={event.description}
              onCalloutPress={() =>
                openDirections(event.latitude, event.longitude, event.name)
              }
            />
          ))}
        </MapView>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Bir etkinlik pinine tıklayın ve yön tarifi almak için bilgi kutusuna dokunun!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  infoContainer: {
    backgroundColor: '#FFF',
    padding: 10,
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  infoText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#333',
  },
});
