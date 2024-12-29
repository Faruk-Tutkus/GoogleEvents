import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import {useEffect} from 'react';
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo'
import * as SecureStore from 'expo-secure-store'
export default function RootLayout() {

  const [loaded, error] = useFonts({
    'delius': require('./../assets/fonts/Delius-Regular.ttf'),
    'delius-bold': require('./../assets/fonts/DeliusUnicase-Bold.ttf'),
    'pacifico': require('./../assets/fonts/Pacifico-Regular.ttf'),
  });
  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }
  const tokenCache = {
    async getToken(key) {
      try {
        const item = await SecureStore.getItemAsync(key)
        if (item) {
          console.log(`${key} was used 🔐 \n`)
        } else {
          console.log('No values stored under key: ' + key)
        }
        return item
      } catch (error) {
        console.error('SecureStore get item error: ', error)
        await SecureStore.deleteItemAsync(key)
        return null
      }
    },
    async saveToken(key, value) {
      try {
        return SecureStore.setItemAsync(key, value)
      } catch (err) {
        return
      }
    },
  }

  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY

  if (!publishableKey) {
    throw new Error('Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to your .env file')
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
    <ClerkLoaded>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {backgroundColor : '#4A4947'},
        }}
      >
        <Stack.Screen name="index" options={{animation: 'fade'}}/>
        <Stack.Screen name="splashScreen"options={{animation: 'fade'}}/>
        <Stack.Screen name="startScreen" options={{animation: 'none'}}/>
        <Stack.Screen name="(auth)" options={{animation: 'slide_from_right'}}/>
        <Stack.Screen name="(tabs)" options={{animation: 'slide_from_right'}}/>
      </Stack>
    </ClerkLoaded>
  </ClerkProvider>
  );
}
