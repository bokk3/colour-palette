/**
 * PaletteGenerator - Main component for color palette generation
 * Provides responsive grid layout, keyboard shortcuts, and component integration
 */

"use client";

import { useState, useCallback } from 'react';
import { ColorCard } from './ColorCard';
import { ToneSelector } from './ToneSelector';
import { usePalette } from '@/hooks/usePalette';
import { useKeyPress } from '@/hooks/useKeyPress';
import type { Color, ColorTone } from '@/types';
import { ColorConverter } from '@/lib/color-utils';

interface PaletteGeneratorProps {
  readonly className?: string;
}

/**
 * Main PaletteGenerator component
 * - Responsive grid layout (1 col mobile, 2-3 col tablet, 5 col desktop)
 * - Spacebar keyboard shortcut for generation
 * - Integration of ColorCard and ToneSelector components
 * - Generate button with visual feedback
 */
export function PaletteGenerator({ className = '' }: PaletteGeneratorProps): React.JSX.Element {
  const { palette, generateNewPalette, toggleColorLock, updateColor } = usePalette();
  const [selectedColorForTones, setSelectedColorForTones] = useState<Color | null>(null);
  const [showToneSelector, setShowToneSelector] = useState<boolean>(false);

  /**
   * Handle palette generation with loading state
   */
  const handleGenerate = useCallback(async (): Promise<void> => {
    try {
      await generateNewPalette();
    } catch (error) {
      console.error('Failed to generate palette:', error);
    }
  }, [generateNewPalette]);

  /**
   * Handle color lock toggle
   */
  const handleColorLockToggle = useCallback(async (colorId: string): Promise<void> => {
    try {
      await toggleColorLock(colorId);
    } catch (error) {
      console.error('Failed to toggle color lock:', error);
    }
  }, [toggleColorLock]);

  /**
   * Handle tone selection for a color
   */
  const handleToneSelect = useCallback(async (tone: ColorTone): Promise<void> => {
    if (!selectedColorForTones) return;

    try {
      // Create new color with the selected tone
      const newColor: Color = {
        ...selectedColorForTones,
        hex: tone.hex,
        hsl: { 
          ...selectedColorForTones.hsl, 
          l: tone.lightness 
        },
        rgb: ColorConverter.hexToRgb(tone.hex)
      };

      await updateColor(selectedColorForTones.id, newColor);
      setShowToneSelector(false);
      setSelectedColorForTones(null);
    } catch (error) {
      console.error('Failed to apply tone:', error);
    }
  }, [selectedColorForTones, updateColor]);

  /**
   * Handle opening tone selector for a color
   */
  const handleOpenToneSelector = useCallback((color: Color): void => {
    setSelectedColorForTones(color);
    setShowToneSelector(true);
  }, []);

  /**
   * Handle closing tone selector
   */
  const handleCloseToneSelector = useCallback((): void => {
    setShowToneSelector(false);
    setSelectedColorForTones(null);
  }, []);

  // Set up spacebar keyboard shortcut
  useKeyPress('Space', handleGenerate, {
    preventDefault: true,
    ignoreRepeat: true
  });

  return (
    <div className={`flex flex-col bg-white h-screen overflow-hidden ${className}`}>
      {/* Top Content Area - Takes up 1/3 of viewport */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
            Color Palette Generator
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-md">
            Generate harmonious color palettes, lock colors you love, and explore tone variations
          </p>
        </div>

        {/* Generate Button */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleGenerate}
            className="px-6 py-3 sm:px-8 sm:py-4 rounded-lg font-medium text-base sm:text-lg transition-all duration-200 min-w-[200px] min-h-[48px] bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg hover:shadow-xl"
            aria-label="Generate new color palette"
            data-testid="generate-button"
          >
            Generate New Palette
          </button>

          {/* Keyboard shortcut hint */}
          <p className="text-xs sm:text-sm text-gray-500 text-center">
            Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Space</kbd> to generate
          </p>
        </div>

        {/* Palette Info */}
        <div className="text-center space-y-2">
          <div className="flex flex-wrap justify-center gap-4 text-xs sm:text-sm text-gray-600">
            <span>
              Locked: {palette.colors.filter(c => c.isLocked).length}/5
            </span>
            <span>•</span>
            <span>
              Generated: {palette.createdAt.toLocaleTimeString()}
            </span>
          </div>
          
          {/* Instructions */}
          <div className="text-xs text-gray-500 max-w-lg">
            <p>Click colors to explore tones • Click lock icons to preserve colors</p>
          </div>
        </div>
      </div>

      {/* Color Strip - Bottom 2/3 of viewport - Tall Rectangles */}
      <div 
        className="h-2/3 w-full"
        data-testid="palette-container"
      >
        <div
          className="flex w-full h-full"
          data-testid="color-grid"
          role="grid"
          aria-label="Color palette strip"
        >
          {palette.colors.map((color, index) => (
            <div
              key={color.id}
              className="relative flex-1 group"
              role="gridcell"
              aria-label={`Color ${index + 1}: ${color.hex}`}
            >
              <div
                className="w-full h-full cursor-pointer transition-all duration-200 hover:scale-105 hover:z-10 relative"
                style={{ backgroundColor: color.hex }}
                onClick={(e) => {
                  // Only open tone picker if not clicking on lock button
                  const target = e.target as HTMLElement;
                  if (!target.closest('button[aria-label*="lock"]')) {
                    handleOpenToneSelector(color);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Explore tones for ${color.hex}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOpenToneSelector(color);
                  }
                }}
                data-testid="color-card"
              >
                {/* Always visible color hex value at bottom */}
                <div className="absolute bottom-4 left-4 right-4 text-center">
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await navigator.clipboard.writeText(color.hex);
                      } catch (error) {
                        console.error('Failed to copy color:', error);
                      }
                    }}
                    className="text-lg font-mono font-medium px-3 py-2 rounded inline-block hover:scale-105 transition-transform duration-200"
                    style={{ 
                      color: color.hsl.l > 50 ? '#000000' : '#ffffff',
                      backgroundColor: color.hsl.l > 50 ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)'
                    }}
                    title="Click to copy color code"
                    aria-label={`Copy ${color.hex} to clipboard`}
                  >
                    {color.hex}
                  </button>
                </div>

                {/* Lock button */}
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    await handleColorLockToggle(color.id);
                  }}
                  className="absolute top-4 right-4 p-2 rounded transition-all duration-200 opacity-0 group-hover:opacity-100 hover:bg-black hover:bg-opacity-20"
                  style={{ color: color.hsl.l > 50 ? '#000000' : '#ffffff' }}
                  aria-label={color.isLocked ? 'Unlock color' : 'Lock color'}
                  title={color.isLocked ? 'Unlock color' : 'Lock color'}
                >
                  <span className="text-2xl leading-none">
                    {color.isLocked ? '🔒' : '🔓'}
                  </span>
                </button>

                {/* Lock indicator */}
                {color.isLocked && (
                  <div className="absolute top-0 left-0 w-full h-2 bg-blue-500"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tone Selector Modal */}
      {selectedColorForTones && (
        <ToneSelector
          baseColor={selectedColorForTones}
          onToneSelect={handleToneSelect}
          onClose={handleCloseToneSelector}
          isVisible={showToneSelector}
        />
      )}
    </div>
  );
}

