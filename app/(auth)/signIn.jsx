import React, { useEffect, useRef, useState, useCallback  } from 'react';
import { View, Text, Animated, TextInput, StyleSheet, TouchableOpacity, Image, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useSignIn, useSignUp } from '@clerk/clerk-expo'
import { useRouter } from 'expo-router'
import { useOAuth } from '@clerk/clerk-expo'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
export const useWarmUpBrowser = () => {
  React.useEffect(() => {
    void WebBrowser.warmUpAsync()
    return () => {
      void WebBrowser.coolDownAsync()
    }
  }, [])
}
WebBrowser.maybeCompleteAuthSession()
export default function SignIn() {
  const [isFocusedEmail, setIsFocusedEmail] = useState(false);
  const [isFocusedPassword, setIsFocusedPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('')
  const [textSize, setTextSize] = useState(0)


  const emailLabelAnim = useRef(new Animated.Value(0)).current;
  const passwordLabelAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const colorValue = useRef(new Animated.Value(0)).current;
  const shakePasswordAnim = useRef(new Animated.Value(0)).current

  const handleEmailChange = (text) => {
    setEmail(text);
  };

  useEffect(() => {
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

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [isFocusedEmail, isFocusedPassword, email, password]);

  const animatedLabelStyle = (animation) => ({
    transform: [{ translateY: animation }],
    fontSize: 20,
    color: '#FAF7F0',
    position: 'absolute',
    left: 45,
  });
  const { signIn, setActive, isLoaded } = useSignIn()
  const { signUp } = useSignUp()
  const router = useRouter()
  const triggerShakeAndColor = () => {
    Animated.timing(colorValue, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {

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
  const onSignInPress = React.useCallback(async () => {
    if (!isLoaded) {
      return
    }

    try {
      const signInAttempt = await signIn.create({
        identifier: email,
        password: password,
      })

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId })
        router.replace('/(tabs)/home')
      } else {

        console.error(JSON.stringify(signInAttempt, null, 2))
      }
    } catch (err) {
      setTextSize(17)
      
      if (err["errors"][0]["message"] === "Password is incorrect. Try again, or use another method."){
        setMessage("Şifre yanlış, lütfen geçerli bir şifre girin")
        triggerShakeAndColor()
      }
      else if (err["errors"][0]["message"] === "Couldn't find your account."){
        setMessage("Belirtilen hesap bulunamadı")
        triggerShakeAndColor()
      }
      else if (err["errors"][0]["message"] === "You're already signed in"){
        setMessage("Oturum zaten açık")
      }
      else if (err["errors"][0]["message"] === "Enter password."){
        setMessage("E-mail ve Şifre girin")
        triggerShakeAndColor()
      }
      else if (err["errors"][0]["message"] === "Identifier is invalid."){
        setMessage("Geçersiz mail adresi")
        triggerShakeAndColor()
      }
      console.log(err["errors"][0]["message"])
    }
  }, [isLoaded, email, password])
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
      const { createdSessionId, setActive, signIn } = await startOAuthFlow({
        redirectUrl: Linking.createURL('/signIn'),
      });
      
      if (createdSessionId) {
        await setActive({session: createdSessionId})
        if (signIn.status == 'complete') {
          router.replace('/(tabs)/home')
        }
        
      } else {
        
      }
    } catch (err) {
      Alert.alert("OAuth Error", `An error occurred during the OAuth process: ${err.message || err}`);
      console.error("OAuth error", err);
    }
  }, []);
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
    line: {
      backgroundColor: '#FAF7F0',
      marginTop:25,
      width:300,
      height:2,
      alignSelf:'center'
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
    forgotPassword: {
      color: '#FAF7F0',
      fontSize: 16,
      marginTop: 15,
      textDecorationLine: 'underline',
      textAlign: 'center'
    },
    socialButtonsContainer: {
      marginTop: 30,
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
          <View>
            <Animated.View style={[styles.inputContainer, { opacity: fadeAnim, transform:[{translateX: shakePasswordAnim}] }]}>
              <Icon name="email" size={24} color="#FAF7F0" style={styles.icon} />
              <Animated.Text style={animatedLabelStyle(emailLabelAnim)}>E-mail - Kullanıcı Adı</Animated.Text>
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
            </Animated.View>

            <Animated.View style={[styles.inputContainer, { opacity: fadeAnim, marginTop: 20, transform:[{translateX: shakePasswordAnim}] }]}>
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

            <TouchableOpacity style={styles.loginButton} onPress={onSignInPress}>
              <Text style={styles.loginButtonText}>Giriş Yap</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={()=> { router.navigate('/(auth)/forgotPassword') }}>
              <Text style={styles.forgotPassword}>Şifrenizi mi unuttunuz?</Text>
            </TouchableOpacity>
          </View>
            <View style={{paddingTop: 20}}>
                <Text style={styles.text}>
                  {message}
                </Text>
            </View>
            <View style={styles.line}></View>
          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity style={styles.socialButton} onPress={() => onPressOAuth('google')}>
              <Image source={require('./../../assets/images/google.png')} style={styles.socialLogo} />
              <Text style={styles.socialButtonText}>Google ile Giriş Yap</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialButton} onPress={() => onPressOAuth('facebook')}>
              <Image source={require('./../../assets/images/facebook.png')} style={styles.socialLogo} />
              <Text style={styles.socialButtonText}>Facebook ile Giriş Yap</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialButton} onPress={() => onPressOAuth('apple')}>
              <Image source={require('./../../assets/images/apple.png')} style={styles.socialLogo} />
              <Text style={styles.socialButtonText}>Apple ile Giriş Yap</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

