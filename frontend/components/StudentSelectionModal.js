import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const StudentSelectionModal = ({ 
  visible, 
  onClose, 
  students, 
  onSelectStudent, 
  title,
  currentGroupStudents 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const safeStudents = Array.isArray(students) ? students : [];
  const safeCurrentGroupStudents = Array.isArray(currentGroupStudents) ? currentGroupStudents : [];
  
  // Filter out students already in the target group
  const availableStudents = safeStudents.filter(student => 
    !safeCurrentGroupStudents.some(groupStudent => 
      Number(groupStudent.studentID) === Number(student.studentID)
    )
  );
  
  // Filter by search query with robust name checking
  const filteredStudents = availableStudents.filter(student => {
    const fullName = (student.name || `${student.Fname || ''} ${student.Lname || ''}`).toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  // Helper to render name correctly
  const renderName = (item) => {
    if (item.name) return item.name;
    if (item.Fname || item.Lname) return `${item.Fname || ''} ${item.Lname || ''}`.trim();
    return "Unknown Name";
  };
  
  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <TextInput
          style={styles.searchInput}
          placeholder="Search students..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => item.studentID.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.studentItem}
              onPress={() => {
                setSearchQuery(''); // Clear search on select
                onSelectStudent(item);
              }}
            >
              <View>
                <Text style={styles.studentName}>
                  {renderName(item)}
                </Text>
                <Text style={styles.studentClass}>
                  ID: {item.studentID} • {item.class || 'No Class'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery ? "No students match your search" : "No students available in this class"}
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: '#f9fafb' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e40af' },
  closeButton: { padding: 8 },
  closeButtonText: { fontSize: 22, color: '#64748b', fontWeight: 'bold' },
  searchInput: {
    margin: 16,
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 16,
    color: '#1e293b'
  },
  studentItem: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  studentName: { fontSize: 16, fontWeight: '700', color: '#334155', marginBottom: 4 },
  studentClass: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', fontSize: 15 },
});

export default StudentSelectionModal;