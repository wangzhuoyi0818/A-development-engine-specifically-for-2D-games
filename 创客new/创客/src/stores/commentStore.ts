/**
 * 评论状态管理 Store
 */

import { create } from 'zustand';
import type {
  Comment,
  CommentPosition,
  AddCommentRequest,
} from '../types/collaboration';
import {
  getComments,
  getComment,
  addComment,
  updateComment,
  updateCommentPosition,
  resolveComment,
  deleteComment,
  addCommentReply,
  deleteCommentReply,
  getUnresolvedCommentCount,
  getCommentsForCanvas,
  subscribeToProject,
  unsubscribeFromProject,
} from '../services/supabase';
import type { RealtimeEvent } from '../types/collaboration';

interface CommentState {
  // 状态
  projectId: string | null;
  comments: Comment[];
  canvasComments: Comment[];
  activeCommentId: string | null;
  isAddingComment: boolean;
  unresolvedCount: number;
  isLoading: boolean;
  filter: {
    pageId: string | null;
    componentId: string | null;
    showResolved: boolean;
  };

  // 操作
  // 项目管理
  setProject: (projectId: string) => void;
  clearProject: () => void;

  // 加载评论
  loadComments: (projectId?: string) => Promise<void>;
  loadCanvasComments: (projectId?: string) => Promise<void>;
  refreshComment: (commentId: string) => Promise<void>;

  // 添加评论
  startAddingComment: () => void;
  cancelAddingComment: () => void;
  addComment: (
    projectId: string,
    content: string,
    pageId?: string,
    componentId?: string,
    position?: CommentPosition
  ) => Promise<Comment>;

  // 更新评论
  updateComment: (commentId: string, content: string) => Promise<void>;
  updateCommentPosition: (commentId: string, position: CommentPosition) => Promise<void>;

  // 解决/取消解决评论
  resolveComment: (commentId: string, resolved: boolean) => Promise<void>;

  // 删除评论
  deleteComment: (commentId: string) => Promise<void>;

  // 回复
  addReply: (commentId: string, content: string) => Promise<void>;
  deleteReply: (commentId: string, replyId: string) => Promise<void>;

  // 筛选
  setFilter: (filter: Partial<CommentState['filter']>) => void;
  clearFilter: () => void;

  // 激活评论
  setActiveComment: (commentId: string | null) => void;

  // 实时事件处理
  handleRealtimeEvent: (event: RealtimeEvent) => void;

  // 未解决评论数量
  refreshUnresolvedCount: () => Promise<void>;
}

