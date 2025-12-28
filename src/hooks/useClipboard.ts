/**
 * Custom hook for clipboard operations
 * Provides copy functionality with success/error feedback and fallback support
 */

"use client";

import { useState, useCallback } from 'react';

interface UseClipboardReturn {
  copyToClipboard: (text: string) => Promise<boolean>;
  isSuccess: boolean;
  isError: boolean;
  errorMessage: string | null;
  resetStatus: () => void;
}

/**
 * Hook for clipboard operations with feedback and error handling
 * @param resetDelay Time in milliseconds to auto-reset status (default: 2000)
 * @returns Clipboard functions and status
 */
export function useClipboard(resetDelay: number = 2000): UseClipboardReturn {
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Resets all status flags
   */
  const resetStatus = useCallback((): void => {
    setIsSuccess(false);
    setIsError(false);
    setErrorMessage(null);
  }, []);

  /**
   * Auto-reset status after delay
   */
  const autoResetStatus = useCallback((): void => {
    setTimeout(() => {
      resetStatus();
    }, resetDelay);
  }, [resetStatus, resetDelay]);

  /**
   * Fallback copy method using deprecated document.execCommand
   * @param text Text to copy
   * @returns Promise resolving to success status
   */
  const fallbackCopyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    try {
      // Create a temporary textarea element
      const textArea = document.createElement('textarea');
      textArea.value = text;
      
      // Make it invisible but still selectable
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      // Try to copy using the deprecated method
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      return successful;
    } catch (error) {
      console.error('Fallback copy failed:', error);
      return false;
    }
  }, []);

  /**
   * Copies text to clipboard with modern API and fallback
   * @param text Text to copy to clipboard
   * @returns Promise resolving to success status
   */
  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    // Reset previous status
    resetStatus();

    try {
      // Check if modern Clipboard API is available
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setIsSuccess(true);
        autoResetStatus();
        return true;
      } else {
        // Fall back to deprecated method
        const success = await fallbackCopyToClipboard(text);
        
        if (success) {
          setIsSuccess(true);
          autoResetStatus();
          return true;
        } else {
          throw new Error('Clipboard API not available and fallback failed');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to copy to clipboard';
      
      setIsError(true);
      setErrorMessage(message);
      autoResetStatus();
      
      console.error('Copy to clipboard failed:', error);
      return false;
    }
  }, [resetStatus, autoResetStatus, fallbackCopyToClipboard]);

  return {
    copyToClipboard,
    isSuccess,
    isError,
    errorMessage,
    resetStatus
  };
}

/**
 * Simple clipboard hook with just copy functionality
 * @returns Copy function that returns a promise
 */
export function useSimpleClipboard(): (text: string) => Promise<boolean> {
  const { copyToClipboard } = useClipboard();
  return copyToClipboard;
}