import Splash from "./splashScreen";
import startScreen from "./startScreen";
import signUp from "./(auth)/signUp";
import signIn from "./(auth)/signIn";
import home from "./(tabs)/home";
import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import * as SystemUI from "expo-system-ui";
import { SplashScreen } from "expo-router";
const Stack = createStackNavigator();
SystemUI.setBackgroundColorAsync("transparent");
SplashScreen.preventAutoHideAsync()
export default function App() {
  return (
    <NavigationContainer independent={true}>
      <Stack.Navigator initialRouteName="splash">
          <Stack.Screen name="Splash" component={Splash} options={{ headerShown: false}} />
          <Stack.Screen name="startScreen" component={startScreen} options={{ headerShown: false }}/>
          <Stack.Screen name="(auth)" component={signUp} options={{ headerShown: false }}/>
          <Stack.Screen name="(tabs)" component={home} options={{ headerShown: false }}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