export const useCommentStore = create<CommentState>()((set, get) => {
  // 实时订阅取消函数
  let unsubscribe: (() => void) | null = null;

  return {
    // 初始状态
    projectId: null,
    comments: [],
    canvasComments: [],
    activeCommentId: null,
    isAddingComment: false,
    unresolvedCount: 0,
    isLoading: false,
    filter: {
      pageId: null,
      componentId: null,
      showResolved: false,
    },

    // 设置当前项目
    setProject: async (projectId) => {
      const { clearProject } = get();

      // 如果项目相同，不做处理
      if (get().projectId === projectId) return;

      // 先清除之前的项目
      clearProject();

      set({ projectId });

      // 订阅实时事件
      unsubscribe = await subscribeToProject(projectId, get().handleRealtimeEvent);

      // 加载评论
      await get().loadComments(projectId);
      await get().loadCanvasComments(projectId);
      await get().refreshUnresolvedCount();
    },

    // 清除项目
    clearProject: () => {
      if (unsubscribe) {
        const { projectId } = get();
        if (projectId) {
          unsubscribeFromProject(projectId);
        }
        unsubscribe = null;
      }

      set({
        projectId: null,
        comments: [],
        canvasComments: [],
        activeCommentId: null,
        isAddingComment: false,
        unresolvedCount: 0,
        filter: {
          pageId: null,
          componentId: null,
          showResolved: false,
        },
      });
    },

    // 加载评论列表
    loadComments: async (projectId) => {
      const pid = projectId || get().projectId;
      if (!pid) return;

      set({ isLoading: true });

      try {
        const { filter } = get();
        const comments = await getComments(pid, {
          pageId: filter.pageId || undefined,
          componentId: filter.componentId || undefined,
          includeResolved: filter.showResolved,
        });

        set({ comments, isLoading: false });
      } catch (error) {
        console.error('加载评论失败:', error);
        set({ isLoading: false });
      }
    },

    // 加载画布评论（用于显示标记）
    loadCanvasComments: async (projectId) => {
      const pid = projectId || get().projectId;
      if (!pid) return;

      try {
        const { filter } = get();
        const canvasComments = await getCommentsForCanvas(
          pid,
          filter.pageId || undefined
        );

        set({ canvasComments });
      } catch (error) {
        console.error('加载画布评论失败:', error);
      }
    },

    // 刷新单条评论
    refreshComment: async (commentId) => {
      try {
        const comment = await getComment(commentId);

        set({
          comments: get().comments.map((c) =>
            c.id === commentId ? comment : c
          ),
        });
      } catch (error) {
        console.error('刷新评论失败:', error);
      }
    },

    // 开始添加评论
    startAddingComment: () => {
      set({ isAddingComment: true });
    },

    // 取消添加评论
    cancelAddingComment: () => {
      set({ isAddingComment: false });
    },

    // 添加评论
    addComment: async (projectId, content, pageId, componentId, position) => {
      const request: AddCommentRequest = {
        projectId,
        pageId,
        componentId,
        content,
        position,
      };

      const comment = await addComment(request);

      set({
        comments: [comment, ...get().comments],
        isAddingComment: false,
      });

      // 如果有位置，也添加到画布评论
      if (position) {
        set({
          canvasComments: [comment, ...get().canvasComments],
        });
      }

      await get().refreshUnresolvedCount();

      return comment;
    },

    // 更新评论内容
    updateComment: async (commentId, content) => {
      await updateComment(commentId, content);

      set({
        comments: get().comments.map((c) =>
          c.id === commentId ? { ...c, content } : c
        ),
      });
    },

    // 更新评论位置
    updateCommentPosition: async (commentId, position) => {
      await updateCommentPosition(commentId, position);

      set({
        comments: get().comments.map((c) =>
          c.id === commentId ? { ...c, position } : c
        ),
        canvasComments: get().canvasComments.map((c) =>
          c.id === commentId ? { ...c, position } : c
        ),
      });
    },

    // 解决/取消解决评论
    resolveComment: async (commentId, resolved) => {
      await resolveComment(commentId, resolved);

      const { comments, filter } = get();

      // 如果不显示已解决评论，从列表中移除
      if (resolved && !filter.showResolved) {
        set({
          comments: comments.filter((c) => c.id !== commentId),
        });
      } else {
        set({
          comments: comments.map((c) =>
            c.id === commentId ? { ...c, resolved } : c
          ),
        });
      }

      await get().refreshUnresolvedCount();
    },

    // 删除评论
    deleteComment: async (commentId) => {
      await deleteComment(commentId);

      set({
        comments: get().comments.filter((c) => c.id !== commentId),
        canvasComments: get().canvasComments.filter((c) => c.id !== commentId),
      });

      await get().refreshUnresolvedCount();
    },

    // 添加回复
    addReply: async (commentId, content) => {
      const reply = await addCommentReply(commentId, content);

      set({
        comments: get().comments.map((c) =>
          c.id === commentId
            ? { ...c, replies: [...(c.replies || []), reply] }
            : c
        ),
      });
    },

    // 删除回复
    deleteReply: async (commentId, replyId) => {
      await deleteCommentReply(replyId);

      set({
        comments: get().comments.map((c) =>
          c.id === commentId
            ? { ...c, replies: (c.replies || []).filter((r) => r.id !== replyId) }
            : c
        ),
      });
    },

    // 设置筛选条件
    setFilter: async (filter) => {
      set({
        filter: { ...get().filter, ...filter },
      });

      // 重新加载评论
      await get().loadComments();
      await get().loadCanvasComments();
    },

    // 清除筛选条件
    clearFilter: async () => {
      set({
        filter: {
          pageId: null,
          componentId: null,
          showResolved: false,
        },
      });

      await get().loadComments();
      await get().loadCanvasComments();
    },

    // 设置激活评论
    setActiveComment: (commentId) => {
      set({ activeCommentId: commentId });
    },

    // 处理实时事件
    handleRealtimeEvent: (event) => {
      const { projectId } = get();

      switch (event.type) {
        case 'comment:add': {
          // 新评论已添加，刷新列表
          get().loadComments(projectId || undefined);
          get().loadCanvasComments(projectId || undefined);
          get().refreshUnresolvedCount();
          break;
        }

        case 'comment:update': {
          // 评论已更新
          // @ts-ignore
          const commentId = event.payload?.old?.id;
          if (commentId) {
            get().refreshComment(commentId);
          }
          break;
        }

        case 'comment:delete': {
          // 评论已删除
          // @ts-ignore
          const commentId = event.payload?.old?.id;
          if (commentId) {
            set({
              comments: get().comments.filter((c) => c.id !== commentId),
              canvasComments: get().canvasComments.filter((c) => c.id !== commentId),
            });
            get().refreshUnresolvedCount();
          }
          break;
        }

        default:
          // 忽略其他事件
          break;
      }
    },

    // 刷新未解决评论数量
    refreshUnresolvedCount: async () => {
      const { projectId } = get();
      if (!projectId) return;

      try {
        const count = await getUnresolvedCommentCount(projectId);
        set({ unresolvedCount: count });
      } catch (error) {
        console.error('刷新未解决评论数量失败:', error);
      }
    },
  };
});

export default useCommentStore;
