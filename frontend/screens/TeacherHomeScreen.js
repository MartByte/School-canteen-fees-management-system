import { Entypo, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import Config from '../config';
import ApiService from '../utils/apiService';
import SessionManager from '../utils/sessionManager';

const TeacherHomeScreen = ({ route, navigation, onLogout, teacherID: propId }) => {
    // 1. Extract params
    const [teacherId, setTeacherId] = useState(propId || route.params?.teacherID);

    const [teacher, setTeacher] = useState({
        Fname: '',
        Lname: '',
        assignedClass: '',
        town: '',
        profilePic: null,
        isCanteenCollector: false
    });
    const [loading, setLoading] = useState(true);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 16) return 'Good afternoon';
        return 'Good evening';
    };

    // FIXED LOGOUT: Removed manual navigation to fix the 'REPLACE' error
    const handleLogout = async () => {
        Alert.alert("Logout", "Are you sure you want to sign out?", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Logout",
              style: "destructive",
              onPress: async () => {
                  try {
                      // Clear physical storage
                      await SessionManager.logout();

                      // Trigger state change in App.js.
                      // This will automatically take the user to the Login screen.
                      if (onLogout) {
                          onLogout();
                      }
                  } catch (error) {
                      console.error("Logout Error:", error);
                  }
              }
            }
        ]);
    };

    const pickImage = async () => {
        let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            alert("Permission to access camera roll is required!");
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            const localUri = result.assets[0].uri;
            const filename = localUri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image`;

            try {
                const res = await ApiService.uploadProfilePicture(
                    teacherId,
                    { uri: localUri, name: filename, type }
                );
                if (res.success) {
                    // res.data.profilePic should be the filename from the server
                    const newPicName = res.data.profilePic.split('/').pop();
                    
                    // Update the state
                    setTeacher(prev => ({ 
                        ...prev, 
                        profilePic: newPicName 
                    }));
                    
                    Alert.alert('Success', 'Profile picture updated!');
                } else {
                    alert('Failed to upload: ' + res.message);
                }
            } catch (error) {
                console.error('Upload error:', error);
                alert('Error uploading profile picture');
            }
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                let id = teacherId;
                if (!id) {
                    const sess = await SessionManager.getUserSession();
                    id = sess?.userId;
                    setTeacherId(id);
                }

                // Debugging: Check your console to see if an ID exists
                console.log("Fetching data for Teacher ID:", id);

                if (!id) {
                    setLoading(false);
                    return;
                }

                const res = await fetch(`${Config.API_BASE_URL}/api/teacher/${id}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (!res.ok) throw new Error(`Failed to fetch teacher data: ${res.status}`);

                const data = await res.json();

                let profilePic = data.profilePicUrl || null;
                if (profilePic && profilePic.includes('/uploads/')) {
                    profilePic = profilePic.split('/uploads/').pop();
                }

                setTeacher({
                    Fname: data.Fname || '',
                    Lname: data.Lname || '',
                    assignedClass: data.assignedClass || '',
                    town: data.town || '',
                    profilePic: profilePic,
                    isCanteenCollector: !!data.isCanteenCollector
                });

            } catch (err) {
                console.error('Error fetching teacher:', err);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [teacherId]);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
                <ActivityIndicator size="large" color="#000066" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={{ width: 40 }} />
                <Text style={styles.headerTitle}>Teacher Home</Text>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={24} color="#EF4444" />
                </TouchableOpacity>
            </View>

            <LinearGradient
                colors={['#000066', '#0044aa']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.greetingCard}
            >
                <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
                    {teacher?.profilePic ? (
                        <Image
                        source={{
                            // Adding ?t= and the current time forces the image to refresh immediately
                            uri: `${Config.API_BASE_URL}/uploads/${teacher.profilePic.replace(/^uploads\//, '')}?t=${new Date().getTime()}`
                        }}
                        style={styles.profileImage}
                    />
                    ) : (
                        <Ionicons name="person-circle-outline" size={80} color="#fff" />
                    )}
                    <View style={styles.editIconWrapper}>
                        <Ionicons name="pencil" size={18} color="white" />
                    </View>
                </TouchableOpacity>
                <View style={{ marginLeft: 15, flex: 1 }}>
                    <Text style={styles.greetingText}>{getGreeting()},</Text>
                    <Text style={styles.nameText} numberOfLines={1}>
                        {teacher?.Fname ? `${teacher.Fname} ${teacher.Lname}` : 'Welcome'}
                    </Text>
                    <Text style={styles.classText}>
                        Class: {teacher?.assignedClass || 'Unassigned'}
                    </Text>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content}>
                <GradientButton
                    icon={<MaterialCommunityIcons name="check-decagram" size={24} color="white" />}
                    text="Mark Attendance"
                    onPress={() => {
                        if (teacher?.assignedClass) {
                            navigation.navigate('SelectClass', {
                                className: teacher.assignedClass,
                                teacherID: teacherId,
                                teacher: teacher
                            });
                        } else {
                            Alert.alert('Notice', 'No class assigned to your profile.');
                        }
                    }}
                />

                {teacher?.isCanteenCollector && (
                    <>
                        <GradientButton
                            icon={<Entypo name="price-tag" size={24} color="white" />}
                            text="Collect Canteen Fees"
                            onPress={() => {
                                const today = new Date().toISOString().split('T')[0];
                                navigation.navigate('CollectCanteen', {
                                    role: 'teacher',
                                    town: teacher.town,
                                    date: today
                                });
                            }}
                        />
                        <GradientButton
                            icon={<Ionicons name="create-outline" size={24} color="white" />}
                            text="Edit Canteen Records"
                            onPress={() => {
                                const today = new Date().toISOString().split('T')[0];
                                navigation.navigate('EditCanteen', {
                                    role: 'teacher',
                                    town: teacher.town,
                                    date: today
                                });
                            }}
                        />
                    </>
                )}

                <GradientButton
                    icon={<Ionicons name="document-text-outline" size={24} color="white" />}
                    text="View My Records"
                    onPress={() => navigation.navigate('TeacherClassRecords', {
                        className: teacher.assignedClass,
                        teacherID: teacherId,
                        town: teacher.town
                    })}
                />
            </ScrollView>
        </View>
    );
};

const GradientButton = ({ icon, text, onPress }) => (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={{ width: '100%' }}>
        <LinearGradient
            colors={['#000066', '#0044aa']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.actionButton}
        >
            {icon}
            <Text style={styles.actionText}>{text}</Text>
        </LinearGradient>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff6e9' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#000066', textAlign: 'center' },
    logoutButton: { padding: 8, borderRadius: 8, backgroundColor: '#FEF2F2' },
    greetingCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 25, paddingHorizontal: 20, borderBottomLeftRadius: 25, borderBottomRightRadius: 25, elevation: 5 },
    greetingText: { fontSize: 16, color: '#fff', fontWeight: '400' },
    nameText: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginTop: 2 },
    classText: { fontSize: 14, color: '#d1d5db', marginTop: 4 },
    profileImage: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: '#fff' },
    editIconWrapper: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#000066', borderRadius: 10, padding: 3, borderWidth: 1, borderColor: '#fff' },
    content: { padding: 20, alignItems: 'center', gap: 15 },
    actionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 15, justifyContent: 'center', elevation: 3 },
    actionText: { marginLeft: 10, color: 'white', fontSize: 16, fontWeight: 'bold' },
});

export default TeacherHomeScreen;