import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, TextInput, StyleSheet, TouchableOpacity, Image, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, BackHandler, Alert } from 'react-native';
import { useSignIn, useAuth } from '@clerk/clerk-expo'
import { useRouter } from 'expo-router'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
export default function ForgotPassword() {

    const [isFocusedEmail, setIsFocusedEmail] = useState(false);
    const [isFocusedPassword, setIsFocusedPassword] = useState(false);
    const [isFocusedCode, setIsFocusedCode] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('')
    const [textSize, setTextSize] = useState(0)
    const [code, setCode] = useState('')
    const [successfulCreation, setSuccessfulCreation] = useState(false)

    const router = useRouter()
    const { signIn, setActive } = useSignIn()
  

    const onRequestReset = async () => {
		try {
			await signIn.create({
				strategy: 'reset_password_email_code',
				identifier: email
			});
			setSuccessfulCreation(true);
            setTextSize(0)
            setMessage('')
		} catch (err) {
            setTextSize(17)
			console.log(err.errors[0].message);
            if (err["errors"][0]["message"] === "Identifier is invalid."){
              setMessage("Lütfen geçerli bir e-posta girin")
              triggerShakeAndColor()
            }
            else if (err["errors"][0]["message"] === "Couldn't find your account."){
              setMessage("E-posta bulunamadı")
              triggerShakeAndColor()
            }
            else if (err["errors"][0]["message"] === "You're already signed in"){
              setMessage("Oturum zaten açık, lütfen önce çıkış yapın")
            }
            else if (err["errors"][0]["message"] === "Too many requests. Please try again in a bit."){
              setMessage("Çok fazla istek, lütfen biraz bekleyin")
            }
            else if (err["errors"][0]["message"] === "reset_password_email_code is not allowed"){
              setMessage("Şifre sıfırlamaya şu anlık izin verilemiyor")
            }
		}
	};
    const onReset = async () => {
		try {
			const result = await signIn.attemptFirstFactor({
				strategy: 'reset_password_email_code',
				code: code,
				password: password
			});
			console.log(result);
			Alert.alert('Uyarı', 'Şifre başarıyla değiştirilmiştir', [
                {text: 'Tamam', onPress: () => router.replace('/home')},
              ]);
			await setActive({ session: result.createdSessionId });
		} catch (err) {
            setTextSize(17)
      
            if (err["errors"][0]["message"] === "Enter code."){
                setMessage("Lütfen kodu girin")
                triggerShakeAndColor()
            }
            else if (err["errors"][0]["message"] === "Enter password."){
                setMessage("Lütfen yeni şifrenizi girin")
                triggerShakeAndColor()
            }
            else if (err["errors"][0]["message"] === "Identifier is invalid." || err["errors"][0]["message"] === "is incorrect"){
                setMessage("Geçersiz kod")
                triggerShakeAndColor()
            }
            else if (err["errors"][0]["message"] === "Passwords must be 8 characters or more."){
                setMessage("Şifre en az 8 karakterden oluşmalı")
                triggerShakeAndColor()
            }
            else if (err["errors"][0]["message"] === "Password has been found in an online data breach. For account safety, please use a different password."){
                setMessage("Bu şifre çok yaygın! Hesap güvenliği için lütfen farklı bir şifre kullanın")
                triggerShakeAndColor()
            }
			console.log(err.errors[0].message);
		}
	};

    const emailLabelAnim = useRef(new Animated.Value(0)).current;
    const passwordLabelAnim = useRef(new Animated.Value(0)).current;
    const codeLabelAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const colorValue = useRef(new Animated.Value(0)).current;
    const shakePasswordAnim = useRef(new Animated.Value(0)).current
  
  
    const handleEmailChange = (text) => {
      setEmail(text);
    };
  
    useEffect(() => {
      Animated.timing(emailLabelAnim, {
        toValue: isFocusedEmail || email ? -35 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
  
      Animated.timing(passwordLabelAnim, {
        toValue: isFocusedPassword || password ? -35 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      Animated.timing(codeLabelAnim, {
        toValue: isFocusedCode || code ? -35 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, [isFocusedEmail, isFocusedCode, isFocusedPassword, email, password, code]);
  
    const animatedLabelStyle = (animation) => ({
      transform: [{ translateY: animation }],
      fontSize: 20,
      color: '#FAF7F0',
      position: 'absolute',
      left: 45,
      top: 20,
    });
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
          marginBottom: 15,
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
    });
    useEffect(() => {
        const onBackPress = () => {
          if (successfulCreation) {
            setSuccessfulCreation(false);
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
    }, [successfulCreation]);
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
            {!successfulCreation && (
                <>
                    <View style={{width: '80%', alignSelf:'center'}}>
                        <Text style={{fontSize: 15, color: '#FAF7F0', textAlign: 'center'}}>
                            Sıfırlama kodu için lütfen geçerli e-posta adresinizi girin
                        </Text>
                    </View>
                    <View style={{paddingTop: 20}}>
                        <Text style={styles.text}>
                            {message}
                        </Text>
                    </View>
                    <Animated.View style={[styles.inputContainer, { opacity: fadeAnim, transform:[{translateX: shakePasswordAnim}] }]}>
                    <Icon name="email" size={24} color="#FAF7F0" style={styles.icon} />
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
                    </Animated.View>

                    <TouchableOpacity style={styles.loginButton} onPress={onRequestReset}>
                        <Text style={styles.loginButtonText}>Şifreyi Sıfırla</Text>
                    </TouchableOpacity>
                </>
            )}
            {successfulCreation && (
                <>
                    <View style={{width: '80%' , alignSelf:'center'}}>
                        <Text style={{fontSize: 15, color: '#FAF7F0', textAlign: 'center'}}>
                            {email} adresine kodu gönderdik
                        </Text>
                    </View>
                    <View style={{paddingTop: 20}}>
                        <Text style={styles.text}>
                            {message}
                        </Text>
                    </View>
                    <Animated.View style={[styles.inputContainer, { opacity: fadeAnim, marginTop: 20, transform:[{translateX: shakePasswordAnim}] }]}>
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
                    </Animated.View>
                    <Animated.View style={[styles.inputContainer, { opacity: fadeAnim, marginTop: 20, transform:[{translateX: shakePasswordAnim}] }]}>
                        <Icon name="lock" size={24} color="#FAF7F0" style={styles.icon} />
                        <Animated.Text style={animatedLabelStyle(passwordLabelAnim)}>Yeni Şifre</Animated.Text>
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
                    <TouchableOpacity style={styles.loginButton} onPress={onReset}>
                        <Text style={styles.loginButtonText}>Onayla</Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
        </SafeAreaView>
    </ScrollView>
    </KeyboardAvoidingView>
  )
}