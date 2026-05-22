import SessionManager from './sessionManager';
import { Alert } from 'react-native';

class LogoutHandler {
    static async logout(navigation) {
        try {
            // Clear session data
            await SessionManager.clearSession();
            
            // Navigate to login screen and reset navigation stack
            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            });
        } catch (error) {
            console.error('Error during logout:', error);
            // Even if there's an error, still navigate to login
            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            });
        }
    }

    static async forceLogout(navigation, reason = 'Session expired') {
        try {
            await SessionManager.clearSession();
            
            // Show alert and navigate to login
            Alert.alert(
                'Session Expired',
                reason,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                            });
                        },
                    },
                ]
            );
        } catch (error) {
            console.error('Error during force logout:', error);
            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            });
        }
    }
}

export default LogoutHandler; 