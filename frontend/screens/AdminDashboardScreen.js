import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Config from '../config';
import io from 'socket.io-client';
import { CommonActions } from '@react-navigation/native'; // Add this at the top
import SessionManager from '../utils/sessionManager';
import eventStack from '../utils/events';

const AdminDashboardScreen = ({ navigation }) => {
  // 1. Initialize with default numbers to prevent "Text strings" errors
  // when stats is null or undefined during the first render.
  const [stats, setStats] = useState({
    classPresent: 0,
    canteenPresent: 0,
    missedCanteen: 0,
    totalCollected: 0,
    totalStudents: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const response = await fetch(`${Config.API_BASE_URL}/admin/dashboard/admin-summary`, {
        method: 'POST', // Keep as POST since your backend expects it
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error('Server error');

      const data = await response.json();

      // Map data carefully to ensure no nulls reach the UI
      setStats({
        classPresent: data.classPresent || 0,
        canteenPresent: data.canteenPresent || 0,
        missedCanteen: data.missedCanteen || 0,
        totalCollected: data.totalCollected || 0,
        totalStudents: data.totalStudents || 0
      });
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
      if (!isSilent) {
        Alert.alert("Connection Error", "Could not fetch dashboard stats. Is the MySQL server running?");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Socket.io for real-time updates
    const socket = io(Config.API_BASE_URL);
    socket.on('refresh_data', (data) => {
      if (data && data.type === 'attendance_update') {
        loadData(true);
      }
    });

    return () => {
      socket.off('refresh_data');
      socket.disconnect();
    };
  }, [loadData]);

 const handleLogout = () => {
  Alert.alert("Logout", "Are you sure you want to sign out?", [
    { text: "Cancel", style: "cancel" },
    {
      text: "Logout",
      style: 'destructive',
      onPress: async () => {
        try {
          await SessionManager.logout(); // Clear storage
          eventStack.emit('forceLogout'); // Shout to App.js!
        } catch (error) {
          console.error("Logout error", error);
        }
      }
    }
  ]);
};
  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1e40af" />
        <Text style={styles.loadingText}>Loading statistics...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1e40af" />}
    >
      {/* Header Section */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Admin Portal</Text>
          <Text style={styles.subtitle}>Management Dashboard</Text>
        </View>

        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => loadData(false)} style={styles.iconBtnMargin}>
            <Ionicons name="refresh-circle" size={34} color="#1e40af" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={28} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Audit Alert Box */}
      <View style={styles.auditContainer}>
        <View style={styles.auditHeader}>
          <Ionicons name="warning" size={24} color="#ef4444" />
          <Text style={styles.auditTitle}>Canteen Audit Gap</Text>
        </View>

        <View style={styles.auditRow}>
          <View style={styles.auditStat}>
            <Text style={styles.auditLabel}>In Class Today</Text>
            <Text style={styles.auditValue}>{String(stats.classPresent)}</Text>
          </View>
          <View style={styles.auditDivider} />
          <View style={styles.auditStat}>
            <Text style={styles.auditLabel}>Paid Canteen</Text>
            <Text style={styles.auditValue}>{String(stats.canteenPresent)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.gapButton}
          onPress={() => navigation.navigate('AttendanceGapList')}
        >
          <Text style={styles.gapText}>
            Identify {String(stats.missedCanteen)} Unpaid Students
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <View style={styles.row}>
        <View style={styles.statCard}>
          <Text style={styles.cardLabel}>Collection Today</Text>
          <Text style={styles.cardValue}>GHS {String(stats.totalCollected)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.cardLabel}>Total Students</Text>
          <Text style={styles.cardValue}>{String(stats.totalStudents)}</Text>
        </View>
      </View>

      {/* Quick Actions List */}
      <View style={styles.actions}>
        <Text style={styles.sectionTitle}>Quick Management</Text>

        <ActionItem
          title="Collect Canteen Fees"
          icon="wallet"
          color="#3b82f6"
          onPress={() => navigation.navigate('CollectCanteen', { town: 'all' })}
        />
        <ActionItem
          title="View Balances/Debtors"
          icon="alert-circle"
          color="#f59e0b"
          onPress={() => navigation.navigate('FeesBalances')}
        />
        <ActionItem
          title="Financial Reports"
          icon="document-text"
          color="#10b981"
          onPress={() => navigation.navigate('Reports')}
        />
        <ActionItem
          title="Staff Directory"
          icon="people"
          color="#6366f1"
          onPress={() => navigation.navigate('AllTeachers')}
        />
      </View>

      {/* Bottom Spacer for ScrollView */}
      <View style={styles.footerSpacer} />
    </ScrollView>
  );
};

// Sub-component for Action Items to keep code clean
const ActionItem = ({ title, icon, color, onPress }) => (
  <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
    <View style={[styles.iconBox, {backgroundColor: color + '15'}]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <Text style={styles.actionText}>{title}</Text>
    <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText: { marginTop: 10, color: '#64748b' },
  header: {
    paddingHorizontal: 25,
    paddingTop: 60,
    paddingBottom: 25,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  title: { fontSize: 26, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  iconBtnMargin: { marginRight: 15 },
  auditContainer: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  auditHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  auditTitle: { marginLeft: 10, fontSize: 17, fontWeight: '700', color: '#ef4444' },
  auditRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  auditStat: { alignItems: 'center' },
  auditLabel: { color: '#64748b', fontSize: 13, marginBottom: 5 },
  auditValue: { fontSize: 24, fontWeight: '800', color: '#1e293b' },
  auditDivider: { width: 1, height: '80%', backgroundColor: '#e2e8f0' },
  gapButton: {
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  gapText: { color: '#fff', fontWeight: '700', fontSize: 15, marginRight: 10 },
  row: { flexDirection: 'row', paddingHorizontal: 20, justifyContent: 'space-between' },
  statCard: {
    backgroundColor: '#fff',
    width: '47%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1, // Fixed typo from 'borderWIdth'
    borderColor: '#f1f5f9'
  },
  cardLabel: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  cardValue: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginTop: 8 },
  actions: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 15, marginLeft: 5 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  iconBox: { padding: 10, borderRadius: 10, marginRight: 15 },
  actionText: { flex: 1, fontWeight: '600', color: '#334155', fontSize: 15 },
  footerSpacer: { height: 40 }
});

export default AdminDashboardScreen;