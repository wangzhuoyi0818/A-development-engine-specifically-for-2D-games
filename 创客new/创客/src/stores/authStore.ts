/**
 * 认证状态管理 Store
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Session } from '@supabase/supabase-js';
import type { UserProfile, LoginCredentials, SignUpCredentials } from '../types/collaboration';
import {
  signInWithEmail,
  signUpWithEmail,
  signOut as supabaseSignOut,
  getSession,
  getCurrentUser,
  getUserProfile,
  updateUserProfile,
  onAuthStateChange,
  signInWithGitHub,
  resetPassword,
} from '../services/supabase';

interface AuthState {
  // 状态
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // 计算属性
  isAuthenticated: boolean;

  // 操作
  initialize: () => Promise<void>;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signUp: (credentials: SignUpCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<Pick<UserProfile, 'username' | 'avatar_url'>>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      profile: null,
      session: null,
      isLoading: false,
      isInitialized: false,
      error: null,
      isAuthenticated: false,

      // 初始化认证状态
      initialize: async () => {
        if (get().isInitialized) return;

        set({ isLoading: true, error: null });

        try {
          const session = await getSession();

          if (session) {
            const user = await getCurrentUser();
            let profile: UserProfile | null = null;

            if (user) {
              profile = await getUserProfile(user.id);
            }

            set({
              user,
              session,
              profile,
              isAuthenticated: !!user,
              isInitialized: true,
              isLoading: false,
            });
          } else {
            set({
              user: null,
              session: null,
              profile: null,
              isAuthenticated: false,
              isInitialized: true,
              isLoading: false,
            });
          }

          // 监听认证状态变化
          onAuthStateChange(async (event, sessionData) => {
            const session = sessionData as Session | null;
            if (event === 'SIGNED_IN' && session) {
              const user = session.user;
              let profile: UserProfile | null = null;

              if (user) {
                profile = await getUserProfile(user.id);
              }

              set({
                user,
                session: session as Session,
                profile,
                isAuthenticated: true,
              });
            } else if (event === 'SIGNED_OUT') {
              set({
                user: null,
                session: null,
                profile: null,
                isAuthenticated: false,
              });
            } else if (event === 'TOKEN_REFRESHED' && session) {
              set({ session: session as Session });
            }
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '初始化失败',
            isInitialized: true,
            isLoading: false,
          });
        }
      },

      // 邮箱密码登录
      signIn: async (credentials) => {
        set({ isLoading: true, error: null });

        try {
          const { user, session } = await signInWithEmail(credentials);

          let profile: UserProfile | null = null;
          if (user) {
            profile = await getUserProfile(user.id);
          }

          set({
            user,
            session,
            profile,
            isAuthenticated: !!user,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '登录失败',
            isLoading: false,
          });
          throw error;
        }
      },

      // 邮箱密码注册
      signUp: async (credentials) => {
        set({ isLoading: true, error: null });

        try {
          const { user, session } = await signUpWithEmail(credentials);

          let profile: UserProfile | null = null;
          if (user) {
            profile = await getUserProfile(user.id);
          }

          set({
            user,
            session,
            profile,
            isAuthenticated: !!user,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '注册失败',
            isLoading: false,
          });
          throw error;
        }
      },

      // 登出
      signOut: async () => {
        set({ isLoading: true, error: null });

        try {
          await supabaseSignOut();

          set({
            user: null,
            session: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '登出失败',
            isLoading: false,
          });
          throw error;
        }
      },

      // GitHub OAuth 登录
      signInWithGitHub: async () => {
        set({ isLoading: true, error: null });

        try {
          await signInWithGitHub();
          // OAuth 登录会重定向，实际的状态更新会在 onAuthStateChange 中处理
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'GitHub 登录失败',
            isLoading: false,
          });
          throw error;
        }
      },

      // 重置密码
      resetPassword: async (email) => {
        set({ isLoading: true, error: null });

        try {
          await resetPassword(email);
          set({ isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '发送重置邮件失败',
            isLoading: false,
          });
          throw error;
        }
      },

      // 更新用户资料
      updateProfile: async (updates) => {
        const { user } = get();
        if (!user) {
          throw new Error('请先登录');
        }

        set({ isLoading: true, error: null });

        try {
          const updatedProfile = await updateUserProfile(user.id, updates);
          set({
            profile: updatedProfile,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '更新资料失败',
            isLoading: false,
          });
          throw error;
        }
      },

      // 刷新用户资料
      refreshProfile: async () => {
        const { user } = get();
        if (!user) return;

        try {
          const profile = await getUserProfile(user.id);
          set({ profile });
        } catch (error) {
          console.error('刷新用户资料失败:', error);
        }
      },

      // 清除错误
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'miniprogram-auth',
      partialize: (state) => ({
        // 只持久化必要的状态
        isInitialized: state.isInitialized,
      }),
    }
  )
);

export default useAuthStore;
