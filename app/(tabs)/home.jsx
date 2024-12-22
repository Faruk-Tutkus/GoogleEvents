import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const TICKETMASTER_API_KEY = 'UGiA3kpVaWCmHMp36mCf9wu7wnNbeZbF';

export default function Home() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tümü');

  const categories = ['Tümü', 'Music', 'Sports', 'Arts & Theatre', 'Technology'];

  useEffect(() => {
    requestLocationAndFetchEvents();
  }, []);

  // Kullanıcıdan konum izni al ve etkinlikleri çek
  const requestLocationAndFetchEvents = async () => {
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

      const location = await Location.getCurrentPositionAsync({});
      fetchEvents(location.coords);
    } catch (error) {
      console.error('Konum alınamadı:', error);
      Alert.alert('Hata', 'Konum alınırken bir hata oluştu.');
      setLoading(false);
    }
  };

  // Ticketmaster API'den etkinlik verilerini çek
  const fetchEvents = async (coords) => {
    try {
      const response = await axios.get(
        'https://app.ticketmaster.com/discovery/v2/events.json',
        {
          params: {
            apikey: TICKETMASTER_API_KEY,
            latlong: `${coords.latitude},${coords.longitude}`,
            radius: 2000, // 20 km yarıçapında etkinlikler
            size: 20, // Maksimum 20 etkinlik
          },
        }
      );

      if (response.data._embedded && response.data._embedded.events) {
        const eventsData = response.data._embedded.events.map((event) => {
          const category = event.classifications
            ? event.classifications[0]?.segment?.name || 'Diğer'
            : 'Diğer';

          return {
            id: event.id,
            name: event.name,
            description: event.info || 'Açıklama mevcut değil.',
            date: event.dates.start.localDate || 'Tarih bilinmiyor',
            category: category,
          };
        });

        setEvents(eventsData);
        setFilteredEvents(eventsData);
      } else {
        Alert.alert('Uyarı', 'Yakındaki etkinlik bulunamadı.');
      }
    } catch (error) {
      console.error('Etkinlik verisi alınamadı:', error.message || error);
      Alert.alert('Hata', 'Etkinlik verisi alınırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Kategoriye göre filtreleme
  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
    if (category === 'Tümü') {
      setFilteredEvents(events);
    } else {
      const filtered = events.filter(
        (event) => event.category.toLowerCase() === category.toLowerCase()
      );
      setFilteredEvents(filtered);
    }
  };

  // Arama fonksiyonu
  const handleSearch = (query) => {
    setSearchQuery(query);
    const filtered = events.filter((event) =>
      event.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredEvents(filtered);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={[styles.header, { marginTop: 50 }]}>Yakındaki Etkinlikler</Text>

      {/* Arama Çubuğu */}
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={24} color="#555" />
        <TextInput
          style={styles.searchInput}
          placeholder="Etkinlik ara..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {/* Kategori Filtreleme */}
      <View style={styles.categoriesContainer}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.categoryButtonSelected,
            ]}
            onPress={() => handleCategoryFilter(category)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextSelected,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Etkinlik Listesi */}
      {loading ? (
        <ActivityIndicator size="large" color="#4A90E2" />
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.eventCard}>
              <Text style={styles.eventTitle}>{item.name}</Text>
              <Text style={styles.eventDate}>{item.date}</Text>
              <Text style={styles.eventDescription}>{item.description}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', padding: 10 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  searchInput: { flex: 1, padding: 10, fontSize: 16 },
  categoriesContainer: { flexDirection: 'row', justifyContent: 'space-around' },
  categoryButton: { padding: 8, borderRadius: 20, backgroundColor: '#E0E0E0' },
  categoryButtonSelected: { backgroundColor: '#4A90E2' },
  categoryText: { fontSize: 14, color: '#555' },
  categoryTextSelected: { color: '#FFF' },
  eventCard: {
    padding: 15,
    marginVertical: 5,
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    elevation: 2,
  },
  eventTitle: { fontSize: 16, fontWeight: 'bold' },
  eventDate: { fontSize: 14, color: '#777' },
  eventDescription: { fontSize: 14, color: '#555' },
});
