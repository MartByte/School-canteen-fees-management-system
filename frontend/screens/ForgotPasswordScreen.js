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

export default function ForgotPasswordScreen({ navigation }) {
    const [userID, setUserID] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    const handleResetRequest = async () => {
        if (!userID || !phoneNumber) {
            Alert.alert('Error', 'Please enter both ID and phone number');
            return;
        }

        try {
            const response = await fetch(`${Config.API_BASE_URL}/api/request-password-reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: userID, phone: phoneNumber }),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert('Success', 'Check your phone for a reset code');
                navigation.navigate('VerifyResetCode', { userID }); // ✅ Navigate to verification screen
            } else {
                Alert.alert('Failed', data.message || 'Password reset request failed');
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
            <Text style={styles.title}>Forgot Password</Text>

            <TextInput
                placeholder="Enter your ID"
                style={styles.input}
                value={userID}
                onChangeText={setUserID}
                keyboardType="numeric"
            />
            <TextInput
                placeholder="Enter your phone number"
                style={styles.input}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
            />

            <TouchableOpacity style={styles.button} onPress={handleResetRequest}>
                <Text style={styles.buttonText}>Request Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.backText}>Back to Login</Text>
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
