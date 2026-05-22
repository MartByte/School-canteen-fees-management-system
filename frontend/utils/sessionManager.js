import * as SecureStore from 'expo-secure-store';

const SESSION_KEYS = {
    USER_DATA: 'user_data',
    AUTH_TOKEN: 'auth_token', // Re-integrated for API security
    LAST_LOGIN: 'last_login',
    USER_ROLE: 'user_role',
    USER_ID: 'user_id',
};

class SessionManager {
    // Save user session data securely
    static async saveUserSession(userData) {
        try {
            // Check if token exists in the incoming data
            const token = userData.token || '';
            
            // We store the data. Using SecureStore is safer than AsyncStorage for tokens.
            await SecureStore.setItemAsync(SESSION_KEYS.USER_DATA, JSON.stringify(userData));
            await SecureStore.setItemAsync(SESSION_KEYS.AUTH_TOKEN, token);
            await SecureStore.setItemAsync(SESSION_KEYS.USER_ROLE, userData.role || '');
            await SecureStore.setItemAsync(SESSION_KEYS.USER_ID, String(userData.id || ''));
            await SecureStore.setItemAsync(SESSION_KEYS.LAST_LOGIN, new Date().toISOString());

            console.log('Session saved successfully with Token.');
            return true;
        } catch (error) {
            console.error('Error saving session:', error);
            return false;
        }
    }

    // Get user session data
    static async getUserSession() {
        try {
            const userDataStr = await SecureStore.getItemAsync(SESSION_KEYS.USER_DATA);
            const token = await SecureStore.getItemAsync(SESSION_KEYS.AUTH_TOKEN);
            const role = await SecureStore.getItemAsync(SESSION_KEYS.USER_ROLE);
            const id = await SecureStore.getItemAsync(SESSION_KEYS.USER_ID);
            const lastLogin = await SecureStore.getItemAsync(SESSION_KEYS.LAST_LOGIN);

            if (userDataStr) {
                const parsedUserData = JSON.parse(userDataStr);
                return {
                    userData: parsedUserData,
                    token: token,
                    role: role,
                    userId: id || parsedUserData.id,
                    lastLogin: lastLogin,
                };
            }
            return null;
        } catch (error) {
            console.error('Error getting session:', error);
            return null;
        }
    }

    static async getCurrentUser() {
        try {
            const session = await this.getUserSession();
            if (!session) return null;

            // Merging the main userData with the metadata (role, userId)
            // to ensure user.role and user.town are available at the top level.
            return {
                ...session.userData,
                id: session.userId,
                role: session.role,
                token: session.token
            };
        } catch (error) {
            console.error('Error in getCurrentUser:', error);
            return null;
        }
    }


    // Check if user is logged in & session is valid (7 days)
    static async isLoggedIn() {
        try {
            const session = await this.getUserSession();
            if (!session || !session.lastLogin) return false;

            const lastLogin = new Date(session.lastLogin);
            const now = new Date();
            const daysDiff = (now - lastLogin) / (1000 * 60 * 60 * 24);
            
            // Session is valid if it's less than 7 days old and token exists
            return daysDiff < 7 && !!session.token;
        } catch (error) {
            return false;
        }
    }

    // Clear user session (Logout)
    static async logout() {
        try {
            await SecureStore.deleteItemAsync(SESSION_KEYS.USER_DATA);
            await SecureStore.deleteItemAsync(SESSION_KEYS.AUTH_TOKEN);
            await SecureStore.deleteItemAsync(SESSION_KEYS.USER_ROLE);
            await SecureStore.deleteItemAsync(SESSION_KEYS.USER_ID);
            await SecureStore.deleteItemAsync(SESSION_KEYS.LAST_LOGIN);
            return true;
        } catch (error) {
            console.error('Logout error:', error);
            return false;
        }
    }

    // Helper to get only the Token for API headers
    static async getToken() {
        return await SecureStore.getItemAsync(SESSION_KEYS.AUTH_TOKEN);
    }
}

export default SessionManager;