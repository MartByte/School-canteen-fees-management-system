import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { 
    Alert, 
    StatusBar, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    View, 
    ScrollView, 
    KeyboardAvoidingView, 
    Platform,
    StyleSheet
} from 'react-native';
import ApiService from '../utils/apiService';

export default function EditTeacherScreen({ route }) {
    const { teacher } = route.params;
    const [Fname, setFname] = useState(teacher.Fname || '');
    const [Mname, setMname] = useState(teacher.Mname || '');
    const [Lname, setLname] = useState(teacher.Lname || '');
    const [town, setTown] = useState(teacher.town || '');
    const [className, setClassName] = useState(teacher.assignedClass || '');
    const [phone, setPhone] = useState(teacher.phone || '');
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();

    const validateClassFormat = (classInput) => {
        if (!classInput) return true;
        const validClassPattern = /^(Basic\s+\d+|KG\d+|JHS\d+)$/i;
        return validClassPattern.test(classInput.trim());
    };

    const handleUpdate = async () => {
        if (!Fname || !Lname || !phone) {
            Alert.alert('Missing Fields', 'First Name, Last Name, and Phone are required.');
            return;
        }

        if (className && !validateClassFormat(className)) {
            Alert.alert(
                'Invalid Class Format',
                'Please use the correct format (e.g., Basic 1, KG1, JHS1).'
            );
            return;
        }

        setLoading(true);
        try {
            // Mapping UI 'className' back to DB 'assignedClass'
            const teacherData = {
                Fname: Fname.trim(),
                Mname: Mname.trim(),
                Lname: Lname.trim(),
                assignedClass: className.trim(), 
                phone: phone.trim(),
                town: town.trim()
            };

            const result = await ApiService.updateTeacher(teacher.teacherID, teacherData);
            
            if (result.success) {
                Alert.alert('Success', 'Teacher updated successfully!');
                navigation.goBack();
            } else {
                Alert.alert('Update Failed', result.message || 'Check your connection.');
            }
        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>Edit Teacher</Text>
                        <Text style={styles.headerSubtitle}>ID: {teacher.teacherID}</Text>
                    </View>
                </View>

                <ScrollView 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    <View style={styles.formSection}>
                        {/* Name Section */}
                        <Text style={styles.sectionLabel}>Personal Details</Text>
                        
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>First Name *</Text>
                            <TextInput
                                style={styles.textInput}
                                value={Fname}
                                onChangeText={setFname}
                                placeholder="Enter first name"
                                autoCapitalize="words"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Middle Name</Text>
                            <TextInput
                                style={styles.textInput}
                                value={Mname}
                                onChangeText={setMname}
                                placeholder="Optional"
                                autoCapitalize="words"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Last Name *</Text>
                            <TextInput
                                style={styles.textInput}
                                value={Lname}
                                onChangeText={setLname}
                                placeholder="Enter last name"
                                autoCapitalize="words"
                            />
                        </View>

                        <View style={styles.divider} />
                        <Text style={styles.sectionLabel}>Work & Contact</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Assigned Class</Text>
                            <TextInput
                                style={styles.textInput}
                                value={className}
                                onChangeText={setClassName}
                                placeholder="e.g., Basic 1"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Phone Number *</Text>
                            <TextInput
                                style={styles.textInput}
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                                placeholder="+233..."
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Town</Text>
                            <TextInput
                                style={styles.textInput}
                                value={town}
                                onChangeText={setTown}
                                placeholder="Enter town location"
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.updateButton, loading && styles.updateButtonDisabled]}
                        onPress={handleUpdate}
                        disabled={loading}
                    >
                        <Ionicons name="save-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.updateButtonText}>
                            {loading ? "Saving..." : "Save Changes"}
                        </Text>
                    </TouchableOpacity>
                    
                    <View style={{ height: 40 }} />
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backButton: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center',
        marginRight: 12,
    },
    headerContent: { flex: 1 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
    headerSubtitle: { fontSize: 13, color: '#64748B' },
    scrollContent: { paddingVertical: 10 },
    formSection: {
        backgroundColor: '#FFFFFF', borderRadius: 16,
        margin: 20, padding: 20,
        elevation: 3, shadowColor: '#000', shadowOpacity: 0.1,
        shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    },
    sectionLabel: { 
        fontSize: 12, fontWeight: 'bold', color: '#94A3B8', 
        textTransform: 'uppercase', marginBottom: 15, letterSpacing: 1 
    },
    inputGroup: { marginBottom: 16 },
    inputLabel: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 },
    textInput: {
        borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10,
        paddingHorizontal: 15, paddingVertical: 12, fontSize: 16,
        backgroundColor: '#F8FAFC', color: '#1E293B',
    },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 20 },
    updateButton: {
        backgroundColor: '#000066', flexDirection: 'row',
        alignItems: 'center', justifyContent: 'center',
        paddingVertical: 16, marginHorizontal: 20, borderRadius: 12,
    },
    updateButtonDisabled: { backgroundColor: '#94A3B8' },
    updateButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});