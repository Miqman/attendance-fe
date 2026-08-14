import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';

export interface UserProfile {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  role: string;
  department: string;
  job_title: string;
  office_name: string;
  avatar_url?: string;
  office_latitude: number;
  office_longitude: number;
  geofence_radius: number;
  is_geofence_required?: number;
  biometric_enabled: number;
  is_active: number;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  lastUserEmail: string | null;
  biometricRefreshToken: string | null;
  isHydrated: boolean;
  setAuth: (token: string, user: UserProfile, refreshToken?: string) => void;
  setUser: (user: UserProfile) => void;
  logout: () => void;
  setHydrated: (hydrated: boolean) => void;
}

// Cross-platform persistent storage adapter (Web & Native)
const customStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(name) : null;
    }
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      return await AsyncStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.setItem(name, value);
      return;
    }
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(name, value);
    } catch {}
  },
  removeItem: async (name: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(name);
      return;
    }
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem(name);
    } catch {}
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      lastUserEmail: 'dame9401@gmail.com',
      biometricRefreshToken: null,
      isHydrated: false,
      setAuth: (token, user, refreshToken) =>
        set((state) => ({
          token,
          user,
          refreshToken: refreshToken ?? state.refreshToken,
          lastUserEmail: user.email || state.lastUserEmail,
          biometricRefreshToken: refreshToken ?? state.biometricRefreshToken ?? state.refreshToken,
        })),
      setUser: (user) => set((state) => ({ user, lastUserEmail: user.email || state.lastUserEmail })),
      logout: () => set({ token: null, refreshToken: null, user: null }),
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
    }),
    {
      name: 'attendance-auth-session',
      storage: createJSONStorage(() => customStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
