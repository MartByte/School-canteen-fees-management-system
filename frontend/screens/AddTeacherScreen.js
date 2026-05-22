import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    Alert, Image, ScrollView, Text, TextInput, 
    TouchableOpacity, View, StatusBar, ActivityIndicator, StyleSheet
} from 'react-native';
import ApiService from '../utils/apiService';

const AddTeacherScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    
    // Form State
    const [Fname, setFname] = useState('');
    const [Mname, setMname] = useState('');
    const [Lname, setLname] = useState('');
    const [phone, setPhone] = useState('');
    const [assignedClass, setAssignedClass] = useState('');
    const [town, setTown] = useState('');
    const [isCanteenCollector, setIsCanteenCollector] = useState(false);
    const [image, setImage] = useState(null);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'We need access to your photos.');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            setImage(result.assets[0]);
        }
    };

    const validateClassFormat = (classInput) => {
        if (!classInput) return true; 
        // Updated Regex: Specifically looks for "Class", "KG", or "JHS"
        const validClassPattern = /^(Class\s+\d+|KG\d+|JHS\d+)$/i;
        return validClassPattern.test(classInput.trim());
    };

    const handleSubmit = async () => {
        if (!Fname || !Lname || !phone) {
            Alert.alert('Required Fields', 'First Name, Last Name, and Phone are mandatory.');
            return;
        }

        if (assignedClass && !validateClassFormat(assignedClass)) {
            Alert.alert('Invalid Format', 'Use: Class 1, KG1, or JHS1');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('Fname', Fname);
        formData.append('Mname', Mname);
        formData.append('Lname', Lname);
        formData.append('phone', phone);
        formData.append('town', town);
        formData.append('role', 'teacher');
        formData.append('assignedClass', assignedClass.trim());
        formData.append('isCanteenCollector', isCanteenCollector ? "1" : "0");

        if (image) {
            const filename = image.uri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image`;
            formData.append('profilePic', {
                uri: image.uri,
                name: filename,
                type: type,
            });
        }

        try {
            const result = await ApiService.addTeacher(formData);
            if (result.success) {
                Alert.alert('Success', 'Teacher profile created!');
                navigation.goBack();
            } else {
                Alert.alert('Error', result.message || 'Submission failed');
            }
        } catch (error) {
            Alert.alert('Error', 'Could not connect to server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>New Teacher</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.imageSection}>
                    <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
                        <Image 
                            source={image ? { uri: image.uri } : require('../assets/default-profile.png')} 
                            style={styles.profileImage} 
                        />
                        <View style={styles.imageOverlay}><Ionicons name="camera" size={20} color="#FFF" /></View>
                    </TouchableOpacity>
                </View>

                <View style={styles.formSection}>
                    <InputField label="First Name *" value={Fname} onChange={setFname} />
                    <InputField label="Middle Name" value={Mname} onChange={setMname} />
                    <InputField label="Last Name *" value={Lname} onChange={setLname} />
                    <InputField label="Phone *" value={phone} onChange={setPhone} keyboard="phone-pad" />
                    <InputField label="Town" value={town} onChange={setTown} />
                    <InputField label="Assigned Class (e.g. Class 1)" value={assignedClass} onChange={setAssignedClass} />

                    <TouchableOpacity 
                        style={styles.toggleRow} 
                        onPress={() => setIsCanteenCollector(!isCanteenCollector)}
                    >
                        <Ionicons 
                            name={isCanteenCollector ? "checkbox" : "square-outline"} 
                            size={24} color={isCanteenCollector ? "#10B981" : "#64748B"} 
                        />
                        <Text style={styles.toggleText}>Set as Canteen Collector</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.submitButton, loading && {backgroundColor: '#94A3B8'}]} 
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Save Teacher</Text>}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

// Simple reusable input component
const InputField = ({ label, value, onChange, keyboard = "default" }) => (
    <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TextInput 
            style={styles.textInput} 
            value={value} 
            onChangeText={onChange} 
            keyboardType={keyboard}
            placeholderTextColor="#94A3B8"
        />
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#FFF' },
    backButton: { marginRight: 15 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
    scrollContent: { paddingBottom: 40 },
    imageSection: { alignItems: 'center', marginVertical: 20 },
    imageContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E2E8F0' },
    profileImage: { width: 100, height: 100, borderRadius: 50 },
    imageOverlay: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#3B82F6', padding: 5, borderRadius: 15 },
    formSection: { paddingHorizontal: 20 },
    inputGroup: { marginBottom: 15 },
    inputLabel: { fontSize: 13, color: '#64748B', marginBottom: 5, fontWeight: '600' },
    textInput: { backgroundColor: '#FFF', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', fontSize: 16 },
    toggleRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 15 },
    toggleText: { marginLeft: 10, fontSize: 15, color: '#334155' },
    submitButton: { backgroundColor: '#3B82F6', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    submitText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});

export default AddTeacherScreen;