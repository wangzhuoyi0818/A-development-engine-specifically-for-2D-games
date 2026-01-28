/**
 * Supabase 实时同步服务
 */

import { supabase, isSupabaseConfigured } from './client';
import type { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js';
import type { RealtimeEvent, RealtimeEventType } from '../../types/collaboration';

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
 * 实时事件监听器类型
 */
export type RealtimeEventListener = (event: RealtimeEvent) => void;

/**
 * 频道管理器
 */
class ChannelManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private listeners: Map<string, Set<RealtimeEventListener>> = new Map();

  /**
   * 获取或创建项目频道
   */
  getChannel(projectId: string): RealtimeChannel {
    const client = checkSupabase();
    let channel = this.channels.get(projectId);

    if (!channel) {
      channel = client.channel(`project:${projectId}`, {
        config: {
          presence: {
            key: 'user',
          },
        },
      });

      // 设置广播监听
      channel.on('broadcast', { event: '*' }, (payload) => {
        this.handleBroadcast(payload);
      });

      // 设置 Presence 状态变化监听
      channel.on('presence', { event: 'sync' }, () => {
        this.handlePresenceSync(projectId);
      });

      channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
        this.handlePresenceJoin(projectId, key, newPresences);
      });

      channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        this.handlePresenceLeave(projectId, key, leftPresences);
      });

      // 订阅数据库变更
      channel
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${projectId}`,
        }, (payload) => {
          this.handleDatabaseChange(projectId, 'project', payload);
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'components',
        }, (payload) => {
          this.handleDatabaseChange(projectId, 'component', payload);
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `project_id=eq.${projectId}`,
        }, (payload) => {
          this.handleDatabaseChange(projectId, 'comment', payload);
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'presence',
          filter: `project_id=eq.${projectId}`,
        }, (payload) => {
          this.handlePresenceChange(projectId, payload);
        });

      this.channels.set(projectId, channel);
    }

    return channel;
  }

  /**
   * 订阅项目
   */
  async subscribe(projectId: string): Promise<void> {
    const channel = this.getChannel(projectId);
    if (channel.state !== 'joined') {
      await channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`已订阅项目: ${projectId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`订阅项目失败: ${projectId}`);
        }
      });
    }
  }

  /**
   * 取消订阅项目
   */
  async unsubscribe(projectId: string): Promise<void> {
    const channel = this.channels.get(projectId);
    if (channel && isSupabaseConfigured && supabase) {
      await supabase.removeChannel(channel);
      this.channels.delete(projectId);
      this.listeners.delete(projectId);
    }
  }

  /**
   * 添加事件监听器
   */
  addListener(projectId: string, listener: RealtimeEventListener): () => void {
    if (!this.listeners.has(projectId)) {
      this.listeners.set(projectId, new Set());
    }
    this.listeners.get(projectId)!.add(listener);

    // 返回取消订阅函数
    return () => {
      this.removeListener(projectId, listener);
    };
  }

  /**
   * 移除事件监听器
   */
  removeListener(projectId: string, listener: RealtimeEventListener): void {
    const listeners = this.listeners.get(projectId);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * 广播事件到项目频道
   */
  async broadcast(projectId: string, eventType: RealtimeEventType, payload: unknown): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      return;
    }
    const channel = this.getChannel(projectId);

    const event: RealtimeEvent = {
      type: eventType,
      userId: (await supabase.auth.getUser()).data.user?.id || '',
      timestamp: Date.now(),
      payload,
    };

    await channel.send({
      type: 'broadcast',
      event: eventType,
      payload: event,
    });
  }

  /**
   * 获取当前在线用户
   */
  getOnlineUsers(projectId: string): RealtimePresenceState {
    const channel = this.channels.get(projectId);
    const state = channel?.presenceState?.();
    return (state || {}) as RealtimePresenceState;
  }

  /**
   * 处理广播消息
   */
  private handleBroadcast(payload: unknown): void {
    // 解析并分发广播事件
    if (payload && typeof payload === 'object' && 'payload' in payload) {
      const event = payload.payload as RealtimeEvent;
      // 从频道名提取项目 ID
      // @ts-ignore
      const projectId = payload.ref?.channel?.split(':')[1];
      if (projectId) {
        this.notifyListeners(projectId, event);
      }
    }
  }

  /**
   * 处理数据库变更
   */
  private handleDatabaseChange(
    projectId: string,
    table: string,
    payload: unknown
  ): void {
    // @ts-ignore
    const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';

    let realtimeType: RealtimeEventType;
    switch (table) {
      case 'project':
        realtimeType = 'project:update';
        break;
      case 'component':
        // @ts-ignore
        switch (eventType) {
          case 'INSERT':
            realtimeType = 'component:add';
            break;
          case 'UPDATE':
            realtimeType = 'component:update';
            break;
          case 'DELETE':
            realtimeType = 'component:delete';
            break;
          default:
            return;
        }
        break;
      case 'comment':
        // @ts-ignore
        switch (eventType) {
          case 'INSERT':
            realtimeType = 'comment:add';
            break;
          case 'UPDATE':
            realtimeType = 'comment:update';
            break;
          case 'DELETE':
            realtimeType = 'comment:delete';
            break;
          default:
            return;
        }
        break;
      default:
        return;
    }

    const event: RealtimeEvent = {
      type: realtimeType,
      userId: '',
      timestamp: Date.now(),
      payload,
    };

    this.notifyListeners(projectId, event);
  }

  /**
   * 处理在线状态同步
   */
  private handlePresenceSync(projectId: string): void {
    const presenceState = this.getOnlineUsers(projectId);
    console.log(`项目 ${projectId} 在线用户同步:`, presenceState);
  }

  /**
   * 处理用户加入
   */
  private handlePresenceJoin(
    projectId: string,
    key: string,
    newPresences: unknown
  ): void {
    const event: RealtimeEvent = {
      type: 'user:join',
      userId: key,
      timestamp: Date.now(),
      payload: newPresences,
    };

    this.notifyListeners(projectId, event);
  }

  /**
   * 处理用户离开
   */
  private handlePresenceLeave(
    projectId: string,
    key: string,
    leftPresences: unknown
  ): void {
    const event: RealtimeEvent = {
      type: 'user:leave',
      userId: key,
      timestamp: Date.now(),
      payload: leftPresences,
    };

    this.notifyListeners(projectId, event);
  }

  /**
   * 处理在线状态变更
   */
  private handlePresenceChange(_projectId: string, payload: unknown): void {
    // presence 表的变更也会触发在线用户列表更新
    console.log('用户状态变更:', payload);
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(projectId: string, event: RealtimeEvent): void {
    const listeners = this.listeners.get(projectId);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          console.error('事件监听器错误:', error);
        }
      });
    }
  }

  /**
   * 更新当前用户的状态
   */
  async trackPresence(projectId: string, state: Record<string, unknown>): Promise<void> {
    const channel = this.getChannel(projectId);
    await channel.track(state);
  }

  /**
   * 取消追踪当前用户状态
   */
  async untrackPresence(projectId: string): Promise<void> {
    const channel = this.getChannel(projectId);
    await channel.untrack();
  }
}

