import React, { useEffect, useState, useMemo } from 'react';
import { 
    Alert, FlatList, Text, TextInput, TouchableOpacity, 
    View, StatusBar, ActivityIndicator, StyleSheet, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ApiService from '../utils/apiService';

const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const MonthlyCanteenReportScreen = () => {
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [data, setData] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();

    const fetchReport = async () => {
        setLoading(true);
        try {
            const result = await ApiService.getMonthlyReport(selectedMonth, selectedYear);
            if (result.success) {
                setData(Array.isArray(result.data) ? result.data : []);
            } else {
                setData([]);
                Alert.alert('Notice', result.message || 'No data found.');
            }
        } catch (err) {
            setData([]);
            Alert.alert('Error', 'Server connection failed');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [selectedMonth, selectedYear]);

    // Financial Totals including Debt and Exemptions
    const monthlyTotals = useMemo(() => {
        const safeData = Array.isArray(data) ? data : [];
        return safeData.reduce((acc, curr) => ({
            cash: acc.cash + (parseFloat(curr.totalCashCollected) || 0),
            balance: acc.balance + (parseFloat(curr.balanceValueConsumed) || 0),
            debt: acc.debt + (parseFloat(curr.creditDebtIncurred) || 0),
            exemptCount: acc.exemptCount + (parseInt(curr.totalExemptedServed) || 0),
            students: acc.students + (parseInt(curr.studentsServed) || 0)
        }), { cash: 0, balance: 0, debt: 0, exemptCount: 0, students: 0 });
    }, [data]);

    const filteredData = useMemo(() => {
        const safeData = Array.isArray(data) ? data : [];
        return safeData.filter((item) =>
            item.town?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.class?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [data, searchQuery]);

    const renderItem = ({ item }) => (
        <View style={styles.reportCard}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.townName}>{item.town || 'Unknown'}</Text>
                    <Text style={styles.className}>Class: {item.class}</Text>
                </View>
                <View style={styles.studentCount}>
                    <Ionicons name="people" size={16} color="#3B82F6" />
                    <Text style={styles.countText}>{item.studentsServed || 0} students</Text>
                </View>
            </View>
            
            <View style={styles.amountSection}>
                <Text style={styles.totalAmount}>₵ {(parseFloat(item.totalCashCollected) || 0).toFixed(2)}</Text>
                <Text style={styles.amountLabel}>Total Physical Cash Collected</Text>
            </View>
            
            <View style={styles.breakdownSection}>
                <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>Bal. Used</Text>
                    <Text style={styles.breakdownAmount}>₵{(parseFloat(item.balanceValueConsumed) || 0).toFixed(2)}</Text>
                </View>
                <View style={styles.breakdownDivider} />
                <View style={styles.breakdownItem}>
                    <Text style={[styles.breakdownLabel, { color: '#EF4444' }]}>Debt</Text>
                    <Text style={[styles.breakdownAmount, { color: '#EF4444' }]}>₵{(parseFloat(item.creditDebtIncurred) || 0).toFixed(2)}</Text>
                </View>
                <View style={styles.breakdownDivider} />
                <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>Exempt</Text>
                    <Text style={[styles.breakdownAmount, { color: '#64748b' }]}>{item.totalExemptedServed || 0}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Monthly Finance</Text>
                    <Text style={styles.headerSubtitle}>Summary by town & class</Text>
                </View>
            </View>

            <FlatList
                data={filteredData}
                keyExtractor={(item, index) => `${item.class}-${item.town}-${index}`}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
                ListHeaderComponent={
                    <>
                        <View style={styles.selectionSection}>
                            <Text style={styles.sectionTitle}>Reporting Period</Text>
                            <View style={styles.selectionContainer}>
                                <TouchableOpacity 
                                    style={styles.navButton} 
                                    onPress={() => setSelectedMonth(prev => prev > 1 ? prev - 1 : 12)}>
                                    <Ionicons name="chevron-back" size={24} color="#3B82F6" />
                                </TouchableOpacity>
                                <View style={styles.currentSelection}>
                                    <Text style={styles.monthText}>{months[selectedMonth - 1]}</Text>
                                    <Text style={styles.yearText}>{selectedYear}</Text>
                                </View>
                                <TouchableOpacity 
                                    style={styles.navButton} 
                                    onPress={() => setSelectedMonth(prev => prev < 12 ? prev + 1 : 1)}>
                                    <Ionicons name="chevron-forward" size={24} color="#3B82F6" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.summaryRow}>
                            <View style={[styles.summaryCard, { backgroundColor: '#059669' }]}>
                                <Text style={styles.summaryLabel}>Total Cash</Text>
                                <Text style={styles.summaryValue}>₵{monthlyTotals.cash.toFixed(0)}</Text>
                            </View>
                            <View style={[styles.summaryCard, { backgroundColor: '#EF4444' }]}>
                                <Text style={styles.summaryLabel}>Total Debt</Text>
                                <Text style={styles.summaryValue}>₵{monthlyTotals.debt.toFixed(0)}</Text>
                            </View>
                        </View>

                        <View style={styles.searchBar}>
                            <Ionicons name="search" size={20} color="#94A3B8" />
                            <TextInput
                                placeholder="Search town or class..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                style={styles.searchInput}
                                placeholderTextColor="#94A3B8"
                            />
                        </View>
                    </>
                }
                ListEmptyComponent={
                    loading ? (
                        <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 50 }} />
                    ) : (
                        <Text style={styles.emptyText}>No records for this period.</Text>
                    )
                }
            />
        </View>
    );
};


