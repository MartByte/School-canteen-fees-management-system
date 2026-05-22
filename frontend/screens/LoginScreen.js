import { useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons'; // Import icons
import ApiService from '../utils/apiService';
import SessionManager from '../utils/sessionManager';

export default function LoginScreen({ navigation, onLoginSuccess }) {
    const [userID, setUserID] = useState('');
    const [passwordHash, setPasswordHash] = useState('');
    const [loading, setLoading] = useState(false);
    
    // State to toggle password visibility
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const handleLogin = async () => {
        if (!userID || !passwordHash) {
            Alert.alert('Error', 'Please enter both ID and password');
            return;
        }

        setLoading(true);
        try {
            const result = await ApiService.login({ id: userID, passwordHash });

            if (result && result.success && result.data && result.data.user) {
                const { user, token } = result.data;
                
                const sessionSaved = await SessionManager.saveUserSession({
                    ...user,
                    token: token
                });

                if (sessionSaved && onLoginSuccess) {
                    onLoginSuccess(user);
                }
            } 
            else if (result?.data?.requireRegistration) {
                navigation.navigate('Register', {
                    prefill: {
                        id: result.data.id,
                        role: result.data.role,
                        Fname: result.data.fullName,
                    },
                });
            } 
            else {
                Alert.alert('Login Failed', result?.message || 'Invalid Credentials');
            }
        } catch (error) {
            console.error('Login error caught:', error);
            Alert.alert('Error', 'The server sent an invalid response.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <KeyboardAwareScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <Image
                        source={require('../assets/logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.schoolName}>VICTORY PREPARATORY SCHOOL</Text>
                </View>

                <Text style={styles.title}>Login</Text>

                <TextInput
                    placeholder="Enter your ID"
                    style={styles.input}
                    value={userID}
                    onChangeText={setUserID}
                    keyboardType="numeric"
                    editable={!loading}
                />

                {/* Password Input Wrapper */}
                <View style={styles.passwordWrapper}>
                    <TextInput
                        placeholder="Enter your password"
                        style={styles.passwordInput}
                        secureTextEntry={!isPasswordVisible} // Toggle based on state
                        value={passwordHash}
                        onChangeText={setPasswordHash}
                        editable={!loading}
                    />
                    <TouchableOpacity 
                        style={styles.eyeIcon} 
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                    >
                        <Ionicons 
                            name={isPasswordVisible ? "eye-off" : "eye"} 
                            size={24} 
                            color="#000066" 
                        />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity 
                    style={[styles.button, loading && styles.buttonDisabled]} 
                    onPress={handleLogin}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>
                        {loading ? 'LOGGING IN...' : 'LOGIN'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    onPress={() => navigation.navigate('ForgotPassword')}
                    disabled={loading}
                >
                    <Text style={[styles.forgotText, loading && styles.disabledText]}>
                        Forgot Password?
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    onPress={() => navigation.navigate('Register')}
                    disabled={loading}
                >
                    <Text style={[styles.registerText, loading && styles.disabledText]}>
                        First time here? Register
                    </Text>
                </TouchableOpacity>
            </KeyboardAwareScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#fff',
        padding: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logo: {
        width: 90,
        height: 90,
        marginBottom: 8,
    },
    schoolName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000066',
        textAlign: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#000066',
    },
    input: {
        width: '100%',
        backgroundColor: '#fff6e9',
        padding: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ccc',
        marginBottom: 12,
    },
    passwordWrapper: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff6e9',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ccc',
        marginBottom: 12,
        paddingRight: 15,
    },
    passwordInput: {
        flex: 1,
        padding: 12,
        borderRadius: 20,
    },
    eyeIcon: {
        marginLeft: 10,
    },
    button: {
        width: '100%',
        backgroundColor: '#000066',
        padding: 15,
        borderRadius: 25,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    registerText: {
        marginTop: 10,
        color: '#000066',
    },
    forgotText: {
        marginTop: 12,
        color: '#000066',
        textDecorationLine: 'underline',
    },
    disabledText: {
        opacity: 0.5,
    },
});