// 导出单例
export const channelManager = new ChannelManager();

/**
 * 订阅项目变更
 */
export async function subscribeToProject(
  projectId: string,
  listener: RealtimeEventListener
): Promise<() => void> {
  if (!isSupabaseConfigured || !supabase) {
    // 返回空的取消订阅函数
    return () => {};
  }
  await channelManager.subscribe(projectId);
  return channelManager.addListener(projectId, listener);
}

/**
 * 取消订阅项目
 */
export async function unsubscribeFromProject(projectId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    return;
  }
  await channelManager.unsubscribe(projectId);
}

/**
 * 广播项目更新
 */
export async function broadcastProjectUpdate(
  projectId: string,
  data: unknown
): Promise<void> {
  await channelManager.broadcast(projectId, 'project:update', data);
}

/**
 * 广播组件变更
 */
export async function broadcastComponentChange(
  projectId: string,
  changeType: 'add' | 'update' | 'delete',
  component: unknown
): Promise<void> {
  const eventType = `component:${changeType}` as RealtimeEventType;
  await channelManager.broadcast(projectId, eventType, component);
}

/**
 * 广播光标移动
 */
export async function broadcastCursorMove(
  projectId: string,
  cursorPosition: { pageId: string; x: number; y: number }
): Promise<void> {
  await channelManager.broadcast(projectId, 'cursor:move', cursorPosition);
}

/**
 * 广播选中状态变化
 */
export async function broadcastSelectionChange(
  projectId: string,
  componentId: string | null
): Promise<void> {
  await channelManager.broadcast(projectId, 'selection:change', { componentId });
}

/**
 * 追踪用户在线状态
 */
export async function trackUserPresence(
  projectId: string,
  presence: {
    cursor?: { pageId: string; x: number; y: number };
    selectedComponent?: string | null;
  }
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    return;
  }
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return;

  await channelManager.trackPresence(projectId, {
    userId: user.id,
    ...presence,
  });
}

/**
 * 取消追踪用户在线状态
 */
export async function untrackUserPresence(projectId: string): Promise<void> {
  await channelManager.untrackPresence(projectId);
}

/**
 * 获取项目在线用户
 */
export function getOnlineUsers(projectId: string): RealtimePresenceState {
  return channelManager.getOnlineUsers(projectId);
}
