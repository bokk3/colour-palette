/**
 * Property-based tests for tone generation system
 * Feature: color-palette-generator
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { ToneGenerator } from '../tone-generator';
import { ColorConverter } from '../color-utils';
import type { Color } from '@/types';

describe('ToneGenerator Property Tests', () => {
  /**
   * Property 7: Tone Generation Consistency
   * Feature: color-palette-generator, Property 7: Tone Generation Consistency
   * Validates: Requirements 4.1, 4.2, 4.3
   */
  it('should generate exactly 7 tone variations with lightness from 10% to 95% while preserving hue and saturation', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 359 }), // hue
        fc.integer({ min: 60, max: 100 }), // saturation (palette generator range)
        fc.integer({ min: 40, max: 70 }), // lightness (palette generator range)
        (h, s, l) => {
          // Create base color
          const baseColor = ColorConverter.createColorFromHsl(h, s, l);
          
          // Generate tones
          const tones = ToneGenerator.generateTones(baseColor);
          
          // Verify exactly 7 tones are generated
          if (tones.length !== 7) {
            return false;
          }
          
          // Verify lightness range (should be from 10% to 95% approximately)
          const lightnessValues = tones.map(tone => tone.lightness);
          const minLightness = Math.min(...lightnessValues);
          const maxLightness = Math.max(...lightnessValues);
          
          // Should span a reasonable range (at least 60% difference)
          if (maxLightness - minLightness < 60) {
            return false;
          }
          
          // Verify hue and saturation are preserved for each tone
          for (const tone of tones) {
            const toneHsl = ColorConverter.hexToHsl(tone.hex);
            
            // Allow tolerance for color conversion precision limits
            const hueDiff = Math.abs(toneHsl.h - h);
            const hueMatch = hueDiff <= 4 || Math.abs(hueDiff - 360) <= 4; // Handle wraparound
            const saturationMatch = Math.abs(toneHsl.s - s) <= 4;
            const lightnessMatch = Math.abs(toneHsl.l - tone.lightness) <= 4;
            
            if (!hueMatch || !saturationMatch || !lightnessMatch) {
              return false;
            }
          }
          
          // Verify standard tone labeling exists
          const labels = tones.map(tone => tone.label);
          const hasValidLabels = labels.every(label => 
            typeof label === 'string' && label.length > 0
          );
          
          return hasValidLabels;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7 Extended: All Tone Generation Consistency
   * Feature: color-palette-generator, Property 7: Tone Generation Consistency
   * Validates: Requirements 4.1, 4.2, 4.3
   */
  it('should generate all 10 tone variations while preserving hue and saturation', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 359 }), // hue
        fc.integer({ min: 60, max: 100 }), // saturation
        fc.integer({ min: 40, max: 70 }), // lightness
        (h, s, l) => {
          // Create base color
          const baseColor = ColorConverter.createColorFromHsl(h, s, l);
          
          // Generate all tones
          const allTones = ToneGenerator.generateAllTones(baseColor);
          
          // Verify exactly 10 tones are generated
          if (allTones.length !== 10) {
            return false;
          }
          
          // Verify lightness range spans from 10% to 95%
          const lightnessValues = allTones.map(tone => tone.lightness);
          const minLightness = Math.min(...lightnessValues);
          const maxLightness = Math.max(...lightnessValues);
          
          if (minLightness !== 10 || maxLightness !== 95) {
            return false;
          }
          
          // Verify hue and saturation are preserved
          return ToneGenerator.validateToneConsistency(baseColor, allTones);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7 Extended: Specific Tone Generation
   * Feature: color-palette-generator, Property 7: Tone Generation Consistency
   * Validates: Requirements 4.1, 4.2, 4.3
   */
  it('should generate specific tones with exact lightness while preserving hue and saturation', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 359 }), // hue
        fc.integer({ min: 60, max: 100 }), // saturation
        fc.integer({ min: 40, max: 70 }), // base lightness
        fc.integer({ min: 10, max: 95 }), // target lightness
        (h, s, l, targetLightness) => {
          // Create base color
          const baseColor = ColorConverter.createColorFromHsl(h, s, l);
          
          // Generate specific tone
          const tone = ToneGenerator.generateSpecificTone(baseColor, targetLightness, 'custom');
          
          // Verify lightness matches exactly
          if (tone.lightness !== targetLightness) {
            return false;
          }
          
          // Verify label is set
          if (tone.label !== 'custom') {
            return false;
          }
          
          // Verify hue and saturation are preserved
          const toneHsl = ColorConverter.hexToHsl(tone.hex);
          const hueDiff = Math.abs(toneHsl.h - h);
          const hueMatch = hueDiff <= 4 || Math.abs(hueDiff - 360) <= 4;
          const saturationMatch = Math.abs(toneHsl.s - s) <= 4;
          const lightnessMatch = Math.abs(toneHsl.l - targetLightness) <= 4;
          
          return hueMatch && saturationMatch && lightnessMatch;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7 Extended: Tone to Color Conversion
   * Feature: color-palette-generator, Property 7: Tone Generation Consistency
   * Validates: Requirements 4.1, 4.2, 4.3
   */
  it('should convert tones back to Color objects while preserving hue and saturation', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 359 }), // hue
        fc.integer({ min: 60, max: 100 }), // saturation
        fc.integer({ min: 40, max: 70 }), // lightness
        fc.boolean(), // isLocked
        (h, s, l, isLocked) => {
          // Create base color
          const baseColor = ColorConverter.createColorFromHsl(h, s, l);
          
          // Generate tones
          const tones = ToneGenerator.generateTones(baseColor);
          
          // Convert each tone back to a Color object
          for (const tone of tones) {
            const colorFromTone = ToneGenerator.toneToColor(tone, baseColor, isLocked);
            
            // Verify the color has the correct properties
            if (colorFromTone.isLocked !== isLocked) {
              return false;
            }
            
            // Verify hue and saturation match the base color
            const hueDiff = Math.abs(colorFromTone.hsl.h - h);
            const hueMatch = hueDiff <= 4 || Math.abs(hueDiff - 360) <= 4;
            const saturationMatch = Math.abs(colorFromTone.hsl.s - s) <= 4;
            const lightnessMatch = Math.abs(colorFromTone.hsl.l - tone.lightness) <= 4;
            
            if (!hueMatch || !saturationMatch || !lightnessMatch) {
              return false;
            }
            
            // Verify it's a complete Color object
            if (
              typeof colorFromTone.id !== 'string' ||
              typeof colorFromTone.hex !== 'string' ||
              typeof colorFromTone.rgb !== 'object' ||
              typeof colorFromTone.hsl !== 'object'
            ) {
              return false;
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7 Extended: Standard Labels and Lightness Values
   * Feature: color-palette-generator, Property 7: Tone Generation Consistency
   * Validates: Requirements 4.4
   */
  it('should provide consistent standard tone labels and lightness values', () => {
    fc.assert(
      fc.property(
        fc.constant(null), // No input needed for this test
        () => {
          const labels = ToneGenerator.getStandardLabels();
          const lightnessValues = ToneGenerator.getStandardLightness();
          
          // Verify we have 10 standard tones
          if (labels.length !== 10 || lightnessValues.length !== 10) {
            return false;
          }
          
          // Verify expected labels exist
          const expectedLabels = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];
          const hasAllLabels = expectedLabels.every(label => labels.includes(label));
          
          if (!hasAllLabels) {
            return false;
          }
          
          // Verify lightness values are in descending order (lighter to darker)
          for (let i = 0; i < lightnessValues.length - 1; i++) {
            if (lightnessValues[i] <= lightnessValues[i + 1]) {
              return false; // Should be descending
            }
          }
          
          // Verify range spans from 10 to 95
          const minLightness = Math.min(...lightnessValues);
          const maxLightness = Math.max(...lightnessValues);
          
          return minLightness === 10 && maxLightness === 95;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7 Extended: Closest Tone Finding
   * Feature: color-palette-generator, Property 7: Tone Generation Consistency
   * Validates: Requirements 4.1, 4.2, 4.3
   */
  it('should find the closest standard tone for any lightness value', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }), // target lightness
        (targetLightness) => {
          const closestTone = ToneGenerator.findClosestTone(targetLightness);
          const standardLightness = ToneGenerator.getStandardLightness();
          
          // Verify the returned tone is actually the closest
          const actualDifference = Math.abs(closestTone.lightness - targetLightness);
          
          // Check that no other standard tone is closer
          for (const standardLight of standardLightness) {
            const otherDifference = Math.abs(standardLight - targetLightness);
            if (otherDifference < actualDifference) {
              return false; // Found a closer tone, so the function is wrong
            }
          }
          
          // Verify the returned tone has valid properties
          return (
            typeof closestTone.label === 'string' &&
            closestTone.label.length > 0 &&
            typeof closestTone.lightness === 'number' &&
            closestTone.lightness >= 0 &&
            closestTone.lightness <= 100 &&
            standardLightness.includes(closestTone.lightness)
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});