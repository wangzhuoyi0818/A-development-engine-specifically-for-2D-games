/**
 * Supabase 协作服务
 */

import { supabase, isSupabaseConfigured } from './client';
import type {
  Collaborator,
  CollaboratorRole,
  ShareLink,
  SharePermission,
  InviteCollaboratorRequest,
  CreateShareLinkRequest,
  UserPresence,
  CursorPosition,
} from '../../types/collaboration';

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
 * 获取项目协作者列表
 */
export async function getCollaborators(projectId: string): Promise<Collaborator[]> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('collaborators')
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq('project_id', projectId);

  if (error) {
    throw new Error(error.message);
  }

  return data.map((item) => ({
    ...item,
    profile: item.profile,
  }));
}

/**
 * 邀请协作者
 */
export async function inviteCollaborator(
  request: InviteCollaboratorRequest
): Promise<Collaborator> {
  const client = checkSupabase();
  // 首先通过邮箱查找用户
  // 注意：这需要一个自定义的数据库函数或者调整 profiles 表结构
  const { data: users, error: userError } = await client
    .from('profiles')
    .select('id')
    .eq('username', request.email)
    .limit(1);

  if (userError) {
    throw new Error(userError.message);
  }

  if (!users || users.length === 0) {
    throw new Error('未找到该用户');
  }

  const userId = users[0].id;

  // 检查是否已经是协作者
  const { data: existing } = await client
    .from('collaborators')
    .select('id')
    .eq('project_id', request.projectId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    throw new Error('该用户已经是协作者');
  }

  // 添加协作者
  const { data, error } = await client
    .from('collaborators')
    .insert({
      project_id: request.projectId,
      user_id: userId,
      role: request.role,
    })
    .select(`
      *,
      profile:profiles(*)
    `)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...data,
    profile: data.profile,
  };
}

/**
 * 更新协作者权限
 */
export async function updateCollaboratorRole(
  collaboratorId: string,
  role: CollaboratorRole
): Promise<void> {
  const client = checkSupabase();
  const { error } = await client
    .from('collaborators')
    .update({ role })
    .eq('id', collaboratorId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * 移除协作者
 */
export async function removeCollaborator(collaboratorId: string): Promise<void> {
  const client = checkSupabase();
  const { error } = await client
    .from('collaborators')
    .delete()
    .eq('id', collaboratorId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * 创建分享链接
 */
export async function createShareLink(
  request: CreateShareLinkRequest
): Promise<ShareLink> {
  const client = checkSupabase();
  // 生成随机令牌
  const token = generateToken();

  // 计算过期时间
  const expiresAt = request.expiresInDays
    ? new Date(Date.now() + request.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data, error } = await client
    .from('share_links')
    .insert({
      project_id: request.projectId,
      token,
      permission: request.permission,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * 获取项目的分享链接列表
 */
export async function getShareLinks(projectId: string): Promise<ShareLink[]> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('share_links')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * 删除分享链接
 */
export async function deleteShareLink(linkId: string): Promise<void> {
  const client = checkSupabase();
  const { error } = await client
    .from('share_links')
    .delete()
    .eq('id', linkId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * 更新分享链接权限
 */
export async function updateShareLinkPermission(
  linkId: string,
  permission: SharePermission
): Promise<void> {
  const client = checkSupabase();
  const { error } = await client
    .from('share_links')
    .update({ permission })
    .eq('id', linkId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * 更新用户在线状态
 */
export async function updatePresence(
  projectId: string,
  cursorPosition?: CursorPosition,
  selectedComponent?: string
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    return;
  }
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return;

  const { error } = await supabase
    .from('presence')
    .upsert({
      project_id: projectId,
      user_id: user.id,
      cursor_position: cursorPosition || null,
      selected_component: selectedComponent || null,
      last_seen: new Date().toISOString(),
    }, {
      onConflict: 'project_id,user_id',
    });

  if (error) {
    console.error('更新在线状态失败:', error.message);
  }
}

/**
 * 获取项目在线用户
 */
export async function getOnlineUsers(projectId: string): Promise<UserPresence[]> {
  const client = checkSupabase();
  // 只获取最近 30 秒内活跃的用户
  const threshold = new Date(Date.now() - 30 * 1000).toISOString();

  const { data, error } = await client
    .from('presence')
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq('project_id', projectId)
    .gte('last_seen', threshold);

  if (error) {
    throw new Error(error.message);
  }

  return data.map((item) => ({
    ...item,
    profile: item.profile,
  }));
}

/**
 * 离开项目（清除在线状态）
 */
export async function leaveProject(projectId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    return;
  }
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return;

  const { error } = await supabase
    .from('presence')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', user.id);

  if (error) {
    console.error('清除在线状态失败:', error.message);
  }
}

/**
 * 生成随机令牌
 */
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * 构建分享链接 URL
 */
export function buildShareUrl(token: string): string {
  return `${window.location.origin}/share/${token}`;
}
