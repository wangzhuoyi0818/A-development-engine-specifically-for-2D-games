/**
 * 微信API封装测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NetworkAPI } from '../wx-api/network';
import { StorageAPI } from '../wx-api/storage';
import { UIAPI } from '../wx-api/ui';
import { NavigationAPI } from '../wx-api/navigation';
import { DeviceAPI } from '../wx-api/device';
import { MediaAPI } from '../wx-api/media';
import { LocationAPI } from '../wx-api/location';
import { FileAPI } from '../wx-api/file';
import { PaymentAPI } from '../wx-api/payment';
import { ShareAPI } from '../wx-api/share';

// Mock wx对象
const mockWx = {
  request: vi.fn(),
  setStorage: vi.fn(),
  setStorageSync: vi.fn(),
  getStorage: vi.fn(),
  getStorageSync: vi.fn(),
  removeStorage: vi.fn(),
  removeStorageSync: vi.fn(),
  getStorageInfo: vi.fn(),
  getStorageInfoSync: vi.fn(),
  showToast: vi.fn(),
  showModal: vi.fn(),
  showLoading: vi.fn(),
  hideLoading: vi.fn(),
  navigateTo: vi.fn(),
  redirectTo: vi.fn(),
  navigateBack: vi.fn(),
  switchTab: vi.fn(),
  reLaunch: vi.fn(),
  getSystemInfo: vi.fn(),
  getSystemInfoSync: vi.fn(),
  chooseImage: vi.fn(),
  previewImage: vi.fn(),
  saveImageToPhotosAlbum: vi.fn(),
  getImageInfo: vi.fn(),
  getLocation: vi.fn(),
  chooseLocation: vi.fn(),
  openLocation: vi.fn(),
  uploadFile: vi.fn(),
  downloadFile: vi.fn(),
  requestPayment: vi.fn(),
  shareAppMessage: vi.fn(),
  showShareMenu: vi.fn(),
  hideShareMenu: vi.fn(),
  updateShareMenu: vi.fn(),
  getShareInfo: vi.fn(),
};

global.wx = mockWx as any;

describe('微信API封装', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('NetworkAPI', () => {
    let api: NetworkAPI;

    beforeEach(() => {
      api = new NetworkAPI();
    });

    it('应该成功发起request请求', async () => {
      const mockResponse = {
        statusCode: 200,
        data: { success: true },
        header: {},
      };

      mockWx.request.mockImplementation((options: any) => {
        options.success(mockResponse);
      });

      const result = await api.request({ url: '/api/test' });
      expect(result).toEqual({ success: true });
    });

    it('应该支持GET方便方法', async () => {
      const mockResponse = {
        statusCode: 200,
        data: { id: 1 },
        header: {},
      };

      mockWx.request.mockImplementation((options: any) => {
        options.success(mockResponse);
      });

      const result = await api.get('/api/users', { page: 1 });
      expect(result).toEqual({ id: 1 });
    });

    it('应该支持POST方便方法', async () => {
      const mockResponse = {
        statusCode: 200,
        data: { created: true },
        header: {},
      };

      mockWx.request.mockImplementation((options: any) => {
        options.success(mockResponse);
      });

      const result = await api.post('/api/users', { name: 'John' });
      expect(result).toEqual({ created: true });
    });

    it('应该支持PUT方便方法', async () => {
      const mockResponse = {
        statusCode: 200,
        data: { updated: true },
        header: {},
      };

      mockWx.request.mockImplementation((options: any) => {
        options.success(mockResponse);
      });

      const result = await api.put('/api/users/1', { name: 'Jane' });
      expect(result).toEqual({ updated: true });
    });

    it('应该支持DELETE方便方法', async () => {
      const mockResponse = {
        statusCode: 200,
        data: { deleted: true },
        header: {},
      };

      mockWx.request.mockImplementation((options: any) => {
        options.success(mockResponse);
      });

      const result = await api.delete('/api/users/1');
      expect(result).toEqual({ deleted: true });
    });
  });

  describe('StorageAPI', () => {
    let api: StorageAPI;

    beforeEach(() => {
      api = new StorageAPI();
    });

    it('应该成功设置存储', async () => {
      mockWx.setStorage.mockImplementation((options: any) => {
        options.success();
      });

      await api.setStorage('key', { data: 'value' });
      expect(mockWx.setStorage).toHaveBeenCalled();
    });

    it('应该支持同步设置存储', () => {
      api.setStorageSync('key', { data: 'value' });
      expect(mockWx.setStorageSync).toHaveBeenCalled();
    });

    it('应该成功获取存储', async () => {
      mockWx.getStorage.mockImplementation((options: any) => {
        options.success({ data: { stored: true } });
      });

      const result = await api.getStorage('key');
      expect(result).toEqual({ stored: true });
    });

    it('应该支持同步获取存储', () => {
      mockWx.getStorageSync.mockReturnValue({ stored: true });

      const result = api.getStorageSync('key');
      expect(result).toEqual({ stored: true });
    });

    it('应该成功删除存储', async () => {
      mockWx.removeStorage.mockImplementation((options: any) => {
        options.success();
      });

      await api.removeStorage('key');
      expect(mockWx.removeStorage).toHaveBeenCalled();
    });

    it('应该支持同步删除存储', () => {
      api.removeStorageSync('key');
      expect(mockWx.removeStorageSync).toHaveBeenCalled();
    });

    it('应该成功获取存储信息', async () => {
      mockWx.getStorageInfo.mockImplementation((options: any) => {
        options.success({
          keys: ['key1', 'key2'],
          currentSize: 100,
          limitSize: 1000,
        });
      });

      const result = await api.getStorageInfo();
      expect(result.keys).toContain('key1');
    });

    it('应该成功清空存储', async () => {
      mockWx.clearStorage = vi.fn((options: any) => {
        options.success();
      });

      await api.clearStorage();
      expect(mockWx.clearStorage).toHaveBeenCalled();
    });
  });

  describe('UIAPI', () => {
    let api: UIAPI;

    beforeEach(() => {
      api = new UIAPI();
    });

    it('应该成功显示Toast', async () => {
      mockWx.showToast.mockImplementation((options: any) => {
        options.success?.();
      });

      await api.showToast({ title: '成功' });
      expect(mockWx.showToast).toHaveBeenCalled();
    });

    it('应该成功显示Modal', async () => {
      mockWx.showModal.mockImplementation((options: any) => {
        options.success?.({ confirm: true });
      });

      const result = await api.showModal({ content: '确定吗?' });
      expect(result.confirm).toBe(true);
    });

    it('应该成功显示Loading', async () => {
      mockWx.showLoading.mockImplementation((options: any) => {
        options.success?.();
      });

      await api.showLoading({ title: '加载中...' });
      expect(mockWx.showLoading).toHaveBeenCalled();
    });

    it('应该成功隐藏Loading', () => {
      mockWx.hideLoading.mockImplementation((options: any) => {
        options.success?.();
      });

      api.hideLoading();
      expect(mockWx.hideLoading).toHaveBeenCalled();
    });
  });

  describe('NavigationAPI', () => {
    let api: NavigationAPI;

    beforeEach(() => {
      api = new NavigationAPI();
    });

    it('应该成功导航到页面', async () => {
      mockWx.navigateTo.mockImplementation((options: any) => {
        options.success?.();
      });

      await api.navigateTo({ url: '/pages/index' });
      expect(mockWx.navigateTo).toHaveBeenCalled();
    });

    it('应该成功重定向页面', async () => {
      mockWx.redirectTo.mockImplementation((options: any) => {
        options.success?.();
      });

      await api.redirectTo({ url: '/pages/index' });
      expect(mockWx.redirectTo).toHaveBeenCalled();
    });

    it('应该成功返回页面', async () => {
      mockWx.navigateBack.mockImplementation((options: any) => {
        options.success?.();
      });

      await api.navigateBack();
      expect(mockWx.navigateBack).toHaveBeenCalled();
    });

    it('应该成功切换Tab', async () => {
      mockWx.switchTab.mockImplementation((options: any) => {
        options.success?.();
      });

      await api.switchTab({ url: '/pages/tab' });
      expect(mockWx.switchTab).toHaveBeenCalled();
    });

    it('应该成功重启应用', async () => {
      mockWx.reLaunch.mockImplementation((options: any) => {
        options.success?.();
      });

      await api.reLaunch({ url: '/pages/index' });
      expect(mockWx.reLaunch).toHaveBeenCalled();
    });
  });

  describe('DeviceAPI', () => {
    let api: DeviceAPI;

    beforeEach(() => {
      api = new DeviceAPI();
    });

    it('应该成功获取系统信息', async () => {
      const systemInfo = {
        brand: 'iPhone',
        model: 'iPhone 12',
        system: 'iOS 14.0',
        platform: 'ios',
        windowWidth: 375,
        windowHeight: 812,
      };

      mockWx.getSystemInfo.mockImplementation((options: any) => {
        options.success(systemInfo);
      });

      const result = await api.getSystemInfo();
      expect(result.brand).toBe('iPhone');
    });

    it('应该支持同步获取系统信息', () => {
      const systemInfo = {
        brand: 'Android',
        model: 'Nexus 6P',
        system: 'Android 10',
        platform: 'android',
      };

      mockWx.getSystemInfoSync.mockReturnValue(systemInfo);

      const result = api.getSystemInfoSync();
      expect(result.brand).toBe('Android');
    });
  });

  describe('MediaAPI', () => {
    let api: MediaAPI;

    beforeEach(() => {
      api = new MediaAPI();
    });

    it('应该成功选择图片', async () => {
      mockWx.chooseImage.mockImplementation((options: any) => {
        options.success({
          tempFilePaths: ['/tmp/image.jpg'],
          tempFiles: [{ path: '/tmp/image.jpg', size: 1024 }],
        });
      });

      const result = await api.chooseImage();
      expect(result.tempFilePaths.length).toBe(1);
    });

    it('应该成功预览图片', async () => {
      mockWx.previewImage.mockImplementation((options: any) => {
        options.success?.();
      });

      await api.previewImage({
        urls: ['/tmp/image.jpg'],
        current: '/tmp/image.jpg',
      });

      expect(mockWx.previewImage).toHaveBeenCalled();
    });

    it('应该成功保存图片到相册', async () => {
      mockWx.saveImageToPhotosAlbum.mockImplementation((options: any) => {
        options.success?.();
      });

      await api.saveImageToPhotosAlbum({ filePath: '/tmp/image.jpg' });
      expect(mockWx.saveImageToPhotosAlbum).toHaveBeenCalled();
    });

    it('应该成功获取图片信息', async () => {
      mockWx.getImageInfo.mockImplementation((options: any) => {
        options.success({
          width: 1920,
          height: 1080,
          path: '/tmp/image.jpg',
          type: 'image/jpeg',
          size: 1024,
        });
      });

      const result = await api.getImageInfo({ src: '/tmp/image.jpg' });
      expect(result.width).toBe(1920);
    });
  });

  describe('LocationAPI', () => {
    let api: LocationAPI;

    beforeEach(() => {
      api = new LocationAPI();
    });

    it('应该成功获取位置', async () => {
      const location = {
        latitude: 39.9042,
        longitude: 116.4074,
        accuracy: 10,
        altitude: 0,
        verticalAccuracy: 0,
        horizontalAccuracy: 10,
        speed: 0,
      };

      mockWx.getLocation.mockImplementation((options: any) => {
        options.success(location);
      });

      const result = await api.getLocation();
      expect(result.latitude).toBe(39.9042);
    });

    it('应该成功选择位置', async () => {
      const location = {
        name: '北京',
        address: '北京市朝阳区',
        latitude: 39.9042,
        longitude: 116.4074,
      };

      mockWx.chooseLocation.mockImplementation((options: any) => {
        options.success(location);
      });

      const result = await api.chooseLocation();
      expect(result.name).toBe('北京');
    });

    it('应该成功打开位置', async () => {
      mockWx.openLocation.mockImplementation((options: any) => {
        options.success?.();
      });

      await api.openLocation({
        latitude: 39.9042,
        longitude: 116.4074,
        name: '北京',
        address: '北京市朝阳区',
      });

      expect(mockWx.openLocation).toHaveBeenCalled();
    });
  });

  describe('FileAPI', () => {
    let api: FileAPI;

    beforeEach(() => {
      api = new FileAPI();
    });

    it('应该成功上传文件', async () => {
      mockWx.uploadFile.mockImplementation((options: any) => {
        options.success({
          statusCode: 200,
          data: JSON.stringify({ success: true }),
        });
      });

      const result = await api.uploadFile({
        url: '/api/upload',
        filePath: '/tmp/file.txt',
        name: 'file',
      });

      expect(result.statusCode).toBe(200);
    });

    it('应该成功下载文件', async () => {
      mockWx.downloadFile.mockImplementation((options: any) => {
        options.success({
          statusCode: 200,
          tempFilePath: '/tmp/downloaded.txt',
        });
      });

      const result = await api.downloadFile({
        url: '/api/download/file.txt',
      });

      expect(result.tempFilePath).toBe('/tmp/downloaded.txt');
    });
  });

  describe('PaymentAPI', () => {
    let api: PaymentAPI;

    beforeEach(() => {
      api = new PaymentAPI();
    });

    it('应该成功发起支付', async () => {
      mockWx.requestPayment.mockImplementation((options: any) => {
        options.success?.();
      });

      await api.requestPayment({
        timeStamp: Date.now().toString(),
        nonceStr: 'random',
        package: 'prepay_id=123',
        signType: 'MD5',
        paySign: 'signature',
      });

      expect(mockWx.requestPayment).toHaveBeenCalled();
    });
  });

  describe('ShareAPI', () => {
    let api: ShareAPI;

    beforeEach(() => {
      api = new ShareAPI();
    });

    it('应该成功显示分享菜单', async () => {
      mockWx.showShareMenu.mockImplementation((options: any) => {
        options.success?.();
      });

      await api.showShareMenu();
      expect(mockWx.showShareMenu).toHaveBeenCalled();
    });

    it('应该成功隐藏分享菜单', async () => {
      mockWx.hideShareMenu.mockImplementation((options: any) => {
        options.success?.();
      });

      await api.hideShareMenu();
      expect(mockWx.hideShareMenu).toHaveBeenCalled();
    });

    it('应该成功更新分享菜单', async () => {
      mockWx.updateShareMenu.mockImplementation((options: any) => {
        options.success?.();
      });

      await api.updateShareMenu({
        withShareTicket: true,
        isUpdatableMessage: true,
      });

      expect(mockWx.updateShareMenu).toHaveBeenCalled();
    });

    it('应该成功获取分享信息', async () => {
      mockWx.getShareInfo.mockImplementation((options: any) => {
        options.success?.({
          errMsg: 'getShareInfo:ok',
          encryptedData: 'data',
          iv: 'iv',
        });
      });

      const result = await api.getShareInfo({ shareTicket: 'ticket' });
      expect(result.errMsg).toBe('getShareInfo:ok');
    });
  });
});
