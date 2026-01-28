/**
 * Supabase 版本管理服务
 */

import { supabase, isSupabaseConfigured } from './client';
import type {
  Version,
  CreateVersionRequest,
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
 * 创建版本快照
 */
export async function createVersion(
  request: CreateVersionRequest,
  projectData: unknown
): Promise<Version> {
  const client = checkSupabase();
  const user = (await client.auth.getUser()).data.user;
  if (!user) {
    throw new Error('请先登录');
  }

  // 获取当前最大版本号
  const { data: lastVersion } = await client
    .from('versions')
    .select('version_number')
    .eq('project_id', request.projectId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single();

  const nextVersionNumber = (lastVersion?.version_number || 0) + 1;

  const { data, error } = await client
    .from('versions')
    .insert({
      project_id: request.projectId,
      version_number: nextVersionNumber,
      name: request.name || `v${nextVersionNumber}`,
      description: request.description || null,
      data: projectData,
      created_by: user.id,
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
 * 获取项目的版本列表
 */
export async function listVersions(projectId: string): Promise<Version[]> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('versions')
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq('project_id', projectId)
    .order('version_number', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data.map((version) => ({
    ...version,
    profile: version.profile,
  }));
}

/**
 * 获取特定版本
 */
export async function getVersion(versionId: string): Promise<Version> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('versions')
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq('id', versionId)
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
 * 恢复到指定版本
 */
export async function restoreVersion(
  versionId: string
): Promise<{ projectId: string; data: unknown }> {
  const client = checkSupabase();
  const version = await getVersion(versionId);

  // 将版本数据恢复到项目
  const { data: project, error: projectError } = await client
    .from('projects')
    .update({
      data: version.data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', version.project_id)
    .select()
    .single();

  if (projectError) {
    throw new Error(projectError.message);
  }

  return {
    projectId: version.project_id,
    data: project.data,
  };
}

/**
 * 删除版本
 */
export async function deleteVersion(versionId: string): Promise<void> {
  const client = checkSupabase();
  const { error } = await client
    .from('versions')
    .delete()
    .eq('id', versionId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * 比较两个版本
 */
export function compareVersions(
  version1: Version,
  version2: Version
): {
  added: string[];
  removed: string[];
  modified: string[];
} {
  const data1 = version1.data as Record<string, unknown>;
  const data2 = version2.data as Record<string, unknown>;

  const added: string[] = [];
  const removed: string[] = [];
  const modified: string[] = [];

  // 简单比较项目级别的变化
  const keys1 = new Set(Object.keys(data1));
  const keys2 = new Set(Object.keys(data2));

  keys2.forEach((key) => {
    if (!keys1.has(key)) {
      added.push(key);
    }
  });

  keys1.forEach((key) => {
    if (!keys2.has(key)) {
      removed.push(key);
    }
  });

  keys1.forEach((key) => {
    if (keys2.has(key) && JSON.stringify(data1[key]) !== JSON.stringify(data2[key])) {
      modified.push(key);
    }
  });

  return { added, removed, modified };
}

/**
 * 自动创建版本快照（用于定时任务）
 */
export async function autoCreateVersion(
  projectId: string,
  projectData: unknown
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    return;
  }
  try {
    // 检查是否需要创建新版本（避免重复创建）
    const { data: lastVersion } = await supabase
      .from('versions')
      .select('data, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // 如果最新版本数据相同，则不创建
    if (lastVersion && JSON.stringify(lastVersion.data) === JSON.stringify(projectData)) {
      return;
    }

    await createVersion(
      {
        projectId,
        name: '自动保存',
        description: '系统自动创建的版本快照',
      },
      projectData
    );
  } catch (error) {
    console.error('自动创建版本失败:', error);
  }
}

/**
 * 获取版本统计信息
 */
export async function getVersionStats(projectId: string): Promise<{
  totalVersions: number;
  oldestVersion: Version | null;
  latestVersion: Version | null;
}> {
  const versions = await listVersions(projectId);

  return {
    totalVersions: versions.length,
    oldestVersion: versions[versions.length - 1] || null,
    latestVersion: versions[0] || null,
  };
}
