import { View, StyleSheet } from 'react-native';
import TabBarButton from './TabBarButton';
import { useCallback, useState, useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

function TabBar({ state, descriptors, navigation }) {
    const [dimensions, setDimensions] = useState({ height: 50, width: 200 });
    const buttonWidth = dimensions.width / state.routes.length;
    const buttonHeight = dimensions.height;

    const onTabbarLayout = useCallback((event) => {
        const { width, height } = event.nativeEvent.layout;
        setDimensions({ width, height });
    }, []);

    const tabPositionX = useSharedValue(0);
    
    useEffect(() => {
        tabPositionX.value = withSpring(buttonWidth * state.index, { duration: 750 });
    }, [state.index, buttonWidth]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: tabPositionX.value }]
        };
    });

    return (
        <View onLayout={onTabbarLayout} style={styles.tabbar}>
            <Animated.View
                style={[
                    animatedStyle,
                    {
                        position: 'absolute',
                        backgroundColor: '#B17457',
                        borderRadius: 30,
                        marginHorizontal: 12,
                        height: buttonHeight - 12,
                        bottom: 20,
                        width: buttonWidth - 25,
                    },
                ]}
            />
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const label =
                    options.tabBarLabel !== undefined
                        ? options.tabBarLabel
                        : options.title !== undefined
                        ? options.title
                        : route.name;

                const isFocused = state.index === index;

                const onPress = () => {
                    tabPositionX.value = withSpring(buttonWidth * index, { duration: 750 });
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name, route.params);
                    }
                };

                const onLongPress = () => {
                    navigation.emit({
                        type: 'tabLongPress',
                        target: route.key,
                    });
                };

                return (
                    <TabBarButton
                        key={route.name}
                        onPress={onPress}
                        onLongPress={onLongPress}
                        isFocused={isFocused}
                        routeName={route.name}
                        color={isFocused ? '#B17457' : '#D8D2C2'}
                        label={label}
                    />
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    tabbar: {
        position: 'absolute',
        bottom: 25,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#2e2d2d',
        marginHorizontal: 15,
        paddingVertical: 15,
        borderRadius: 35,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowRadius: 10,
        shadowOpacity: 0.5,
    },
});

export default TabBar;
