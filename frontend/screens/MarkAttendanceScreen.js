import React, { useEffect, useState, useCallback } from 'react';
import { 
    Alert, FlatList, Text, TouchableOpacity, View, 
    StyleSheet, ActivityIndicator 
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ApiService from '../utils/apiService';

const MarkAttendanceScreen = ({ route }) => {
    const navigation = useNavigation();
    const { className: selectedClass, teacher, teacherID } = route.params;

    const [date, setDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState({});
    const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0, total: 0 });

    // Helper: Update local statistics
    const updateAttendanceStats = (studentList) => {
        const stats = studentList.reduce((acc, student) => {
            if (student.status === 'present') acc.present++;
            else if (student.status === 'absent') acc.absent++;
            return acc;
        }, { present: 0, absent: 0 });
        stats.total = studentList.length;
        setAttendanceStats(stats);
    };

    // Fetch Logic
    const fetchAttendance = useCallback(async () => {
        setLoading(true);
        const formattedDate = date.toISOString().split('T')[0];

        try {
            const result = await ApiService.getStudentAttendanceByClass(selectedClass, formattedDate);

            if (result.success) {
                const normalized = result.data.map(row => ({
                    studentID: row.studentID,
                    status: row.attendanceStatus || 'not marked', 
                    class: row.class, // Using the 'class' column from DB
                    Fname: row.Fname,
                    Mname: row.Mname || '',
                    Lname: row.Lname
                }));

                setStudents(normalized);
                updateAttendanceStats(normalized);
            }
        } catch (err) {
            console.error("Fetch Error:", err);
            Alert.alert('Error', 'Failed to fetch attendance records');
        } finally {
            setLoading(false);
        }
    }, [date, selectedClass]);

    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance]);

    // Submit Logic
    const handleMark = async (studentID, status) => {
        setSubmitting(prev => ({ ...prev, [studentID]: true }));
        const formattedDate = date.toISOString().split('T')[0];
        
        // Check if the current user is a teacher or admin
        // This assumes you pass 'role' in your route params or have it in state
        const effectiveTeacherID = teacherID || (teacher ? teacher.teacherID : null);
        const isTeacher = !!effectiveTeacherID;
        
        const payload = {
            studentID: parseInt(studentID),
            teacherID: isTeacher ? effectiveTeacherID : null,
            adminID: !isTeacher ? 105 : null, // Static ID for admin
            class: selectedClass, 
            date: formattedDate,
            status: status,
            source: 'class'
        };
    
        try {
            const result = await ApiService.submitStudentAttendance(payload);
            if (result.success) {
                setStudents(prev => {
                    const updated = prev.map(s => 
                        s.studentID === studentID ? { ...s, status } : s
                    );
                    updateAttendanceStats(updated);
                    return updated;
                });
            }
        } catch (err) {
            Alert.alert('Error', 'Could not save attendance');
        } finally {
            setSubmitting(prev => ({ ...prev, [studentID]: false }));
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'present': return { color: '#10B981', icon: 'checkmark-circle', bgColor: '#D1FAE5' };
            case 'absent': return { color: '#EF4444', icon: 'close-circle', bgColor: '#FEE2E2' };
            default: return { color: '#6B7280', icon: 'help-circle', bgColor: '#F3F4F6' };
        }
    };

    const renderStudentCard = ({ item }) => {
        const style = getStatusStyle(item.status);
        const isBusy = submitting[item.studentID];

        return (
            <View style={styles.studentCard}>
                <View style={styles.studentInfo}>
                    <View style={styles.avatarContainer}>
                        <Ionicons name="person" size={24} color="#6B7280" />
                    </View>
                    <View style={styles.studentDetails}>
                        <Text style={styles.studentName}>{`${item.Fname} ${item.Lname}`}</Text>
                        <Text style={styles.studentClass}>{item.class || selectedClass}</Text>
                    </View>
                </View>

                <View style={[styles.statusIndicator, { backgroundColor: style.bgColor }]}>
                    <Ionicons name={style.icon} size={14} color={style.color} />
                    <Text style={[styles.statusText, { color: style.color }]}>
                        {item.status.toUpperCase()}
                    </Text>
                </View>

                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        onPress={() => handleMark(item.studentID, 'present')}
                        disabled={isBusy || item.status === 'present'}
                        style={[styles.actionButton, styles.presentButton, item.status === 'present' && styles.activeButton]}
                    >
                        {isBusy ? <ActivityIndicator color="white" size="small" /> : <Text style={styles.buttonText}>Present</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => handleMark(item.studentID, 'absent')}
                        disabled={isBusy || item.status === 'absent'}
                        style={[styles.actionButton, styles.absentButton, item.status === 'absent' && styles.activeButton]}
                    >
                        {isBusy ? <ActivityIndicator color="white" size="small" /> : <Text style={styles.buttonText}>Absent</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>Attendance</Text>
                    <Text style={styles.headerSubtitle}>{selectedClass}</Text>
                </View>
            </View>

            <View style={styles.dateSection}>
                <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.dateButton}>
                    <Ionicons name="calendar" size={20} color="#000066" />
                    <Text style={styles.dateText}>{date.toDateString()}</Text>
                    <Ionicons name="chevron-down" size={16} color="#000066" />
                </TouchableOpacity>
                {showPicker && (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        onChange={(e, d) => { setShowPicker(false); if (d) setDate(d); }}
                    />
                )}
            </View>

            <View style={styles.statsContainer}>
                <StatBox label="Total" value={attendanceStats.total} />
                <StatBox label="Present" value={attendanceStats.present} color="#10B981" />
                <StatBox label="Absent" value={attendanceStats.absent} color="#EF4444" />
            </View>

            <FlatList
                data={students}
                keyExtractor={(item) => item.studentID.toString()}
                renderItem={renderStudentCard}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>{loading ? 'Loading...' : 'No students found'}</Text>
                }
            />
        </View>
    );
};

// Reusable Stat Component
const StatBox = ({ label, value, color = '#000066' }) => (
    <View style={styles.statCard}>
        <Text style={[styles.statNumber, { color }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { backgroundColor: '#000066', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
    headerTextContainer: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
    headerSubtitle: { fontSize: 14, color: '#E5E7EB' },
    dateSection: { padding: 15, backgroundColor: 'white' },
    dateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6', padding: 12, borderRadius: 10, gap: 10 },
    dateText: { fontSize: 16, fontWeight: '600', color: '#000066' },
    statsContainer: { flexDirection: 'row', padding: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#EEE' },
    statCard: { flex: 1, alignItems: 'center' },
    statNumber: { fontSize: 18, fontWeight: 'bold' },
    statLabel: { fontSize: 11, color: '#6B7280' },
    listContent: { padding: 15 },
    studentCard: { backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 12, elevation: 2 },
    studentInfo: { flexDirection: 'row', marginBottom: 10 },
    avatarContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    studentName: { fontSize: 16, fontWeight: '600' },
    studentClass: { fontSize: 12, color: '#6B7280' },
    statusIndicator: { flexDirection: 'row', alignItems: 'center', padding: 5, borderRadius: 15, alignSelf: 'flex-start', marginBottom: 10, paddingHorizontal: 10 },
    statusText: { fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
    actionButtons: { flexDirection: 'row', gap: 10 },
    actionButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
    presentButton: { backgroundColor: '#10B981' },
    absentButton: { backgroundColor: '#EF4444' },
    buttonText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
    activeButton: { borderWidth: 2, borderColor: '#000' },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#9CA3AF' }
});

export default MarkAttendanceScreen;