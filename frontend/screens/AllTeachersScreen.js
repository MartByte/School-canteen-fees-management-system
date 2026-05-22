import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { 
    ActivityIndicator, 
    Alert, 
    FlatList, 
    Image, 
    StyleSheet, 
    Text, 
    TouchableOpacity, 
    View, 
    TextInput 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Config from '../config';
import ApiService from '../utils/apiService';

export default function AllTeachersScreen() {
    const [teachers, setTeachers] = useState([]);
    const [filteredTeachers, setFilteredTeachers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();

    const fetchTeachers = async () => {
        try {
            setLoading(true);
            const result = await ApiService.getAllTeachers();
            
            // Your ApiService returns: { success: true, data: { teachers: [...] } }
            if (result && result.success && result.data?.teachers) {
                setTeachers(result.data.teachers);
                setFilteredTeachers(result.data.teachers);
            } else {
                setTeachers([]);
                setFilteredTeachers([]);
            }
        } catch (err) {
            Alert.alert('Connection Error', 'Could not reach the server.');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchTeachers(); }, []));

    useEffect(() => {
        const query = searchQuery.toLowerCase();
        const filtered = teachers.filter(t => 
            (t.fullName && t.fullName.toLowerCase().includes(query)) || 
            (t.assignedClass && t.assignedClass.toLowerCase().includes(query))
        );
        setFilteredTeachers(filtered);
    }, [searchQuery, teachers]);

    const handleDelete = (teacherID, name) => {
        Alert.alert('Confirm Delete', `Are you sure you want to delete ${name}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const result = await ApiService.deleteTeacher(teacherID);
                        if (result.success) {
                            Alert.alert('Success', 'Teacher removed.');
                            fetchTeachers(); 
                        }
                    } catch (err) {
                        Alert.alert('Error', 'Network request failed.');
                    }
                },
            },
        ]);
    };

    const renderItem = ({ item }) => (
        <View style={styles.teacherCard}>
            <Image
                style={styles.profileImage}
                source={
                    item.profilePic 
                        ? { uri: `${Config.API_BASE_URL}/uploads/${item.profilePic.replace(/^(uploads\/|teachers\/)/, '')}` }
                        : require('../assets/default-profile.png')
                }
            />
            
            <View style={styles.teacherDetails}>
                <Text style={styles.teacherName}>{item.fullName || 'No Name'}</Text>
                
                <View style={styles.metaRow}>
                    <Ionicons name="school-outline" size={14} color="#64748B" />
                    <Text style={styles.teacherMeta}>{item.assignedClass || 'No Class Assigned'}</Text>
                </View>

                <View style={styles.metaRow}>
                    <Ionicons name="location-outline" size={14} color="#64748B" />
                    <Text style={styles.teacherMeta}>{item.town || 'No Location'}</Text>
                </View>
            </View>

            <View style={styles.verticalActions}>
                <TouchableOpacity onPress={() => navigation.navigate('EditTeacher', { teacher: item })}>
                    <Ionicons name="create-outline" size={20} color="#3B82F6" style={styles.actionIcon} />
                </TouchableOpacity>
                <View style={styles.actionDivider} />
                <TouchableOpacity onPress={() => handleDelete(item.teacherID, item.fullName)}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" style={styles.actionIcon} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Staff Registry</Text>
            </View>

            <View style={styles.searchSection}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search teachers..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={filteredTeachers}
                    keyExtractor={(item) => item.teacherID.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        <View style={{alignItems: 'center', marginTop: 50}}>
                            <Text style={{color: '#64748B'}}>No teachers found.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
    searchSection: { paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFF' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 12, height: 45 },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 15 },
    listContainer: { padding: 20 },
    teacherCard: { 
        flexDirection: 'row', backgroundColor: '#FFF', padding: 12, 
        borderRadius: 16, marginBottom: 12, alignItems: 'center',
        borderWidth: 1, borderColor: '#E2E8F0', elevation: 2 
    },
    profileImage: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#E2E8F0' },
    teacherDetails: { flex: 1, marginLeft: 15 },
    teacherName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    teacherMeta: { fontSize: 13, color: '#64748B', marginLeft: 6 },
    verticalActions: { backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#F1F5F9' },
    actionIcon: { padding: 10 },
    actionDivider: { height: 1, backgroundColor: '#E2E8F0', width: '80%', alignSelf: 'center' },
});