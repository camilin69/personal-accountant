// store/user.store.ts - Versión Optimizada
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService, userService } from '../services';
import type { UserProfile, UpdateUserRequest, RegisterRequest } from '../services/types/user.types';

interface UserStore {
  accessToken: string | null;
  refreshToken: string | null;
  
  user: UserProfile | null;
  userLastFetch: number | null;
  userTTL: number;
  
  // Estado
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  
  // Acciones
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  initialize: () => Promise<void>;
  
  loadUserProfile: (forceRefresh?: boolean) => Promise<UserProfile | null>;
  updateProfile: (data: UpdateUserRequest) => Promise<UserProfile | null>;
  deleteAccount: () => Promise<void>;
  
  followUser: (userId: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
  
  clearCache: () => void;
  clearError: () => void;
}

const USER_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      userLastFetch: null,
      userTTL: USER_CACHE_TTL,
      isLoading: false,
      error: null,
      isAuthenticated: false,
      isInitialized: false,
      clearError: () => set({ error: null }),
      
      initialize: async () => {
        const accessToken = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (refreshToken) {
          set({ 
            accessToken, 
            refreshToken, 
            isAuthenticated: true,
            isInitialized: true 
          });
          
          // Cargar perfil en background
          get().loadUserProfile();
        } else {
          set({ isInitialized: true });
        }
      },
      
      loadUserProfile: async (forceRefresh = false) => {
        const { user, userLastFetch, userTTL, isAuthenticated, refreshSession } = get();
        
        if (!isAuthenticated) return null;
        
        // Usar caché de memoria si es válido
        if (!forceRefresh && user && userLastFetch && 
            (Date.now() - userLastFetch) < userTTL) {
          console.log('[UserStore] Using memory cached user');
          return user;
        }
        
        set({ isLoading: true });
        
        try {
          const profile = await userService.getMyProfile();
          set({ 
            user: profile, 
            userLastFetch: Date.now(),
            isLoading: false 
          });
          return profile;
        } catch (error: any) {
          if (error.response?.status === 401) {
            const refreshed = await refreshSession();
            if (refreshed) {
              const profile = await userService.getMyProfile();
              set({ user: profile, userLastFetch: Date.now(), isLoading: false });
              return profile;
            }
          }
          set({ isLoading: false, error: error.message });
          return null;
        }
      },
      
      updateProfile: async (data) => {
        set({ isLoading: true });
        
        try {
          await userService.updateMyProfile(data);
          const updatedProfile = await userService.getMyProfile();
          
          set({ 
            user: updatedProfile, 
            userLastFetch: Date.now(),
            isLoading: false 
          });
          
          return updatedProfile;
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },
      
      refreshSession: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return false;
        
        try {
          const response = await authService.refreshToken();
          if (response) {
            set({ 
              accessToken: response.token,
              refreshToken: response.refreshToken,
              isAuthenticated: true 
            });
            return true;
          }
        } catch (error) {
          console.error('Refresh failed:', error);
        }
        
        return false;
      },
      
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        
        try {
            const response = await authService.login({ email, password });
            
            // localStorage para tokens (lo necesita el interceptor)
            localStorage.setItem('access_token', response.token);
            localStorage.setItem('refresh_token', response.refreshToken);
            localStorage.setItem('client_id', response.clientId); // Solo aquí
            
            // Store para la UI
            set({
                accessToken: response.token,
                refreshToken: response.refreshToken,
                isAuthenticated: true,
                isLoading: false
                // NO guardar clientId aquí, ya está en user.clientId
            });
            
            await get().loadUserProfile(true);
        } catch (error: any) {
            set({ error: error.message, isLoading: false, isAuthenticated: false });
            throw error;
        }
    },

      
      register: async (data) => {
        set({ isLoading: true, error: null });
        
        try {
          await authService.register(data);
          await get().login(data.email, data.password);
          set({ isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },
      
      logout: async () => {
          await authService.logout();
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('client_id');
          set({
              accessToken: null, refreshToken: null, user: null,
              userLastFetch: null, isAuthenticated: false,
              isLoading: false, error: null
          });
      },
      
      deleteAccount: async () => {
        await userService.deleteMyAccount();
        await get().logout();
      },
      
      followUser: async (userId) => {
        await userService.followUser(userId);
        // Invalidar caché del perfil (ya que followers cambió)
        set({ userLastFetch: null });
      },
      
      unfollowUser: async (userId) => {
        await userService.unfollowUser(userId);
        set({ userLastFetch: null });
      },
      
      clearCache: () => {
        set({ userLastFetch: null });
      }
    }),
    {
      name: 'yung-accountant-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);