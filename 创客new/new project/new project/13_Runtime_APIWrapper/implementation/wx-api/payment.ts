/**
 * 微信小程序可视化开发平台 - 支付API封装
 */

import { APIWrapper } from '../api-wrapper';
import { PaymentOptions } from '../types';

export class PaymentAPI extends APIWrapper {
  async requestPayment(options: PaymentOptions): Promise<void> {
    return this.promisify('requestPayment', {
      timeStamp: options.timeStamp,
      nonceStr: options.nonceStr,
      package: options.package,
      signType: options.signType || 'MD5',
      paySign: options.paySign,
    });
  }
}

export const payment = new PaymentAPI();
