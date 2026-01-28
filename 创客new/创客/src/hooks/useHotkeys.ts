import { useEffect } from 'react';

type HotkeyCallback = (event: KeyboardEvent) => void;

interface HotkeyOptions {
  enabled?: boolean;
  preventDefault?: boolean;
}

/**
 * 注册全局快捷键
 * @param hotkey 快捷键字符串，如 'ctrl+s', 'ctrl+shift+z', 'delete'
 * @param callback 回调函数
 * @param options 选项
 */
export const useHotkeys = (
  hotkey: string,
  callback: HotkeyCallback,
  options: HotkeyOptions = {}
) => {
  const { enabled = true, preventDefault = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (matchHotkey(hotkey, event)) {
        if (preventDefault) {
          event.preventDefault();
        }
        callback(event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hotkey, callback, enabled, preventDefault]);
};

/**
 * 解析并匹配快捷键
 */
function matchHotkey(hotkey: string, event: KeyboardEvent): boolean {
  const keys = hotkey.toLowerCase().split('+').map(k => k.trim());
  const keyMap = {
    'ctrl': event.ctrlKey,
    'control': event.ctrlKey,
    'cmd': event.metaKey,
    'command': event.metaKey,
    'shift': event.shiftKey,
    'alt': event.altKey,
    'option': event.altKey,
    'meta': event.metaKey,
  };

  // 检查修饰键
  const modifiers = keys.filter(k => k in keyMap || k === 'ctrl' || k === 'control' || k === 'cmd' || k === 'command');
  for (const mod of modifiers) {
    if (!keyMap[mod as keyof typeof keyMap]) {
      return false;
    }
  }

  // 获取主键
  const mainKey = keys.find(k => !(k in keyMap));
  if (!mainKey) return true;

  // 特殊键处理
  const specialKeys: Record<string, string> = {
    'delete': 'delete',
    'backspace': 'backspace',
    'escape': 'escape',
    'esc': 'escape',
    'enter': 'enter',
    'return': 'enter',
    'tab': 'tab',
    'space': ' ',
    'up': 'arrowup',
    'down': 'arrowdown',
    'left': 'arrowleft',
    'right': 'arrowright',
    'home': 'home',
    'end': 'end',
    'pageup': 'pageup',
    'pagedown': 'pagedown',
    'f5': 'f5',
    'f1': 'f1',
    'f2': 'f2',
    'f3': 'f3',
    'f4': 'f4',
    'f6': 'f6',
    'f7': 'f7',
    'f8': 'f8',
    'f9': 'f9',
    'f10': 'f10',
    'f11': 'f11',
    'f12': 'f12',
  };

  const expectedKey = specialKeys[mainKey] || mainKey;
  const actualKey = event.key.toLowerCase();

  return actualKey === expectedKey;
}

/**
 * 组合多个快捷键
 */
export const useHotkeysGroup = (hotkeys: Record<string, HotkeyCallback>, options?: HotkeyOptions) => {
  for (const [hotkey, callback] of Object.entries(hotkeys)) {
    useHotkeys(hotkey, callback, options);
  }
};
