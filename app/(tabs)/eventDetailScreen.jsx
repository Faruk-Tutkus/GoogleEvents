import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import * as Location from 'expo-location';
import * as Calendar from 'expo-calendar';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/FirebaseConfig';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useUser } from '@clerk/clerk-expo';

const TICKETMASTER_API_KEY = 'UGiA3kpVaWCmHMp36mCf9wu7wnNbeZbF';

export default function EventDetailScreen() {
  const [events, setEvents] = useState([]);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const { user, isLoaded } = useUser();
  const userId = user?.id;

  useEffect(() => {
    getUserLocation();
    loadFavoritesFromFirebase();
  }, []);

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
      setLocation(loc.coords);
      fetchNearbyEvents(loc.coords.latitude, loc.coords.longitude);
    } catch (error) {
      console.error('Konum alınırken hata:', error);
      Alert.alert('Hata', 'Konum alınırken bir hata oluştu.');
      setLoading(false);
    }
  };

  const fetchNearbyEvents = async (latitude, longitude) => {
    try {
      const response = await axios.get(
        'https://app.ticketmaster.com/discovery/v2/events.json',
        {
          params: {
            apikey: TICKETMASTER_API_KEY,
            latlong: `${latitude},${longitude}`,
            radius: 250,
            sort: 'date,asc',
          },
        }
      );

      if (response.data._embedded && response.data._embedded.events) {
        const eventsData = response.data._embedded.events.map((event) => ({
          id: event.id,
          name: event.name,
          description: event.info || 'Açıklama mevcut değil.',
          location: event._embedded.venues[0].name || 'Bilinmeyen Konum',
          date: event.dates.start.localDate,
          time: event.dates.start.localTime || 'Belirtilmemiş',
          organizer: event.promoter ? event.promoter.name : 'Bilinmeyen Organizatör',
        }));
        setEvents(eventsData);

        eventsData.forEach((event) => {
          loadComments(event.id);
        });
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


  // Firebase'den yorumları yükle
const loadComments = async (eventId) => {
  try {
    const eventDocRef = doc(db, 'events', eventId); // Etkinlik ID'sine göre doküman referansı
    const eventDoc = await getDoc(eventDocRef);

    if (eventDoc.exists()) {
      setComments((prev) => ({
        ...prev,
        [eventId]: eventDoc.data().comments || [],
      }));
    } else {
      console.warn('Belge bulunamadı. Yorumlar yüklenemedi.');
    }
  } catch (error) {
    console.error('Yorumlar yüklenirken hata:', error);
  }
};

// Firebase'e yorum ekle
const addComment = async (eventId, newComment) => {
  if (!newComment || typeof newComment !== 'string' || !newComment.trim()) {
    Alert.alert('Boş yorum gönderilemez!');
    return;
  }

  const eventDocRef = doc(db, 'events', eventId);
  const newCommentData = {
    userId,
    userName: user?.firstName || 'Bilinmeyen Kullanıcı',
    text: newComment.trim(),
    date: new Date().toISOString(),
  };

  // Update local state immediately
  setComments((prev) => ({
    ...prev,
    [eventId]: [...(prev[eventId] || []), newCommentData],
  }));

  try {
    await updateDoc(eventDocRef, {
      comments: arrayUnion(newCommentData),
    });
    setNewComment('');
  } catch (error) {
    if (error.code === 'not-found') {
      await setDoc(eventDocRef, {
        comments: [newCommentData],
      });
      Alert.alert('Yorum eklendi ve yeni doküman oluşturuldu.');
    } else {
      console.error('Yorum eklenirken hata:', error);
    }
  }
};

// Favorilere ekle veya çıkar
const toggleFavorite = async (event) => {
  try {
    const isAdding = !favorites.some((fav) => fav.id === event.id);
    await updateDoc(doc(db, 'users', userId), {
      favorites: isAdding
        ? arrayUnion({ id: event.id, name: event.name })
        : arrayRemove({ id: event.id, name: event.name }),
    });

    setFavorites((prev) =>
      isAdding
        ? [...prev, { id: event.id, name: event.name }]
        : prev.filter((fav) => fav.id !== event.id)
    );
  } catch (error) {
    console.error('Favori güncelleme hatası:', error);
  }
};


  const loadFavoritesFromFirebase = async () => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        setFavorites(userDoc.data().favorites || []);
      } else {
        console.warn('Kullanıcı dokümanı bulunamadı.');
      }
    } catch (error) {
      console.error('Favoriler yüklenirken hata:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Yakındaki Etkinlikler</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#4A90E2" />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.eventCard}>
              <Text style={styles.eventName}>{item.name}</Text>
              <Text style={styles.eventInfo}>📍 {item.location}</Text>
              <Text style={styles.eventInfo}>🗓 {item.date} - 🕒 {item.time}</Text>
              <Text style={styles.eventInfo}>👤 {item.organizer}</Text>

              <TouchableOpacity
                style={styles.calendarButton}
                onPress={() => addToCalendar(item)}
              >
                <Icon name="calendar" size={20} color="#FFF" />
                <Text style={styles.calendarButtonText}>Hatırlatıcı Ekle</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.favoriteButton,
                  favorites.some((fav) => fav.id === item.id) && styles.favorited,
                ]}
                onPress={() => toggleFavorite(item)}
              >
                <Icon
                  name={favorites.some((fav) => fav.id === item.id) ? 'heart' : 'heart-outline'}
                  size={20}
                  color="#FFF"
                />
                <Text style={styles.calendarButtonText}>
                  {favorites.some((fav) => fav.id === item.id) ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
                </Text>
              </TouchableOpacity>


              <Text style={styles.commentTitle}>Yorumlar:</Text>
              {(comments[item.id] || []).map((comment, index) => (
                <Text key={index} style={styles.comment}>
                  {comment.userName}: {comment.text} - {new Date(comment.date).toLocaleString()}
                </Text>
              ))}
              <TextInput
                style={styles.input}
                placeholder="Yorum yaz..."
                value={newComment}
                onChangeText={setNewComment}
              />
              <TouchableOpacity
                style={styles.commentButton}
                onPress={() => addComment(item.id, newComment)}
              >
                <Text style={styles.commentButtonText}>Yorum Yap</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  eventCard: {
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  eventName: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  eventInfo: { fontSize: 14, color: '#555', marginBottom: 5 },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  calendarButtonText: { color: '#FFF', marginLeft: 10 },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6F61',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  favorited: { backgroundColor: '#FF3B3B' },
  commentTitle: { marginTop: 10, fontWeight: 'bold' },
  comment: { fontSize: 14, color: '#777' },
  input: {
    borderColor: '#DDD',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginVertical: 10,
  },
  commentButton: {
    backgroundColor: '#4A90E2',
    padding: 10,
    borderRadius: 5,
  },
  commentButtonText: { color: '#FFF', textAlign: 'center' },
});
