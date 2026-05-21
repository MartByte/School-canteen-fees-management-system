import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { 
    ActivityIndicator, 
    Alert, 
    FlatList, 
    StyleSheet, 
    Text, 
    TouchableOpacity, 
    View, 
    Platform,
    StatusBar
} from 'react-native';
import ApiService from '../utils/apiService';

export default function AllStudentsScreen() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();

    useEffect(() => {
        fetchStudents();
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchStudents();
        }, [])
    );

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const result = await ApiService.getAllStudents();

            if (result && result.success) {
                const data = Array.isArray(result.data) ? result.data : result.data.students;
                // Sort by name for better readability
                const sortedData = (data || []).sort((a, b) => 
                    (a.Fname || '').localeCompare(b.Fname || '')
                );
                setStudents(sortedData);
            } else {
                setStudents([]);
                Alert.alert('Notice', result?.message || 'No student data available');
            }
        } catch (err) {
            console.error('❌ Error fetching students:', err);
            setStudents([]);
            Alert.alert('Connection Error', 'Could not reach the server.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (studentID) => {
        Alert.alert('Confirm Delete', 'Are you sure you want to delete this student?', [
            { text: 'Cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const result = await ApiService.deleteStudent(studentID);
                        if (result.success) {
                            Alert.alert('Success', 'Student deleted successfully');
                            fetchStudents();
                        } else {
                            Alert.alert('Error', result.message || 'Failed to delete student');
                        }
                    } catch (err) {
                        Alert.alert('Error', 'Failed to delete student');
                    }
                },
            },
        ]);
    };

    const renderItem = ({ item }) => (
        <View style={styles.studentCard}>
            <View style={styles.studentInfo}>
                {/* Simplified Avatar using First Initial */}
                <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>
                        {item.Fname ? item.Fname.charAt(0).toUpperCase() : '?'}
                    </Text>
                </View>

                <View style={styles.studentDetails}>
                    <Text style={styles.studentName}>{item.Fname} {item.Lname}</Text>
                    
                    <View style={styles.metaRow}>
                        <Ionicons name="finger-print" size={14} color="#94A3B8" />
                        <Text style={styles.studentMeta}> ID: {item.studentID}</Text>
                    </View>
                    
                    <View style={styles.metaRow}>
                        <Ionicons name="school" size={14} color="#94A3B8" />
                        <Text style={styles.studentMeta}> {item.class}</Text>
                    </View>

                    <View style={styles.metaRow}>
                        <Ionicons name="location" size={14} color="#94A3B8" />
                        <Text style={styles.studentMeta}> {item.town}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => navigation.navigate('EditStudent', { student: item })}
                >
                    <Ionicons name="pencil" size={20} color="#3B82F6" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(item.studentID)}
                >
                    <Ionicons name="trash" size={20} color="#EF4444" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>Students Directory</Text>
                        <Text style={styles.headerSubtitle}>{students.length} Total Registered</Text>
                    </View>
                </View>
            </View>

            <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('AddStudent')}
            >
                <Ionicons name="person-add" size={20} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Add New Student</Text>
            </TouchableOpacity>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.loadingText}>Syncing records...</Text>
                </View>
            ) : students.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Ionicons name="people-outline" size={64} color="#CBD5E1" />
                    <Text style={styles.emptyTitle}>No Students Found</Text>
                    <Text style={styles.emptySubtitle}>Start by adding a new student to the system</Text>
                </View>
            ) : (
                <FlatList
                    data={students}
                    keyExtractor={(item) => item.studentID.toString()}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContainer}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: {
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 60 : 20,
        paddingBottom: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerTop: { flexDirection: 'row', alignItems: 'center' },
    backButton: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9',
        justifyContent: 'center', alignItems: 'center', marginRight: 16,
    },
    headerContent: { flex: 1 },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
    headerSubtitle: { fontSize: 13, color: '#64748B', fontWeight: '500' },
    
    addButton: {
        backgroundColor: '#000066', flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', paddingVertical: 14, marginHorizontal: 24,
        marginTop: 20, marginBottom: 10, borderRadius: 12, elevation: 2,
    },
    addButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginLeft: 10 },
    
    listContainer: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 },
    studentCard: {
        backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12,
        flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
    },
    studentInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    avatarCircle: {
        width: 50, height: 50, borderRadius: 25, backgroundColor: '#E0E7FF',
        justifyContent: 'center', alignItems: 'center', marginRight: 16,
    },
    avatarText: { color: '#4338CA', fontSize: 20, fontWeight: 'bold' },
    studentDetails: { flex: 1 },
    studentName: { fontSize: 17, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    studentMeta: { fontSize: 13, color: '#64748B', fontWeight: '500' },
    
    actionButtons: { flexDirection: 'column', gap: 10, marginLeft: 10 },
    editButton: {
        width: 38, height: 38, borderRadius: 10, backgroundColor: '#EFF6FF',
        justifyContent: 'center', alignItems: 'center',
    },
    deleteButton: {
        width: 38, height: 38, borderRadius: 10, backgroundColor: '#FEF2F2',
        justifyContent: 'center', alignItems: 'center',
    },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    loadingText: { marginTop: 15, color: '#64748B' },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#64748B', marginTop: 15 },
    emptySubtitle: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginTop: 5 },
});