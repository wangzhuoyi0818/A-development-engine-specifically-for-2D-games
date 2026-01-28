/**
 * 认证相关 Hooks
 */

import { useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';

/**
 * 认证 Hook
 * 提供认证状态和操作的便捷访问
 */
export function useAuth() {
  const {
    user,
    profile,
    session,
    isLoading,
    isAuthenticated,
    isInitialized,
    error,
    initialize,
    signIn,
    signUp,
    signOut,
    signInWithGitHub,
    resetPassword,
    updateProfile,
    refreshProfile,
    clearError,
  } = useAuthStore();

  // 初始化认证状态
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  return {
    // 状态
    user,
    profile,
    session,
    isLoading,
    isAuthenticated,
    isInitialized,
    error,

    // 操作
    signIn,
    signUp,
    signOut,
    signInWithGitHub,
    resetPassword,
    updateProfile,
    refreshProfile,
    clearError,
  };
}

/**
 * 需要认证的 Hook
 * 如果用户未登录，返回 null
 */
export function useRequireAuth() {
  const auth = useAuth();

  if (!auth.isAuthenticated || !auth.user) {
    return null;
  }

  return auth;
}

/**
 * 用户资料 Hook
 */
export function useUserProfile() {
  const { profile, isLoading, updateProfile, refreshProfile } = useAuthStore();

  const updateAvatar = useCallback(
    async (avatarUrl: string) => {
      await updateProfile({ avatar_url: avatarUrl });
    },
    [updateProfile]
  );

  const updateUsername = useCallback(
    async (username: string) => {
      await updateProfile({ username });
    },
    [updateProfile]
  );

  return {
    profile,
    isLoading,
    updateAvatar,
    updateUsername,
    refreshProfile,
  };
}

export default useAuth;
