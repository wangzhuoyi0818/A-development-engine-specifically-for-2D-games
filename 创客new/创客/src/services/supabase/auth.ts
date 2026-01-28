/**
 * Supabase 认证服务
 */

import { supabase, isSupabaseConfigured } from './client';
import type { UserProfile, LoginCredentials, SignUpCredentials } from '../../types/collaboration';

/**
 * 检查 Supabase 是否可用
 */
function checkSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase 未配置，请先配置环境变量');
  }
  return supabase;
}

/**
 * 邮箱密码登录
 */
export async function signInWithEmail(credentials: LoginCredentials) {
  const client = checkSupabase();
  const { data, error } = await client.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * 邮箱密码注册
 */
export async function signUpWithEmail(credentials: SignUpCredentials) {
  const client = checkSupabase();
  const { data, error } = await client.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      data: {
        username: credentials.username,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  // 创建用户资料
  if (data.user) {
    await createUserProfile({
      id: data.user.id,
      username: credentials.username || null,
      avatar_url: null,
    });
  }

  return data;
}

/**
 * 登出
 */
export async function signOut() {
  const client = checkSupabase();
  const { error } = await client.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}

/**
 * 获取当前会话
 */
export async function getSession() {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(error.message);
  }
  return data.session;
}

/**
 * 获取当前用户
 */
export async function getCurrentUser() {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    return null;
  }
  return data.user;
}

/**
 * 创建用户资料
 */
export async function createUserProfile(
  profile: Omit<UserProfile, 'created_at'>
) {
  const client = checkSupabase();
  const { data, error } = await client
    .from('profiles')
    .insert(profile)
    .select()
    .single();

  if (error) {
    // 如果资料已存在，忽略错误
    if (error.code === '23505') {
      return getUserProfile(profile.id);
    }
    throw new Error(error.message);
  }

  return data;
}

/**
 * 获取用户资料
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(error.message);
  }

  return data;
}

/**
 * 更新用户资料
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, 'username' | 'avatar_url'>>
) {
  const client = checkSupabase();
  const { data, error } = await client
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * 重置密码
 */
export async function resetPassword(email: string) {
  const client = checkSupabase();
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * 更新密码
 */
export async function updatePassword(newPassword: string) {
  const client = checkSupabase();
  const { error } = await client.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * 监听认证状态变化
 */
export function onAuthStateChange(
  callback: (event: string, session: unknown) => void
) {
  if (!isSupabaseConfigured || !supabase) {
    // 返回一个空的取消订阅对象
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
  return supabase.auth.onAuthStateChange(callback);
}

/**
 * OAuth 登录 (GitHub)
 */
export async function signInWithGitHub() {
  const client = checkSupabase();
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}/editor`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * 通过邮箱查找用户
 */
export async function findUserByEmail(email: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }
  // 注意: 这需要在 Supabase 中启用相应的 RLS 策略
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', email)
    .single();

  if (error) {
    return null;
  }

  return data;
}
