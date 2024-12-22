import { Redirect, Stack } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'
export default function AuthRoutesLayout() {

    return (
        <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {backgroundColor : '#4A4947'},
        }}
      >
        <Stack.Screen name="signIn" options={{animation: 'slide_from_right'}}/>
        <Stack.Screen name="signUp" options={{animation: 'slide_from_right'}}/>
        <Stack.Screen name="forgotPassword" options={{animation: 'slide_from_right'}}/>
      </Stack>
    )
}