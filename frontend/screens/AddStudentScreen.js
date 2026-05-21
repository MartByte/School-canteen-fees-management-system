import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import React, { useState, useEffect } from 'react'; // Added useEffect
import { 
    Alert, KeyboardAvoidingView, Platform, ScrollView, 
    StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator 
} from 'react-native';
import ApiService from '../utils/apiService';

export default function AddStudentScreen({ navigation }) {
    const [formData, setFormData] = useState({
        Fname: '',
        Mname: '',
        Lname: '',
        class: '',
        town: '',
        guardianPhone: ''
    });
    const [loading, setLoading] = useState(false);
    
    // States for dynamic data
    const [classOptions, setClassOptions] = useState([]);
    const [townOptions, setTownOptions] = useState([]);
    const [isFetchingOptions, setIsFetchingOptions] = useState(true);

    // Fetch Towns and Classes on component load
    useEffect(() => {
        const loadPickerData = async () => {
            try {
                setIsFetchingOptions(true);
                // Fetching both in parallel for better performance
                const [townRes, classRes] = await Promise.all([
                    ApiService.getAvailableTowns(),
                    ApiService.getClasses()
                ]);

                if (townRes.success) {
                    const towns = townRes.data.map(t => typeof t === 'string' ? t : t.townName);
                    setTownOptions(towns);
                }

                if (classRes.success) {
                    const classes = classRes.data.map(c => typeof c === 'string' ? c : c.className);
                    setClassOptions(classes);
                }
            } catch (error) {
                console.error("Error loading form options:", error);
                Alert.alert('Notice', 'Using default lists due to connection error.');
            } finally {
                setIsFetchingOptions(false);
            }
        };

        loadPickerData();
    }, []);

    const handleSubmit = async () => {
        if (!formData.Fname || !formData.Lname || !formData.class || !formData.town) {
            Alert.alert('Missing Info', 'Please fill in all required fields (*)');
            return;
        }

        setLoading(true);

        const studentData = {
            Fname: formData.Fname,
            Mname: formData.Mname,
            Lname: formData.Lname,
            class: formData.class,
            town: formData.town,
            guardianPhone: formData.guardianPhone
        };

        try {
            const result = await ApiService.addStudent(studentData);
            if (result.success) {
                Alert.alert(
                    'Success', 
                    `Student registered successfully!\nAssigned ID: ${result.studentID}`
                );
                navigation.goBack();
            } else {
                Alert.alert('Error', result.message || 'Failed to add student');
            }
        } catch (error) {
            Alert.alert('Connection Error', 'Could not reach the server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#000066" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.title}>Student Registration</Text>
                        <Text style={styles.subtitle}>Enter student details below</Text>
                    </View>
                </View>

                <View style={styles.formContainer}>
                    <InputField 
                        label="First Name *" 
                        value={formData.Fname} 
                        onChange={(t) => setFormData({...formData, Fname: t})} 
                        placeholder="e.g. John"
                    />
                    <InputField 
                        label="Middle Name" 
                        value={formData.Mname} 
                        onChange={(t) => setFormData({...formData, Mname: t})} 
                        placeholder="Optional"
                    />
                    <InputField 
                        label="Last Name *" 
                        value={formData.Lname} 
                        onChange={(t) => setFormData({...formData, Lname: t})} 
                        placeholder="e.g. Doe"
                    />

                    <Text style={styles.label}>Class *</Text>
                    <View style={styles.pickerWrapper}>
                        {isFetchingOptions ? (
                            <ActivityIndicator size="small" color="#000066" style={{ height: 55 }} />
                        ) : (
                            <Picker
                                selectedValue={formData.class}
                                onValueChange={(v) => setFormData({...formData, class: v})}
                                style={styles.picker}
                            >
                                <Picker.Item label="Select Class" value="" color="#9CA3AF" />
                                {classOptions.map((opt, index) => (
                                    <Picker.Item key={`class-${index}`} label={opt} value={opt} />
                                ))}
                            </Picker>
                        )}
                    </View>

                    <Text style={styles.label}>Town *</Text>
                    <View style={styles.pickerWrapper}>
                        {isFetchingOptions ? (
                            <ActivityIndicator size="small" color="#000066" style={{ height: 55 }} />
                        ) : (
                            <Picker
                                selectedValue={formData.town}
                                onValueChange={(v) => setFormData({...formData, town: v})}
                                style={styles.picker}
                            >
                                <Picker.Item label="Select Town" value="" color="#9CA3AF" />
                                {townOptions.map((opt, index) => (
                                    <Picker.Item key={`town-${index}`} label={opt} value={opt} />
                                ))}
                            </Picker>
                        )}
                    </View>

                    <InputField 
                        label="Guardian's Phone" 
                        value={formData.guardianPhone} 
                        onChange={(t) => setFormData({...formData, guardianPhone: t})} 
                        keyboard="phone-pad"
                        placeholder="024 XXX XXXX"
                    />
                </View>

                <TouchableOpacity 
                    style={[styles.submitButton, (loading || isFetchingOptions) && styles.submitButtonDisabled]} 
                    onPress={handleSubmit}
                    disabled={loading || isFetchingOptions}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Ionicons name="person-add-outline" size={20} color="#FFF" style={{marginRight: 10}} />
                            <Text style={styles.submitButtonText}>Register Student</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}



const InputField = ({ label, value, onChange, placeholder, keyboard = "default" }) => (
    <View style={styles.inputGroup}>
        <Text style={styles.label}>{label}</Text>
        <TextInput 
            value={value} 
            onChangeText={onChange} 
            style={styles.input}
            keyboardType={keyboard}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
        />
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff6e9' },
    scrollContent: { padding: 20 },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: 25, 
        paddingTop: 40 
    },
    backButton: { 
        width: 45, 
        height: 45, 
        borderRadius: 22.5, 
        backgroundColor: '#FFF', 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginRight: 15,
        elevation: 2 
    },
    title: { fontSize: 24, fontWeight: '800', color: '#000066' },
    subtitle: { fontSize: 14, color: '#64748B', marginTop: 2 },
    formContainer: { 
        backgroundColor: '#FFFFFF', 
        borderRadius: 20, 
        padding: 20, 
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    inputGroup: { marginBottom: 15 },
    label: { fontSize: 14, fontWeight: '700', color: '#000066', marginBottom: 6 },
    input: { 
        backgroundColor: '#F9FAFB', 
        borderRadius: 12, 
        padding: 14, 
        fontSize: 16, 
        borderWidth: 1, 
        borderColor: '#E5E7EB',
        color: '#1F2937'
    },
    pickerWrapper: { 
        backgroundColor: '#F9FAFB', 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: '#E5E7EB', 
        marginBottom: 15,
        overflow: 'hidden' 
    },
    picker: { height: 55 },
    submitButton: { 
        backgroundColor: '#000066', 
        padding: 18, 
        borderRadius: 15, 
        flexDirection: 'row',
        alignItems: 'center', 
        justifyContent: 'center',
        marginTop: 25,
        elevation: 4
    },
    submitButtonDisabled: { backgroundColor: '#9CA3AF' },
    submitButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 18 },
});