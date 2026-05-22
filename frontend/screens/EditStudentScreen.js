import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View, StatusBar } from 'react-native';
import Config from '../config';
import ApiService from '../utils/apiService';

export default function EditStudentScreen({ route }) {
    const { student } = route.params;
    const [Fname, setFname] = useState(student.Fname || '');
    const [Mname, setMname] = useState(student.Mname || '');
    const [Lname, setLname] = useState(student.Lname || '');
    const [className, setClassName] = useState(student.class || '');
    const [town, setTown] = useState(student.town || '');
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();

    // Class format validation function
    const validateClassFormat = (classInput) => {
        if (!classInput) return true; // Allow empty class
        const validClassPattern = /^(Basic\s+\d+|KG\d+|JHS\d+)$/i;
        return validClassPattern.test(classInput.trim());
    };

    const handleUpdate = async () => {
        if (!Fname || !Lname) {
            Alert.alert('Missing Fields', 'Please enter first name and last name.');
            return;
        }

        // Validate class format if provided
        if (className && !validateClassFormat(className)) {
            Alert.alert(
                'Invalid Class Format', 
                'Please use the correct class format:\n\nExamples:\n• Class 1\n• Class 2\n• KG1\n• KG2\n• JHS1\n• JHS2\n\nNote: Use "Class" not "Basic" and include a space before the number.'
            );
            return;
        }

        setLoading(true);
        try {
            const updatedData = {
                Fname,
                Mname,
                Lname,
                className: className.trim(),
                town
            };
            const result = await ApiService.updateStudent(student.studentID, updatedData);
            if (result.success) {
                Alert.alert('Success', 'Student updated successfully!');
                navigation.goBack();
            } else {
                Alert.alert('Error', result.message || 'Failed to update student');
            }
        } catch (error) {
            console.error('Error updating student:', error);
            Alert.alert('Error', 'Failed to update student. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Edit Student</Text>
                    <Text style={styles.headerSubtitle}>Update student information</Text>
                </View>
            </View>

            {/* Form */}
            <View style={styles.formSection}>
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>First Name *</Text>
                    <TextInput 
                        style={styles.textInput}
                        placeholder="Enter first name"
                        value={Fname} 
                        onChangeText={setFname}
                        placeholderTextColor="#9CA3AF"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Middle Name</Text>
                    <TextInput 
                        style={styles.textInput}
                        placeholder="Enter middle name (optional)"
                        value={Mname} 
                        onChangeText={setMname}
                        placeholderTextColor="#9CA3AF"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Last Name *</Text>
                    <TextInput 
                        style={styles.textInput}
                        placeholder="Enter last name"
                        value={Lname} 
                        onChangeText={setLname}
                        placeholderTextColor="#9CA3AF"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Class</Text>
                    <TextInput 
                        style={styles.textInput}
                        placeholder="e.g., Class 1, Class 2, KG1, JHS1"
                        value={className} 
                        onChangeText={setClassName}
                        placeholderTextColor="#9CA3AF"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Town</Text>
                    <TextInput 
                        style={styles.textInput}
                        placeholder="Enter town"
                        value={town} 
                        onChangeText={setTown}
                        placeholderTextColor="#9CA3AF"
                    />
                </View>
            </View>

            {/* Update Button */}
            <TouchableOpacity 
                style={[styles.updateButton, loading && styles.updateButtonDisabled]}
                onPress={handleUpdate}
                disabled={loading}
            >
                {loading ? (
                    <Text style={styles.updateButtonText}>Updating...</Text>
                ) : (
                    <>
                        <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                        <Text style={styles.updateButtonText}>Update Student</Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = {
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#64748B',
    },
    formSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        margin: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: '#FFFFFF',
        color: '#1E293B',
    },
    updateButton: {
        backgroundColor: '#000066',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        marginHorizontal: 20,
        borderRadius: 12,
        shadowColor: '#000066',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    updateButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    updateButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
};
