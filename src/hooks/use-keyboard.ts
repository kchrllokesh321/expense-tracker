import { useState, useEffect } from 'react';
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

export const useKeyboard = () => {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    let showListener: any;
    let hideListener: any;

    const setupListeners = async () => {
      showListener = await Keyboard.addListener('keyboardWillShow', (info) => {
        setIsKeyboardOpen(true);
        setKeyboardHeight(info.keyboardHeight);
      });

      hideListener = await Keyboard.addListener('keyboardWillHide', () => {
        setIsKeyboardOpen(false);
        setKeyboardHeight(0);
      });
    };

    setupListeners();

    return () => {
      if (showListener) {
        showListener.remove();
      }
      if (hideListener) {
        hideListener.remove();
      }
    };
  }, []);

  return {
    isKeyboardOpen,
    keyboardHeight,
  };
};