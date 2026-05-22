import axios from 'axios';
import Config from '../config';
import SessionManager from './sessionManager';

const apiClient = axios.create({
    baseURL: Config.API_BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// REQUEST INTERCEPTOR: Automatic Token Attachment
apiClient.interceptors.request.use(
    async (config) => {
        const token = await SessionManager.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

const createApiResponse = (success, data, message, error = null) => ({
    success,
    data,
    message,
    error,
});

const handleApiError = (error) => {
    console.error('API Error Details:', error.response?.data || error.message);
    if (error.response) {
        const { status, data } = error.response;
        return createApiResponse(false, null, data?.message || `HTTP ${status}`, error);
    }
    return createApiResponse(false, null, 'Network error. Please check your connection.', error);
};

class ApiService {
    // ========== AUTHENTICATION ==========
    static async login(credentials) {
    try {
        const response = await apiClient.post('/api/login', credentials);
        
        // IMPORTANT: axios puts the server response inside 'response.data'
        // Your server sends { success: true, data: { user, token }, message: '...' }
        
        return {
            success: response.data.success,
            data: response.data.data, // This contains { user, token }
            message: response.data.message
        };
    } catch (error) {
        return handleApiError(error);
    }
}

    static async register(userData) {
        try {
            const response = await apiClient.post('/api/register', userData);
            return createApiResponse(true, response.data, 'Registration successful');
        } catch (error) { return handleApiError(error); }
    }

    static async forgotPassword(userId) {
        try {
            const response = await apiClient.post('/api/forgot-password', { id: userId });
            return createApiResponse(true, response.data, 'Reset code sent');
        } catch (error) { return handleApiError(error); }
    }

    static async verifyResetCode(userId, code, newPassword) {
        try {
            const response = await apiClient.post('/api/verify-reset-code', { id: userId, code, newPassword });
            return createApiResponse(true, response.data, 'Password reset successful');
        } catch (error) { return handleApiError(error); }
    }

    // ========== ADMIN & STUDENT MANAGEMENT ==========
    static async getAdminSummary() {
        try {
            const response = await apiClient.get('/admin/dashboard/admin-summary');
            return response.data;
        } catch (error) { throw error; }
    }

    static async getAllStudents(filters = {}) {
        try {
            const response = await apiClient.get('/admin/students/all', { params: filters });
            return createApiResponse(true, response.data, 'Students loaded');
        } catch (error) { return handleApiError(error); }
    }

    static async getStudentsByClass(className) {
        try {
            const response = await apiClient.get(`/admin/by-class/${className}`);
            return createApiResponse(true, response.data, 'Students loaded');
        } catch (error) { return handleApiError(error); }
    }

    static async getStudentsByTown(town) {
        try {
            const response = await apiClient.get(`/admin/by-town/${town}`);
            return createApiResponse(true, response.data, 'Students loaded');
        } catch (error) { return handleApiError(error); }
    }

    static async getStudentsByClassAndTown(filters) {
        try {
            const response = await apiClient.post('/api/students/by-class-town', filters);
            return response.data;
        } catch (error) { throw error; }
    }

    static async addStudent(studentData) {
        try {
            const response = await apiClient.post('/admin/students/add', studentData);
            return createApiResponse(true, response.data, 'Student added successfully');
        } catch (error) { return handleApiError(error); }
    }

    static async updateStudent(studentId, studentData) {
        try {
            const response = await apiClient.put(`/admin/students/edit/${studentId}`, studentData);
            return createApiResponse(true, response.data, 'Student updated successfully');
        } catch (error) { return handleApiError(error); }
    }

    static async deleteStudent(studentId) {
        try {
            const response = await apiClient.delete(`/admin/students/delete/${studentId}`);
            return createApiResponse(true, response.data, 'Student deleted successfully');
        } catch (error) { return handleApiError(error); }
    }

    // ========== CANTEEN MANAGEMENT ==========
    static async getCanteenCollect(town, date) {
        try {
            const response = await apiClient.get('/canteen/collect', { params: { town, date } });
            return createApiResponse(true, response.data, 'Canteen data fetched successfully');
        } catch (error) { return handleApiError(error); }
    }

    static async postCanteenCollect(payload) {
        try {
            const response = await apiClient.post('/canteen/collect', payload);
            return createApiResponse(true, response.data, 'Canteen data saved successfully');
        } catch (error) { return handleApiError(error); }
    }

    static async topupBalance(studentID, amount, collectedBy, town) {
        try {
            const response = await apiClient.post('/canteen/advance/topup', { studentID, amount, collectedBy, town });
            return response.data;
        } catch (error) { return handleApiError(error); }
    }

    static async getAllStudentsForTown(town) {
        try {
            const response = await apiClient.get(`/canteen/students/town/${town}`);
            const students = response.data?.data || response.data || [];
            return createApiResponse(true, students, 'Students loaded successfully');
        } catch (error) { return handleApiError(error); }
    }

    static async moveStudentToGroup(payload) {
        try {
            const response = await apiClient.post('/canteen/student/move-group', payload);
            return createApiResponse(true, response.data, 'Student moved successfully');
        } catch (error) { return handleApiError(error); }
    }

    static async setCreditFlag(studentID, active) {
        try {
            const response = await apiClient.post('/canteen/credit/flag', { studentID, active });
            return createApiResponse(true, response.data, 'Credit flag updated');
        } catch (error) { return handleApiError(error); }
    }

    static async setExemptFlag(studentID, active) {
        try {
            const response = await apiClient.post('/canteen/exempt/flag', { studentID, active });
            return createApiResponse(true, response.data, 'Exempt flag updated');
        } catch (error) { return handleApiError(error); }
    }


    static async getTownFee(town) {
        try {
            // encodeURIComponent handles towns with spaces like "Dantano Road"
            const response = await apiClient.get(`/canteen/town-fee/${encodeURIComponent(town)}`);
            
            // Return your standard success response
            return createApiResponse(true, { fee: response.data.fee }, 'Fee retrieved');
        } catch (error) {
            return handleApiError(error);
        }
    }


    // ========== TEACHER MANAGEMENT & INFO ==========
    static async getAllTeachers() {
        try {
            const response = await apiClient.get('/admin/all/teachers');
            return createApiResponse(true, { teachers: response.data }, 'Teachers loaded');
        } catch (error) { return handleApiError(error); }
    }

    static async addTeacher(teacherData) {
        try {
            const response = await apiClient.post('/admin/add-teacher', teacherData);
            return createApiResponse(true, response.data, 'Teacher added successfully');
        } catch (error) { return handleApiError(error); }
    }

    static async updateTeacher(teacherId, teacherData) {
        try {
            const response = await apiClient.put(`/admin/teachers/edit/${teacherId}`, teacherData);
            return createApiResponse(true, response.data, 'Teacher updated successfully');
        } catch (error) { return handleApiError(error); }
    }

    static async deleteTeacher(teacherId) {
        try {
            const response = await apiClient.delete(`/admin/delete-teacher/${teacherId}`);
            return createApiResponse(true, response.data, 'Teacher deleted successfully');
        } catch (error) { return handleApiError(error); }
    }

    static async getTeacherInfo(teacherId) {
        try {
            const response = await apiClient.get(`/api/teacher/${teacherId}/info`);
            return createApiResponse(true, response.data, 'Teacher info loaded');
        } catch (error) { return handleApiError(error); }
    }

    static async getTeacherStudents(teacherId) {
        try {
            const response = await apiClient.get(`/api/teacher/${teacherId}/students`);
            return createApiResponse(true, response.data, 'Teacher students loaded');
        } catch (error) { return handleApiError(error); }
    }

    // ========== ATTENDANCE ==========
    static async getStudentAttendance(date) {
        try {
            const response = await apiClient.get(`/api/student-attendance/${date}`);
            return createApiResponse(true, response.data, 'Attendance loaded');
        } catch (error) { return handleApiError(error); }
    }

    static async getStudentAttendanceByClass(className, date) {
        try {
            const finalClass = typeof className === 'object' ? className.className : className;
            const finalDate = typeof className === 'object' ? className.date : date;
            const response = await apiClient.get(`/api/student-attendance/${finalClass}/${finalDate}`);
            return createApiResponse(true, response.data, 'Success');
        } catch (error) { return handleApiError(error); }
    }

    static async getAttendanceRecordsOnly(className, date) {
        try {
            const finalDate = date instanceof Date ? date.toISOString().split('T')[0] : date;
            const response = await apiClient.get(`/api/student-attendance/${className}/${finalDate}`);
            return createApiResponse(true, response.data, 'Success');
        } catch (error) { return handleApiError(error); }
    }

    static async submitStudentAttendance(attendanceData) {
        try {
            const response = await apiClient.post('/api/student-attendance', { ...attendanceData, source: 'class' });
            return createApiResponse(true, response.data, 'Attendance submitted');
        } catch (error) { return handleApiError(error); }
    }

    static async getTeacherAttendance(date) {
        try {
            const response = await apiClient.get(`/admin/teachers/attendance`, { params: { date } });
            return createApiResponse(true, response.data, 'Teacher attendance loaded');
        } catch (error) { return handleApiError(error); }
    }

    static async getTeacherAttendanceRecords(teacherId, startDate, endDate) {
        try {
            const params = { start: startDate, end: endDate };
            const response = await apiClient.get(`/api/teacher/${teacherId}/attendance`, { params });
            return createApiResponse(true, response.data, 'Attendance records loaded');
        } catch (error) { return handleApiError(error); }
    }

    static async submitTeacherAttendance(attendanceData) {
        try {
            const response = await apiClient.post('/admin/teachers/attendance', attendanceData);
            return createApiResponse(true, response.data, 'Teacher attendance submitted');
        } catch (error) { return handleApiError(error); }
    }

    // ========== REPORTS ==========
    static async getDailyReport(date, town = '') {
        try {
            const response = await apiClient.get('/admin/reports/canteen/daily', {
                params: { date, town: (town === 'All Towns' || !town) ? '' : town }
            });
            return response.data; 
        } catch (error) { return handleApiError(error); }
    }

    static async getWeeklyReport(town, startDate, endDate) {
        try {
            const cleanTown = (town === 'All Towns' || !town) ? '' : town;
            const response = await apiClient.get('/admin/reports/weekly', { params: { town: cleanTown, startDate, endDate } });
            return response.data;
        } catch (error) { return handleApiError(error); }
    }

    static async getMonthlyReport(month, year) {
        try {
            const response = await apiClient.get('/admin/reports/canteen/monthly', { params: { month, year } });
            return response.data;
        } catch (error) { return handleApiError(error); }
    }

    static async getYearlyReport(year) {
        try {
            const response = await apiClient.get('/admin/reports/canteen/yearly', { params: { year } });
            return response.data;
        } catch (error) { return handleApiError(error); }
    }

    // ========== UTILITIES & FILES ==========
    // Add this to align with CollectCanteenScreen
    // ========== UTILITIES & FILES ==========
    
    // This matches what CollectCanteenScreen.js is looking for
    static async getAvailableTowns() {
        try {
            const response = await apiClient.get('/admin/towns');
            return createApiResponse(true, response.data, 'Towns loaded');
        } catch (error) { 
            return handleApiError(error); 
        }
    }

    static async getTowns() {
        try {
            const response = await apiClient.get('/admin/towns');
            return createApiResponse(true, response.data, 'Towns loaded');
        } catch (error) { return handleApiError(error); }
    }

    static async getClasses() {
        try {
            const response = await apiClient.get('/api/classes');
            return createApiResponse(true, response.data, 'Classes loaded');
        } catch (error) { return handleApiError(error); }
    }

    static async updateStudentPhoto(formData) {
        try {
            const response = await apiClient.post('/admin/students/update-photo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return { success: true, ...response.data };
        } catch (error) { return handleApiError(error); }
    }

    static async uploadProfilePicture(userId, imageData) {
        try {
            const formData = new FormData();
            formData.append('profilePic', imageData);
            const response = await apiClient.post(`/api/upload/profile-pic/${userId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return createApiResponse(true, response.data, 'Profile picture uploaded');
        } catch (error) { return handleApiError(error); }
    }


    // Inside ApiService.js
static async applyCanteenCorrection(payload) {
    try {
        const response = await apiClient.post('/api/canteen/apply-correction', payload);
        return response.data;
    } catch (error) {
        return { success: false, message: error.message };
    }
}
}

export default ApiService;