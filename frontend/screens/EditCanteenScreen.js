import React, { useState, useEffect } from 'react';
import { 
  View, Text, ScrollView, TextInput, TouchableOpacity, 
  StyleSheet, Alert, ActivityIndicator, Modal, Switch 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../utils/apiService'; 
import SessionManager from '../utils/sessionManager';

const EditCanteenScreen = ({ route, navigation }) => {
  const { town, date } = route.params || {}; 
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Correction Form State
  const [dailyFee, setDailyFee] = useState(0); 
  const [targetGroup, setTargetGroup] = useState('normal');
  const [adjustmentAmount, setAdjustmentAmount] = useState('0');
  const [isPresent, setIsPresent] = useState(true);

  useEffect(() => {
    if (!town || !date) {
      Alert.alert("Error", "Missing required parameters (Town/Date).");
      return;
    }
    loadScreenData();
  }, [town, date]);

  const loadScreenData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch the specific fee for this town from town_fees table
      const feeRes = await ApiService.getTownFee(town);
if (feeRes.success) {
    // Access the fee from the data object returned by createApiResponse
    setDailyFee(parseFloat(feeRes.data.fee));
}

      // 2. Fetch the current status of all students for this day
      const res = await ApiService.getCanteenCollect(town, date);
      if (res.success) {
        setData(res.data?.data || res.data);
      }
    } catch (err) {
      Alert.alert("Connection Error", "Could not synchronize with the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceToggle = (newVal) => {
    setIsPresent(newVal);
    
    // Auto-calculate math: If they were present and now absent, refund the fee (+X)
    // If they were absent and now present, charge the fee (-X)
    const originalStatus = selectedStudent?.attendanceStatus === 'present';
    
    if (originalStatus && !newVal) {
      setAdjustmentAmount(dailyFee.toString()); 
    } else if (!originalStatus && newVal) {
      setAdjustmentAmount((dailyFee * -1).toString()); 
    } else {
      setAdjustmentAmount('0');
    }
  };

  const handleCorrection = async () => {
    try {
        setLoading(true);
        const user = await SessionManager.getCurrentUser();
        const userId = user?.teacherID || user?.adminID || user?.id;

        if (!userId) {
            Alert.alert("Error", "Session not found. Please log in again.");
            return;
        }

        const payload = {
            studentID: selectedStudent.studentID,
            toGroup: targetGroup.toLowerCase(),
            adjustmentAmount: parseFloat(adjustmentAmount) || 0,
            isPresent: isPresent, 
            town: town,
            date: date,
            collectedBy: userId
        };

        // Call the atomic backend route we discussed
        const res = await ApiService.applyCanteenCorrection(payload);

        if (res.success) {
            Alert.alert("Success", "Student record updated successfully.");
            setModalVisible(false);
            loadScreenData(); // Refresh list
        } else {
            Alert.alert("Update Failed", res.message || "Could not update record.");
        }
    } catch (err) {
        Alert.alert("Error", "A system error occurred.");
    } finally {
        setLoading(false);
    }
};

  if (loading && !data) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#1e40af" />
      <Text style={styles.loadingText}>Loading records and fees...</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBox}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Correction Mode</Text>
          <Text style={styles.headerSub}>{town} • {date} (₵{dailyFee} fee)</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {data && data.classes && Object.entries(data.classes).map(([className, groups]) => (
          <View key={className} style={styles.classCard}>
            <View style={styles.classHeader}>
               <Ionicons name="school-outline" size={18} color="#1e293b" />
               <Text style={styles.className}>{className}</Text>
            </View>
            
            {['normal', 'advanced', 'credit', 'exempted'].map(type => (
              groups[type] && groups[type].length > 0 && (
                <View key={type} style={styles.groupContainer}>
                  <Text style={[styles.groupHeader, styles[type + 'Text']]}>{type.toUpperCase()}</Text>
                  {groups[type].map(student => (
                    <TouchableOpacity 
                      key={student.studentID} 
                      style={[styles.studentRow, student.attendanceStatus !== 'present' && styles.absentRow]}
                      onPress={() => {
                        setSelectedStudent(student);
                        setTargetGroup(type);
                        setAdjustmentAmount('0');
                        setIsPresent(student.attendanceStatus === 'present');
                        setModalVisible(true);
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.studentName}>{student.Fname} {student.Lname}</Text>
                        <Text style={styles.statusSubText}>
                          {student.attendanceStatus === 'present' ? '✅ Present' : '❌ Absent'}
                        </Text>
                      </View>
                      <View style={styles.rightSide}>
                        <Ionicons name="create-outline" size={20} color="#1e40af" />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )
            ))}
          </View>
        ))}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Modify Transaction</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSub}>{selectedStudent?.Fname} {selectedStudent?.Lname}</Text>

            <View style={styles.formSection}>
                <Text style={styles.label}>Attendance Toggle</Text>
                <View style={[styles.toggleRow, { backgroundColor: isPresent ? '#f0fdf4' : '#fef2f2' }]}>
                    <Text style={[styles.statusLabel, { color: isPresent ? '#15803d' : '#b91c1c' }]}>
                      Student was {isPresent ? "PRESENT" : "ABSENT"}
                    </Text>
                    <Switch value={isPresent} onValueChange={handleAttendanceToggle} />
                </View>
            </View>

            <View style={styles.formSection}>
                <Text style={styles.label}>Switch Group To:</Text>
                <View style={styles.pickerBorder}>
                <Picker
                    selectedValue={targetGroup}
                    onValueChange={(val) => setTargetGroup(val)}
                    mode="dropdown"
                >
                    <Picker.Item label="Normal (Daily Cash)" value="normal" />
                    <Picker.Item label="Advanced (Balance)" value="advanced" />
                    <Picker.Item label="Credit (Debt)" value="credit" />
                    <Picker.Item label="Exempted" value="exempted" />
                </Picker>
                </View>
            </View>

            <View style={styles.formSection}>
                <Text style={styles.label}>Balance Adjustment (₵)</Text>
                <TextInput
                    style={[styles.input, { color: parseFloat(adjustmentAmount) < 0 ? '#b91c1c' : '#15803d' }]}
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={adjustmentAmount}
                    onChangeText={setAdjustmentAmount}
                />
                <Text style={styles.hint}>
                    {parseFloat(adjustmentAmount) > 0 ? "Refunding fee to student." : 
                     parseFloat(adjustmentAmount) < 0 ? "Deducting fee from student." : "No balance change."}
                </Text>
            </View>

            <TouchableOpacity style={styles.applyBtn} onPress={handleCorrection}>
               <Text style={styles.applyBtnText}>Save Correction</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#64748b' },
  headerBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e40af', padding: 20, paddingTop: 40 },
  backBtn: { marginRight: 15 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerSub: { color: '#bfdbfe', fontSize: 13 },
  classCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, margin: 15, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  classHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 8 },
  className: { fontSize: 16, fontWeight: '700', marginLeft: 8, color: '#1e293b' },
  groupContainer: { marginTop: 15 },
  groupHeader: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
  advancedText: { color: '#8b5cf6' },
  normalText: { color: '#3b82f6' },
  creditText: { color: '#f59e0b' },
  exemptedText: { color: '#64748b' },
  studentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  absentRow: { opacity: 0.6 },
  studentName: { fontSize: 15, fontWeight: '600', color: '#334155' },
  statusSubText: { fontSize: 12, color: '#64748b' },
  rightSide: { flexDirection: 'row', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  modalSub: { color: '#64748b', fontSize: 15, marginBottom: 20 },
  formSection: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 8 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12 },
  statusLabel: { fontWeight: '700', fontSize: 14 },
  pickerBorder: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, backgroundColor: '#f8fafc' },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, fontSize: 18, fontWeight: '600', backgroundColor: '#f8fafc', textAlign: 'center' },
  hint: { fontSize: 11, color: '#94a3b8', marginTop: 6, fontStyle: 'italic' },
  applyBtn: { backgroundColor: '#1e40af', padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 10 },
  applyBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 }
});

export default EditCanteenScreen;