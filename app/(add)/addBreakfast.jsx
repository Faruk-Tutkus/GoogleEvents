import React, { useEffect } from 'react';
import { Colors } from '../../constants/Colors'
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Animated, { interpolate, LayoutAnimationConfig, useAnimatedStyle, useSharedValue, withSpring, SlideInLeft, SlideOutRight } from 'react-native-reanimated'
import * as Progress from 'react-native-progress';
import { router, useLocalSearchParams } from 'expo-router';
export default function AddBreakfast() {

  return (
    <SafeAreaView style={styles.container}>
      
    </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContainer: {
    alignItems: 'center',
    flexGrow: 1
  },
  header: {
    flexDirection:'row',
    width: '100%',
    height: 75,
    backgroundColor: Colors.dark.background,
    paddingTop: 10
  },
  headerText: {
    fontSize: 35,
    color: '#D8D2C2',
    marginLeft: 70,
    fontWeight:'bold'
  },
  icon: {
    position: 'absolute',
    left: 16,
    top: 5,
    textAlign:'center',
    fontSize: 40
  },
  calorieContainer: {
    backgroundColor: Colors.dark.container,
    width:'95%',
    borderRadius:15,
    flexDirection:'column',
    paddingTop:20
  },
  textTake: {
    fontSize: 25,
    color:'#D8D2C2',
    textAlign:'center',
    fontWeight:'bold'
  },
  nutrient: {
    fontSize:17,
    color:'#D8D2C2',
    textAlign:'center',
    fontWeight:'bold'
  },
  percentText: {
    fontSize:25,
    color:'#D8D2C2',
    position:'absolute',
    fontWeight:'bold'
  },
  totalCaloriText: {
    fontSize:25,
    color:'#D8D2C2',
    textAlign:'center',
    fontWeight:'bold'
  },
  mealContainer: {
    backgroundColor: Colors.dark.container,
    width:'95%',
    height: 350,
    marginVertical:20,
    borderRadius:15,
    flexDirection:'column',
    paddingTop:20,
    justifyContent:'center',
  },
  calorieText: {
    fontSize:20,
    color:'#D8D2C2',
    fontWeight:'bold',
  },
  addFoodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:'center',
    backgroundColor: '#FAF7F0',
    borderRadius: 10,
    width: 300,
    height: 50,
    marginTop: 15,
    paddingHorizontal: 10,
  },
  addFoodButtonText: {
    color: '#4A4947',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign:'center'
  },
});
