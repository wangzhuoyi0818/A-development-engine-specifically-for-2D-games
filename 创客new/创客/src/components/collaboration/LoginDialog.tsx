/**
 * 登录对话框组件
 */

import React, { useState } from 'react';
import { Modal, Form, Input, Button, Tabs, message, Divider } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  GithubOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth';

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
}

type TabKey = 'login' | 'register' | 'reset';

export const LoginDialog: React.FC<LoginDialogProps> = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('login');
  const [form] = Form.useForm();
  const { signIn, signUp, signInWithGitHub, resetPassword, isLoading, error, clearError } =
    useAuth();

  // 处理登录
  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      await signIn(values);
      message.success('登录成功');
      onClose();
      form.resetFields();
    } catch (err) {
      message.error(error || '登录失败');
    }
  };

  // 处理注册
  const handleRegister = async (values: {
    email: string;
    password: string;
    username: string;
  }) => {
    try {
      await signUp(values);
      message.success('注册成功，请检查邮箱确认');
      setActiveTab('login');
      form.resetFields();
    } catch (err) {
      message.error(error || '注册失败');
    }
  };

  // 处理密码重置
  const handleResetPassword = async (values: { email: string }) => {
    try {
      await resetPassword(values.email);
      message.success('重置链接已发送到您的邮箱');
      setActiveTab('login');
      form.resetFields();
    } catch (err) {
      message.error(error || '发送失败');
    }
  };

  // 处理 GitHub 登录
  const handleGitHubLogin = async () => {
    try {
      await signInWithGitHub();
    } catch (err) {
      message.error('GitHub 登录失败');
    }
  };

  // 切换标签时清除错误
  const handleTabChange = (key: string) => {
    setActiveTab(key as TabKey);
    clearError();
    form.resetFields();
  };

  // 登录表单
  const loginForm = (
    <Form form={form} onFinish={handleLogin} layout="vertical">
      <Form.Item
        name="email"
        rules={[
          { required: true, message: '请输入邮箱' },
          { type: 'email', message: '请输入有效的邮箱地址' },
        ]}
      >
        <Input prefix={<MailOutlined />} placeholder="邮箱" size="large" />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[{ required: true, message: '请输入密码' }]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="密码"
          size="large"
        />
      </Form.Item>
      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={isLoading}
          block
          size="large"
        >
          登录
        </Button>
      </Form.Item>
      <div style={{ textAlign: 'center' }}>
        <Button type="link" onClick={() => setActiveTab('reset')}>
          忘记密码？
        </Button>
      </div>
    </Form>
  );

  // 注册表单
  const registerForm = (
    <Form form={form} onFinish={handleRegister} layout="vertical">
      <Form.Item
        name="username"
        rules={[{ required: true, message: '请输入用户名' }]}
      >
        <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
      </Form.Item>
      <Form.Item
        name="email"
        rules={[
          { required: true, message: '请输入邮箱' },
          { type: 'email', message: '请输入有效的邮箱地址' },
        ]}
      >
        <Input prefix={<MailOutlined />} placeholder="邮箱" size="large" />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[
          { required: true, message: '请输入密码' },
          { min: 6, message: '密码至少6位' },
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="密码"
          size="large"
        />
      </Form.Item>
      <Form.Item
        name="confirmPassword"
        dependencies={['password']}
        rules={[
          { required: true, message: '请确认密码' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('两次输入的密码不一致'));
            },
          }),
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="确认密码"
          size="large"
        />
      </Form.Item>
      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={isLoading}
          block
          size="large"
        >
          注册
        </Button>
      </Form.Item>
    </Form>
  );

  // 重置密码表单
  const resetForm = (
    <Form form={form} onFinish={handleResetPassword} layout="vertical">
      <Form.Item
        name="email"
        rules={[
          { required: true, message: '请输入邮箱' },
          { type: 'email', message: '请输入有效的邮箱地址' },
        ]}
      >
        <Input prefix={<MailOutlined />} placeholder="邮箱" size="large" />
      </Form.Item>
      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={isLoading}
          block
          size="large"
        >
          发送重置链接
        </Button>
      </Form.Item>
      <div style={{ textAlign: 'center' }}>
        <Button type="link" onClick={() => setActiveTab('login')}>
          返回登录
        </Button>
      </div>
    </Form>
  );

  const tabItems = [
    { key: 'login', label: '登录', children: loginForm },
    { key: 'register', label: '注册', children: registerForm },
  ];

  return (
    <Modal
      title={activeTab === 'reset' ? '重置密码' : '账号'}
      open={open}
      onCancel={onClose}
      footer={null}
      width={400}
      destroyOnClose
    >
      {activeTab === 'reset' ? (
        resetForm
      ) : (
        <>
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            items={tabItems}
            centered
          />
          <Divider>或</Divider>
          <Button
            icon={<GithubOutlined />}
            onClick={handleGitHubLogin}
            block
            size="large"
          >
            使用 GitHub 登录
          </Button>
        </>
      )}
    </Modal>
  );
};

export default LoginDialog;
