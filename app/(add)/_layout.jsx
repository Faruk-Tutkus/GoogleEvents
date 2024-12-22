import { Redirect, Stack } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'
export default function AddLayout() {

    return (
        <Stack
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#2e2d2d'
          },
          headerTintColor: "#fff", // Header yazı rengi
          headerTitleStyle: {
            fontWeight: "bold",
            fontSize:25
          },
          contentStyle: {backgroundColor : '#4A4947'},
        }}
      >
        <Stack.Screen name="addBreakfast" options={{animation: 'slide_from_right', title: 'Kahvaltı Ekle'}}/>
      </Stack>
    )
}