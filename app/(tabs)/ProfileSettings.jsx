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
          />
        ) : (
          <Text style={styles.profileText}>Kullanıcı Adı: {profile.userName}</Text>
        )}
        <Text style={styles.profileText}>E-posta: {profile.email}</Text>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => (editing ? updateProfile() : setEditing(true))}
        >
          <Text style={styles.buttonText}>{editing ? 'Kaydet' : 'Düzenle'}</Text>
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
                  <Icon name="delete" size={20} color="#FF6F61" />
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
        <Icon name="logout" size={20} color="#FFF" />
        <Text style={styles.buttonText}>Çıkış Yap</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  profileText: { fontSize: 16, marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    marginBottom: 10,
  },
  editButton: {
    backgroundColor: '#4A90E2',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  notificationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  favoriteItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  favoriteItem: { fontSize: 16 },
  deleteButton: {
    backgroundColor: '#FFF',
    padding: 5,
    borderRadius: 5,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6F61',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});
