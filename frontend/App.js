// App.js
import { Ionicons } from '@expo/vector-icons';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View , Alert} from 'react-native';
import 'react-native-gesture-handler';
import { CommonActions } from '@react-navigation/native';

// Screens
import AddStudentScreen from './screens/AddStudentScreen';
import AddTeacherScreen from './screens/AddTeacherScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import AllStudentsScreen from './screens/AllStudentsScreen';
import AllTeachersScreen from './screens/AllTeachersScreen';
import CollectCanteenScreen from './screens/CollectCanteenScreen';
import DailyCanteenScreen from './screens/DailyCanteenScreen';
import EditCanteenScreen from './screens/EditCanteenScreen';
import EditStudentScreen from './screens/EditStudentScreen';
import EditTeacherScreen from './screens/EditTeachersScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import LoginScreen from './screens/LoginScreen';
import MarkAttendanceScreen from './screens/MarkAttendanceScreen';
import MonthlyCanteenReportScreen from './screens/MonthlyCanteenReportScreen';
import RegisterScreen from './screens/RegisterScreen';
import SelectClassScreen from './screens/SelectClassScreen';
import StudentsByClassScreen from './screens/StudentsByClassScreen';
import StudentsByTownScreen from './screens/StudentsByTownScreen';
import TeacherAttendanceScreen from './screens/TeacherAttendanceScreen';
import TeacherHomeScreen from './screens/TeacherHomeScreen';
import TeacherClassRecordsScreen from './screens/TeacherClassRecordsScreen';
import VerifyResetCodeScreen from './screens/VerifyResetCodeScreen';
import WeeklyCanteenReportScreen from './screens/WeeklyCanteenReportScreen';
import YearlyCanteenReportScreen from './screens/YearlyCanteenReportScreen';
import AttendanceGapListScreen from './screens/AttendanceGapListScreen';
import FeesBalancesScreen from './screens/FeesBalancesScreen';
import ReportsMenuScreen from './screens/ReportsMenuScreen';

// Utils
import SessionManager from './utils/sessionManager';
import eventStack from './utils/events';


const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// ========== MAIN APP COMPONENT ==========
export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const isValid = await SessionManager.isLoggedIn();
      if (isValid) {
        const session = await SessionManager.getUserSession();
        if (session) {
          setUserId(session.userId);
          setUserRole(session.role);
          setIsLoggedIn(true);
        }
      }
    } catch (error) {
      console.error('Session Check Error:', error);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    // 1. Check status once on start
    checkLoginStatus();
  
    // 2. Listen for the logout "shout"
    const logoutSubscription = eventStack.addListener('forceLogout', () => {
      handleLogout(); 
    });
  
    return () => {
      logoutSubscription.remove();
    };
  }, []);

  const handleLoginSuccess = (userData) => {
    setUserId(userData.id);
    setUserRole(userData.role);
    setIsLoggedIn(true);
  };

  // The Master Logout Function
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: 'destructive',
        onPress: async () => {
          try {
            await SessionManager.logout(); // 1. Clear storage
            setIsLoggedIn(false);          // 2. Update state (Navigates to Login automatically)
            setUserRole(null);
            setUserId(null);
          } catch (error) {
            console.error("Logout error", error);
          }
        }
      }
    ]);
  };


  // ========== ADMIN DRAWER COMPONENT ==========
function AdminDrawer() {
  return (
    <Drawer.Navigator
      initialRouteName="AdminDashboard"
      screenOptions={{
        headerStyle: { backgroundColor: '#000066' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        drawerStyle: { backgroundColor: '#fff6e9', width: 280 },
        drawerActiveTintColor: '#000066',
        drawerInactiveTintColor: '#6B7280',
      }}
    >
      <Drawer.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{
          title: 'Dashboard',
          drawerIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="StudentsByClass"
        component={StudentsByClassScreen}
        options={{
          title: 'Students by Class',
          drawerIcon: ({ color, size }) => <Ionicons name="school" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="StudentsByTown"
        component={StudentsByTownScreen}
        options={{
          title: 'Students by Town',
          drawerIcon: ({ color, size }) => <Ionicons name="location" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="AllStudents"
        component={AllStudentsScreen}
        options={{
          title: 'All Students',
          drawerIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="AllTeachers"
        component={AllTeachersScreen}
        options={{
          title: 'All Teachers',
          drawerIcon: ({ color, size }) => <Ionicons name="people-circle" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="TeacherAttendance"
        component={TeacherAttendanceScreen}
        options={{
          title: 'Teacher Attendance',
          drawerIcon: ({ color, size }) => <Ionicons name="checkmark-circle" size={size} color={color} />,
        }}
      />

      <Drawer.Screen
        name="MarkStudentsAttendance"
        component={SelectClassScreen}
        options={{
          title: 'Students Attendance',
          drawerIcon: ({ color, size }) => <Ionicons name="checkmark-circle" size={size} color={color} />,
        }}
      />
    </Drawer.Navigator>
  );
}


  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff6e9' }}>
        <ActivityIndicator size="large" color="#000066" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn ? (
          // AUTH STACK
          <>
            <Stack.Screen name="Login">
              {(props) => <LoginScreen {...props} onLoginSuccess={handleLoginSuccess} />}
            </Stack.Screen>
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="VerifyResetCode" component={VerifyResetCodeScreen} />
          </>
        ) : (
          // PROTECTED STACK
          <>
            {userRole === 'admin' ? (
              <Stack.Screen name="Admin" component={AdminDrawer} />
            ) : (
              <Stack.Screen name="TeacherHome">
                {(props) => <TeacherHomeScreen {...props} onLogout={handleLogout} teacherID={userId} />}
              </Stack.Screen>
            )}

            {/* Shared Screens */}
            <Stack.Screen name="AddStudent" component={AddStudentScreen} />
            <Stack.Screen name="EditStudent" component={EditStudentScreen} />
            <Stack.Screen name="AddTeacher" component={AddTeacherScreen} />
            <Stack.Screen name="EditTeacher" component={EditTeacherScreen} />
            <Stack.Screen name="MarkAttendance" component={MarkAttendanceScreen} />
            <Stack.Screen name="CollectCanteen" component={CollectCanteenScreen} />
            <Stack.Screen name="TeacherClassRecords" component={TeacherClassRecordsScreen} />
            <Stack.Screen name="SelectClass" component={SelectClassScreen} />
            <Stack.Screen name="Reports" component={ReportsMenuScreen} />
            <Stack.Screen name="AttendanceGapList" component={AttendanceGapListScreen} />
            <Stack.Screen name="FeesBalances" component={FeesBalancesScreen} />
            <Stack.Screen name="DailyCanteen" component={DailyCanteenScreen} />
            <Stack.Screen name="WeeklyCanteenReport" component={WeeklyCanteenReportScreen} />
            <Stack.Screen name="MonthlyCanteenReport" component={MonthlyCanteenReportScreen} />
            <Stack.Screen name="YearlyCanteenReport" component={YearlyCanteenReportScreen} />
            <Stack.Screen name="EditCanteen" component={EditCanteenScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}