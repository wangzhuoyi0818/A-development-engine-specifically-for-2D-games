/**
 * Supabase 项目服务
 */

import { supabase, isSupabaseConfigured } from './client';
import type { CloudProject, ProjectFilter } from '../../types/collaboration';
import type { MiniProgramProject } from '../../types';

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
 * 保存项目到云端
 */
export async function saveProject(
  project: MiniProgramProject,
  cloudId?: string
): Promise<CloudProject> {
  const client = checkSupabase();
  const user = (await client.auth.getUser()).data.user;
  if (!user) {
    throw new Error('请先登录');
  }

  if (cloudId) {
    // 更新已存在的云端项目
    const { data, error } = await client
      .from('projects')
      .update({
        name: project.name,
        description: project.description || null,
        data: project as unknown,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cloudId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // 增加版本号
    await client
      .from('projects')
      .update({ version: (data.version || 1) + 1 })
      .eq('id', cloudId);

    return data;
  } else {
    // 创建新的云端项目
    const { data, error } = await client
      .from('projects')
      .insert({
        owner_id: user.id,
        name: project.name,
        description: project.description || null,
        data: project as unknown,
        is_public: false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}

/**
 * 从云端加载项目
 */
export async function loadProject(projectId: string): Promise<CloudProject> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * 获取用户项目列表
 */
export async function listProjects(
  filter?: ProjectFilter
): Promise<CloudProject[]> {
  const client = checkSupabase();
  const user = (await client.auth.getUser()).data.user;
  if (!user) {
    throw new Error('请先登录');
  }

  let query = client.from('projects').select('*');

  // 根据过滤条件查询
  if (filter?.ownedByMe) {
    query = query.eq('owner_id', user.id);
  }

  if (filter?.isPublic) {
    query = query.eq('is_public', true);
  }

  if (filter?.search) {
    query = query.ilike('name', `%${filter.search}%`);
  }

  const { data, error } = await query.order('updated_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  // 如果需要获取分享给我的项目，需要额外查询协作者表
  if (filter?.sharedWithMe) {
    const { data: collabData, error: collabError } = await client
      .from('collaborators')
      .select('project_id')
      .eq('user_id', user.id);

    if (collabError) {
      throw new Error(collabError.message);
    }

    const sharedProjectIds = collabData.map((c) => c.project_id);
    if (sharedProjectIds.length > 0) {
      const { data: sharedProjects, error: sharedError } = await client
        .from('projects')
        .select('*')
        .in('id', sharedProjectIds)
        .order('updated_at', { ascending: false });

      if (sharedError) {
        throw new Error(sharedError.message);
      }

      // 合并结果，去重
      const allProjects = [...data, ...sharedProjects];
      const uniqueProjects = allProjects.filter(
        (project, index, self) =>
          index === self.findIndex((p) => p.id === project.id)
      );
      return uniqueProjects;
    }
  }

  return data;
}

/**
 * 删除云端项目
 */
export async function deleteProject(projectId: string): Promise<void> {
  const client = checkSupabase();
  const { error } = await client
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * 更新项目公开状态
 */
export async function updateProjectVisibility(
  projectId: string,
  isPublic: boolean
): Promise<void> {
  const client = checkSupabase();
  const { error } = await client
    .from('projects')
    .update({ is_public: isPublic })
    .eq('id', projectId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * 检查用户对项目的权限
 */
export async function checkProjectPermission(
  projectId: string
): Promise<'owner' | 'editor' | 'viewer' | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) {
    return null;
  }

  // 首先检查是否是项目所有者
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('owner_id, is_public')
    .eq('id', projectId)
    .single();

  if (projectError) {
    return null;
  }

  if (project.owner_id === user.id) {
    return 'owner';
  }

  // 检查是否是协作者
  const { data: collaborator, error: collabError } = await supabase
    .from('collaborators')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single();

  if (!collabError && collaborator) {
    return collaborator.role as 'editor' | 'viewer';
  }

  // 检查是否是公开项目
  if (project.is_public) {
    return 'viewer';
  }

  return null;
}

/**
 * 通过分享令牌获取项目
 */
export async function getProjectByShareToken(
  token: string
): Promise<{ project: CloudProject; permission: 'view' | 'edit' } | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }
  const { data: shareLink, error: linkError } = await supabase
    .from('share_links')
    .select('*')
    .eq('token', token)
    .single();

  if (linkError || !shareLink) {
    return null;
  }

  // 检查是否过期
  if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
    return null;
  }

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', shareLink.project_id)
    .single();

  if (projectError || !project) {
    return null;
  }

  return {
    project,
    permission: shareLink.permission as 'view' | 'edit',
  };
}
