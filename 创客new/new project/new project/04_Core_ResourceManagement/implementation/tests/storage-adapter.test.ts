/**
 * 存储适配器测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  LocalStorageAdapter,
  CloudStorageAdapter,
  HybridStorageAdapter,
} from '../storage-adapter';

describe('LocalStorageAdapter', () => {
  let adapter: LocalStorageAdapter;

  beforeEach(() => {
    adapter = new LocalStorageAdapter();
  });

  it('应该创建实例', () => {
    expect(adapter).toBeDefined();
    expect(adapter.name).toBe('local');
    expect(adapter.type).toBe('local');
  });

  it('应该有所有必需的方法', () => {
    expect(typeof adapter.upload).toBe('function');
    expect(typeof adapter.download).toBe('function');
    expect(typeof adapter.delete).toBe('function');
    expect(typeof adapter.getFileInfo).toBe('function');
    expect(typeof adapter.exists).toBe('function');
  });
});

describe('CloudStorageAdapter', () => {
  let adapter: CloudStorageAdapter;

  beforeEach(() => {
    adapter = new CloudStorageAdapter('test-env-id');
  });

  it('应该创建实例', () => {
    expect(adapter).toBeDefined();
    expect(adapter.name).toBe('cloud');
    expect(adapter.type).toBe('cloud');
  });

  it('应该有所有必需的方法', () => {
    expect(typeof adapter.upload).toBe('function');
    expect(typeof adapter.download).toBe('function');
    expect(typeof adapter.delete).toBe('function');
    expect(typeof adapter.getFileInfo).toBe('function');
    expect(typeof adapter.exists).toBe('function');
  });
});

describe('HybridStorageAdapter', () => {
  let adapter: HybridStorageAdapter;

  beforeEach(() => {
    adapter = new HybridStorageAdapter('test-env-id');
  });

  it('应该创建实例', () => {
    expect(adapter).toBeDefined();
    expect(adapter.name).toBe('hybrid');
    expect(adapter.type).toBe('local');
  });

  it('应该有所有必需的方法', () => {
    expect(typeof adapter.upload).toBe('function');
    expect(typeof adapter.download).toBe('function');
    expect(typeof adapter.delete).toBe('function');
    expect(typeof adapter.getFileInfo).toBe('function');
    expect(typeof adapter.exists).toBe('function');
  });
});
