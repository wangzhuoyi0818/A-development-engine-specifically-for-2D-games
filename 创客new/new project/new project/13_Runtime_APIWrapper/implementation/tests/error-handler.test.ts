/**
 * 错误处理器测试
 */

import { describe, it, expect } from 'vitest';
import { ErrorHandler, APIErrorImpl } from '../error-handler';
import { ErrorType } from '../types';

describe('ErrorHandler', () => {
  describe('handleWxError', () => {
    it('应该正确处理超时错误', () => {
      const wxError = {
        errMsg: 'request:fail timeout',
      };

      const error = ErrorHandler.handleWxError(wxError, 'request');

      expect(error).toBeInstanceOf(APIErrorImpl);
      expect(error.type).toBe(ErrorType.TIMEOUT);
      expect(error.code).toBe('TIMEOUT');
      expect(error.recoverable).toBe(true);
    });

    it('应该正确处理网络错误', () => {
      const wxError = {
        errMsg: 'request:fail',
      };

      const error = ErrorHandler.handleWxError(wxError, 'request');

      expect(error.type).toBe(ErrorType.NETWORK_ERROR);
      expect(error.recoverable).toBe(true);
    });

    it('应该正确处理权限错误', () => {
      const wxError = {
        errMsg: 'authorize:fail auth deny',
      };

      const error = ErrorHandler.handleWxError(wxError, 'authorize');

      expect(error.type).toBe(ErrorType.PERMISSION_DENIED);
      expect(error.code).toBe('PERMISSION_DENIED');
      expect(error.recoverable).toBe(false);
    });

    it('应该正确处理参数错误', () => {
      const wxError = {
        errMsg: 'invalid parameter',
      };

      const error = ErrorHandler.handleWxError(wxError);

      expect(error.type).toBe(ErrorType.INVALID_PARAMS);
    });
  });

  describe('handleHttpError', () => {
    it('应该正确处理400错误', () => {
      const error = ErrorHandler.handleHttpError(400);

      expect(error.type).toBe(ErrorType.BUSINESS_ERROR);
      expect(error.code).toBe('BAD_REQUEST');
    });

    it('应该正确处理401错误', () => {
      const error = ErrorHandler.handleHttpError(401);

      expect(error.code).toBe('UNAUTHORIZED');
    });

    it('应该正确处理404错误', () => {
      const error = ErrorHandler.handleHttpError(404);

      expect(error.code).toBe('NOT_FOUND');
    });

    it('应该正确处理500错误', () => {
      const error = ErrorHandler.handleHttpError(500);

      expect(error.type).toBe(ErrorType.SYSTEM_ERROR);
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.recoverable).toBe(true);
    });

    it('应该正确处理502错误', () => {
      const error = ErrorHandler.handleHttpError(502);

      expect(error.code).toBe('BAD_GATEWAY');
      expect(error.recoverable).toBe(true);
    });
  });

  describe('handleBusinessError', () => {
    it('应该正确创建业务错误', () => {
      const error = ErrorHandler.handleBusinessError(
        'USER_NOT_FOUND',
        '用户不存在'
      );

      expect(error.type).toBe(ErrorType.BUSINESS_ERROR);
      expect(error.code).toBe('USER_NOT_FOUND');
      expect(error.message).toBe('用户不存在');
      expect(error.recoverable).toBe(false);
    });
  });

  describe('handleError', () => {
    it('应该正确处理APIError', () => {
      const apiError = new APIErrorImpl(
        ErrorType.TIMEOUT,
        'TIMEOUT',
        '超时',
        undefined,
        true
      );

      const error = ErrorHandler.handleError(apiError);

      expect(error).toBe(apiError);
    });

    it('应该正确处理Error对象', () => {
      const stdError = new Error('标准错误');

      const error = ErrorHandler.handleError(stdError);

      expect(error.type).toBe(ErrorType.SYSTEM_ERROR);
      expect(error.code).toBe('RUNTIME_ERROR');
      expect(error.message).toBe('标准错误');
    });

    it('应该正确处理字符串错误', () => {
      const error = ErrorHandler.handleError('字符串错误');

      expect(error.type).toBe(ErrorType.SYSTEM_ERROR);
      expect(error.message).toBe('字符串错误');
    });
  });

  describe('APIErrorImpl', () => {
    it('应该能设置请求ID', () => {
      const error = new APIErrorImpl(
        ErrorType.TIMEOUT,
        'TIMEOUT',
        '超时'
      );

      error.setRequestId('req-123');

      expect(error.requestId).toBe('req-123');
    });

    it('应该能设置额外信息', () => {
      const error = new APIErrorImpl(
        ErrorType.TIMEOUT,
        'TIMEOUT',
        '超时'
      );

      error.setExtra({ url: '/api/test' });

      expect(error.extra).toEqual({ url: '/api/test' });
    });

    it('应该能转换为JSON', () => {
      const error = new APIErrorImpl(
        ErrorType.TIMEOUT,
        'TIMEOUT',
        '超时',
        undefined,
        true
      );

      error.setRequestId('req-123');

      const json = error.toJSON();

      expect(json).toMatchObject({
        name: 'APIError',
        type: ErrorType.TIMEOUT,
        code: 'TIMEOUT',
        message: '超时',
        recoverable: true,
        requestId: 'req-123',
      });
    });

    it('应该能转换为字符串', () => {
      const error = new APIErrorImpl(
        ErrorType.TIMEOUT,
        'TIMEOUT',
        '请求超时'
      );

      expect(error.toString()).toBe('[TIMEOUT] TIMEOUT: 请求超时');
    });
  });
});
