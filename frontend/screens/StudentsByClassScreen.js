import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { 
    ActivityIndicator, Alert, FlatList, StyleSheet, 
    Text, TouchableOpacity, View, StatusBar, Platform 
} from 'react-native';
import ApiService from '../utils/apiService';

export default function StudentsByClassScreen() {
    const [selectedClass, setSelectedClass] = useState('');
    const [students, setStudents] = useState([]);
    const [classOptions, setClassOptions] = useState([]); // Dynamic classes state
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true); // Initial fetch loading
    const navigation = useNavigation();

    // 1. Fetch available classes from database on mount
    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const result = await ApiService.getClasses();
                if (result.success) {
                    // Check if data is array of strings or objects (e.g., {className: 'KG1'})
                    const classes = Array.isArray(result.data) 
                        ? result.data.map(c => typeof c === 'string' ? c : c.className)
                        : [];
                    setClassOptions(classes);
                } else {
                    Alert.alert('Error', 'Failed to load classes');
                }
            } catch (err) {
                console.error("Class Fetch Error:", err);
            } finally {
                setInitialLoading(false);
            }
        };
        fetchClasses();
    }, []);

    // 2. Fetch students when selected class changes
    useEffect(() => {
        if (selectedClass) {
            fetchStudentsByClass(selectedClass);
        } else {
            setStudents([]);
        }
    }, [selectedClass]);

    const fetchStudentsByClass = async (className) => {
        setLoading(true);
        try {
            const result = await ApiService.getStudentsByClass(className);
            if (result.success) {
                const sortedData = result.data.sort((a, b) => a.fullName.localeCompare(b.fullName));
                setStudents(sortedData);
            } else {
                Alert.alert('Error', result.message || 'Failed to fetch students');
            }
        } catch (err) {
            Alert.alert('Error', 'Connection failed. Please check your server.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteStudent = (student) => {
        Alert.alert(
            'Delete Student',
            `This will move ${student.fullName} to the trash. Continue?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const result = await ApiService.deleteStudent(student.studentID);
                            if (result.success) {
                                fetchStudentsByClass(selectedClass);
                            }
                        } catch (err) {
                            Alert.alert('Error', 'Failed to delete student');
                        }
                    },
                },
            ]
        );
    };

    const renderStudentCard = ({ item }) => (
        <View style={styles.studentCard}>
            <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.fullName.charAt(0)}</Text>
                </View>
                <View style={styles.mainInfo}>
                    <Text style={styles.name}>{item.fullName}</Text>
                    <Text style={styles.studentIdText}>ID: {item.studentID}</Text>
                </View>
            </View>
            
            <View style={styles.cardDetails}>
                <View style={styles.detailItem}>
                    <Ionicons name="location-outline" size={14} color="#64748B" />
                    <Text style={styles.detailText}>{item.town || 'No Town'}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Ionicons name="school-outline" size={14} color="#64748B" />
                    <Text style={styles.detailText}>{item.class}</Text>
                </View>
            </View>

            <View style={styles.cardActions}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.editBtn]}
                    onPress={() => navigation.navigate('EditStudent', { student: item })}
                >
                    <Ionicons name="create-outline" size={18} color="#000066" />
                    <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDeleteStudent(item)}
                >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Class Directory</Text>
                    <Text style={styles.headerSubtitle}>{students.length} Students Total</Text>
                </View>
            </View>

            <View style={styles.selectorContainer}>
                <Text style={styles.label}>Select Class:</Text>
                {initialLoading ? (
                    <ActivityIndicator size="small" color="#000066" style={{ marginVertical: 10 }} />
                ) : (
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={classOptions}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity 
                                style={[styles.classTab, selectedClass === item && styles.activeTab]}
                                onPress={() => setSelectedClass(item)}
                            >
                                <Text style={[styles.classTabText, selectedClass === item && styles.activeTabText]}>
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={styles.tabsContent}
                    />
                )}
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#000066" />
                    <Text style={styles.loadingText}>Fetching Student Data...</Text>
                </View>
            ) : students.length > 0 ? (
                <FlatList
                    data={students}
                    keyExtractor={(item) => item.studentID.toString()}
                    renderItem={renderStudentCard}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContainer}
                />
            ) : (
                <View style={styles.centerContainer}>
                    <Ionicons name="people-outline" size={64} color="#CBD5E1" />
                    <Text style={styles.emptyText}>
                        {selectedClass ? 'No students found in this class' : 'Choose a class to begin'}
                    </Text>
                </View>
            )}
        </View>
    );
}


const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 15,
        backgroundColor: '#FFFFFF',
    },
    backButton: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center',
        marginRight: 15,
    },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#000066' },
    headerSubtitle: { fontSize: 13, color: '#64748B' },
    
    selectorContainer: { backgroundColor: '#FFFFFF', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    label: { fontSize: 12, fontWeight: 'bold', color: '#94A3B8', marginLeft: 20, marginBottom: 8, textTransform: 'uppercase' },
    tabsContent: { paddingHorizontal: 15, paddingBottom: 5 },
    classTab: { 
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, 
        backgroundColor: '#F1F5F9', marginRight: 10, borderWidth: 1, borderColor: '#E2E8F0' 
    },
    activeTab: { backgroundColor: '#000066', borderColor: '#000066' },
    classTabText: { fontWeight: '600', color: '#475569' },
    activeTabText: { color: '#FFFFFF' },

    listContainer: { padding: 15 },
    studentCard: { 
        backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 15,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    avatar: { 
        width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#E0E7FF', 
        justifyContent: 'center', alignItems: 'center', marginRight: 12 
    },
    avatarText: { color: '#4338CA', fontSize: 18, fontWeight: 'bold' },
    mainInfo: { flex: 1 },
    name: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
    studentIdText: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
    
    cardDetails: { 
        flexDirection: 'row', gap: 15, paddingVertical: 10, 
        borderTopWidth: 1, borderTopColor: '#F1F5F9' 
    },
    detailItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    detailText: { fontSize: 13, color: '#64748B' },

    cardActions: { 
        flexDirection: 'row', gap: 10, marginTop: 10, 
        paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' 
    },
    actionBtn: { 
        flex: 1, flexDirection: 'row', alignItems: 'center', 
        justifyContent: 'center', paddingVertical: 8, borderRadius: 8, gap: 5 
    },
    editBtn: { backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#C7D2FE' },
    deleteBtn: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
    editBtnText: { color: '#000066', fontWeight: 'bold', fontSize: 13 },
    deleteBtnText: { color: '#EF4444', fontWeight: 'bold', fontSize: 13 },

    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    loadingText: { marginTop: 15, color: '#64748B', fontWeight: '500' },
    emptyText: { marginTop: 15, color: '#94A3B8', textAlign: 'center', fontSize: 16 }
});