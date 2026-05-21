import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { 
    ActivityIndicator, Alert, FlatList, StyleSheet, 
    Text, TouchableOpacity, View, StatusBar, Platform 
} from 'react-native';
import ApiService from '../utils/apiService';

export default function StudentsByTownScreen() {
    const [selectedTown, setSelectedTown] = useState('');
    const [students, setStudents] = useState([]);
    const [townOptions, setTownOptions] = useState([]); // State for dynamic towns
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true); // Loading for towns
    const navigation = useNavigation();

    // 1. Fetch towns on initial load
    useEffect(() => {
        const fetchTowns = async () => {
            try {
                const result = await ApiService.getAvailableTowns();
                if (result.success) {
                    // Check if data is array of strings or array of objects
                    const towns = Array.isArray(result.data) 
                        ? result.data.map(t => typeof t === 'string' ? t : t.townName)
                        : [];
                    setTownOptions(towns);
                } else {
                    Alert.alert('Error', 'Failed to load towns from database');
                }
            } catch (err) {
                console.error(err);
            } finally {
                setInitialLoading(false);
            }
        };
        fetchTowns();
    }, []);

    // 2. Fetch students when town changes
    useEffect(() => {
        if (selectedTown) {
            fetchStudentsByTown(selectedTown);
        } else {
            setStudents([]);
        }
    }, [selectedTown]);

    const fetchStudentsByTown = async (town) => {
        setLoading(true);
        try {
            const result = await ApiService.getStudentsByTown(town);
            if (result.success) {
                const sortedData = result.data.sort((a, b) => a.fullName.localeCompare(b.fullName));
                setStudents(sortedData);
            } else {
                Alert.alert('Error', result.message || 'Failed to fetch students');
            }
        } catch (err) {
            Alert.alert('Error', 'Could not connect to server.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteStudent = (student) => {
        Alert.alert(
            'Delete Student',
            `Are you sure you want to delete ${student.fullName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const result = await ApiService.deleteStudent(student.studentID);
                            if (result.success) {
                                fetchStudentsByTown(selectedTown);
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
                    <Ionicons name="person" size={20} color="#000066" />
                </View>
                <View style={styles.mainInfo}>
                    <Text style={styles.name}>{item.fullName}</Text>
                    <Text style={styles.classTag}>Class: {item.class}</Text>
                </View>
                <View style={styles.idBadge}>
                    <Text style={styles.idText}>#{item.studentID}</Text>
                </View>
            </View>
            
            <View style={styles.cardActions}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.editBtn]}
                    onPress={() => navigation.navigate('EditStudent', { student: item })}
                >
                    <Ionicons name="pencil" size={16} color="#000066" />
                    <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDeleteStudent(item)}
                >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
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
                    <Text style={styles.headerTitle}>Town Directory</Text>
                    <Text style={styles.headerSubtitle}>Filter students by location</Text>
                </View>
            </View>

            <View style={styles.selectorContainer}>
                {initialLoading ? (
                    <ActivityIndicator size="small" color="#000066" style={{ paddingLeft: 20 }} />
                ) : (
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={townOptions}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                            <TouchableOpacity 
                                style={[styles.chip, selectedTown === item && styles.activeChip]}
                                onPress={() => setSelectedTown(item)}
                            >
                                <Ionicons 
                                    name="location" 
                                    size={14} 
                                    color={selectedTown === item ? "#FFF" : "#64748B"} 
                                    style={{ marginRight: 5 }}
                                />
                                <Text style={[styles.chipText, selectedTown === item && styles.activeChipText]}>
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
                    <Text style={styles.loadingText}>Searching {selectedTown}...</Text>
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
                    <Ionicons name="map-outline" size={80} color="#E2E8F0" />
                    <Text style={styles.emptyText}>
                        {selectedTown ? `No students found in ${selectedTown}` : 'Select a town to view students'}
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
    
    selectorContainer: { backgroundColor: '#FFFFFF', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    tabsContent: { paddingHorizontal: 20 },
    chip: { 
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 8, 
        borderRadius: 25, backgroundColor: '#F1F5F9', marginRight: 10, borderWidth: 1, borderColor: '#E2E8F0' 
    },
    activeChip: { backgroundColor: '#000066', borderColor: '#000066' },
    chipText: { fontWeight: '600', color: '#64748B', fontSize: 13 },
    activeChipText: { color: '#FFFFFF' },

    listContainer: { padding: 20 },
    studentCard: { 
        backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 15,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    avatar: { 
        width: 40, height: 40, borderRadius: 12, backgroundColor: '#F1F5F9', 
        justifyContent: 'center', alignItems: 'center', marginRight: 12 
    },
    mainInfo: { flex: 1 },
    name: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
    classTag: { fontSize: 13, color: '#64748B', marginTop: 2 },
    idBadge: { backgroundColor: '#F8FAFC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    idText: { fontSize: 11, fontWeight: 'bold', color: '#94A3B8' },
    
    cardActions: { 
        flexDirection: 'row', gap: 10, paddingTop: 12, 
        borderTopWidth: 1, borderTopColor: '#F1F5F9' 
    },
    actionBtn: { 
        flex: 1, flexDirection: 'row', alignItems: 'center', 
        justifyContent: 'center', paddingVertical: 8, borderRadius: 10, gap: 5 
    },
    editBtn: { backgroundColor: '#F0F7FF' },
    deleteBtn: { backgroundColor: '#FFF1F1' },
    editBtnText: { color: '#000066', fontWeight: 'bold', fontSize: 13 },
    deleteBtnText: { color: '#EF4444', fontWeight: 'bold', fontSize: 13 },

    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    loadingText: { marginTop: 15, color: '#64748B', fontWeight: '500' },
    emptyText: { marginTop: 15, color: '#94A3B8', textAlign: 'center', fontSize: 16, lineHeight: 24 }
});