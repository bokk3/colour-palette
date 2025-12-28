/**
 * Custom hook for keyboard event handling
 * Provides clean keyboard shortcut functionality with proper event management
 */

"use client";

import { useEffect, useCallback, useRef } from 'react';

interface UseKeyPressOptions {
  preventDefault?: boolean;
  stopPropagation?: boolean;
  ignoreRepeat?: boolean;
}

/**
 * Hook for handling keyboard events with proper cleanup and options
 * @param targetKey Key code to listen for (e.g., 'Space', 'Enter', 'Escape')
 * @param callback Function to call when key is pressed
 * @param options Additional options for event handling
 */
export function useKeyPress(
  targetKey: string,
  callback: () => void | Promise<void>,
  options: UseKeyPressOptions = {}
): void {
  const {
    preventDefault = true,
    stopPropagation = false,
    ignoreRepeat = true
  } = options;

  // Use ref to ensure we have the latest callback without recreating the effect
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const handleKeyPress = useCallback(async (event: KeyboardEvent): Promise<void> => {
    // Check if this is the target key
    if (event.code !== targetKey) {
      return;
    }

    // Ignore repeated keypress events if option is set
    if (ignoreRepeat && event.repeat) {
      return;
    }

    // Prevent default browser behavior if requested
    if (preventDefault) {
      event.preventDefault();
    }

    // Stop event propagation if requested
    if (stopPropagation) {
      event.stopPropagation();
    }

    try {
      // Call the callback function
      await callbackRef.current();
    } catch (error) {
      console.error('Error in keyboard event handler:', error);
    }
  }, [targetKey, preventDefault, stopPropagation, ignoreRepeat]);

  useEffect(() => {
    // Add event listener to document for global keyboard shortcuts
    document.addEventListener('keydown', handleKeyPress);

    // Cleanup function to remove event listener
    return (): void => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);
}

/**
 * Hook for handling multiple keyboard shortcuts
 * @param keyMap Object mapping key codes to callback functions
 * @param options Additional options for event handling
 */
export function useKeyPressMap(
  keyMap: Record<string, () => void | Promise<void>>,
  options: UseKeyPressOptions = {}
): void {
  const {
    preventDefault = true,
    stopPropagation = false,
    ignoreRepeat = true
  } = options;

  // Use ref to ensure we have the latest keyMap without recreating the effect
  const keyMapRef = useRef(keyMap);
  
  useEffect(() => {
    keyMapRef.current = keyMap;
  }, [keyMap]);

  const handleKeyPress = useCallback(async (event: KeyboardEvent): Promise<void> => {
    const callback = keyMapRef.current[event.code];
    
    if (!callback) {
      return;
    }

    // Ignore repeated keypress events if option is set
    if (ignoreRepeat && event.repeat) {
      return;
    }

    // Prevent default browser behavior if requested
    if (preventDefault) {
      event.preventDefault();
    }

    // Stop event propagation if requested
    if (stopPropagation) {
      event.stopPropagation();
    }

    try {
      // Call the callback function
      await callback();
    } catch (error) {
      console.error('Error in keyboard event handler:', error);
    }
  }, [preventDefault, stopPropagation, ignoreRepeat]);

  useEffect(() => {
    // Add event listener to document for global keyboard shortcuts
    document.addEventListener('keydown', handleKeyPress);

    // Cleanup function to remove event listener
    return (): void => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);
}