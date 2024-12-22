import { db } from '../config/FirebaseConfig';
import { doc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';

/**
 * Kullanıcı verisini gerçek zamanlı olarak Firestore'dan dinler.
 * @param {string} userId - Firestore'daki kullanıcı belgesinin ID'si.
 * @param {function} callback - Veriyi işlemek için bir callback fonksiyonu.
 * @returns {function} unsubscribe - Dinlemeyi durdurmak için çağrılacak fonksiyon.
 */
export const fetchUserData = (userId, callback) => {
  if (!userId) {
    console.error('User ID gerekli.');
    return () => {};
  }

  const unsubscribe = onSnapshot(
    doc(db, 'users', userId),
    (documentSnapshot) => {
      if (documentSnapshot.exists()) {
        callback(documentSnapshot.data());
      } else {
        console.log('Kullanıcı bulunamadı.');
        callback(null);
      }
    },
    (error) => {
      console.error('Veri dinleme sırasında hata oluştu:', error);
      callback(null); 
    }
  );
  return unsubscribe;
};

/**
 * Kullanıcı sohbet mesajını Firestore'a ekler.
 * @param {string} userId - Kullanıcı ID'si.
 * @param {object} message - Sohbet mesajı.
 * @returns {Promise<void>}
 */
export const addMessageToUser = async (userId, message) => {
  if (!userId || !message) {
    console.error('Hem kullanıcı ID\'si hem de mesaj gerekli.');
    return;
  }

  const userRef = doc(db, 'users', userId);
  try {
    await updateDoc(userRef, {
      messages: arrayUnion(message),
    });
    console.log('Mesaj başarıyla eklendi.');
  } catch (error) {
    console.error('Mesaj ekleme sırasında hata oluştu:', error);
  }
};
