/**
 * 评论相关 Hooks
 */

import { useEffect, useCallback } from 'react';
import { useCommentStore } from '../stores/commentStore';
import type { CommentPosition } from '../types/collaboration';

/**
 * 评论 Hook
 * 提供评论功能的便捷访问
 */
export function useComments(projectId: string | null) {
  const {
    comments,
    canvasComments,
    activeCommentId,
    isAddingComment,
    unresolvedCount,
    isLoading,
    filter,
    setProject,
    clearProject,
    loadComments,
    loadCanvasComments,
    startAddingComment,
    cancelAddingComment,
    addComment,
    updateComment,
    updateCommentPosition,
    resolveComment,
    deleteComment,
    addReply,
    deleteReply,
    setFilter,
    clearFilter,
    setActiveComment,
  } = useCommentStore();

  // 设置项目
  useEffect(() => {
    if (projectId) {
      setProject(projectId);
    }

    return () => {
      clearProject();
    };
  }, [projectId, setProject, clearProject]);

  // 添加评论的便捷方法
  const createComment = useCallback(
    async (
      content: string,
      pageId?: string,
      componentId?: string,
      position?: CommentPosition
    ) => {
      if (!projectId) {
        throw new Error('未设置项目');
      }
      return addComment(projectId, content, pageId, componentId, position);
    },
    [projectId, addComment]
  );

  // 按页面筛选
  const filterByPage = useCallback(
    (pageId: string | null) => {
      setFilter({ pageId });
    },
    [setFilter]
  );

  // 按组件筛选
  const filterByComponent = useCallback(
    (componentId: string | null) => {
      setFilter({ componentId });
    },
    [setFilter]
  );

  // 显示/隐藏已解决评论
  const toggleShowResolved = useCallback(() => {
    setFilter({ showResolved: !filter.showResolved });
  }, [filter.showResolved, setFilter]);

  return {
    // 状态
    comments,
    canvasComments,
    activeCommentId,
    isAddingComment,
    unresolvedCount,
    isLoading,
    filter,

    // 操作
    loadComments,
    loadCanvasComments,
    startAddingComment,
    cancelAddingComment,
    createComment,
    updateComment,
    updateCommentPosition,
    resolveComment,
    deleteComment,
    addReply,
    deleteReply,
    setActiveComment,

    // 筛选
    filterByPage,
    filterByComponent,
    toggleShowResolved,
    clearFilter,
  };
}

/**
 * 画布评论 Hook
 * 专门用于画布上的评论标记
 */
export function useCanvasComments(projectId: string | null, pageId?: string) {
  const {
    canvasComments,
    isAddingComment,
    startAddingComment,
    cancelAddingComment,
    addComment,
    updateCommentPosition,
    setActiveComment,
    activeCommentId,
  } = useCommentStore();

  // 按页面筛选评论
  const filteredComments = pageId
    ? canvasComments.filter(
        (c) => !c.page_id || c.page_id === pageId
      )
    : canvasComments;

  // 添加带位置的评论
  const addCommentAtPosition = useCallback(
    async (
      content: string,
      position: CommentPosition,
      componentId?: string
    ) => {
      if (!projectId) {
        throw new Error('未设置项目');
      }
      return addComment(projectId, content, pageId, componentId, position);
    },
    [projectId, pageId, addComment]
  );

  // 拖拽移动评论
  const moveComment = useCallback(
    async (commentId: string, position: CommentPosition) => {
      await updateCommentPosition(commentId, position);
    },
    [updateCommentPosition]
  );

  return {
    comments: filteredComments,
    isAddingComment,
    activeCommentId,
    startAddingComment,
    cancelAddingComment,
    addCommentAtPosition,
    moveComment,
    setActiveComment,
  };
}

/**
 * 组件评论 Hook
 * 获取特定组件的评论
 */
export function useComponentComments(
  projectId: string | null,
  componentId: string | null
) {
  const comments = useCommentStore((state) => state.comments);
  const addComment = useCommentStore((state) => state.addComment);

  // 筛选组件评论
  const componentComments = componentId
    ? comments.filter((c) => c.component_id === componentId)
    : [];

  // 添加组件评论
  const addComponentComment = useCallback(
    async (content: string) => {
      if (!projectId || !componentId) {
        throw new Error('未设置项目或组件');
      }
      return addComment(projectId, content, undefined, componentId);
    },
    [projectId, componentId, addComment]
  );

  return {
    comments: componentComments,
    addComment: addComponentComment,
    count: componentComments.length,
  };
}

export default useComments;
