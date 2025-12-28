/**
 * ToneSelector component for exploring color tone variations
 * Provides 7 tone variations with proper labeling and visual hierarchy
 * Allows tone selection to update the original color in the palette
 */

"use client";

import { useState, useCallback, useEffect } from 'react';
import { ToneGenerator } from '@/lib/tone-generator';
import { ColorConverter } from '@/lib/color-utils';
import type { Color, ColorTone } from '@/types';

interface ToneSelectorProps {
  readonly baseColor: Color;
  readonly onToneSelect: (tone: ColorTone) => Promise<void>;
  readonly onClose: () => void;
  readonly isVisible: boolean;
  readonly className?: string;
}

/**
 * ToneSelector component displays 7 tone variations of a base color
 * - Generates tones by adjusting lightness while preserving hue and saturation
 * - Provides standard tone labeling (100, 200, 300, 400, 500, 600, 700, 800)
 * - Allows selection of tones to update the original color
 * - Implements proper visual hierarchy and accessibility
 */
export function ToneSelector({ 
  baseColor, 
  onToneSelect, 
  onClose, 
  isVisible,
  className = '' 
}: ToneSelectorProps): React.JSX.Element | null {
  const [tones, setTones] = useState<readonly ColorTone[]>([]);
  const [selectedTone, setSelectedTone] = useState<ColorTone | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * Generate tones when base color changes
   */
  useEffect(() => {
    if (baseColor && isVisible) {
      setIsLoading(true);
      try {
        const generatedTones = ToneGenerator.generateTones(baseColor);
        setTones(generatedTones);
        
        // Find the tone closest to the base color's lightness
        const closestTone = generatedTones.find(tone => 
          Math.abs(tone.lightness - baseColor.hsl.l) <= 10
        ) || generatedTones[3]; // Default to middle tone if no close match
        
        setSelectedTone(closestTone);
      } catch (error) {
        console.error('Failed to generate tones:', error);
        setTones([]);
      } finally {
        setIsLoading(false);
      }
    }
  }, [baseColor, isVisible]);

  /**
   * Handle tone selection
   */
  const handleToneSelect = useCallback(async (tone: ColorTone): Promise<void> => {
    try {
      setSelectedTone(tone);
      await onToneSelect(tone);
    } catch (error) {
      console.error('Failed to select tone:', error);
    }
  }, [onToneSelect]);

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent): void => {
    if (!tones.length) return;

    const currentIndex = selectedTone ? tones.findIndex(t => t.label === selectedTone.label) : -1;
    
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        if (currentIndex > 0) {
          handleToneSelect(tones[currentIndex - 1]);
        }
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        if (currentIndex < tones.length - 1) {
          handleToneSelect(tones[currentIndex + 1]);
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (selectedTone) {
          handleToneSelect(selectedTone);
        }
        break;
      case 'Escape':
        event.preventDefault();
        onClose();
        break;
    }
  }, [tones, selectedTone, handleToneSelect, onClose]);

  /**
   * Handle click outside to close
   */
  const handleBackdropClick = useCallback((event: React.MouseEvent): void => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`
        fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4
        ${className}
      `}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tone-selector-title"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 id="tone-selector-title" className="text-xl font-semibold text-gray-900">
              Explore Tones
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              aria-label="Close tone selector"
            >
              <span className="text-2xl leading-none">×</span>
            </button>
          </div>
          
          {/* Base color info */}
          <div className="mt-4 flex items-center gap-3">
            <div
              className="w-8 h-8 rounded border border-gray-300"
              style={{ backgroundColor: baseColor.hex }}
              aria-hidden="true"
            />
            <div className="text-sm text-gray-600">
              <div className="font-mono">{baseColor.hex}</div>
              <div>HSL: {baseColor.hsl.h}°, {baseColor.hsl.s}%, {baseColor.hsl.l}%</div>
            </div>
          </div>
        </div>

        {/* Tone grid */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Generating tones...</div>
            </div>
          ) : tones.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-red-500">Failed to generate tones</div>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a Tone ({tones.length} variations)
                </h3>
                <p className="text-sm text-gray-600">
                  Click a tone to update your palette color, or use arrow keys to navigate.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {tones.map((tone) => {
                  const isSelected = selectedTone?.label === tone.label;
                  const textColor = ColorConverter.getContrastColor(tone.hex);
                  
                  return (
                    <button
                      key={tone.label}
                      onClick={() => handleToneSelect(tone)}
                      className={`
                        relative h-20 rounded-lg transition-all duration-200 focus:outline-none
                        ${isSelected 
                          ? 'ring-2 ring-blue-500 ring-offset-2 scale-105' 
                          : 'hover:scale-105 focus:ring-2 focus:ring-blue-300 focus:ring-offset-2'
                        }
                      `}
                      style={{ backgroundColor: tone.hex }}
                      aria-label={`Select tone ${tone.label} with lightness ${tone.lightness}%`}
                      tabIndex={0}
                    >
                      {/* Tone label and lightness */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                        <div
                          className="font-semibold text-sm"
                          style={{ color: textColor }}
                        >
                          {tone.label}
                        </div>
                        <div
                          className="text-xs opacity-75 mt-1"
                          style={{ color: textColor }}
                        >
                          L: {tone.lightness}%
                        </div>
                      </div>

                      {/* Hex value on hover */}
                      <div
                        className="absolute bottom-1 left-1 right-1 text-xs font-mono opacity-0 hover:opacity-100 transition-opacity duration-200 text-center"
                        style={{ color: textColor }}
                      >
                        {tone.hex}
                      </div>

                      {/* Selection indicator */}
                      {isSelected && (
                        <div
                          className="absolute top-1 right-1 text-lg leading-none"
                          style={{ color: textColor }}
                          aria-hidden="true"
                        >
                          ✓
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Action buttons */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => selectedTone && handleToneSelect(selectedTone)}
                  disabled={!selectedTone}
                  className={`
                    px-6 py-2 rounded-lg font-medium transition-colors
                    ${selectedTone
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }
                  `}
                >
                  Apply Tone
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact ToneSelector for inline use (without modal overlay)
 */
export function InlineToneSelector({
  baseColor,
  onToneSelect,
  className = ''
}: {
  readonly baseColor: Color;
  readonly onToneSelect: (tone: ColorTone) => Promise<void>;
  readonly className?: string;
}): React.JSX.Element {
  const [tones, setTones] = useState<readonly ColorTone[]>([]);
  const [selectedTone, setSelectedTone] = useState<ColorTone | null>(null);

  useEffect(() => {
    if (!baseColor) return;
    
    const generateTonesAsync = async (): Promise<void> => {
      try {
        const generatedTones = ToneGenerator.generateTones(baseColor);
        setTones(generatedTones);
        
        // Find closest tone to base color
        const closestTone = generatedTones.find(tone => 
          Math.abs(tone.lightness - baseColor.hsl.l) <= 10
        ) || generatedTones[3];
        
        setSelectedTone(closestTone);
      } catch (error) {
        console.error('Failed to generate tones:', error);
        setTones([]);
      }
    };
    
    generateTonesAsync();
  }, [baseColor]);

  const handleToneSelect = useCallback(async (tone: ColorTone): Promise<void> => {
    try {
      setSelectedTone(tone);
      await onToneSelect(tone);
    } catch (error) {
      console.error('Failed to select tone:', error);
    }
  }, [onToneSelect]);

  return (
    <div className={`space-y-3 ${className}`}>
      <h4 className="text-sm font-medium text-gray-700">Tone Variations</h4>
      
      <div className="flex gap-1 overflow-x-auto pb-2">
        {tones.map((tone) => {
          const isSelected = selectedTone?.label === tone.label;
          const textColor = ColorConverter.getContrastColor(tone.hex);
          
          return (
            <button
              key={tone.label}
              onClick={() => handleToneSelect(tone)}
              className={`
                flex-shrink-0 w-12 h-12 rounded transition-all duration-200
                ${isSelected ? 'ring-2 ring-blue-500 scale-110' : 'hover:scale-105'}
              `}
              style={{ backgroundColor: tone.hex }}
              title={`Tone ${tone.label} (${tone.lightness}% lightness)`}
              aria-label={`Select tone ${tone.label}`}
            >
              <div className="w-full h-full flex items-center justify-center">
                <span
                  className="text-xs font-semibold"
                  style={{ color: textColor }}
                >
                  {tone.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}