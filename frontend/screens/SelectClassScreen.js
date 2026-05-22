import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ApiService from '../utils/apiService';

const SelectClassScreen = ({ route, navigation }) => {
    // 1. Destructure with a fallback to ensure the app doesn't crash
    const { teacherID, teacher } = route.params || {}; 
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const result = await ApiService.getClasses();
                if (result.success) {
                    if (result.data && result.data.length > 0) {
                        const classOptions = result.data.map((name, index) => ({
                            classID: index + 1,
                            className: name,
                            // Ensure we use the teacherID from route.params
                            teacherID: teacherID 
                        }));
                        setClasses(classOptions);
                    }
                }
            } catch (error) {
                console.error("Error fetching classes:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchClasses();
    }, [teacherID]);

    const handleClassSelect = (className) => {
        // 1. Determine who is marking attendance
        // If it's an admin, teacher will be undefined, so we use null or the adminID
        const currentTeacherID = teacherID || (teacher ? teacher.teacherID : null);
    
        navigation.navigate('MarkAttendance', { 
            className: className, // Use the class that was actually clicked
            teacherID: currentTeacherID, 
            teacher: teacher || null // Pass null if it's an admin
        });
    };

    const renderClassItem = ({ item }) => (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleClassSelect(item.className)}
            style={{ marginBottom: 15 }}
        >
            <LinearGradient colors={['#000066', '#0044aa']} style={styles.classCard}>
                <Ionicons name="school" size={22} color="white" />
                <Text style={styles.className}>{item.className}</Text>
            </LinearGradient>
        </TouchableOpacity>
    );

    // If only one class, show a different message
    const renderSingleClass = () => (
        <View style={styles.singleClassContainer}>
            <Text style={styles.singleClassText}>Your Assigned Class:</Text>
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleClassSelect(classes[0].className)}
                style={{ marginTop: 20 }}
            >
                <LinearGradient colors={['#000066', '#0044aa']} style={styles.classCard}>
                    <Ionicons name="school" size={28} color="white" />
                    <Text style={[styles.className, { fontSize: 18 }]}>{classes[0].className}</Text>
                </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.tapToContinue}>Tap to continue to attendance</Text>
        </View>
    );
    
    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.header}>Select Class</Text>
            </View>
            {loading ? (
                <ActivityIndicator size="large" color="#000066" style={{ marginTop: 20 }} />
            ) : classes.length === 1 ? (
                renderSingleClass()
            ) : (
                <FlatList
                    data={classes}
                    keyExtractor={(item) => item.classID.toString()}
                    renderItem={renderClassItem}
                    contentContainerStyle={{ padding: 20 }}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
    },
    backButton: {
        padding: 8,
        marginRight: 12,
        borderRadius: 8,
        backgroundColor: '#F1F5F9'
    },
    header: { fontSize: 22, fontWeight: 'bold', color: '#000066' },
    classCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    className: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
    singleClassContainer: {
        padding: 20,
        alignItems: 'center',
    },
    singleClassText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000066',
        marginBottom: 10,
    },
    tapToContinue: {
        fontSize: 14,
        color: '#666',
        marginTop: 10,
    },
});

export default SelectClassScreen;
