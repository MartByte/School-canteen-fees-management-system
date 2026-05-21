import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState, useMemo } from 'react';
import { 
    Alert, FlatList, Text, TextInput, 
    TouchableOpacity, View, StatusBar, StyleSheet, ActivityIndicator 
} from 'react-native';
import ApiService from '../utils/apiService';

const WeeklyCanteenReportScreen = () => {
    const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    const [endDate, setEndDate] = useState(new Date());
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [data, setData] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();

    const fetchReport = async () => {
        setLoading(true);
        const start = startDate.toISOString().split('T')[0];
        const end = endDate.toISOString().split('T')[0];
        try {
            const result = await ApiService.getWeeklyReport('All Towns', start, end);
            if (result.success) {
                setData(Array.isArray(result.data) ? result.data : []);
            }
        } catch (err) {
            Alert.alert('Error', 'Connection failed');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [startDate, endDate]);

    const totals = useMemo(() => {
        return data.reduce((acc, curr) => ({
            cash: acc.cash + (parseFloat(curr.realCashIn) || 0),
            debt: acc.debt + (parseFloat(curr.creditDebt) || 0),
            students: acc.students + (parseInt(curr.studentCount) || 0)
        }), { cash: 0, debt: 0, students: 0 });
    }, [data]);

    const filteredData = data.filter((item) =>
        item.town?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }) => (
        <View style={styles.reportCard}>
            <View style={styles.cardHeader}>
                <Text style={styles.townName}>{item.town}</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.studentCount || 0} Served</Text>
                </View>
            </View>
            
            <View style={styles.mainAmountContainer}>
                <Text style={styles.amountLabel}>Physical Cash Collected</Text>
                <Text style={styles.cashAmount}>₵ {(parseFloat(item.realCashIn) || 0).toFixed(2)}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.breakdownRow}>
                <View style={styles.breakdownBox}>
                    <Text style={styles.miniLabel}>Advance Used</Text>
                    <Text style={styles.miniAmount}>₵{(parseFloat(item.advanceDeductions) || 0).toFixed(2)}</Text>
                </View>
                <View style={styles.verticalDivider} />
                <View style={styles.breakdownBox}>
                    <Text style={[styles.miniLabel, { color: '#EF4444' }]}>Debt (Credit)</Text>
                    <Text style={styles.miniAmount}>₵{(parseFloat(item.creditDebt) || 0).toFixed(2)}</Text>
                </View>
                <View style={styles.verticalDivider} />
                <View style={styles.breakdownBox}>
                    <Text style={[styles.miniLabel, { color: '#64748b' }]}>Exempted</Text>
                    <Text style={styles.miniAmount}>{item.exemptCount || 0}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Weekly Finance</Text>
            </View>

            <View style={styles.summaryContainer}>
                <View style={[styles.summaryCard, { backgroundColor: '#059669' }]}>
                    <Text style={styles.summaryLabel}>Total Cash In</Text>
                    <Text style={styles.summaryValue}>₵ {totals.cash.toFixed(2)}</Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: '#EF4444' }]}>
                    <Text style={styles.summaryLabel}>Total Debt</Text>
                    <Text style={styles.summaryValue}>₵ {totals.debt.toFixed(2)}</Text>
                </View>
            </View>

            <View style={styles.searchSection}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#94A3B8" />
                    <TextInput
                        placeholder="Filter by area..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={styles.searchInput}
                    />
                </View>
            </View>

            <FlatList
                data={filteredData}
                keyExtractor={(item, index) => `${item.town}-${index}`}
                renderItem={renderItem}
                ListHeaderComponent={
                    <View style={styles.datePickerRow}>
                         <TouchableOpacity style={styles.dateBtn} onPress={() => setShowStartPicker(true)}>
                            <Text style={styles.dateBtnLabel}>Start</Text>
                            <Text style={styles.dateBtnValue}>{startDate.toLocaleDateString()}</Text>
                         </TouchableOpacity>
                         <TouchableOpacity style={styles.dateBtn} onPress={() => setShowEndPicker(true)}>
                            <Text style={styles.dateBtnLabel}>End</Text>
                            <Text style={styles.dateBtnValue}>{endDate.toLocaleDateString()}</Text>
                         </TouchableOpacity>
                    </View>
                }
                contentContainerStyle={{ paddingBottom: 50 }}
            />

            {showStartPicker && <DateTimePicker value={startDate} mode="date" onChange={(e, d) => { setShowStartPicker(false); if(d) setStartDate(d); }} />}
            {showEndPicker && <DateTimePicker value={endDate} mode="date" onChange={(e, d) => { setShowEndPicker(false); if(d) setEndDate(d); }} />}
        </View>
    );
};
// ... (Styles same as your previous version)

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    backButton: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 10, marginRight: 15 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
    summaryContainer: { flexDirection: 'row', padding: 15, justifyContent: 'space-between' },
    summaryCard: { flex: 0.48, padding: 15, borderRadius: 16, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
    summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    summaryValue: { color: '#FFF', fontSize: 20, fontWeight: '800', marginTop: 4 },
    searchSection: { flexDirection: 'row', paddingHorizontal: 15, marginBottom: 10, alignItems: 'center' },
    searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 12, borderRadius: 12, height: 48, borderWidth: 1, borderColor: '#E2E8F0' },
    searchInput: { flex: 1, marginLeft: 8, fontSize: 15 },
    refreshBtn: { marginLeft: 10, padding: 12, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
    datePickerRow: { flexDirection: 'row', padding: 15, justifyContent: 'space-between' },
    dateBtn: { flex: 0.48, backgroundColor: '#FFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
    dateBtnLabel: { fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', fontWeight: '700' },
    dateBtnValue: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginTop: 2 },
    reportCard: { backgroundColor: '#FFF', marginHorizontal: 15, marginBottom: 12, borderRadius: 20, padding: 18, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' },
    townName: { fontSize: 17, fontWeight: '800', color: '#1E293B' },
    badge: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    badgeText: { color: '#64748B', fontSize: 12, fontWeight: '700' },
    mainAmountContainer: { alignItems: 'center', marginVertical: 10 },
    amountLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600', marginBottom: 4 },
    cashAmount: { fontSize: 28, fontWeight: '900', color: '#059669' },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 18 },
    breakdownRow: { flexDirection: 'row', justifyContent: 'space-between' },
    breakdownBox: { flex: 1, alignItems: 'center' },
    verticalDivider: { width: 1, backgroundColor: '#F1F5F9' },
    miniLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '700', marginBottom: 4, textTransform: 'uppercase' },
    miniAmount: { fontSize: 14, fontWeight: '800', color: '#334155' },
    emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
    emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: 15, fontSize: 16 },
    downloadButton: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: '#1e293b', height: 60, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: '#1e293b', shadowOpacity: 0.3, shadowRadius: 10 },
    downloadText: { color: '#FFF', fontSize: 16, fontWeight: '800', marginLeft: 12 }
});

export default WeeklyCanteenReportScreen;