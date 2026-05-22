import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Config from '../config';

const FeesBalancesScreen = () => {
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetch(`${Config.API_BASE_URL}/admin/reports/balances`) // Verify if /admin prefix is needed
            .then(res => res.json())
            .then(res => {
                if (res.success && res.data) {
                    console.log("Students loaded:", res.data.length);
                    setData(res.data);
                    setFilteredData(res.data);
                } else {
                    console.log("No data returned from API");
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Fetch error:", err);
                setLoading(false);
            });
    }, []);

    const handleSearch = (text) => {
        setSearch(text);
        if (!text) {
            setFilteredData(data);
            return;
        }
        const filtered = data.filter(s => {
            const studentName = s.name ? s.name.toLowerCase() : "";
            const studentID = s.studentID ? s.studentID.toString() : "";
            return studentName.includes(text.toLowerCase()) || studentID.includes(text);
        });
        setFilteredData(filtered);
    };

    const renderItem = ({ item }) => (
        <View style={styles.balanceCard}>
            <View>
                <Text style={styles.nameText}>{item.name}</Text>
                <Text style={styles.classText}>{item.class} • {item.town}</Text>
                <Text style={styles.idText}>ID: {item.studentID}</Text>
            </View>
            <View style={styles.amountContainer}>
                <Text style={[styles.balanceAmount, { color: item.balance < 0 ? '#EF4444' : '#10B981' }]}>
                    GH₵ {Math.abs(item.balance).toFixed(2)}
                </Text>
                <Text style={styles.balanceLabel}>{item.balance < 0 ? 'Debt' : 'Credit'}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.searchBox}>
                <Ionicons name="search" size={20} color="#94A3B8" />
                <TextInput 
                    placeholder="Search student or ID..." 
                    style={styles.input} 
                    value={search}
                    onChangeText={handleSearch}
                />
            </View>

            {loading ? <ActivityIndicator size="large" color="#000066" /> : (
                <FlatList 
                    data={filteredData}
                    keyExtractor={item => item.studentID.toString()}
                    renderItem={renderItem}
                    initialNumToRender={10} 
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    removeClippedSubviews={true}
                    contentContainerStyle={{ padding: 15 }}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 50 }}>
                            <Text style={{ color: '#94A3B8' }}>No students with balances found.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    searchBox: { flexDirection: 'row', backgroundColor: '#FFF', margin: 15, padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
    input: { flex: 1, marginLeft: 10 },
    balanceCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFF', padding: 15, borderRadius: 15, marginBottom: 10, elevation: 2 },
    nameText: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
    classText: { color: '#64748B', fontSize: 12 },
    idText: { color: '#94A3B8', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    amountContainer: { alignItems: 'flex-end' },
    balanceAmount: { fontSize: 18, fontWeight: '800' },
    balanceLabel: { fontSize: 10, textTransform: 'uppercase', color: '#94A3B8', fontWeight: '700' }
});

export default FeesBalancesScreen;