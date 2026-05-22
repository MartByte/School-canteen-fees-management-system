import Constants from 'expo-constants';

const { manifest2, manifest } = Constants;

const getHost = () => {
    // New SDK 54 way
    const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.hostUri;
    
    if (debuggerHost) {
        return debuggerHost.split(':')[0];
    }
    return 'localhost';
};

const LOCAL_URL = `http://${getHost()}:5000`; // Your local Node.js port
const REMOTE_URL = 'http://64.226.65.95';

// Use Remote URL by default, but you can toggle this back to LOCAL_URL during coding
const API_BASE_URL = REMOTE_URL; 

console.log('--- Network Config ---');
console.log('Mode:', __DEV__ ? 'Development' : 'Production');
console.log('Target API:', API_BASE_URL);

export default {
    API_BASE_URL,
};