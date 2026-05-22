import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, 
  Alert, TextInput, ScrollView, Modal, RefreshControl, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../utils/apiService';
import SessionManager from '../utils/sessionManager';
import StudentSelectionModal from '../components/StudentSelectionModal';

const CollectCanteenScreen = ({ route, navigation }) => {
  const today = new Date().toISOString().split('T')[0];
  const { town: routeTown, date: routeDate } = route.params || {};
  
  // State Management
  const [date, setDate] = useState(routeDate || today);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [classData, setClassData] = useState({});
  const [selectedTown, setSelectedTown] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [availableTowns, setAvailableTowns] = useState([]);
  const [showTownSelector, setShowTownSelector] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  
  // Logic States
  const [attendance, setAttendance] = useState({});
  const [amounts, setAmounts] = useState({});
  const [dbState, setDbState] = useState({}); 

  // Refs for Debouncing Amounts
  const debounceTimers = useRef({});

  // Modals & Selection
  const [showNormalModal, setShowNormalModal] = useState(false);
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showExemptedModal, setShowExemptedModal] = useState(false);
  const [showAdvanceAmountModal, setShowAdvanceAmountModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [modalStudents, setModalStudents] = useState([]);
  const [selectedStudentForAdvance, setSelectedStudentForAdvance] = useState(null);
  const [advanceAmount, setAdvanceAmount] = useState('');

  // 1. Initialize
  useEffect(() => {
    const initialize = async () => {
      try {
        const user = await SessionManager.getCurrentUser();
        if (!user) {
          Alert.alert('Error', 'Session expired. Please log in.');
          navigation.navigate('Login');
          return;
        }
        if (user.role?.toLowerCase() === 'admin') {
          if (routeTown === 'all' || !routeTown) {
            await fetchAvailableTowns();
            setShowTownSelector(true);
          } else {
            setSelectedTown(routeTown);
          }
        } else {
          setSelectedTown(user.town);
        }
      } catch (error) {
        console.error('Init Error:', error);
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, [routeTown]);

  useEffect(() => {
    if (selectedTown && selectedTown !== 'all') {
      fetchData();
      fetchAllStudents(selectedTown);
    }
  }, [selectedTown, date]);

  const fetchData = async () => {
    if (!selectedTown || selectedTown === 'all') return;
    try {
      if (!refreshing) setLoading(true);
      const response = await ApiService.getCanteenCollect(selectedTown, date);
      if (response.success) {
        const rawData = response.data?.data || response.data || {};
        const classesData = rawData.classes || {};
        const initialAttendance = {};
        const initialAmounts = {};
        const initialDbState = {};

        Object.values(classesData).forEach((categories) => {
          ['normal', 'advanced', 'credit', 'exempted'].forEach(group => {
            if (Array.isArray(categories[group])) {
              categories[group].forEach(student => {
                const isPresent = student.attendanceStatus === 'present';
                initialAttendance[student.studentID] = isPresent;
                initialDbState[student.studentID] = isPresent;
                if (student.paidAmount !== null) {
                  initialAmounts[student.studentID] = String(student.paidAmount);
                }
              });
            }
          });
        });
        setClassData(classesData);
        setAttendance(initialAttendance);
        setAmounts(initialAmounts);
        setDbState(initialDbState);
      }
    } catch (error) {
      Alert.alert('Error', 'Refresh failed.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAvailableTowns = async () => {
    const res = await ApiService.getAvailableTowns();
    if (res.success) setAvailableTowns(res.data || []);
  };

  const fetchAllStudents = async (town) => {
    const res = await ApiService.getAllStudentsForTown(town);
    if (res.success) setAllStudents(res.data || []);
  };

  // --- CORE SYNC LOGIC ---
  const syncSingleRecord = async (studentID, isPresent, amountValue) => {
    try {
      const user = await SessionManager.getCurrentUser();
      const payload = {
        town: selectedTown,
        date: date,
        attendance: { [studentID]: isPresent },
        amounts: { [studentID]: amountValue || 0 },
        collectedBy: user.teacherID || user.adminID || user.id,
        classData: classData 
      };

      const response = await ApiService.postCanteenCollect(payload);
      if (response.success) {
        setDbState(prev => ({ ...prev, [studentID]: isPresent }));
        setLastSynced(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (error) {
      console.error("Auto-sync failed:", error);
    }
  };

  const handleAttendanceToggle = (studentID, isPresent) => {
    // Optimistic Update
    setAttendance(prev => ({ ...prev, [studentID]: isPresent }));
    // Immediate Sync
    syncSingleRecord(studentID, isPresent, amounts[studentID]);
  };

  const handleAmountChange = (studentID, value) => {
    // 1. Update UI state immediately
    setAmounts(prev => ({ ...prev, [studentID]: value }));

    // 2. Clear existing timer for this student
    if (debounceTimers.current[studentID]) {
      clearTimeout(debounceTimers.current[studentID]);
    }

    // 3. Set a new timer (Sync after 1 second of no typing)
    debounceTimers.current[studentID] = setTimeout(() => {
      syncSingleRecord(studentID, attendance[studentID], value);
    }, 1000);
  };

  const submitCollection = async () => {
    setLoading(true);
    await fetchData(); // Final refresh to ensure everything is matched
    Alert.alert('Done', "All records are saved.");
    setLoading(false);
  };

  // --- RENDERING & MODALS ---
  const handleAddButtonPress = (category, className) => {
    setSelectedClass(className);
    setSelectedCategory(category);
    const filtered = allStudents.filter(s => 
      String(s.class).toLowerCase().trim() === String(className).toLowerCase().trim()
    );
    setModalStudents(filtered);
    const cat = category.toLowerCase();
    if (cat === 'normal') setShowNormalModal(true);
    else if (cat === 'advanced') setShowAdvancedModal(true);
    else if (cat === 'credit') setShowCreditModal(true);
    else if (cat === 'exempted') setShowExemptedModal(true);
  };

  const performStudentMove = async (student, targetCategory, className, advAmount = null) => {
    try {
      setLoading(true);
      const user = await SessionManager.getCurrentUser();
      const userId = user.teacherID || user.adminID || user.id;
      if (advAmount && parseFloat(advAmount) > 0) {
        await ApiService.topupBalance(student.studentID, parseFloat(advAmount), userId, selectedTown);
      }
      const payload = {
        studentID: student.studentID,
        toGroup: targetCategory.toLowerCase(),
        className: className,
        town: selectedTown,
        date: date,
        isPresent: true,
        collectedBy: userId 
      };
      const res = await ApiService.moveStudentToGroup(payload);
      if (res.success) { fetchData(); }
    } catch (e) {
      Alert.alert('Error', 'Move failed');
    } finally {
      setLoading(false);
      setShowNormalModal(false);
      setShowAdvancedModal(false);
      setShowCreditModal(false);
      setShowExemptedModal(false);
      setShowAdvanceAmountModal(false);
    }
  };

  const getSummaryStats = () => {
    let totals = { paid: 0, adv: 0, cred: 0 };
    Object.values(classData).forEach(cat => {
      totals.paid += (cat.normal || []).filter(s => attendance[s.studentID]).length;
      totals.adv += (cat.advanced || []).filter(s => attendance[s.studentID]).length;
      totals.cred += (cat.credit || []).filter(s => attendance[s.studentID]).length;
    });
    return totals;
  };

  const renderStudent = (student, category, className) => {
    const isChecked = !!attendance[student.studentID];
    const wasInDb = !!dbState[student.studentID];
    const isAdv = category === 'Advanced'; 
    const isExempt = category === 'Exempted';
    
    return (
      <View key={student.studentID} style={[styles.studentRow, isChecked && styles.activeRow, wasInDb && isChecked && styles.savedRow]}>
        <TouchableOpacity style={styles.checkboxContainer} onPress={() => handleAttendanceToggle(student.studentID, !isChecked)}>
          <Ionicons 
            name={isChecked ? (wasInDb ? "checkmark-circle" : "checkbox") : "square-outline"} 
            size={24} color={isChecked ? "#10b981" : "#cbd5e1"} 
          />
        </TouchableOpacity>

        <TouchableOpacity style={{ flex: 1 }} onPress={() => { if(isAdv) handleStudentSelection(student, 'Advanced', className); }}>
          <Text style={[styles.studentName, isChecked && styles.activeText]}>
            {student.name || `${student.Fname} ${student.Lname}`}
            {wasInDb && isChecked && <Text style={styles.savedBadge}> (Synced)</Text>}
          </Text>
          {isAdv && <Text style={styles.balanceText}>Bal: GH₵ {student.advance_balance || 0}</Text>}
        </TouchableOpacity>

        {!isAdv && !isExempt && (
          <View style={styles.amountContainer}>
             <Text style={styles.currencyLabel}>₵</Text>
             <TextInput
              style={styles.amountInput}
              value={amounts[student.studentID] || ""}
              placeholder="0"
              keyboardType="numeric"
              onChangeText={(val) => handleAmountChange(student.studentID, val)}
            />
          </View>
        )}
      </View>
    );
  };

  const renderCategory = (name, students, className) => {
    const colorMap = { 'Normal': '#3b82f6', 'Advanced': '#8b5cf6', 'Credit': '#f59e0b', 'Exempted': '#64748b' };
    return (
      <View style={[styles.categoryContainer, { borderLeftColor: colorMap[name] }]}>
        <View style={styles.categoryHeader}>
          <Text style={[styles.categoryTitle, { color: colorMap[name] }]}>{name}</Text>
          <TouchableOpacity style={[styles.addButton, { backgroundColor: colorMap[name] }]} onPress={() => handleAddButtonPress(name, className)}>
            <Ionicons name="add" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        {students && students.length > 0 ? students.map((s) => renderStudent(s, name, className)) : <Text style={styles.emptyText}>No students</Text>}
      </View>
    );
  };

  if (loading && !refreshing) return <View style={styles.loader}><ActivityIndicator size="large" color="#1e40af" /></View>;

  const stats = getSummaryStats();

  return (
    <SafeAreaView style={styles.container}>
      {!!showTownSelector && (
        <View style={styles.townSelectorModal}>
          <View style={styles.townSelectorContent}>
            <Text style={styles.townSelectorTitle}>Select Bus / Area</Text>
            <ScrollView style={styles.townList}>
              {availableTowns.map((t, i) => (
                <TouchableOpacity key={i} style={styles.townItem} onPress={() => { setSelectedTown(typeof t === 'string' ? t : t.town); setShowTownSelector(false); }}>
                  <Text style={styles.townItemText}>{typeof t === 'string' ? t : t.town}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      <View style={styles.header}>
        <View>
          <Text style={styles.townLabel}>{selectedTown || 'Select Area'}</Text>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={styles.dateLabel}>{new Date(date).toDateString()}</Text>
            {lastSynced && <Text style={styles.syncIndicator}> • Synced {lastSynced}</Text>}
          </View>
        </View>
        <TouchableOpacity onPress={() => setShowTownSelector(true)} style={styles.changeBtn}>
            <Ionicons name="map-outline" size={20} color="#1e40af" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 160 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchData();}} />}>
        {Object.entries(classData).map(([className, categories]) => (
          <View key={className} style={styles.classCard}>
            <View style={styles.classHeader}>
                <Ionicons name="school-outline" size={18} color="#1e293b" /><Text style={styles.classTitle}>{className}</Text>
            </View>
            {renderCategory('Normal', categories.normal, className)}
            {renderCategory('Advanced', categories.advanced, className)}
            {renderCategory('Credit', categories.credit, className)}
            {renderCategory('Exempted', categories.exempted, className)}
          </View>
        ))}
      </ScrollView>
      
      <View style={styles.footer}>
        <View style={styles.statsBar}>
            <View style={styles.statBox}><Text style={styles.statVal}>{String(stats.paid)}</Text><Text style={styles.statLab}>Daily</Text></View>
            <View style={styles.statBox}><Text style={styles.statVal}>{String(stats.adv)}</Text><Text style={styles.statLab}>Adv</Text></View>
            <View style={styles.statBox}><Text style={styles.statVal}>{String(stats.cred)}</Text><Text style={styles.statLab}>Credit</Text></View>
        </View>
        <TouchableOpacity style={styles.submitButton} onPress={submitCollection}>
          <Text style={styles.submitButtonText}>Submit records</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={!!showAdvanceAmountModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.advanceAmountModalContainer}>
            <Text style={styles.advanceAmountModalTitle}>Advance Top-up</Text>
            <TextInput style={styles.advanceAmountInput} placeholder="0.00" value={advanceAmount} onChangeText={setAdvanceAmount} keyboardType="numeric" autoFocus />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdvanceAmountModal(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={() => performStudentMove(selectedStudentForAdvance.student, 'Advanced', selectedStudentForAdvance.className, advanceAmount)}><Text style={styles.confirmText}>Confirm</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <StudentSelectionModal visible={showNormalModal} onClose={() => setShowNormalModal(false)} students={modalStudents} onSelectStudent={(s) => performStudentMove(s, 'Normal', selectedClass)} title="Add to Normal" currentGroupStudents={classData[selectedClass]?.normal || []} />
      <StudentSelectionModal visible={showCreditModal} onClose={() => setShowCreditModal(false)} students={modalStudents} onSelectStudent={(s) => performStudentMove(s, 'Credit', selectedClass)} title="Add to Credit" currentGroupStudents={classData[selectedClass]?.credit || []} />
      <StudentSelectionModal visible={showExemptedModal} onClose={() => setShowExemptedModal(false)} students={modalStudents} onSelectStudent={(s) => performStudentMove(s, 'Exempted', selectedClass)} title="Add to Exempted" currentGroupStudents={classData[selectedClass]?.exempted || []} />
      <StudentSelectionModal visible={showAdvancedModal} onClose={() => setShowAdvancedModal(false)} students={modalStudents} onSelectStudent={(s) => performStudentMove(s, 'Advanced', selectedClass)} title="Add to Advanced" currentGroupStudents={classData[selectedClass]?.advanced || []} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  townLabel: { fontSize: 18, fontWeight: '800', color: '#1e40af' },
  dateLabel: { fontSize: 13, color: '#64748b', marginTop: 2 },
  syncIndicator: { fontSize: 11, color: '#10b981', fontWeight: '600', marginLeft: 5 },
  changeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  scrollContainer: { flex: 1 },
  classCard: { margin: 12, backgroundColor: '#fff', borderRadius: 16, padding: 12, elevation: 2 },
  classHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f8fafc', paddingBottom: 10 },
  classTitle: { fontSize: 17, fontWeight: '700', marginLeft: 8, color: '#1e293b' },
  categoryContainer: { marginBottom: 15, padding: 10, backgroundColor: '#fdfdfd', borderRadius: 12, borderLeftWidth: 4 },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  categoryTitle: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  addButton: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  studentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  activeRow: { backgroundColor: '#f0fdf4', borderRadius: 8 },
  savedRow: { borderLeftWidth: 3, borderLeftColor: '#10b981' },
  checkboxContainer: { paddingRight: 12, paddingLeft: 4 },
  studentName: { fontSize: 15, color: '#334155', fontWeight: '500' },
  activeText: { color: '#065f46', fontWeight: '700' },
  savedBadge: { fontSize: 10, color: '#10b981', fontWeight: '600' },
  balanceText: { fontSize: 11, color: '#8b5cf6', fontWeight: '600' },
  amountContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 8, paddingHorizontal: 8 },
  currencyLabel: { fontSize: 12, color: '#64748b' },
  amountInput: { width: 45, padding: 6, fontSize: 14, fontWeight: '700', color: '#1e293b', textAlign: 'center' },
  emptyText: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  statsBar: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 },
  statBox: { alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '800', color: '#1e40af' },
  statLab: { fontSize: 10, color: '#64748b' },
  submitButton: { backgroundColor: '#1e40af', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  advanceAmountModalContainer: { backgroundColor: '#fff', padding: 24, borderRadius: 20, width: '85%' },
  advanceAmountModalTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 20 },
  advanceAmountInput: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 16, fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  cancelBtn: { flex: 0.45, padding: 14, alignItems: 'center' },
  cancelText: { color: '#64748b', fontWeight: '600' },
  confirmBtn: { flex: 0.5, backgroundColor: '#1e40af', padding: 14, borderRadius: 10, alignItems: 'center' },
  confirmText: { color: '#fff', fontWeight: '700' },
  townItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  townItemText: { fontSize: 16, color: '#334155' },
  townSelectorModal: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  townSelectorContent: { backgroundColor: '#fff', width: '90%', borderRadius: 24, padding: 20, maxHeight: '80%' },
  townSelectorTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 15, textAlign: 'center' },
  townList: { marginTop: 10 }
});

export default CollectCanteenScreen;