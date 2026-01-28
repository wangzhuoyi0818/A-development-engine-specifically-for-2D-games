/**
 * 协作功能相关类型定义
 */

// 用户资料
export interface UserProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
}

// 云端项目
export interface CloudProject {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  data: unknown; // 完整项目数据 (MiniProgramProject)
  version: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// 协作者角色
export type CollaboratorRole = 'owner' | 'editor' | 'viewer';

// 协作者
export interface Collaborator {
  id: string;
  project_id: string;
  user_id: string;
  role: CollaboratorRole;
  invited_at: string;
  // 关联的用户资料
  profile?: UserProfile;
}

// 分享链接权限
export type SharePermission = 'view' | 'edit';

// 分享链接
export interface ShareLink {
  id: string;
  project_id: string;
  token: string;
  permission: SharePermission;
  expires_at: string | null;
  created_at: string;
}

// 评论位置
export interface CommentPosition {
  x: number;
  y: number;
}

// 评论
export interface Comment {
  id: string;
  project_id: string;
  page_id: string | null;
  component_id: string | null;
  user_id: string;
  content: string;
  position: CommentPosition | null;
  resolved: boolean;
  created_at: string;
  updated_at: string;
  // 关联的用户资料
  profile?: UserProfile;
  // 回复列表
  replies?: CommentReply[];
}

// 评论回复
export interface CommentReply {
  id: string;
  comment_id: string;
  user_id: string;
  content: string;
  created_at: string;
  // 关联的用户资料
  profile?: UserProfile;
}

// 版本快照
export interface Version {
  id: string;
  project_id: string;
  version_number: number;
  name: string | null;
  description: string | null;
  data: unknown; // 项目数据快照
  created_by: string;
  created_at: string;
  // 关联的用户资料
  profile?: UserProfile;
}

// 光标位置
export interface CursorPosition {
  pageId: string;
  x: number;
  y: number;
}

// 用户在线状态
export interface UserPresence {
  id: string;
  project_id: string;
  user_id: string;
  cursor_position: CursorPosition | null;
  selected_component: string | null;
  last_seen: string;
  // 关联的用户资料
  profile?: UserProfile;
}

// 同步状态
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

// 同步错误
export interface SyncError {
  code: string;
  message: string;
  timestamp: number;
}

// 协作会话状态
export interface CollaborationSession {
  projectId: string;
  isActive: boolean;
  onlineUsers: UserPresence[];
  cursors: Map<string, CursorPosition>;
}

// 实时事件类型
export type RealtimeEventType =
  | 'project:update'
  | 'component:add'
  | 'component:update'
  | 'component:delete'
  | 'cursor:move'
  | 'selection:change'
  | 'comment:add'
  | 'comment:update'
  | 'comment:delete'
  | 'user:join'
  | 'user:leave';

// 实时事件载荷
export interface RealtimeEvent {
  type: RealtimeEventType;
  userId: string;
  timestamp: number;
  payload: unknown;
}

// 认证状态
export interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

// 登录凭证
export interface LoginCredentials {
  email: string;
  password: string;
}

// 注册凭证
export interface SignUpCredentials {
  email: string;
  password: string;
  username?: string;
}

// 项目列表过滤器
export interface ProjectFilter {
  ownedByMe?: boolean;
  sharedWithMe?: boolean;
  isPublic?: boolean;
  search?: string;
}

// 邀请协作者请求
export interface InviteCollaboratorRequest {
  projectId: string;
  email: string;
  role: CollaboratorRole;
}

// 创建分享链接请求
export interface CreateShareLinkRequest {
  projectId: string;
  permission: SharePermission;
  expiresInDays?: number;
}

// 创建版本请求
export interface CreateVersionRequest {
  projectId: string;
  name?: string;
  description?: string;
}

// 添加评论请求
export interface AddCommentRequest {
  projectId: string;
  pageId?: string;
  componentId?: string;
  content: string;
  position?: CommentPosition;
}

// 数据库表类型映射 (用于 Supabase 类型推导)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'created_at'>;
        Update: Partial<Pick<UserProfile, 'username' | 'avatar_url'>>;
        Relationships: [];
      };
      projects: {
        Row: CloudProject;
        Insert: Omit<CloudProject, 'id' | 'created_at' | 'updated_at' | 'version'>;
        Update: Partial<Omit<CloudProject, 'id' | 'owner_id' | 'created_at'>>;
        Relationships: [];
      };
      collaborators: {
        Row: Collaborator;
        Insert: Omit<Collaborator, 'id' | 'invited_at'>;
        Update: Partial<Pick<Collaborator, 'role'>>;
        Relationships: [];
      };
      share_links: {
        Row: ShareLink;
        Insert: Omit<ShareLink, 'id' | 'created_at'>;
        Update: Partial<Pick<ShareLink, 'permission' | 'expires_at'>>;
        Relationships: [];
      };
      comments: {
        Row: Comment;
        Insert: Omit<Comment, 'id' | 'created_at' | 'updated_at' | 'resolved'>;
        Update: Partial<Pick<Comment, 'content' | 'position' | 'resolved'>>;
        Relationships: [];
      };
      comment_replies: {
        Row: CommentReply;
        Insert: Omit<CommentReply, 'id' | 'created_at'>;
        Update: Partial<Pick<CommentReply, 'content'>>;
        Relationships: [];
      };
      versions: {
        Row: Version;
        Insert: Omit<Version, 'id' | 'created_at'>;
        Update: Record<string, never>;
        Relationships: [];
      };
      presence: {
        Row: UserPresence;
        Insert: Omit<UserPresence, 'id' | 'last_seen'>;
        Update: Partial<Pick<UserPresence, 'cursor_position' | 'selected_component'>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
