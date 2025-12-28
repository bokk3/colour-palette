/**
 * Custom hook for palette state management
 * Handles palette generation, color locking, and state persistence
 */

"use client";

import { useState, useCallback } from 'react';
import type { Color, Palette } from '@/types';
import { PaletteGenerator } from '@/lib/palette-generator';

interface UsePaletteReturn {
  palette: Palette;
  generateNewPalette: () => Promise<void>;
  toggleColorLock: (colorId: string) => Promise<void>;
  updateColor: (colorId: string, newColor: Color) => Promise<void>;
  isGenerating: boolean;
}

/**
 * Hook for managing palette state and operations
 * @returns Palette state and management functions
 */
export function usePalette(): UsePaletteReturn {
  // Initialize with a fresh palette
  const [palette, setPalette] = useState<Palette>(() => 
    PaletteGenerator.generateFreshPalette()
  );
  
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  /**
   * Generates a new palette while preserving locked colors
   */
  const generateNewPalette = useCallback(async (): Promise<void> => {
    try {
      setIsGenerating(true);
      
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const newPalette = PaletteGenerator.regeneratePalette(palette);
      setPalette(newPalette);
    } catch (error) {
      console.error('Error generating new palette:', error);
      // Fallback to fresh palette if regeneration fails
      const fallbackPalette = PaletteGenerator.generateFreshPalette();
      setPalette(fallbackPalette);
    } finally {
      setIsGenerating(false);
    }
  }, [palette]);

  /**
   * Toggles the lock state of a specific color
   * @param colorId ID of the color to toggle
   */
  const toggleColorLock = useCallback(async (colorId: string): Promise<void> => {
    try {
      const updatedPalette = PaletteGenerator.toggleColorLock(palette, colorId);
      setPalette(updatedPalette);
    } catch (error) {
      console.error('Error toggling color lock:', error);
      // Don't update state if toggle fails
    }
  }, [palette]);

  /**
   * Updates a specific color in the palette
   * @param colorId ID of the color to update
   * @param newColor New color data
   */
  const updateColor = useCallback(async (colorId: string, newColor: Color): Promise<void> => {
    try {
      const updatedColors = palette.colors.map(color =>
        color.id === colorId ? { ...newColor, id: colorId } : color
      );

      setPalette(prevPalette => ({
        ...prevPalette,
        colors: updatedColors
      }));
    } catch (error) {
      console.error('Error updating color:', error);
      // Don't update state if update fails
    }
  }, [palette]);

  return {
    palette,
    generateNewPalette,
    toggleColorLock,
    updateColor,
    isGenerating
  };
}