const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    headerContent: { flex: 1 },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1E293B' },
    headerSubtitle: { fontSize: 13, color: '#64748B' },
    selectionSection: { backgroundColor: '#FFFFFF', margin: 15, padding: 15, borderRadius: 16, elevation: 2 },
    sectionTitle: { fontSize: 11, fontWeight: '800', color: '#94A3B8', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
    selectionContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    navButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
    currentSelection: { alignItems: 'center' },
    monthText: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
    yearText: { fontSize: 14, color: '#64748B' },
    yearNavigation: { flexDirection: 'row', justifyContent: 'center', gap: 30, marginTop: 10 },
    yearButton: { flexDirection: 'row', alignItems: 'center' },
    yearButtonText: { fontSize: 12, color: '#94A3B8', marginHorizontal: 4 },
    summaryRow: { flexDirection: 'row', paddingHorizontal: 15, gap: 12, marginBottom: 15 },
    summaryCard: { flex: 1, padding: 15, borderRadius: 16, elevation: 4 },
    summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    summaryValue: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginTop: 4 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', marginHorizontal: 15, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', height: 48, marginBottom: 10 },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 15 },
    listContainer: { paddingBottom: 100 },
    reportCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginHorizontal: 15, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    townName: { fontSize: 17, fontWeight: '800', color: '#1E293B' },
    className: { fontSize: 13, color: '#3B82F6', fontWeight: '600' },
    studentCount: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', padding: 6, borderRadius: 8 },
    countText: { marginLeft: 5, fontSize: 11, color: '#64748B', fontWeight: '700' },
    amountSection: { alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', marginBottom: 15 },
    totalAmount: { fontSize: 26, fontWeight: '900', color: '#059669' },
    amountLabel: { fontSize: 10, color: '#94A3B8', marginTop: 2, fontWeight: '600' },
    breakdownSection: { flexDirection: 'row', justifyContent: 'space-between' },
    breakdownItem: { flex: 1, alignItems: 'center' },
    breakdownDivider: { width: 1, height: 20, backgroundColor: '#F1F5F9' },
    breakdownLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '700', marginBottom: 2 },
    breakdownAmount: { fontSize: 13, fontWeight: '800', color: '#1E293B' },
    downloadButton: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: '#1E293B', height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 8 },
    downloadButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
    emptyText: { textAlign: 'center', marginTop: 40, color: '#94A3B8' }
});

export default MonthlyCanteenReportScreen;