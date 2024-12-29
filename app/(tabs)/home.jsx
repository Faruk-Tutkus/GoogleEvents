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
  Image,
  Animated,
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
  const [isFocusedSearch, setIsFocusedSearch] = useState(false);

  // Label animasyonu (SignUp ekranında olduğu gibi)
  const searchLabelAnim = React.useRef(new Animated.Value(0)).current;

  const categories = [
    'Tümü',
    'Music',
    'Sports',
    'Arts & Theatre',
    'Technology',
    'Family',
    'Comedy',
    'Film',
  ];

  useEffect(() => {
    requestLocationAndFetchEvents();
  }, []);

  useEffect(() => {
    // TextInput’a odaklanma/çıkma durumuna göre label animasyonu
    Animated.timing(searchLabelAnim, {
      toValue: isFocusedSearch || searchQuery ? -35 : -2,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isFocusedSearch, searchQuery]);

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
            radius: 500,
            size: 50,
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

  const animatedLabelStyle = {
    transform: [{ translateY: searchLabelAnim }],
    fontSize: 20,
    color: '#FAF7F0',
    position: 'absolute',
    left: 45,
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Yakındaki Etkinlikler</Text>

      {/* Arama Çubuğu */}
      <View style={styles.inputContainer}>
        <Icon name="magnify" size={24} color="#FAF7F0" style={styles.icon} />
        <Animated.Text style={animatedLabelStyle}>Ara</Animated.Text>
        <TextInput
          style={styles.input}
          value={searchQuery}
          onChangeText={handleSearch}
          onFocus={() => setIsFocusedSearch(true)}
          onBlur={() => setIsFocusedSearch(false)}
          placeholderTextColor="#FAF7F0"
          cursorColor="#FAF7F0"
        />
      </View>

      {/* Kategori Filtreleme */}
      <View style={styles.categoriesContainer}>
        {categories.map((category) => {
          const isSelected = selectedCategory === category;
          return (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                isSelected && styles.categoryButtonSelected,
              ]}
              onPress={() => handleCategoryFilter(category)}
            >
              <Text
                style={[
                  styles.categoryText,
                  isSelected && styles.categoryTextSelected,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Etkinlik Listesi */}
      {loading ? (
        <ActivityIndicator size="large" color="#FAF7F0" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 125 }}
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
  container: {
    flex: 1,
    backgroundColor: '#4A4947', // SignUp arka plan rengi
    paddingHorizontal: 20,
  },
  header: {
    color: '#FAF7F0',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 50,
    marginBottom: 20,
    textAlign: 'center',
  },
  // Arama input container
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    width: '100%',
    height: 70,
    backgroundColor: '#656565',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#252525',
    paddingHorizontal: 10,
    marginBottom: 20,
    
  },
  icon: {
    position: 'absolute',
    left: 10,
  },
  input: {
    flex: 1,
    fontSize: 20,
    color: '#FAF7F0',
    paddingLeft: 40,
  },
  // Kategori butonları
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 15,
  },
  categoryButton: {
    backgroundColor: '#656565',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 15,
    margin: 5,
  },
  categoryButtonSelected: {
    backgroundColor: '#FAF7F0',
  },
  categoryText: {
    color: '#FAF7F0',
    fontSize: 14,
  },
  categoryTextSelected: {
    color: '#4A4947',
    fontWeight: 'bold',
  },
  // Etkinlik kartları
  eventCard: {
    backgroundColor: '#656565',
    borderColor: '#252525',
    borderWidth: 2,
    borderRadius: 10,
    padding: 15,
    marginVertical: 5,
  },
  eventTitle: {
    fontSize: 18,
    color: '#FAF7F0',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  eventDate: {
    fontSize: 14,
    color: '#FAF7F0',
    marginBottom: 5,
  },
  eventDescription: {
    fontSize: 14,
    color: '#FAF7F0',
  },
});
