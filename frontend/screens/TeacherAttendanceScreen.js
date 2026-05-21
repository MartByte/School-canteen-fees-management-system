import { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Image,
    TextInput,
    Platform,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import ApiService from '../utils/apiService';
import Config from '../config';

const TeacherAttendanceScreen = () => {
    const navigation = useNavigation();
    const [date, setDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');

    // Filter teachers based on search input
    const filteredTeachers = teachers.filter((t) =>
        `${t.Fname} ${t.Lname}`.toLowerCase().includes(searchText.toLowerCase())
    );

    const fetchAttendance = async () => {
        const formattedDate = date.toLocaleDateString('en-CA');
        setLoading(true);
        try {
            const result = await ApiService.getTeacherAttendance(formattedDate);
            if (result.success) {
                // Ensure data is an array
                setTeachers(result.data || []);
            } else {
                Alert.alert('Error', result.message || 'Failed to fetch teacher attendance');
            }
        } catch (err) {
            console.error('Error fetching:', err);
            Alert.alert('Error', 'Failed to fetch teacher attendance');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, [date]);

    const toggleStatus = (teacherID) => {
        setTeachers((prev) =>
            prev.map((t) => {
                if (t.teacherID === teacherID) {
                    // Logic: null -> present -> absent -> present
                    let newStatus;
                    if (!t.status || t.status === 'absent') {
                        newStatus = 'present';
                    } else {
                        newStatus = 'absent';
                    }
                    return { ...t, status: newStatus };
                }
                return t;
            })
        );
    };

    const submitAttendance = async () => {
        try {
            const formattedDate = date.toLocaleDateString('en-CA');
            
            // Only prepare list for teachers who have a status assigned
            const attendanceList = teachers
            .filter(t => t.status !== null)
            .map((t) => ({
                teacherID: t.teacherID,
                status: t.status,
                markedBy: 1 // Use a numeric ID instead of 'Admin'
            }));

            if (attendanceList.length === 0) {
                Alert.alert('Notice', 'No changes to submit.');
                return;
            }

            // Note: Updated to pass the object structure your backend POST expects
            const result = await ApiService.submitTeacherAttendance({
                attendanceList,
                date: formattedDate
            });

            if (result.success) {
                Alert.alert('Success', 'Attendance submitted!');
                fetchAttendance(); 
            } else {
                Alert.alert('Error', result.message || 'Failed to submit attendance');
            }
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to submit attendance');
        }
    };

    const renderItem = ({ item }) => {
        const isPending = !item.status;
        const isPresent = item.status === 'present';

        return (
            <View style={[styles.teacherItem, isPending && styles.pendingItem]}>
                <View style={styles.teacherInfo}>
                    <Image
                        source={item.profilePic 
                            ? { uri: `${Config.API_BASE_URL}/uploads/${item.profilePic.replace(/^(uploads\/|teachers\/)/, '')}` } 
                            : require('../assets/default-profile.png')
                        }
                        style={styles.profileImage}
                    />
                    <View>
                        <Text style={styles.teacherName}>{item.Fname} {item.Lname}</Text>
                        {isPending ? (
                            <Text style={styles.pendingSubtext}>Not marked yet</Text>
                        ) : (
                            <Text style={[styles.statusSubtext, { color: isPresent ? '#10B981' : '#EF4444' }]}>
                                Staff is {item.status.toUpperCase()}
                            </Text>
                        )}
                    </View>
                </View>

                <TouchableOpacity
                    onPress={() => toggleStatus(item.teacherID)}
                    style={[
                        styles.statusButton,
                        { backgroundColor: isPending ? '#94a3b8' : (isPresent ? '#10B981' : '#EF4444') }
                    ]}
                >
                    <Text style={styles.statusText}>
                        {isPending ? 'MARK' : item.status}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#000066" />
                </TouchableOpacity>
                <Text style={styles.header}>Teacher Attendance</Text>
            </View>

            <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.dateButton}>
                <Text style={styles.dateText}>
                    📅 {date.toISOString().split('T')[0]}
                </Text>
            </TouchableOpacity>

            {showPicker && (
                <DateTimePicker
                    value={date}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onChange={(event, selectedDate) => {
                        setShowPicker(false);
                        if (selectedDate) setDate(selectedDate);
                    }}
                />
            )}

            <TextInput
                placeholder="Search by teacher name"
                value={searchText}
                onChangeText={setSearchText}
                style={styles.searchInput}
            />

            {loading ? (
                <ActivityIndicator size="large" color="#000066" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={filteredTeachers}
                    keyExtractor={(item) => item.teacherID.toString()}
                    renderItem={renderItem}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No teachers found</Text>
                    }
                />
            )}

            <TouchableOpacity style={styles.submitButton} onPress={submitAttendance}>
                <Text style={styles.submitButtonText}>Submit Attendance</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff6e9' },
    headerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    backButton: { marginRight: 12, padding: 4 },
    header: { fontSize: 18, fontWeight: 'bold', flex: 1, color: '#000066' },
    dateButton: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 10, alignItems: 'center', elevation: 2 },
    dateText: { fontSize: 16, color: '#000066', fontWeight: 'bold' },
    searchInput: { backgroundColor: '#fff', padding: 12, marginBottom: 10, borderRadius: 8, fontSize: 16, elevation: 1 },
    teacherItem: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: 12, 
        backgroundColor: '#FFFFFF', 
        marginBottom: 8, 
        borderRadius: 10,
        elevation: 1
    },
    pendingItem: { borderLeftWidth: 5, borderLeftColor: '#94a3b8' },
    teacherInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    profileImage: { width: 45, height: 45, borderRadius: 22.5, marginRight: 12 },
    teacherName: { fontSize: 16, fontWeight: 'bold', color: '#000066' },
    pendingSubtext: { fontSize: 11, color: '#9ca3af', fontStyle: 'italic' },
    statusSubtext: { fontSize: 11, fontWeight: 'bold', marginTop: 2 },
    statusButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, minWidth: 80, alignItems: 'center' },
    statusText: { color: 'white', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase' },
    submitButton: { backgroundColor: '#000066', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 10, marginBottom: 10 },
    submitButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    emptyText: { textAlign: 'center', marginTop: 20, color: '#6B7280' }
});

export default TeacherAttendanceScreen;