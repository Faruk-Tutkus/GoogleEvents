import { StyleSheet, Text, View, Pressable } from 'react-native'
import React, { useEffect } from 'react'
import { Colors } from '../constants/Colors'
import { icon } from '../constants/icons'
import Animated, { interpolate, useAnimatedKeyboard, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'

const TabBarButton = ({onPress,onLongPress,isFocused,routeName,color,label})=> {
  
    const scale = useSharedValue(0)
    useEffect(()=> {
        scale.value = withSpring(isFocused === 'boolean' ? (isFocused ? 1 : 0) : isFocused, 
            { duration:350 })

    }, [scale, isFocused])

    const animatedIconStyle = useAnimatedStyle(()=> {
        const scaleValue = interpolate(scale.value, [0,1], [1,2])
        const top = interpolate(scale.value, [0,1],[0,-5])
        return {
            transform: [{
                scale: scaleValue
            }],
            top: top
        }
    })

    const animatedTextStyle = useAnimatedStyle(()=> {
        const opacity = interpolate(scale.value, [0,1],[1,0])
        return {
            opacity
        }
    })

    return (
    <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        style={styles.tabBarItems}
        >
        <Animated.View style={animatedIconStyle}>
            {icon[routeName]({
                color: '#D8D2C2',
            })}
        </Animated.View>
        <Animated.Text style={[{ color:'#D8D2C2' }, animatedTextStyle]}>
            {label}
        </Animated.Text>
    </Pressable>
  )
}
export default TabBarButton
const styles = StyleSheet.create({
    tabBarItems: {
        flex:1,
        justifyContent:'center',
        alignItems:'center',
        gap: 5
    }
})