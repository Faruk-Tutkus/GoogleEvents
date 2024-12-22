import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Animated, Image, StyleSheet } from 'react-native';
import { router } from 'expo-router';
export default function SplashScreen() {
    const [displayText, setDisplayText] = useState('');
    const fullText = 'cartol';

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateYAnim = useRef(new Animated.Value(-250)).current;


    const image = require('./../assets/images/logo.png');
    const backgroundColor = '#4A4947';

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(translateYAnim, {
                toValue: 0,
                friction: 6,
                tension: 50,
                useNativeDriver: true,
            }),
        ]).start(() => {
            animateText();
        });
    }, []);

    const animateText = () => {
        let index = 0;
        const interval = setInterval(() => {
            setDisplayText((prev) => prev + fullText[index]);
            index += 1;
            if (index === fullText.length) {
                clearInterval(interval);
                setTimeout(() => {
                    router.replace('/startScreen');
                }, 250);
            }
        }, 150);
    };

    return (
        <Animated.View style={[styles.container, { backgroundColor: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: ['#000', backgroundColor] }) }]}>
            <Animated.Image
                source={image}
                style={[
                    styles.image,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: translateYAnim }],
                    },
                ]}
            />
            <Text style={styles.text}>{displayText}</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: 250,
        height: 250,
        resizeMode: 'cover',
    },
    text: {
        fontSize: 48,
        color: '#FAF7F0',
        fontFamily: 'delius',
        textAlign:'center'
    },
});
