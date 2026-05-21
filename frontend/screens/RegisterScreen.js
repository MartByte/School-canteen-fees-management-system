import React, { useState } from 'react';
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Config from '../config';

export default function RegisterScreen({ navigation }) {
    const [Fname, setFname] = useState('');
    const [Mname, setMname] = useState('');
    const [Lname, setLname] = useState('');
    const [phone, setPhone] = useState('');
    const [passwordHash, setPasswordHash] = useState('');
    const [userID, setUserID] = useState('');
    
    // Toggle state for password visibility
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const handleRegister = async () => {
        // 1. Validation: Ensure all required fields are filled
        if (!Fname || !Lname || !passwordHash || !phone || !userID) {
            Alert.alert('Error', 'Please fill in all required fields including your ID');
            return;
        }

        // 2. Format Phone Number (Ghana Format)
        let formattedPhone = phone;
        if (phone.startsWith('0') && phone.length === 10) {
            formattedPhone = '+233' + phone.slice(1);
        }

        // 3. Prepare the JSON data
        const registrationData = {
            Fname: Fname.trim(),
            Mname: Mname.trim(),
            Lname: Lname.trim(),
            passwordHash: passwordHash, // Backend will bcrypt this
            phone: formattedPhone,
            userID: userID.trim()
        };

        try {
            // 4. Send POST request as JSON
            const response = await fetch(`${Config.API_BASE_URL}/api/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(registrationData),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert('Success', data.message || 'Registration successful');
                navigation.navigate('Login');
            } else {
                // Catches 400 (Already registered) or 404 (Not pre-listed)
                Alert.alert('Error', data.message || 'Registration failed');
            }
        } catch (error) {
            console.error("Registration Error:", error);
            Alert.alert('Error', 'Connection failed. Please check your internet or server status.');
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.header}>
                        <TouchableOpacity 
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="arrow-back" size={24} color="#000066" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Teacher Registration</Text>
                        <Text style={styles.subtitle}>Enter your details to activate your account</Text>
                    </View>

                    <TextInput
                        placeholder="First Name*"
                        style={styles.input}
                        value={Fname}
                        onChangeText={setFname}
                        autoCapitalize="words"
                    />
                    <TextInput
                        placeholder="Middle Name"
                        style={styles.input}
                        value={Mname}
                        onChangeText={setMname}
                        autoCapitalize="words"
                    />
                    <TextInput
                        placeholder="Last Name*"
                        style={styles.input}
                        value={Lname}
                        onChangeText={setLname}
                        autoCapitalize="words"
                    />
                    <TextInput
                        placeholder="Phone Number*"
                        style={styles.input}
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={setPhone}
                    />

                    <View style={styles.passwordWrapper}>
                        <TextInput
                            placeholder="Create Password*"
                            style={styles.passwordInput}
                            secureTextEntry={!isPasswordVisible}
                            value={passwordHash}
                            onChangeText={setPasswordHash}
                        />
                        <TouchableOpacity 
                            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                            style={styles.eyeIcon}
                        >
                            <Ionicons 
                                name={isPasswordVisible ? "eye-off" : "eye"} 
                                size={22} 
                                color="#000066" 
                            />
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        placeholder="Staff / Teacher ID*"
                        style={styles.input}
                        keyboardType="numeric"
                        value={userID}
                        onChangeText={setUserID}
                    />

                    <TouchableOpacity style={styles.button} onPress={handleRegister}>
                        <Text style={styles.buttonText}>REGISTER NOW</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.loginText}>Already registered? <Text style={{fontWeight: 'bold'}}>Log in</Text></Text>
                    </TouchableOpacity>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#fff',
        alignItems: 'center',
        flexGrow: 1,
        justifyContent: 'center',
    },
    header: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 30,
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        top: 0,
        left: 0,
        padding: 8,
        zIndex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000066',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    input: {
        width: '100%',
        backgroundColor: '#fff6e9',
        padding: 15,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 15,
        fontSize: 16,
    },
    passwordWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        backgroundColor: '#fff6e9',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 15,
        paddingRight: 15,
    },
    passwordInput: {
        flex: 1,
        padding: 15,
        fontSize: 16,
    },
    eyeIcon: {
        padding: 5,
    },
    button: {
        width: '100%',
        backgroundColor: '#000066',
        padding: 18,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 10,
        elevation: 3, // Shadow for Android
        shadowColor: '#000', // Shadow for iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 1,
    },
    loginText: {
        marginTop: 20,
        color: '#000066',
        fontSize: 15,
    },
});