/**
 * Supabase 服务模块导出
 */

// 客户端
export { supabase } from './client';

// 认证服务
export {
  signInWithEmail,
  signUpWithEmail,
  signOut,
  getSession,
  getCurrentUser,
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  resetPassword,
  updatePassword,
  onAuthStateChange,
  signInWithGitHub,
  findUserByEmail,
} from './auth';

// 项目服务
export {
  saveProject,
  loadProject,
  listProjects,
  deleteProject,
  updateProjectVisibility,
  checkProjectPermission,
  getProjectByShareToken,
} from './projects';

// 协作服务
export {
  getCollaborators,
  inviteCollaborator,
  updateCollaboratorRole,
  removeCollaborator,
  createShareLink,
  getShareLinks,
  deleteShareLink,
  updateShareLinkPermission,
  updatePresence,
  getOnlineUsers,
  leaveProject,
  buildShareUrl,
} from './collaboration';

// 评论服务
export {
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
} from './comments';

// 版本管理服务
export {
  createVersion,
  listVersions,
  getVersion,
  restoreVersion,
  deleteVersion,
  compareVersions,
  autoCreateVersion,
  getVersionStats,
} from './versions';

// 实时同步服务
export {
  channelManager,
  subscribeToProject,
  unsubscribeFromProject,
  broadcastProjectUpdate,
  broadcastComponentChange,
  broadcastCursorMove,
  broadcastSelectionChange,
  trackUserPresence,
  untrackUserPresence,
  getOnlineUsers as getRealtimeOnlineUsers,
} from './realtime';

export type { RealtimeEventListener } from './realtime';