/**
 * Simplified PaletteGenerator for embedded use
 */
export function CompactPaletteGenerator({ 
  className = '' 
}: { 
  readonly className?: string; 
}): React.JSX.Element {
  const { palette, generateNewPalette, toggleColorLock } = usePalette();

  const handleGenerate = useCallback(async (): Promise<void> => {
    try {
      await generateNewPalette();
    } catch (error) {
      console.error('Failed to generate palette:', error);
    }
  }, [generateNewPalette]);

  const handleColorLockToggle = useCallback(async (colorId: string): Promise<void> => {
    try {
      await toggleColorLock(colorId);
    } catch (error) {
      console.error('Failed to toggle color lock:', error);
    }
  }, [toggleColorLock]);

  // Set up spacebar keyboard shortcut
  useKeyPress('Space', handleGenerate, {
    preventDefault: true,
    ignoreRepeat: true
  });

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Compact Color Grid */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {palette.colors.map((color) => (
          <div key={color.id} className="flex-shrink-0">
            <ColorCard
              color={color}
              onLockToggle={handleColorLockToggle}
              className="w-16 h-16"
            />
          </div>
        ))}
      </div>

      {/* Compact Generate Button */}
      <button
        onClick={handleGenerate}
        className="w-full px-4 py-2 rounded font-medium text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
      >
        Generate (Space)
      </button>
    </div>
  );
}