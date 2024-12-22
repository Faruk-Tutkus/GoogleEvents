import React, { useEffect, useRef, useState, useCallback  } from 'react';
import { View, Text, Animated, TextInput, StyleSheet, TouchableOpacity, Image, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, BackHandler, Alert  } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SignedOut, useSignUp } from '@clerk/clerk-expo'
import { useRouter, useLocalSearchParams  } from 'expo-router'
import { useOAuth, useAuth, useUser } from '@clerk/clerk-expo'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from '../../config/FirebaseConfig'

export const useWarmUpBrowser = () => {
  React.useEffect(() => {
    void WebBrowser.warmUpAsync()
    return () => {
      void WebBrowser.coolDownAsync()
    }
  }, [])
}
WebBrowser.maybeCompleteAuthSession()
export default function SignUp() {
  const { userId, isSignedIn } = useAuth(); // setActive sonrası değerleri tekrar al
  const { user } = useUser();
  const { signOut } = useAuth()
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()
  const [isFocusedEmail, setIsFocusedEmail] = useState(false);
  const [isFocusedName, setIsFocusedName] = useState(false);
  const [isFocusedPassword, setIsFocusedPassword] = useState(false);
  const [isFocusedRePassword, setIsFocusedRePassword] = useState(false);
  const [isFocusedCode, setIsFocusedCode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rePassword, setRePassword] = useState('');
  const [code, setCode] = useState('')
  const [pendingVerification, setPendingVerification] = useState(false)
  const [message, setMessage] = useState('')
  const [textSize, setTextSize] = useState(0)
  const [name, setName] = useState("")
  const userData = {
    userName: name,
    notification: true,
  };
  console.log(userData)
  const addUserData = async (uid, userData) => {
    try {
      // UID'yi belge kimliği olarak kullan
      await setDoc(doc(db, 'users', uid), userData);
      console.log('Kullanıcı verileri başarıyla kaydedildi.');
    } catch (error) {
      console.error('Veri kaydedilirken hata oluştu:', error);
      signOut()
      router.replace({ pathname: "/(auth)/signUp" });
    }
  };

  const onSignUpPress = async () => {
    if (password != rePassword){
      setTextSize(17)
      setMessage('Şifreler uyuşmuyor')
      triggerShakeAndColor();
      return
    }
    if (!isLoaded) {
      return
    }
    else {
      setMessage('')
      setTextSize(0)
    }
      
    try {
      await signUp.create({
        emailAddress: email,
        password: password,
        firstName: name
      })

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })

      setPendingVerification(true)
    } catch (err) {
      setTextSize(17)
      
      if (err["errors"][0]["message"] === "Too many requests. Please try again in a bit."){
        setMessage("Çok fazla istek. Lütfen biraz bekleyin")
      }
      else if (err["errors"][0]["message"] === "Passwords must be 8 characters or more."){
        setMessage("Şifre en az 8 karakterden oluşmalı")
      }
      else if (err["errors"][0]["message"] === "Password has been found in an online data breach. For account safety, please use a different password."){
        setMessage("Bu şifre çok yaygın! Hesap güvenliği için lütfen farklı bir şifre kullanın")
      }
      else if (err["errors"][0]["message"] === "Enter email address."){
        setMessage("Lütfen geçerli bir e-mail adresi girin")
      }
      else if (password === ''){
        setMessage('Lütfen geçerli bir şifre girin')
        triggerShakeAndColor();
      }
      else if (err["errors"][0]["message"] === "Session already exists"){
        setMessage("Kullanıcı zaten mevcut.")
      }
      else if (err["errors"][0]["message"] === "That email address is taken. Please try another."){
        setMessage("Kullanıcı zaten mevcut.")
      }
      console.log(err["errors"][0]["message"])
    }
  }
  const onPressVerify = async () => {
    if (!isLoaded) {
      return
    }
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      })

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId })
        const userID = signUp.createdUserId
        addUserData(userID,userData)
        router.replace('/(tabs)/home')
      } else {
        console.error(JSON.stringify(completeSignUp, null, 2))
        router.replace({ pathname: "/(auth)/signUp"});
      }
    } catch (err) {
      setMessage('')
      setTextSize(17)
      if (err["errors"][0]["message"] === "is incorrect"){
        setMessage("Hatalı Kod")
      }
      else if (err["errors"][0]["message"] === "failed"){
        setMessage("Kod doğrulaması başarısız oldu")
      }
      else if (err["errors"][0]["message"] === "Too many requests. Please try again in a bit."){
        setMessage("Çok fazla istek. Lütfen biraz bekleyin")
      }
      else if (err["errors"][0]["message"] === "Enter code."){
        setMessage("Lütfen kodu girin")
      }
      console.log(err["errors"][0]["message"])
    }
  }


  useWarmUpBrowser()
  const { startOAuthFlow: startGoogleOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startFacebookOAuthFlow } = useOAuth({ strategy: 'oauth_facebook' });
  const { startOAuthFlow: startAppleOAuthFlow } = useOAuth({ strategy: 'oauth_apple' });

  const onPressOAuth = useCallback(async (provider) => {
    try {
      const startOAuthFlow = 
        provider === 'google' ? startGoogleOAuthFlow :
        provider === 'facebook' ? startFacebookOAuthFlow :
        startAppleOAuthFlow;

      const { createdSessionId, signUp, setActive, authSessionResult } = await startOAuthFlow({
        redirectUrl: Linking.createURL('/signUp', { scheme: 'myapp' }),
      });

      if (createdSessionId) {
        await setActive({ session: createdSessionId })
        console.log(signUp.createdUserId)
        if (signUp.status === 'complete') {
          const userID = signUp.createdUserId
          addUserData(userID,userData)
          router.replace('/(tabs)/home');
        }
        else
          router.replace({ pathname: "/(auth)/signUp"});

      }
    } catch (err) {
      router.replace({ pathname: "/(auth)/signUp"});
      signOut()
      Alert.alert("OAuth Error", `An error occurred during the OAuth process: ${err.message || err}`);
      console.error("OAuth error", err);
    }
  }, [isSignedIn, userId, setActive]);


  const nameLabelAnim = useRef(new Animated.Value(0)).current;
  const emailLabelAnim = useRef(new Animated.Value(0)).current;
  const passwordLabelAnim = useRef(new Animated.Value(0)).current;
  const rePasswordLabelAnim = useRef(new Animated.Value(0)).current;
  const codeLabelAnim = useRef(new Animated.Value(0)).current;
  const shakePasswordAnim = useRef(new Animated.Value(0)).current
  const colorValue = useRef(new Animated.Value(0)).current;
  const triggerShakeAndColor = () => {
    Animated.timing(colorValue, {
      toValue: 1, // Hedef değer
      duration: 500,
      useNativeDriver: true, // Renk animasyonları için false kullanmalıyız
    }).start(() => {
      // Animasyon bitince geri döndürmek için
      Animated.timing(colorValue, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
    Animated.sequence([
      Animated.timing(shakePasswordAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakePasswordAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakePasswordAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakePasswordAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();

  }
  const interpolatedColor = colorValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#252525', '#B17457'], // Başlangıç ve bitiş renkleri
  });
  const handleEmailChange = (text) => {
    setEmail(text);
  };
  
  const handleNameChange = (text) => {
    setName(text);
  };

  useEffect(() => {
    Animated.timing(nameLabelAnim, {
      toValue: isFocusedName || name ? -35 : -2,
      duration: 200,
      useNativeDriver: true,
    }).start();

    Animated.timing(emailLabelAnim, {
      toValue: isFocusedEmail || email ? -35 : -2,
      duration: 200,
      useNativeDriver: true,
    }).start();

    Animated.timing(passwordLabelAnim, {
      toValue: isFocusedPassword || password ? -35 : -2,
      duration: 200,
      useNativeDriver: true,
    }).start();

    Animated.timing(rePasswordLabelAnim, {
      toValue: isFocusedRePassword || rePassword ? -35 : -2,
      duration: 200,
      useNativeDriver: true,
    }).start();

    Animated.timing(codeLabelAnim, {
      toValue: isFocusedCode || code ? -35 : -2,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isFocusedEmail, isFocusedPassword, isFocusedName, isFocusedCode, isFocusedRePassword, email, password, name]);

  const animatedLabelStyle = (animation) => ({
    transform: [{ translateY: animation }],
    fontSize: 20,
    color: '#FAF7F0',
    position: 'absolute',
    left: 45,

  });
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#4A4947',
      paddingHorizontal: 20,
      padding: 100,
    },
    text: {
      textAlign: 'center',
      fontSize: textSize,
      color: '#F15457',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      position: 'relative',
      width: 300,
      height: 70,
      backgroundColor: '#656565',
      borderRadius: 10,
      borderWidth: 2,
      borderColor: '#252525',
      paddingHorizontal: 10,
    },
    passwordContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      position: 'relative',
      width: 300,
      height: 70,
      backgroundColor: '#656565',
      borderRadius: 10,
      borderWidth: 2,
      borderColor: interpolatedColor,
      paddingHorizontal: 10,
    },
    input: {
      flex: 1,
      fontSize: 20,
      color: '#FAF7F0',
      paddingLeft: 40,
      textAlign: 'left',
    },
    icon: {
      position: 'absolute',
      left: 10,
    },
    eyeIcon: {
      position: 'absolute',
      right: 10,
    },
    loginButton: {
      width: 300,
      height: 50,
      backgroundColor: '#FAF7F0',
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 30,
    },
    loginButtonText: {
      color: '#4A4947',
      fontSize: 18,
      fontWeight: 'bold',
    },
    line: {
      backgroundColor: '#FAF7F0',
      marginTop:25,
      width:300,
      height:2,
      alignSelf:'center'
    },
    socialButtonsContainer: {
      marginTop: 20,
    },
    socialButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FAF7F0',
      borderRadius: 10,
      width: 300,
      height: 50,
      marginTop: 15,
      paddingHorizontal: 10,
    },
    socialLogo: {
      width: 24,
      height: 24,
      marginRight: 10,
    },
    socialButtonText: {
      color: '#4A4947',
      fontSize: 16,
      fontWeight: 'bold',
    },
  });
  useEffect(() => {
    const onBackPress = () => {
      if (pendingVerification) {
        setPendingVerification(false);
        setMessage('')
        setTextSize(0)
        return true; // Geri tuşunu yönetmiş olduk, default davranışı engelledik
      }
      return false; // Varsayılan geri davranışını devam ettir
    };

    // BackHandler event listener'ı ekle
    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

    // Component unmount olduğunda event listener'ı kaldır
    return () => backHandler.remove();
  }, [pendingVerification]);
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        <SafeAreaView style={[styles.container]}>
          {!pendingVerification && (
            <>
              <View>
                <View style={[styles.inputContainer, { marginTop: 20 }]}>
                  <Icon name="account-circle" size={24} color="#FAF7F0" style={styles.icon} />
                  <Animated.Text style={animatedLabelStyle(nameLabelAnim)}>Kullanıcı Adı</Animated.Text>
                  <TextInput
                    value={name}
                    onChangeText={handleNameChange}
                    onFocus={() => setIsFocusedName(true)}
                    onBlur={() => setIsFocusedName(false)}
                    autoCapitalize="none"
                    keyboardType="default"
                    cursorColor={'#FAF7F0'}
                    style={styles.input}
                  />
                </View>
                <View style={[styles.inputContainer, { marginTop: 20 }]}>
                  <Icon name="email" size={24} color="#FAF7F0" style={[styles.icon]} />
                  <Animated.Text style={animatedLabelStyle(emailLabelAnim)}>E-mail</Animated.Text>
                  <TextInput
                    value={email}
                    onChangeText={handleEmailChange}
                    onFocus={() => setIsFocusedEmail(true)}
                    onBlur={() => setIsFocusedEmail(false)}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    cursorColor={'#FAF7F0'}
                    style={styles.input}
                  />
                </View>

                <Animated.View style={[styles.passwordContainer, { marginTop: 20, transform:[{translateX: shakePasswordAnim}] }]}>
                  <Icon name="lock" size={24} color="#FAF7F0" style={styles.icon} />
                  <Animated.Text style={animatedLabelStyle(passwordLabelAnim)}>Şifre</Animated.Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setIsFocusedPassword(true)}
                    onBlur={() => setIsFocusedPassword(false)}
                    secureTextEntry={!showPassword}
                    cursorColor={'#FAF7F0'}
                    style={styles.input}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <Icon name={showPassword ? "eye-off" : "eye"} size={24} color="#FAF7F0" />
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View style={[styles.passwordContainer, { marginTop: 20, transform:[{translateX: shakePasswordAnim}] }]}>
                  <Icon name="lock" size={24} color="#FAF7F0" style={styles.icon} />
                  <Animated.Text style={animatedLabelStyle(rePasswordLabelAnim)}>Şifre Tekrar</Animated.Text>
                  <TextInput
                    value={rePassword}
                    onChangeText={setRePassword}
                    onFocus={() => setIsFocusedRePassword(true)}
                    onBlur={() => setIsFocusedRePassword(false)}
                    secureTextEntry={!showRePassword}
                    cursorColor={'#FAF7F0'}
                    style={styles.input}
                  />
                  <TouchableOpacity onPress={() => setShowRePassword(!showRePassword)} style={styles.eyeIcon}>
                    <Icon name={showRePassword ? "eye-off" : "eye"} size={24} color="#FAF7F0" />
                  </TouchableOpacity>
                </Animated.View>
                <TouchableOpacity style={styles.loginButton}
                  onPress={onSignUpPress}  
                >
                  <Text style={styles.loginButtonText}>Üye Ol</Text>
                </TouchableOpacity>
                <View style={{paddingTop: 20}}>
                  <Text style={styles.text}>
                    {message}
                  </Text>
                </View>
                <View style={styles.line}></View>
              </View>

              <View style={styles.socialButtonsContainer}>
                <TouchableOpacity style={styles.socialButton} onPress={() => onPressOAuth('google')}>
                  <Image source={require('./../../assets/images/google.png')} style={styles.socialLogo} />
                  <Text style={styles.socialButtonText}>Google ile Üye Ol</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.socialButton} onPress={() => onPressOAuth('facebook')}>
                  <Image source={require('./../../assets/images/facebook.png')} style={styles.socialLogo} />
                  <Text style={styles.socialButtonText}>Facebook ile Üye Ol</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.socialButton} onPress={() => onPressOAuth('apple')}>
                  <Image source={require('./../../assets/images/apple.png')} style={styles.socialLogo} />
                  <Text style={styles.socialButtonText}>Apple ile Üye Ol</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          {pendingVerification && (
            <>
              <View style={{paddingTop: 20}}>
                <Text style={styles.text}>
                  {message}
                </Text>
              </View>
              <View style={[styles.inputContainer, { marginTop: 20 }]}>
                  <Icon name="code-tags" size={24} color="#FAF7F0" style={styles.icon} />
                  <Animated.Text style={animatedLabelStyle(codeLabelAnim)}>Kod</Animated.Text>
                  <TextInput
                    value={code}
                    onChangeText={setCode}
                    onFocus={() => setIsFocusedCode(true)}
                    onBlur={() => setIsFocusedCode(false)}
                    cursorColor={'#FAF7F0'}
                    style={styles.input}
                    keyboardType='numeric'
                  />
              </View>
              <TouchableOpacity style={styles.loginButton} onPress={onPressVerify} >
              <Text style={styles.loginButtonText}>Doğrula</Text>
              </TouchableOpacity>
            </>
          )}
        </SafeAreaView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}