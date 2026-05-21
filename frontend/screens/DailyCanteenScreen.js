import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  ActivityIndicator, FlatList, Dimensions, StatusBar, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import ApiService from '../utils/apiService';
import io from 'socket.io-client';
import Config from '../config';

const { width } = Dimensions.get('window');

const DailyCanteenScreen = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState({
    totalStudents: 0,
    cashRevenue: '0.00',
    nonCashValue: '0.00'
  });
  
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTown, setSelectedTown] = useState('');
  const [availableTowns, setAvailableTowns] = useState([]);
  const [showTownSelector, setShowTownSelector] = useState(false);

  const fetchReport = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      const result = await ApiService.getDailyReport(
        formattedDate,
        selectedTown === 'All Towns' ? '' : selectedTown
      );

      if (result.success) {
        const studentData = Array.isArray(result.data) ? result.data : [];
        setReportData(studentData);

        let cashTotal = 0;
        let nonCashTotal = 0; 
        let presentCount = 0;

        studentData.forEach(student => {
          const cash = parseFloat(student.cashReceived) || 0;
          const bal = parseFloat(student.balanceUsed) || 0;
          const debt = parseFloat(student.creditIncurred) || 0;
          const isExempt = student.isExempt > 0;

          cashTotal += cash;
          nonCashTotal += (bal + debt);
          
          if (cash > 0 || bal > 0 || debt > 0 || isExempt || student.inCanteen === 1) {
            presentCount++;
          }
        });

        setSummary({
          totalStudents: presentCount,
          cashRevenue: cashTotal.toFixed(2),
          nonCashValue: nonCashTotal.toFixed(2)
        });
      }
    } catch (error) {
      console.error('Fetch Error:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedDate, selectedTown]);

  useEffect(() => {
    const fetchTowns = async () => {
      try {
        const result = await ApiService.getAvailableTowns();
        if (result.success) setAvailableTowns(['All Towns', ...result.data]);
      } catch (e) { console.error(e); }
    };
    fetchTowns();
  }, []);

  useEffect(() => {
    fetchReport();
    const socket = io(Config.API_BASE_URL);
    socket.on('refresh_data', () => fetchReport(true));
    return () => socket.disconnect();
  }, [fetchReport]);

  const renderStudentItem = ({ item }) => {
    const cash = parseFloat(item.cashReceived) || 0;
    const balance = parseFloat(item.balanceUsed) || 0;
    const debt = parseFloat(item.creditIncurred) || 0;
    const isExempt = item.pTypes === 'exempt';
    const isTopup = item.pTypes === 'advance_topup';
    
    const isPresent = cash > 0 || balance > 0 || debt > 0 || isExempt || item.inCanteen === 1;

    return (
      <View style={styles.studentCard}>
        <View style={styles.studentHeader}>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{item.name}</Text>
            <Text style={styles.studentDetails}>{item.class} | {item.town}</Text>
          </View>
          
          <View style={[
            styles.statusBadge, 
            { backgroundColor: isTopup ? '#8b5cf6' : (isExempt ? '#64748B' : (isPresent ? '#10B981' : '#F59E0B')) }
          ]}>
            <Text style={styles.statusText}>
                {isTopup ? 'TOP-UP' : (isExempt ? 'EXEMPT' : (isPresent ? 'PRESENT' : 'ABSENT'))}
            </Text>
          </View>
        </View>

        <View style={styles.studentDetailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Cash In:</Text>
            <Text style={[styles.detailValue, { color: '#059669' }]}>₵{cash.toFixed(2)}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{debt > 0 ? 'Debt:' : 'Bal Used:'}</Text>
            <Text style={[styles.detailValue, { color: debt > 0 ? '#EF4444' : '#64748B' }]}>
              ₵{(debt > 0 ? debt : balance).toFixed(2)}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Ate Today:</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons 
                    name={item.inCanteen ? "checkmark-circle" : "close-circle"} 
                    size={16} 
                    color={item.inCanteen ? "#10B981" : "#CBD5E1"} 
                />
                <Text style={[styles.detailValue, { marginLeft: 4, color: item.inCanteen ? "#10B981" : "#94A3B8" }]}>
                    {item.inCanteen ? 'Yes' : 'No'}
                </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Canteen Report</Text>
        {isRefreshing ? <ActivityIndicator size="small" color="#10B981" /> : <View style={{ width: 24 }} />}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.filterRow}>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                <Ionicons name="calendar" size={18} color="#007AFF" />
                <Text style={styles.dateButtonText}>{selectedDate.toLocaleDateString()}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.townButton} onPress={() => setShowTownSelector(!showTownSelector)}>
                <Text style={styles.townButtonText} numberOfLines={1}>{selectedTown || 'All Towns'}</Text>
                <Ionicons name="caret-down" size={14} color="#64748B" />
            </TouchableOpacity>
        </View>

        {showTownSelector && (
          <View style={styles.townDropdown}>
            {availableTowns.map((t, i) => (
              <TouchableOpacity key={i} style={styles.townOption} onPress={() => { setSelectedTown(t === 'All Towns' ? '' : t); setShowTownSelector(false); }}>
                <Text style={styles.townOptionText}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.summaryContainer}>
            <View style={[styles.mainSummaryCard, { borderLeftColor: '#10B981' }]}>
                <Text style={styles.summaryLabel}>Actual Cash Revenue</Text>
                <Text style={styles.mainSummaryValue}>₵{summary.cashRevenue}</Text>
                <Text style={styles.summarySubtext}>Physical money received today</Text>
            </View>
            
            <View style={styles.summaryGrid}>
                <View style={[styles.smallSummaryCard, { borderLeftColor: '#F59E0B' }]}>
                    <Text style={styles.summaryLabel}>Debt/Bal Value</Text>
                    <Text style={styles.smallSummaryValue}>₵{summary.nonCashValue}</Text>
                </View>
                <View style={[styles.smallSummaryCard, { borderLeftColor: '#3B82F6' }]}>
                    <Text style={styles.summaryLabel}>Ate Today</Text>
                    <Text style={styles.smallSummaryValue}>{summary.totalStudents}</Text>
                </View>
            </View>
        </View>

        {loading ? (
            <ActivityIndicator size="large" color="#007AFF" style={{marginTop: 30}} />
        ) : reportData.length === 0 ? (
          <View style={styles.emptyState}><Text style={styles.emptyStateText}>No activity for this date.</Text></View>
        ) : (
          <FlatList 
            data={reportData} 
            renderItem={renderStudentItem} 
            keyExtractor={(item) => item.studentID.toString()} 
            scrollEnabled={false} 
          />
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker value={selectedDate} mode="date" onChange={(e, d) => { setShowDatePicker(false); if (d) setSelectedDate(d); }} maximumDate={new Date()} />
      )}
    </View>
  );
};
// ... (Styles same as your previous version)

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingBottom: 15, paddingHorizontal: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  content: { padding: 15 },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  dateButton: { flex: 0.55, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  dateButtonText: { marginLeft: 8, fontSize: 14, color: '#334155', fontWeight: '600' },
  townButton: { flex: 0.4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  townButtonText: { fontSize: 14, color: '#334155', fontWeight: '600' },
  townDropdown: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 15, overflow: 'hidden' },
  townOption: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  townOptionText: { color: '#1E293B', fontWeight: '500' },
  
  summaryContainer: { marginBottom: 20 },
  mainSummaryCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 16, borderLeftWidth: 6, marginBottom: 12, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  mainSummaryValue: { fontSize: 32, fontWeight: '800', color: '#1E293B', marginVertical: 4 },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  smallSummaryCard: { backgroundColor: '#FFF', width: (width - 42) / 2, padding: 15, borderRadius: 16, borderLeftWidth: 4, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  summaryLabel: { fontSize: 12, color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  smallSummaryValue: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginTop: 4 },
  summarySubtext: { fontSize: 12, color: '#94A3B8' },

  sectionHeader: { marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  
  studentCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  studentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  studentName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  studentDetails: { fontSize: 12, color: '#64748B', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  studentDetailsRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 11, color: '#94A3B8', marginBottom: 2, fontWeight: '600' },
  detailValue: { fontSize: 13, color: '#1E293B', fontWeight: '600' },
  
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyStateText: { color: '#94A3B8', fontSize: 15, fontWeight: '500' }
});

export default DailyCanteenScreen;