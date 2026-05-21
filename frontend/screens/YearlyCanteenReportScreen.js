import React, { useEffect, useState } from 'react';
import { 
    View, Text, StyleSheet, FlatList, TouchableOpacity, 
    ActivityIndicator, StatusBar, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../utils/apiService';

const YearlyCanteenReportScreen = ({ navigation }) => {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [reportData, setReportData] = useState([]);
    const [stats, setStats] = useState({ 
        grandTotalCash: 0, 
        grandTotalDebt: 0, 
        totalStudents: 0,
        totalExempted: 0 
    });
    const [loading, setLoading] = useState(false);

    const fetchYearlyReport = async () => {
        setLoading(true);
        try {
            const result = await ApiService.getYearlyReport(selectedYear);
            if (result.success) {
                setReportData(result.data || []);
                
                // If the backend doesn't provide stats, calculate them manually:
                const manualStats = (result.data || []).reduce((acc, curr) => ({
                    cash: acc.cash + (parseFloat(curr.cashCollected) || 0),
                    debt: acc.debt + (parseFloat(curr.debtIncurred || curr.creditIncurred) || 0),
                }), { cash: 0, debt: 0 });
    
                setStats({
                    grandTotalCash: result.stats?.grandTotalCash || manualStats.cash,
                    grandTotalDebt: result.stats?.grandTotalDebt || manualStats.debt,
                });
            }
        } catch (err) {
            Alert.alert("Error", "Could not load yearly data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchYearlyReport();
    }, [selectedYear]);

    const renderMonthItem = ({ item }) => {
        // Debugging: Uncomment the line below to see what the backend is sending
        // console.log("Row Item:", item);
    
        return (
            <View style={styles.monthCard}>
                <View style={styles.monthHeader}>
                    <Text style={styles.monthName}>{item.month} - {item.town}</Text>
                    <Text style={styles.studentBadge}>{item.uniqueStudents} Students</Text>
                </View>
                
                <View style={styles.revenueRow}>
                    <View style={styles.revColumn}>
                        <Text style={styles.revLabel}>CASH RECEIVED</Text>
                        <Text style={styles.cashAmount}>₵{(parseFloat(item.cashCollected) || 0).toFixed(2)}</Text>
                    </View>
                    
                    <View style={styles.verticalDivider} />
                    
                    <View style={styles.revColumn}>
                        <Text style={[styles.revLabel, {color: '#EF4444'}]}>UNPAID DEBT</Text>
                        {/* Check both debtIncurred and creditIncurred just in case */}
                        <Text style={[styles.balAmount, {color: '#EF4444'}]}>
                            ₵{(parseFloat(item.debtIncurred || item.creditIncurred) || 0).toFixed(2)}
                        </Text>
                    </View>
    
                    <View style={styles.verticalDivider} />
                    
                    <View style={styles.revColumn}>
                        <Text style={styles.revLabel}>BAL. USED</Text>
                        <Text style={styles.balAmount}>₵{(parseFloat(item.balanceConsumed) || 0).toFixed(2)}</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.darkHeader}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{selectedYear} Annual Summary</Text>
            </View>

            <View style={styles.statsOverview}>
                <View style={styles.mainStat}>
                    <Text style={styles.statLabel}>ANNUAL CASH INFLOW</Text>
                    <Text style={styles.statValue}>GH₵ {parseFloat(stats.grandTotalCash).toLocaleString()}</Text>
                </View>
                
                <View style={styles.subStatsRow}>
                    <View style={styles.subStatItem}>
                        <Text style={styles.subStatLabel}>UNPAID DEBT</Text>
                        <Text style={[styles.subStatValue, {color: '#EF4444'}]}>₵{parseFloat(stats.grandTotalDebt || 0).toLocaleString()}</Text>
                    </View>
                    <View style={styles.subStatItem}>
                        <Text style={styles.subStatLabel}>TOTAL EXEMPT</Text>
                        <Text style={[styles.subStatValue, {color: '#8b5cf6'}]}>{stats.totalExempted || 0}</Text>
                    </View>
                </View>

                <View style={styles.yearPicker}>
                    <TouchableOpacity onPress={() => setSelectedYear(selectedYear - 1)}>
                        <Ionicons name="chevron-back" size={24} color="#3B82F6" />
                    </TouchableOpacity>
                    <Text style={styles.yearText}>{selectedYear}</Text>
                    <TouchableOpacity onPress={() => setSelectedYear(selectedYear + 1)}>
                        <Ionicons name="chevron-forward" size={24} color="#3B82F6" />
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 50 }} />
            ) : reportData.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="calendar-outline" size={60} color="#CBD5E1" />
                    <Text style={styles.emptyText}>No financial data for {selectedYear}</Text>
                </View>
            ) : (
                <FlatList
                    data={reportData}
                    renderItem={renderMonthItem}
                    keyExtractor={(item, index) => `${item.month}-${item.town}-${index}`}
                    contentContainerStyle={{ padding: 15, paddingBottom: 50 }}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    darkHeader: { backgroundColor: '#1E293B', padding: 20, paddingTop: 50, flexDirection: 'row', alignItems: 'center' },
    backBtn: { marginRight: 15 },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
    statsOverview: { backgroundColor: '#FFF', margin: 15, padding: 20, borderRadius: 15, elevation: 4 },
    mainStat: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 15 },
    statLabel: { fontSize: 11, color: '#64748B', fontWeight: '800', letterSpacing: 0.5 },
    statValue: { fontSize: 32, fontWeight: '900', color: '#059669', marginVertical: 5 },
    subStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
    subStatItem: { flex: 1 },
    subStatLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '700' },
    subStatValue: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginTop: 2 },
    yearPicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 15 },
    yearText: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 30, color: '#1E293B' },
    monthCard: { backgroundColor: '#FFF', marginBottom: 12, borderRadius: 12, padding: 16, borderLeftWidth: 5, borderLeftColor: '#3B82F6', elevation: 2 },
    monthHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' },
    badgeContainer: { flexDirection: 'row' },
    monthName: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
    studentBadge: { color: '#64748B', fontSize: 11, fontWeight: '700' },
    revenueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    revColumn: { flex: 1, alignItems: 'center' },
    verticalDivider: { width: 1, height: 25, backgroundColor: '#E2E8F0' },
    revLabel: { fontSize: 9, color: '#94A3B8', fontWeight: '700', marginBottom: 4 },
    cashAmount: { fontSize: 15, fontWeight: '800', color: '#059669' },
    balAmount: { fontSize: 15, fontWeight: '800', color: '#64748B' },
    emptyState: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#94A3B8', marginTop: 10, fontSize: 16 }
});

export default YearlyCanteenReportScreen;