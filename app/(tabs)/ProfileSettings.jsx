import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { doc, getDoc, updateDoc, onSnapshot, arrayRemove } from 'firebase/firestore';
import { db } from '../../config/FirebaseConfig';
import { useAuth } from '@clerk/clerk-expo';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';

export default function ProfileSettings() {
  const [profile, setProfile] = useState({});
  const [favorites, setFavorites] = useState([]);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [editing, setEditing] = useState(false);
  const [updatedName, setUpdatedName] = useState('');
  const { userId, signOut } = useAuth();

  useEffect(() => {
    const userDocRef = doc(db, 'users', userId);

    const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setProfile(data);
        setFavorites(data.favorites || []);
        setNotificationEnabled(data.notification || false);
        setUpdatedName(data.userName || '');
      } else {
        console.warn('Kullanıcı profili bulunamadı.');
      }
    });

    return () => unsubscribe();
  }, [userId]);

  const toggleNotification = async () => {
    try {
      const newNotificationState = !notificationEnabled;
      await updateDoc(doc(db, 'users', userId), {
        notification: newNotificationState,
      });
      setNotificationEnabled(newNotificationState);
    } catch (error) {
      console.error('Bildirim ayarları güncellenirken hata:', error);
    }
  };

  const updateProfile = async () => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        userName: updatedName,
      });
      setEditing(false);
      Alert.alert('Profil Güncellendi', 'Kullanıcı adı başarıyla güncellendi.');
    } catch (error) {
      console.error('Profil güncellenirken hata:', error);
    }
  };

  const deleteFavorite = async (favorite) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        favorites: arrayRemove(favorite),
      });
      setFavorites((prev) => prev.filter((item) => item.id !== favorite.id));
    } catch (error) {
      console.error('Favori silinirken hata:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profil ve Ayarlar</Text>

      {/* Profil Bilgileri */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profil Bilgileri</Text>
        {editing ? (
          <TextInput
            style={styles.input}
            value={updatedName}
            onChangeText={setUpdatedName}
            placeholderTextColor="#FAF7F0"
          />
        ) : (
          <Text style={styles.profileText}>Kullanıcı Adı: {profile.userName}</Text>
        )}
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => (editing ? updateProfile() : setEditing(true))}
        >
          <Text style={styles.editButtonText}>
            {editing ? 'Kaydet' : 'Düzenle'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bildirim Ayarları */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bildirim Ayarları</Text>
        <View style={styles.notificationContainer}>
          <Text style={styles.profileText}>Bildirimleri Aç</Text>
          <Switch
            value={notificationEnabled}
            onValueChange={toggleNotification}
            trackColor={{ false: '#767577', true: '#FAF7F0' }}
            thumbColor={notificationEnabled ? '#4A4947' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Favori Etkinlikler */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Favori Etkinlikler</Text>
        {favorites.length > 0 ? (
          <FlatList
            data={favorites}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.favoriteItemContainer}>
                <Text style={styles.favoriteItem}>- {item.name}</Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteFavorite(item)}
                >
                  <Icon name="delete" size={20} color="#4A4947" />
                </TouchableOpacity>
              </View>
            )}
          />
        ) : (
          <Text style={styles.profileText}>Henüz favori eklenmemiş.</Text>
        )}
      </View>

      {/* Çıkış Yap */}
      <TouchableOpacity
        style={styles.signOutButton}
        onPress={() => {
          signOut();
          router.replace('/startScreen');
        }}
      >
        <Icon name="logout" size={20} color="#4A4947" />
        <Text style={styles.signOutButtonText}>Çıkış Yap</Text>
      </TouchableOpacity>
    </View>
  );
}

// Stil tanımları
const styles = StyleSheet.create({
  // Arka plan
  container: {
    flex: 1,
    backgroundColor: '#4A4947', // SignUp ile aynı arka plan
    paddingHorizontal: 20,
  },
  // Başlık
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FAF7F0',
    marginTop: 50,
    marginBottom: 20,
    textAlign: 'center',
  },
  // Bölüm kapsayıcı
  section: {
    backgroundColor: '#656565',
    borderColor: '#252525',
    borderWidth: 2,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  // Bölüm başlığı
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FAF7F0',
    marginBottom: 10,
  },
  // Profil metinleri
  profileText: {
    fontSize: 16,
    color: '#FAF7F0',
    marginBottom: 5,
  },
  // Düzenlenebilir alan (kullanıcı adı) için giriş
  input: {
    backgroundColor: '#656565',
    borderColor: '#252525',
    borderWidth: 2,
    borderRadius: 10,
    color: '#FAF7F0',
    padding: 10,
    fontSize: 16,
    marginBottom: 10,
  },
  // Düzenle/Kaydet butonu
  editButton: {
    backgroundColor: '#FAF7F0',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#252525',
    alignItems: 'center',
    padding: 10,
    marginTop: 5,
  },
  editButtonText: {
    color: '#4A4947',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Bildirim bölümü
  notificationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // Favori etkinlik item
  favoriteItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  favoriteItem: {
    fontSize: 16,
    color: '#FAF7F0',
  },
  deleteButton: {
    backgroundColor: '#FAF7F0',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#252525',
    padding: 5,
  },
  // Çıkış yap butonu
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF7F0',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#252525',
    padding: 10,
  },
  signOutButtonText: {
    color: '#4A4947',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});
