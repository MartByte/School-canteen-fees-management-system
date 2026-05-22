import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity
} from 'react-native';
import Config from '../config';

export default function VerifyResetCodeScreen({ route, navigation }) {
    const { userID } = route.params;  // coming from ForgotPasswordScreen
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handlePasswordReset = async () => {
        if (!code || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        try {
            const response = await fetch(`${Config.API_BASE_URL}/api/verify-reset-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: userID,
                    code,
                    newPassword,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert('Success', 'Password has been reset successfully');
                navigation.navigate('Login');
            } else {
                Alert.alert('Failed', data.message || 'Verification failed');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Server connection failed');
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <Text style={styles.title}>Reset Password</Text>

            <TextInput
                placeholder="Enter reset code"
                style={styles.input}
                value={code}
                onChangeText={setCode}
                keyboardType="numeric"
            />
            <TextInput
                placeholder="New password"
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
            />
            <TextInput
                placeholder="Confirm password"
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
            />

            <TouchableOpacity style={styles.button} onPress={handlePasswordReset}>
                <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 24,
        justifyContent: 'center',
        alignItems: 'center',
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
    button: {
        width: '100%',
        backgroundColor: '#000066',
        padding: 15,
        borderRadius: 25,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    backText: {
        marginTop: 10,
        color: '#000066',
    },
});
