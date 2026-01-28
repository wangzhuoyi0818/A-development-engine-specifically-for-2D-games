/**
 * Supabase 评论服务
 */

import { supabase, isSupabaseConfigured } from './client';
import type {
  Comment,
  CommentReply,
  AddCommentRequest,
  CommentPosition,
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
 * 获取项目评论列表
 */
export async function getComments(
  projectId: string,
  options?: {
    pageId?: string;
    componentId?: string;
    includeResolved?: boolean;
  }
): Promise<Comment[]> {
  const client = checkSupabase();
  let query = client
    .from('comments')
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (options?.pageId) {
    query = query.eq('page_id', options.pageId);
  }

  if (options?.componentId) {
    query = query.eq('component_id', options.componentId);
  }

  if (!options?.includeResolved) {
    query = query.eq('resolved', false);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  // 获取每条评论的回复
  const commentsWithReplies = await Promise.all(
    data.map(async (comment) => {
      const replies = await getCommentReplies(comment.id);
      return {
        ...comment,
        profile: comment.profile,
        replies,
      };
    })
  );

  return commentsWithReplies;
}

/**
 * 获取单条评论
 */
export async function getComment(commentId: string): Promise<Comment> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('comments')
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq('id', commentId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const replies = await getCommentReplies(commentId);

  return {
    ...data,
    profile: data.profile,
    replies,
  };
}

/**
 * 添加评论
 */
export async function addComment(request: AddCommentRequest): Promise<Comment> {
  const client = checkSupabase();
  const user = (await client.auth.getUser()).data.user;
  if (!user) {
    throw new Error('请先登录');
  }

  const { data, error } = await client
    .from('comments')
    .insert({
      project_id: request.projectId,
      page_id: request.pageId || null,
      component_id: request.componentId || null,
      user_id: user.id,
      content: request.content,
      position: request.position || null,
      resolved: false,
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
    replies: [],
  };
}

/**
 * 更新评论内容
 */
export async function updateComment(
  commentId: string,
  content: string
): Promise<Comment> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('comments')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', commentId)
    .select(`
      *,
      profile:profiles(*)
    `)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const replies = await getCommentReplies(commentId);

  return {
    ...data,
    profile: data.profile,
    replies,
  };
}

/**
 * 更新评论位置
 */
export async function updateCommentPosition(
  commentId: string,
  position: CommentPosition
): Promise<void> {
  const client = checkSupabase();
  const { error } = await client
    .from('comments')
    .update({ position })
    .eq('id', commentId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * 标记评论为已解决/未解决
 */
export async function resolveComment(
  commentId: string,
  resolved: boolean
): Promise<void> {
  const client = checkSupabase();
  const { error } = await client
    .from('comments')
    .update({ resolved })
    .eq('id', commentId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * 删除评论
 */
export async function deleteComment(commentId: string): Promise<void> {
  const client = checkSupabase();
  const { error } = await client
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * 获取评论回复列表
 */
async function getCommentReplies(commentId: string): Promise<CommentReply[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }
  const { data, error } = await supabase
    .from('comment_replies')
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq('comment_id', commentId)
    .order('created_at', { ascending: true });

  if (error) {
    return [];
  }

  return data.map((reply) => ({
    ...reply,
    profile: reply.profile,
  }));
}

/**
 * 添加评论回复
 */
export async function addCommentReply(
  commentId: string,
  content: string
): Promise<CommentReply> {
  const client = checkSupabase();
  const user = (await client.auth.getUser()).data.user;
  if (!user) {
    throw new Error('请先登录');
  }

  const { data, error } = await client
    .from('comment_replies')
    .insert({
      comment_id: commentId,
      user_id: user.id,
      content,
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
 * 删除评论回复
 */
export async function deleteCommentReply(replyId: string): Promise<void> {
  const client = checkSupabase();
  const { error } = await client
    .from('comment_replies')
    .delete()
    .eq('id', replyId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * 获取项目未解决的评论数量
 */
export async function getUnresolvedCommentCount(
  projectId: string
): Promise<number> {
  if (!isSupabaseConfigured || !supabase) {
    return 0;
  }
  const { count, error } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('resolved', false);

  if (error) {
    return 0;
  }

  return count || 0;
}

/**
 * 获取页面或组件的评论（用于画布上的标记）
 */
export async function getCommentsForCanvas(
  projectId: string,
  pageId?: string
): Promise<Comment[]> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('comments')
    .select('*')
    .eq('project_id', projectId)
    .eq('resolved', false)
    .not('position', 'is', null);

  if (error) {
    throw new Error(error.message);
  }

  // 如果指定了页面，过滤该页面的评论
  if (pageId) {
    return data.filter(
      (comment) => !comment.page_id || comment.page_id === pageId
    );
  }

  return data;
}
