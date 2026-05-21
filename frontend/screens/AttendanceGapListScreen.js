import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native'; // Add this
import Config from '../config';

const AttendanceGapListScreen = ({ navigation }) => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchGap = async () => {
        try {
            setLoading(true);
            const url = `${Config.API_BASE_URL}/admin/reports/audit-gap-details`;
            console.log("Fetching from:", url); // Debugging
            
            const response = await fetch(url);
            const result = await response.json();
            
            if (result.success) {
                setStudents(result.data);
            } else {
                console.error("Server returned error:", result.message);
            }
        } catch (err) {
            console.error("Network Error:", err);
            Alert.alert("Error", "Could not connect to server.");
        } finally {
            setLoading(false);
        }
    };

    // This ensures it refreshes EVERY time the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchGap();
        }, [])
    );

    const renderStudent = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.subText}>{item.class} • {item.town}</Text>
            </View>
            <TouchableOpacity 
                style={styles.collectBtn}
                onPress={() => navigation.navigate('CollectCanteen', { student: item })}
            >
                <Text style={styles.collectText}>Collect</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
                     <Ionicons name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Unpaid Students Today</Text>
                    <Text style={styles.count}>{students.length} Students have not paid</Text>
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={students}
                    keyExtractor={(item) => item.studentID.toString()}
                    renderItem={renderStudent}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="checkmark-circle" size={80} color="#10B981" />
                            <Text style={styles.empty}>All present students have paid! 🎉</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { 
        paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20, 
        backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
        flexDirection: 'row', alignItems: 'center'
    },
    back: { marginRight: 15 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
    count: { color: '#EF4444', fontWeight: '600', fontSize: 13 },
    card: { flexDirection: 'row', backgroundColor: '#FFF', marginHorizontal: 15, marginTop: 12, padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'space-between', elevation: 2 },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
    subText: { color: '#64748B', fontSize: 13, marginTop: 2 },
    collectBtn: { backgroundColor: '#3B82F6', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
    collectText: { color: '#FFF', fontWeight: '700' },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    empty: { textAlign: 'center', marginTop: 20, color: '#64748B', fontSize: 16, fontWeight: '500' }
});

export default AttendanceGapListScreen;