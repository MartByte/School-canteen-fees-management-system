import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

const LoadingSpinner = ({ 
    size = 'large', 
    color = '#000066', 
    text = 'Loading...', 
    containerStyle,
    textStyle 
}) => {
    return (
        <View style={[styles.container, containerStyle]}>
            <ActivityIndicator size={size} color={color} />
            {text && <Text style={[styles.text, textStyle]}>{text}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff6e9',
    },
    text: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
    },
});

export default LoadingSpinner; 