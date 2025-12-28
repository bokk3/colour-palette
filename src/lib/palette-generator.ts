/**
 * Palette generation algorithm with HSL-based color generation
 * Implements harmonious color spacing with minimum hue differences
 * Enforces saturation and lightness constraints
 */

import type { Color, Palette, PaletteGenerationOptions } from '@/types';
import { ColorConverter } from './color-utils';

export class PaletteGenerator {
  // Color generation constraints based on requirements
  private static readonly SATURATION_MIN = 60;
  private static readonly SATURATION_MAX = 100;
  private static readonly LIGHTNESS_MIN = 40;
  private static readonly LIGHTNESS_MAX = 70;
  private static readonly MIN_HUE_DIFFERENCE = 30;
  private static readonly PALETTE_SIZE = 5;

  /**
   * Generates a random number within the specified range (inclusive)
   * @param min Minimum value
   * @param max Maximum value
   * @returns Random number between min and max
   */
  private static randomInRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Generates a single random color with proper constraints
   * @returns Color object with HSL values within specified ranges
   */
  static generateRandomColor(): Color {
    const hue = this.randomInRange(0, 359);
    const saturation = this.randomInRange(this.SATURATION_MIN, this.SATURATION_MAX);
    const lightness = this.randomInRange(this.LIGHTNESS_MIN, this.LIGHTNESS_MAX);

    return ColorConverter.createColorFromHsl(hue, saturation, lightness);
  }

  /**
   * Calculates the minimum hue difference between a new hue and existing hues
   * @param newHue The hue to check
   * @param existingHues Array of existing hues
   * @returns Minimum difference considering hue wraparound
   */
  private static getMinHueDifference(newHue: number, existingHues: number[]): number {
    if (existingHues.length === 0) {
      return 360; // No existing hues, maximum difference
    }

    return Math.min(
      ...existingHues.map(existingHue => {
        const diff = Math.abs(newHue - existingHue);
        // Consider hue wraparound (0 and 360 are the same)
        return Math.min(diff, 360 - diff);
      })
    );
  }

  /**
   * Generates a color with sufficient hue difference from existing colors
   * @param existingColors Array of existing colors to avoid
   * @param maxAttempts Maximum attempts to find a distinct hue
   * @returns Color with distinct hue or random color if max attempts reached
   */
  private static generateDistinctColor(existingColors: Color[], maxAttempts: number = 50): Color {
    const existingHues = existingColors.map(color => color.hsl.h);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const hue = this.randomInRange(0, 359);
      const minDifference = this.getMinHueDifference(hue, existingHues);

      if (minDifference >= this.MIN_HUE_DIFFERENCE) {
        const saturation = this.randomInRange(this.SATURATION_MIN, this.SATURATION_MAX);
        const lightness = this.randomInRange(this.LIGHTNESS_MIN, this.LIGHTNESS_MAX);
        
        return ColorConverter.createColorFromHsl(hue, saturation, lightness);
      }
    }

    // If we can't find a distinct hue after max attempts, return a random color
    return this.generateRandomColor();
  }

  /**
   * Generates a harmonious color palette with proper spacing
   * @param existingColors Optional array of existing colors (for preserving locked colors)
   * @param options Optional generation options
   * @returns Complete palette with exactly 5 colors
   */
  static generateHarmoniousPalette(
    existingColors: Color[] = [],
    options?: Partial<PaletteGenerationOptions>
  ): Palette {
    const preserveLocked = options?.preserveLocked ?? true;
    const lockedColors = preserveLocked ? existingColors.filter(color => color.isLocked) : [];
    const newColors: Color[] = [...lockedColors];

    // Generate remaining colors to reach palette size
    const colorsNeeded = this.PALETTE_SIZE - lockedColors.length;

    for (let i = 0; i < colorsNeeded; i++) {
      const newColor = this.generateDistinctColor(newColors);
      newColors.push(newColor);
    }

    // Ensure we have exactly the right number of colors
    const finalColors = newColors.slice(0, this.PALETTE_SIZE);

    return {
      colors: finalColors,
      createdAt: new Date()
    };
  }

  /**
   * Generates a completely new palette (ignoring any existing colors)
   * @returns Fresh palette with 5 new colors
   */
  static generateFreshPalette(): Palette {
    return this.generateHarmoniousPalette([], { preserveLocked: false });
  }

  /**
   * Regenerates a palette while preserving locked colors
   * @param currentPalette Current palette with potential locked colors
   * @returns New palette with locked colors preserved
   */
  static regeneratePalette(currentPalette: Palette): Palette {
    return this.generateHarmoniousPalette(Array.from(currentPalette.colors), { preserveLocked: true });
  }

  /**
   * Validates that a palette meets all requirements
   * @param palette Palette to validate
   * @returns true if palette is valid
   */
  static validatePalette(palette: Palette): boolean {
    // Check palette size
    if (palette.colors.length !== this.PALETTE_SIZE) {
      return false;
    }

    // Check each color's constraints
    for (const color of palette.colors) {
      const { h, s, l } = color.hsl;
      
      // Validate HSL ranges
      if (s < this.SATURATION_MIN || s > this.SATURATION_MAX) {
        return false;
      }
      
      if (l < this.LIGHTNESS_MIN || l > this.LIGHTNESS_MAX) {
        return false;
      }

      // Validate hue range
      if (h < 0 || h >= 360) {
        return false;
      }
    }

    // Check color distinctness
    const hues = palette.colors.map(color => color.hsl.h);
    for (let i = 0; i < hues.length; i++) {
      for (let j = i + 1; j < hues.length; j++) {
        const diff = Math.abs(hues[i] - hues[j]);
        const minDiff = Math.min(diff, 360 - diff);
        if (minDiff < this.MIN_HUE_DIFFERENCE) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Toggles the lock state of a specific color in a palette
   * @param palette Current palette
   * @param colorId ID of the color to toggle
   * @returns New palette with the specified color's lock state toggled
   */
  static toggleColorLock(palette: Palette, colorId: string): Palette {
    const updatedColors = palette.colors.map(color => 
      color.id === colorId 
        ? { ...color, isLocked: !color.isLocked }
        : color
    );

    return {
      ...palette,
      colors: updatedColors
    };
  }
}