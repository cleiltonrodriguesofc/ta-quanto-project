import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function ProductDetailsScreen() {
    const { id, name } = useLocalSearchParams();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Product Details</Text>
            <Text>ID: {id}</Text>
            <Text>Name: {name}</Text>
            <Text style={styles.note}>Details implementation pending.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    note: {
        color: 'gray',
        marginTop: 20,
    },
});
