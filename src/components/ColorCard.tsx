/**
 * ColorCard component for displaying individual colors with interaction capabilities
 * Provides click-to-copy, lock/unlock toggle, and accessibility-compliant contrast
 */

"use client";

import { useState, useCallback } from 'react';
import { useClipboard } from '@/hooks/useClipboard';
import { ColorConverter } from '@/lib/color-utils';
import type { Color } from '@/types';

interface ColorCardProps {
  readonly color: Color;
  readonly onLockToggle: (id: string) => Promise<void>;
  readonly className?: string;
}

/**
 * ColorCard component displays a single color with interactive features
 * - Click to copy hex value to clipboard
 * - Lock/unlock toggle to preserve color during regeneration
 * - Accessibility-compliant text contrast
 * - Visual feedback for interactions
 */
export function ColorCard({ color, onLockToggle, className = '' }: ColorCardProps): React.JSX.Element {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isLockHovered, setIsLockHovered] = useState<boolean>(false);
  const { copyToClipboard, isSuccess, isError } = useClipboard(2000);

  /**
   * Handles copying the color hex value to clipboard
   */
  const handleCopy = useCallback(async (): Promise<void> => {
    try {
      await copyToClipboard(color.hex);
    } catch (error) {
      console.error('Failed to copy color:', error);
    }
  }, [copyToClipboard, color.hex]);

  /**
   * Handles toggling the lock state of the color
   */
  const handleLockToggle = useCallback(async (event: React.MouseEvent): Promise<void> => {
    // Prevent the copy action when clicking the lock button
    event.stopPropagation();
    
    try {
      await onLockToggle(color.id);
    } catch (error) {
      console.error('Failed to toggle lock:', error);
    }
  }, [onLockToggle, color.id]);

  // Get the appropriate text color for accessibility
  const textColor = ColorConverter.getContrastColor(color.hex);
  
  // Determine status message for visual feedback
  const getStatusMessage = (): string => {
    if (isSuccess) return 'Copied!';
    if (isError) return 'Copy failed';
    return color.hex;
  };

  // Get status-specific styling
  const getStatusStyling = (): string => {
    if (isSuccess) return 'font-semibold';
    if (isError) return 'font-medium opacity-75';
    return 'font-mono';
  };

  return (
    <div
      className={`relative group cursor-pointer transition-all duration-200 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main color display area */}
      <div
        className={`
          h-32 rounded-lg transition-all duration-200 
          ${isHovered ? 'scale-105 shadow-lg' : 'shadow-md'}
          ${color.isLocked ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
        `}
        style={{ backgroundColor: color.hex }}
        onClick={handleCopy}
        role="button"
        tabIndex={0}
        aria-label={`Copy color ${color.hex} to clipboard`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCopy();
          }
        }}
      >
        {/* Color value display */}
        <div className="absolute inset-0 flex items-center justify-center p-2">
          <span
            className={`text-sm text-center transition-all duration-200 ${getStatusStyling()}`}
            style={{ color: textColor }}
          >
            {getStatusMessage()}
          </span>
        </div>

        {/* Lock/unlock button */}
        <button
          onClick={handleLockToggle}
          onMouseEnter={() => setIsLockHovered(true)}
          onMouseLeave={() => setIsLockHovered(false)}
          className={`
            absolute top-2 right-2 p-1 rounded transition-all duration-200
            ${isHovered || color.isLocked ? 'opacity-100' : 'opacity-0'}
            ${isLockHovered ? 'bg-black bg-opacity-20' : ''}
            focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50
          `}
          style={{ color: textColor }}
          aria-label={color.isLocked ? 'Unlock color' : 'Lock color'}
          title={color.isLocked ? 'Unlock color' : 'Lock color'}
        >
          <span className="text-lg leading-none">
            {color.isLocked ? '🔒' : '🔓'}
          </span>
        </button>

        {/* Visual feedback overlay for copy success */}
        {isSuccess && (
          <div
            className="absolute inset-0 rounded-lg bg-green-500 bg-opacity-20 flex items-center justify-center transition-opacity duration-200"
            aria-hidden="true"
          >
            <span
              className="text-2xl"
              style={{ color: textColor }}
            >
              ✓
            </span>
          </div>
        )}

        {/* Visual feedback overlay for copy error */}
        {isError && (
          <div
            className="absolute inset-0 rounded-lg bg-red-500 bg-opacity-20 flex items-center justify-center transition-opacity duration-200"
            aria-hidden="true"
          >
            <span
              className="text-2xl"
              style={{ color: textColor }}
            >
              ✗
            </span>
          </div>
        )}
      </div>

      {/* Additional color information (shown on hover) */}
      {isHovered && (
        <div className="absolute -bottom-16 left-0 right-0 bg-black bg-opacity-75 text-white text-xs rounded p-2 z-10">
          <div className="text-center space-y-1">
            <div>RGB: {color.rgb.r}, {color.rgb.g}, {color.rgb.b}</div>
            <div>HSL: {color.hsl.h}°, {color.hsl.s}%, {color.hsl.l}%</div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Simplified ColorCard for cases where lock functionality is not needed
 */
export function SimpleColorCard({ 
  color, 
  onClick, 
  className = '' 
}: { 
  readonly color: Color; 
  readonly onClick?: () => Promise<void>; 
  readonly className?: string; 
}): React.JSX.Element {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const { copyToClipboard, isSuccess } = useClipboard(1500);

  const handleClick = useCallback(async (): Promise<void> => {
    if (onClick) {
      await onClick();
    } else {
      await copyToClipboard(color.hex);
    }
  }, [onClick, copyToClipboard, color.hex]);

  const textColor = ColorConverter.getContrastColor(color.hex);

  return (
    <div
      className={`
        h-16 rounded cursor-pointer transition-all duration-200 
        ${isHovered ? 'scale-105' : ''} 
        ${className}
      `}
      style={{ backgroundColor: color.hex }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      aria-label={`Color ${color.hex}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="h-full flex items-center justify-center">
        <span
          className={`text-xs font-mono ${isSuccess ? 'font-semibold' : ''}`}
          style={{ color: textColor }}
        >
          {isSuccess ? 'Copied!' : color.hex}
        </span>
      </div>
    </div>
  );
}