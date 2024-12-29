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
import { doc, updateDoc, arrayUnion, arrayRemove, onSnapshot, getDoc, setDoc } from 'firebase/firestore';
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
  const { user } = useUser();
  const userId = user?.id;

  useEffect(() => {
    getUserLocation();
    loadFavoritesFromFirebase();
    if (events.length === 0) return;

    // Her etkinlik için comments listener
    const unsubscribeListeners = events.map((event) => {
      const eventDocRef = doc(db, 'events', event.id);
      return onSnapshot(eventDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          setComments((prev) => ({
            ...prev,
            [event.id]: docSnapshot.data().comments || [],
          }));
        } 
      });
    });

    return () => {
      unsubscribeListeners.forEach((unsubscribe) => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    };
  }, [events]);

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
            radius: 500,
            size: 50,
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

        // Her etkinliğin yorumlarını yükle
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

  const loadComments = async (eventId) => {
    try {
      const eventDocRef = doc(db, 'events', eventId);
      const eventDoc = await getDoc(eventDocRef);

      if (eventDoc.exists()) {
        setComments((prev) => ({
          ...prev,
          [eventId]: eventDoc.data().comments || [],
        }));
      }
    } catch (error) {
      console.error('Yorumlar yüklenirken hata:', error);
    }
  };

  const addComment = async (eventId, newComment) => {
    if (!newComment || typeof newComment !== 'string' || !newComment.trim()) {
      Alert.alert('Boş yorum gönderilemez!');
      return;
    }
  
    const eventDocRef = doc(db, 'events', eventId);
    
    try {
      // Kullanıcı adını Firebase'den al
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      const userName = userDoc.exists() ? userDoc.data()?.userName || 'Bilinmeyen Kullanıcı' : 'Bilinmeyen Kullanıcı';
  
      const newCommentData = {
        userId,
        userName,
        text: newComment.trim(),
        date: new Date().toISOString(),
      };
  
      // Update local state immediately
      setComments((prev) => ({
        ...prev,
        [eventId]: [...(prev[eventId] || []), newCommentData],
      }));
  
      // Firebase'de yorum ekle
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

  // Örnek: Expo Calendar'a etkinlik ekleme fonksiyonu (kod içinde belirtilmiş ama örnek; tasarımla ilgili değil)
  const addToCalendar = async (item) => {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status === 'granted') {
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        // Varsayılan takvimin ilkini alalım
        const defaultCalendar = calendars[0];
        await Calendar.createEventAsync(defaultCalendar.id, {
          title: item.name,
          location: item.location,
          startDate: new Date(`${item.date}T${item.time}`),
          endDate: new Date(`${item.date}T${item.time}`), 
        });
        Alert.alert('Başarılı', 'Etkinlik takvime eklendi!');
      }
    } catch (error) {
      Alert.alert('Hata', 'Takvime eklenirken bir hata oluştu.');
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Yakındaki Etkinlikler</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#FAF7F0" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 125 }}
          renderItem={({ item }) => (
            <View style={styles.eventCard}>
              <Text style={styles.eventName}>{item.name}</Text>
              <Text style={styles.eventInfo}>📍 {item.location}</Text>
              <Text style={styles.eventInfo}>🗓 {item.date} - 🕒 {item.time}</Text>
              <Text style={styles.eventInfo}>👤 {item.organizer}</Text>

              <TouchableOpacity style={styles.calendarButton} onPress={() => addToCalendar(item)}>
                <Icon name="calendar" size={20} color="#4A4947" />
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
                  color="#4A4947"
                />
                <Text style={styles.favoriteButtonText}>
                  {favorites.some((fav) => fav.id === item.id)
                    ? 'Favorilerden Çıkar'
                    : 'Favorilere Ekle'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.commentTitle}>Yorumlar:</Text>
              {(comments[item.id] || []).map((comment, index) => (
                <Text key={index} style={styles.comment}>
                  {comment.userName}: {comment.text} -{' '}
                  {new Date(comment.date).toLocaleString()}
                </Text>
              ))}
              <TextInput
                style={styles.input}
                placeholder="Yorum yaz..."
                placeholderTextColor="#FAF7F0"
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
  // Ekran ana container
  container: {
    flex: 1,
    backgroundColor: '#4A4947', // SignUp arka plan rengi
    paddingHorizontal: 20,
  },
  // Başlık
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FAF7F0',
    marginBottom: 20,
    textAlign: 'center',
    marginTop: 50
  },
  // Etkinlik kartı
  eventCard: {
    backgroundColor: '#656565',
    borderColor: '#252525',
    borderWidth: 2,
    borderRadius: 10,
    padding: 15,
    marginVertical: 5,
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FAF7F0',
    marginBottom: 5,
  },
  eventInfo: {
    fontSize: 14,
    color: '#FAF7F0',
    marginBottom: 5,
  },
  // Takvim butonu
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F0',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  calendarButtonText: {
    color: '#4A4947',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  // Favori butonu
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F0',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  favorited: {
    // Favorilerdeyse rengi biraz daha koyu yapabilirsiniz veya isterseniz farklı tasarlayabilirsiniz
    backgroundColor: '#E4DEDE',
  },
  favoriteButtonText: {
    color: '#4A4947',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  // Yorum başlığı
  commentTitle: {
    marginTop: 10,
    fontWeight: 'bold',
    color: '#FAF7F0',
  },
  comment: {
    fontSize: 14,
    color: '#FAF7F0',
  },
  // Yorum girişi
  input: {
    borderColor: '#252525',
    borderWidth: 2,
    borderRadius: 10,
    backgroundColor: '#656565',
    color: '#FAF7F0',
    padding: 10,
    marginVertical: 10,
  },
  // Yorum gönderme butonu
  commentButton: {
    backgroundColor: '#FAF7F0',
    padding: 10,
    borderRadius: 10,
  },
  commentButtonText: {
    color: '#4A4947',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
