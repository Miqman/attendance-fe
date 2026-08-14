import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useAuthStore } from './authStore';

// Resolves proper Host API URL for Web, Android Emulator (10.0.2.2), and Expo Go LAN IP
const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:3001';
  }

  // Try extracting LAN IP from Expo dev server hostUri (e.g. "192.168.1.5:8081")
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const lanIp = hostUri.split(':')[0];
    if (lanIp && lanIp !== 'localhost' && lanIp !== '127.0.0.1') {
      return `http://${lanIp}:3001`;
    }
  }

  // Fallback for standard Android Emulator loopback alias to host machine
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3001';
  }

  return 'http://localhost:3001';
};

export const BASE_URL = getBaseUrl();
console.log('📡 Connected API BASE_URL:', BASE_URL);

let isRefreshing = false;

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
): Promise<{ success?: boolean; error?: string; [key: string]: any }> {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401 && !isRetry && endpoint !== '/api/auth/refresh' && endpoint !== '/api/auth/login') {
        const storedRefreshToken = useAuthStore.getState().refreshToken;
        if (storedRefreshToken && !isRefreshing) {
          isRefreshing = true;
          const refreshRes = await api.refreshToken(storedRefreshToken);
          isRefreshing = false;

          if (refreshRes.success && refreshRes.token) {
            const user = refreshRes.user || useAuthStore.getState().user;
            if (user) {
              useAuthStore.getState().setAuth(refreshRes.token, user, refreshRes.refreshToken);
              return request(endpoint, options, true);
            }
          }
        }
        useAuthStore.getState().logout();
      } else if (res.status === 401) {
        useAuthStore.getState().logout();
      }
      return {
        success: false,
        error: data.error || data.message || `HTTP Error ${res.status}`,
        isExpired: res.status === 401,
        ...data,
      };
    }
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Gagal terhubung ke server API',
    };
  }
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  refreshToken: (refreshToken: string) =>
    request('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),

  sendOtp: (email: string) =>
    request('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyOtp: (email: string, otp_code: string) =>
    request('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp_code }),
    }),

  // Profile
  getProfile: () => request('/api/profile'),

  updateProfile: (data: { biometric_enabled?: number | boolean }) =>
    request('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Attendance
  submitAttendance: (data: {
    type: 'in' | 'out';
    latitude: number;
    longitude: number;
    photo_base64: string;
  }) =>
    request('/api/attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAttendanceHistory: () => request('/api/attendance/history'),

  getAttendanceDetail: (id: string) => request(`/api/attendance/${id}`),

  getAttendanceReport: () => request('/api/attendance/report'),

  // Requests
  submitRequest: (data: {
    type: 'cuti' | 'izin' | 'overtime';
    start_date: string;
    end_date: string;
    reason: string;
  }) =>
    request('/api/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
