import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ReportsMenuScreen = ({ navigation }) => {
    
   const menuItems = [
    {
        title: 'Daily Transactions',
        desc: 'Detailed breakdown of today\'s collections',
        icon: 'calendar-outline',
        color: '#3b82f6',
        screen: 'DailyCanteen' 
    },
    {
        title: 'Weekly Analysis',
        desc: 'Summary and town-based performance',
        icon: 'stats-chart-outline',
        color: '#8b5cf6',
        screen: 'WeeklyCanteenReport' 
    },
    {
        title: 'Monthly Reports',
        desc: 'View performance for a specific month',
        icon: 'calendar-clear-outline',
        color: '#10b981',
        screen: 'MonthlyCanteenReport'
    },
    {
        title: 'Yearly Summaries',
        desc: 'Annual financial growth and overview',
        icon: 'bar-chart-outline',
        color: '#059669', // A slightly darker green for yearly
        screen: 'YearlyCanteenReport'
    },
    {
        title: 'Debt & Credit Balances',
        desc: 'Total balances for all students',
        icon: 'wallet-outline',
        color: '#f59e0b',
        screen: 'FeesBalances' 
    }
];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Financial Reports</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.sectionLabel}>ANALYTICS HUB</Text>
                
                {menuItems.map((item, index) => (
                    <TouchableOpacity 
                        key={index} 
                        style={styles.card}
                        onPress={() => navigation.navigate(item.screen)}
                    >
                        <View style={[styles.iconCircle, { backgroundColor: item.color + '15' }]}>
                            <Ionicons name={item.icon} size={26} color={item.color} />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.cardTitle}>{item.title}</Text>
                            <Text style={styles.cardDesc}>{item.desc}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                    </TouchableOpacity>
                ))}

                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={20} color="#64748b" />
                    <Text style={styles.infoText}>
                        Reports are updated in real-time as canteen staff collect fees.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { 
        paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, 
        backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center',
        borderBottomWidth: 1, borderBottomColor: '#f1f5f9' 
    },
    backBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 10, marginRight: 15 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
    scroll: { padding: 20 },
    sectionLabel: { fontSize: 12, fontWeight: '700', color: '#94a3b8', marginBottom: 15, letterSpacing: 1 },
    card: { 
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', 
        padding: 16, borderRadius: 18, marginBottom: 15,
        borderWidth: 1, borderColor: '#f1f5f9', elevation: 2,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10
    },
    iconCircle: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    textContainer: { flex: 1, marginLeft: 15 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
    cardDesc: { fontSize: 13, color: '#64748b', marginTop: 2 },
    infoBox: { 
        flexDirection: 'row', alignItems: 'center', marginTop: 10, 
        padding: 15, backgroundColor: '#f1f5f9', borderRadius: 12 
    },
    infoText: { flex: 1, marginLeft: 10, fontSize: 12, color: '#64748b', lineHeight: 18 }
});

export default ReportsMenuScreen;