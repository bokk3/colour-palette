/**
 * Tone generation system with lightness variation logic
 * Generates tone variations preserving hue and saturation
 * Provides standard tone labeling (50, 100, 200, etc.)
 */

import type { Color, ColorTone } from '@/types';
import { ColorConverter } from './color-utils';

export class ToneGenerator {
  /**
   * Standard tone steps with lightness values
   * Based on common design system conventions (Material Design, Tailwind, etc.)
   */
  private static readonly TONE_STEPS: readonly ColorTone[] = [
    { label: '50', lightness: 95, hex: '' },
    { label: '100', lightness: 90, hex: '' },
    { label: '200', lightness: 80, hex: '' },
    { label: '300', lightness: 70, hex: '' },
    { label: '400', lightness: 60, hex: '' },
    { label: '500', lightness: 50, hex: '' }, // Base tone
    { label: '600', lightness: 40, hex: '' },
    { label: '700', lightness: 30, hex: '' },
    { label: '800', lightness: 20, hex: '' },
    { label: '900', lightness: 10, hex: '' },
  ];

  /**
   * Generates 7 tone variations from a base color
   * Preserves hue and saturation while varying lightness
   * @param baseColor The base color to generate tones from
   * @returns Array of 7 ColorTone objects with standard labeling
   */
  static generateTones(baseColor: Color): readonly ColorTone[] {
    const { h, s } = baseColor.hsl;

    // Generate 7 tones (excluding the extreme light and dark tones for better usability)
    const selectedSteps = this.TONE_STEPS.slice(1, 8); // Skip 50 and 900, take 7 tones

    return selectedSteps.map(step => ({
      label: step.label,
      lightness: step.lightness,
      hex: ColorConverter.hslToHex(h, s, step.lightness)
    }));
  }

  /**
   * Generates all 10 tone variations from a base color
   * Preserves hue and saturation while varying lightness
   * @param baseColor The base color to generate tones from
   * @returns Array of all 10 ColorTone objects with standard labeling
   */
  static generateAllTones(baseColor: Color): readonly ColorTone[] {
    const { h, s } = baseColor.hsl;

    return this.TONE_STEPS.map(step => ({
      label: step.label,
      lightness: step.lightness,
      hex: ColorConverter.hslToHex(h, s, step.lightness)
    }));
  }

  /**
   * Generates a specific tone from a base color
   * @param baseColor The base color to generate tone from
   * @param lightness The target lightness value (0-100)
   * @param label Optional label for the tone
   * @returns ColorTone object with the specified lightness
   */
  static generateSpecificTone(
    baseColor: Color, 
    lightness: number, 
    label?: string
  ): ColorTone {
    if (lightness < 0 || lightness > 100) {
      throw new Error(`Invalid lightness value: ${lightness}. Must be between 0 and 100.`);
    }

    const { h, s } = baseColor.hsl;

    return {
      label: label || lightness.toString(),
      lightness,
      hex: ColorConverter.hslToHex(h, s, lightness)
    };
  }

  /**
   * Finds the closest standard tone to a given lightness value
   * @param lightness The target lightness value (0-100)
   * @returns The closest standard tone step
   */
  static findClosestTone(lightness: number): ColorTone {
    if (lightness < 0 || lightness > 100) {
      throw new Error(`Invalid lightness value: ${lightness}. Must be between 0 and 100.`);
    }

    let closestTone = this.TONE_STEPS[0];
    let minDifference = Math.abs(lightness - closestTone.lightness);

    for (const tone of this.TONE_STEPS) {
      const difference = Math.abs(lightness - tone.lightness);
      if (difference < minDifference) {
        minDifference = difference;
        closestTone = tone;
      }
    }

    return closestTone;
  }

  /**
   * Creates a Color object from a ColorTone and base color
   * @param tone The tone to convert
   * @param baseColor The base color for hue and saturation reference
   * @param isLocked Whether the resulting color should be locked
   * @returns Complete Color object
   */
  static toneToColor(tone: ColorTone, baseColor: Color, isLocked: boolean = false): Color {
    const { h, s } = baseColor.hsl;
    return ColorConverter.createColorFromHsl(h, s, tone.lightness, isLocked);
  }

  /**
   * Validates that tone generation preserves hue and saturation
   * @param baseColor Original color
   * @param tones Generated tones
   * @returns true if all tones preserve hue and saturation
   */
  static validateToneConsistency(baseColor: Color, tones: readonly ColorTone[]): boolean {
    const { h: baseHue, s: baseSaturation } = baseColor.hsl;

    return tones.every(tone => {
      try {
        const toneHsl = ColorConverter.hexToHsl(tone.hex);
        
        // Allow tolerance for color conversion precision limits
        const hueDiff = Math.abs(toneHsl.h - baseHue);
        const hueMatch = hueDiff <= 4 || Math.abs(hueDiff - 360) <= 4; // Handle wraparound
        const saturationMatch = Math.abs(toneHsl.s - baseSaturation) <= 4;
        const lightnessMatch = Math.abs(toneHsl.l - tone.lightness) <= 4;

        return hueMatch && saturationMatch && lightnessMatch;
      } catch {
        return false; // Invalid hex color
      }
    });
  }

  /**
   * Gets the standard tone labels in order
   * @returns Array of standard tone labels
   */
  static getStandardLabels(): readonly string[] {
    return this.TONE_STEPS.map(step => step.label);
  }

  /**
   * Gets the standard lightness values in order
   * @returns Array of standard lightness values
   */
  static getStandardLightness(): readonly number[] {
    return this.TONE_STEPS.map(step => step.lightness);
  }
}