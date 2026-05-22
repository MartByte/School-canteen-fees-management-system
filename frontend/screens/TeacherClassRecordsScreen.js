import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, Text, StyleSheet, FlatList, TouchableOpacity, 
    ActivityIndicator, StatusBar 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import ApiService from '../utils/apiService';

const TeacherClassRecordsScreen = ({ route, navigation }) => {
    // teacherID can be used if you want to track who is viewing/editing
    const { className, teacherID } = route.params; 

    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ present: 0, absent: 0, unmarked: 0 });

    const fetchRecords = useCallback(async () => {
        setLoading(true);
        const formattedDate = date.toISOString().split('T')[0];
        
        try {
            // Using your existing endpoint logic via ApiService
            const result = await ApiService.getAttendanceRecordsOnly(className, formattedDate);
            
            if (result.success) {
                setRecords(result.data);
                
                // Calculate Statistics using your 'attendanceStatus' alias
                const counts = result.data.reduce((acc, curr) => {
                    const status = curr.attendanceStatus?.toLowerCase();
                    if (status === 'present') acc.present++;
                    else if (status === 'absent') acc.absent++;
                    else acc.unmarked++;
                    return acc;
                }, { present: 0, absent: 0, unmarked: 0 });
                
                setStats(counts);
            }
        } catch (error) {
            console.error("Record Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    }, [date, className]);

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    const renderItem = ({ item }) => {
        const currentStatus = item.attendanceStatus || 'not marked';
        
        return (
            <View style={styles.recordCard}>
                <View style={styles.studentInfo}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{item.Fname[0]}{item.Lname[0]}</Text>
                    </View>
                    <View>
                        <Text style={styles.studentName}>
                            {item.Fname} {item.Mname ? `${item.Mname} ` : ''}{item.Lname}
                        </Text>
                        <Text style={styles.idText}>ID: {item.studentID} • {item.town || 'No Town'}</Text>
                    </View>
                </View>

                <View style={[styles.statusBadge, 
                    { backgroundColor: currentStatus === 'present' ? '#D1FAE5' : currentStatus === 'absent' ? '#FEE2E2' : '#F3F4F6' }]}>
                    <Ionicons 
                        name={currentStatus === 'present' ? 'checkmark-circle' : currentStatus === 'absent' ? 'close-circle' : 'help-circle'} 
                        size={14} 
                        color={currentStatus === 'present' ? '#059669' : currentStatus === 'absent' ? '#DC2626' : '#6B7280'} 
                    />
                    <Text style={[styles.statusText, 
                        { color: currentStatus === 'present' ? '#059669' : currentStatus === 'absent' ? '#DC2626' : '#6B7280' }]}>
                        {currentStatus.toUpperCase()}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            {/* Header Area */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Class Records</Text>
                    <Text style={styles.headerSubtitle}>{className}</Text>
                </View>
                <TouchableOpacity onPress={fetchRecords} style={styles.refreshButton}>
                    <Ionicons name="refresh" size={20} color="white" />
                </TouchableOpacity>
            </View>

            {/* Date Selection Bar */}
            <View style={styles.dateBar}>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateSelector}>
                    <Ionicons name="calendar" size={20} color="#000066" />
                    <Text style={styles.dateText}>{date.toDateString()}</Text>
                    <Ionicons name="chevron-down" size={16} color="#64748B" />
                </TouchableOpacity>
            </View>

            {/* Quick Stats Summary */}
            <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{records.length}</Text>
                    <Text style={styles.statLabel}>Students</Text>
                </View>
                <View style={[styles.statBox, styles.statBorder]}>
                    <Text style={[styles.statNumber, { color: '#059669' }]}>{stats.present}</Text>
                    <Text style={styles.statLabel}>Present</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={[styles.statNumber, { color: '#DC2626' }]}>{stats.absent}</Text>
                    <Text style={styles.statLabel}>Absent</Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#000066" />
                    <Text style={styles.loadingText}>Fetching records...</Text>
                </View>
            ) : (
                <FlatList
                    data={records}
                    keyExtractor={(item) => item.studentID.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listPadding}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Ionicons name="clipboard-outline" size={64} color="#CBD5E1" />
                            <Text style={styles.emptyText}>No students found for this class.</Text>
                        </View>
                    }
                />
            )}

            {showDatePicker && (
                <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={(e, d) => {
                        setShowDatePicker(false);
                        if (d) setDate(d);
                    }}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { 
        backgroundColor: '#000066', 
        paddingTop: 20, 
        paddingBottom: 25, 
        paddingHorizontal: 20, 
        flexDirection: 'row', 
        alignItems: 'center' 
    },
    backButton: { padding: 5 },
    headerTitleContainer: { flex: 1, marginLeft: 15 },
    headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
    headerSubtitle: { color: '#BFDBFE', fontSize: 14 },
    refreshButton: { padding: 5 },
    dateBar: { 
        backgroundColor: 'white', 
        padding: 15, 
        borderBottomWidth: 1, 
        borderBottomColor: '#E2E8F0' 
    },
    dateSelector: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: '#F1F5F9', 
        paddingVertical: 10, 
        borderRadius: 12,
        gap: 10
    },
    dateText: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
    statsContainer: { 
        flexDirection: 'row', 
        backgroundColor: 'white', 
        paddingVertical: 15, 
        elevation: 2, 
        shadowColor: '#000', 
        shadowOpacity: 0.05, 
        shadowOffset: { width: 0, height: 2 } 
    },
    statBox: { flex: 1, alignItems: 'center' },
    statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#F1F5F9' },
    statNumber: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
    statLabel: { fontSize: 12, color: '#64748B', marginTop: 2 },
    listPadding: { padding: 16 },
    recordCard: { 
        backgroundColor: 'white', 
        borderRadius: 16, 
        padding: 16, 
        marginBottom: 12, 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    studentInfo: { flexDirection: 'row', alignItems: 'center' },
    avatar: { 
        width: 45, 
        height: 45, 
        borderRadius: 22.5, 
        backgroundColor: '#E0E7FF', 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginRight: 12 
    },
    avatarText: { color: '#4338CA', fontWeight: 'bold', fontSize: 16 },
    studentName: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
    idText: { fontSize: 12, color: '#64748B', marginTop: 2 },
    statusBadge: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 10, 
        paddingVertical: 6, 
        borderRadius: 20,
        gap: 4
    },
    statusText: { fontSize: 11, fontWeight: 'bold' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
    loadingText: { marginTop: 10, color: '#64748B' },
    emptyText: { marginTop: 10, color: '#94A3B8', fontSize: 16 }
});

export default TeacherClassRecordsScreen;