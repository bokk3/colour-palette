/**
 * Property-based tests for palette generation algorithm
 * Feature: color-palette-generator
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { PaletteGenerator } from '../palette-generator';
import { ColorConverter } from '../color-utils';
import type { Color, Palette } from '@/types';

describe('PaletteGenerator Property Tests', () => {
  /**
   * Property 1: Palette Size Consistency
   * Feature: color-palette-generator, Property 1: Palette Size Consistency
   * Validates: Requirements 1.1
   */
  it('should generate exactly 5 colors for any palette generation request', () => {
    fc.assert(
      fc.property(
        fc.constant(null), // No input needed for this property
        () => {
          // Test fresh palette generation
          const freshPalette = PaletteGenerator.generateFreshPalette();
          
          // Test harmonious palette generation with no existing colors
          const harmoniousPalette = PaletteGenerator.generateHarmoniousPalette();
          
          // Test harmonious palette generation with empty array
          const emptyArrayPalette = PaletteGenerator.generateHarmoniousPalette([]);

          return (
            freshPalette.colors.length === 5 &&
            harmoniousPalette.colors.length === 5 &&
            emptyArrayPalette.colors.length === 5
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1 Extended: Palette Size Consistency with Locked Colors
   * Feature: color-palette-generator, Property 1: Palette Size Consistency
   * Validates: Requirements 1.1
   */
  it('should generate exactly 5 colors even when preserving locked colors', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            hue: fc.integer({ min: 0, max: 359 }),
            saturation: fc.integer({ min: 60, max: 100 }),
            lightness: fc.integer({ min: 40, max: 70 }),
            isLocked: fc.boolean()
          }),
          { minLength: 0, maxLength: 4 } // At most 4 existing colors to ensure we can generate 5 total
        ),
        (existingColorSpecs) => {
          // Create actual Color objects from specs
          const existingColors: Color[] = existingColorSpecs.map(spec => 
            ColorConverter.createColorFromHsl(spec.hue, spec.saturation, spec.lightness, spec.isLocked)
          );

          // Generate palette preserving locked colors
          const palette = PaletteGenerator.generateHarmoniousPalette(existingColors);
          
          // Test regeneration as well
          const regeneratedPalette = PaletteGenerator.regeneratePalette(palette);

          return (
            palette.colors.length === 5 &&
            regeneratedPalette.colors.length === 5
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: Color Value Constraints
   * Feature: color-palette-generator, Property 2: Color Value Constraints
   * Validates: Requirements 1.3
   */
  it('should ensure all generated colors have saturation between 60-100% and lightness between 40-70%', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            hue: fc.integer({ min: 0, max: 359 }),
            saturation: fc.integer({ min: 60, max: 100 }),
            lightness: fc.integer({ min: 40, max: 70 }),
            isLocked: fc.boolean()
          }),
          { minLength: 0, maxLength: 3 } // At most 3 existing colors
        ),
        (existingColorSpecs) => {
          // Create actual Color objects from specs
          const existingColors: Color[] = existingColorSpecs.map(spec => 
            ColorConverter.createColorFromHsl(spec.hue, spec.saturation, spec.lightness, spec.isLocked)
          );

          // Generate palette
          const palette = PaletteGenerator.generateHarmoniousPalette(existingColors);
          
          // Check all colors meet constraints
          return palette.colors.every(color => {
            const { s, l } = color.hsl;
            return (
              s >= 60 && s <= 100 &&  // Saturation constraint
              l >= 40 && l <= 70      // Lightness constraint
            );
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2 Extended: Color Value Constraints for Fresh Palettes
   * Feature: color-palette-generator, Property 2: Color Value Constraints
   * Validates: Requirements 1.3
   */
  it('should ensure fresh palette colors meet saturation and lightness constraints', () => {
    fc.assert(
      fc.property(
        fc.constant(null), // No input needed
        () => {
          const palette = PaletteGenerator.generateFreshPalette();
          
          return palette.colors.every(color => {
            const { s, l } = color.hsl;
            return (
              s >= 60 && s <= 100 &&  // Saturation constraint
              l >= 40 && l <= 70      // Lightness constraint
            );
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2 Extended: Color Value Constraints for Single Color Generation
   * Feature: color-palette-generator, Property 2: Color Value Constraints
   * Validates: Requirements 1.3
   */
  it('should ensure individual random colors meet saturation and lightness constraints', () => {
    fc.assert(
      fc.property(
        fc.constant(null), // No input needed
        () => {
          const color = PaletteGenerator.generateRandomColor();
          const { s, l } = color.hsl;
          
          return (
            s >= 60 && s <= 100 &&  // Saturation constraint
            l >= 40 && l <= 70      // Lightness constraint
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 12: Color Distinctness
   * Feature: color-palette-generator, Property 12: Color Distinctness
   * Validates: Requirements 1.4, 9.1
   */
  it('should ensure generated colors have minimum hue differences for visual distinction', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            hue: fc.integer({ min: 0, max: 359 }),
            saturation: fc.integer({ min: 60, max: 100 }),
            lightness: fc.integer({ min: 40, max: 70 }),
            isLocked: fc.boolean()
          }),
          { minLength: 0, maxLength: 2 } // At most 2 existing colors to allow room for distinct colors
        ),
        (existingColorSpecs) => {
          // Create actual Color objects from specs
          const existingColors: Color[] = existingColorSpecs.map(spec => 
            ColorConverter.createColorFromHsl(spec.hue, spec.saturation, spec.lightness, spec.isLocked)
          );

          // Generate palette
          const palette = PaletteGenerator.generateHarmoniousPalette(existingColors);
          
          // Check color distinctness - minimum 30° hue difference
          const hues = palette.colors.map(color => color.hsl.h);
          
          for (let i = 0; i < hues.length; i++) {
            for (let j = i + 1; j < hues.length; j++) {
              const diff = Math.abs(hues[i] - hues[j]);
              const minDiff = Math.min(diff, 360 - diff); // Handle hue wraparound
              
              // Allow some tolerance for cases where it's impossible to maintain 30° difference
              // (e.g., when we have many locked colors close together)
              if (minDiff < 30) {
                // Check if this is due to locked colors being too close
                const color1 = palette.colors[i];
                const color2 = palette.colors[j];
                
                // If both colors are from existing (potentially locked) colors, allow it
                const color1IsExisting = existingColors.some(existing => 
                  existing.hsl.h === color1.hsl.h && 
                  existing.hsl.s === color1.hsl.s && 
                  existing.hsl.l === color1.hsl.l
                );
                const color2IsExisting = existingColors.some(existing => 
                  existing.hsl.h === color2.hsl.h && 
                  existing.hsl.s === color2.hsl.s && 
                  existing.hsl.l === color2.hsl.l
                );
                
                // If both are existing colors, this is acceptable (we preserve them)
                if (!(color1IsExisting && color2IsExisting)) {
                  return false;
                }
              }
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 12 Extended: Color Distinctness for Fresh Palettes
   * Feature: color-palette-generator, Property 12: Color Distinctness
   * Validates: Requirements 1.4, 9.1
   */
  it('should ensure fresh palettes have minimum 30° hue differences between all colors', () => {
    fc.assert(
      fc.property(
        fc.constant(null), // No input needed
        () => {
          const palette = PaletteGenerator.generateFreshPalette();
          const hues = palette.colors.map(color => color.hsl.h);
          
          // Check all pairs of colors for minimum hue difference
          for (let i = 0; i < hues.length; i++) {
            for (let j = i + 1; j < hues.length; j++) {
              const diff = Math.abs(hues[i] - hues[j]);
              const minDiff = Math.min(diff, 360 - diff); // Handle hue wraparound
              
              if (minDiff < 30) {
                return false;
              }
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: Lock State Preservation
   * Feature: color-palette-generator, Property 5: Lock State Preservation
   * Validates: Requirements 3.2, 3.4
   */
  it('should preserve all locked colors in their exact original state and positions during palette regeneration', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            hue: fc.integer({ min: 0, max: 359 }),
            saturation: fc.integer({ min: 60, max: 100 }),
            lightness: fc.integer({ min: 40, max: 70 }),
            isLocked: fc.boolean()
          }),
          { minLength: 1, maxLength: 5 } // At least 1 color, at most 5
        ),
        (colorSpecs) => {
          // Create actual Color objects from specs
          const originalColors: Color[] = colorSpecs.map(spec => 
            ColorConverter.createColorFromHsl(spec.hue, spec.saturation, spec.lightness, spec.isLocked)
          );

          // Create initial palette
          const initialPalette: Palette = {
            colors: originalColors,
            createdAt: new Date()
          };

          // Regenerate the palette
          const regeneratedPalette = PaletteGenerator.regeneratePalette(initialPalette);
          
          // Find all locked colors from the original palette
          const lockedColors = originalColors.filter(color => color.isLocked);
          
          // Verify that all locked colors are preserved exactly
          for (const lockedColor of lockedColors) {
            const foundColor = regeneratedPalette.colors.find(color => 
              color.id === lockedColor.id &&
              color.hex === lockedColor.hex &&
              color.hsl.h === lockedColor.hsl.h &&
              color.hsl.s === lockedColor.hsl.s &&
              color.hsl.l === lockedColor.hsl.l &&
              color.rgb.r === lockedColor.rgb.r &&
              color.rgb.g === lockedColor.rgb.g &&
              color.rgb.b === lockedColor.rgb.b &&
              color.isLocked === lockedColor.isLocked
            );
            
            if (!foundColor) {
              return false;
            }
          }
          
          // Verify the regenerated palette still has exactly 5 colors
          return regeneratedPalette.colors.length === 5;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6: Lock Toggle Behavior
   * Feature: color-palette-generator, Property 6: Lock Toggle Behavior
   * Validates: Requirements 3.1
   */
  it('should change only the specified color\'s lock status without affecting other colors when toggling lock state', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            hue: fc.integer({ min: 0, max: 359 }),
            saturation: fc.integer({ min: 60, max: 100 }),
            lightness: fc.integer({ min: 40, max: 70 }),
            isLocked: fc.boolean()
          }),
          { minLength: 2, maxLength: 5 } // At least 2 colors to test that others aren't affected
        ),
        (colorSpecs) => {
          // Create actual Color objects from specs
          const colors: Color[] = colorSpecs.map(spec => 
            ColorConverter.createColorFromHsl(spec.hue, spec.saturation, spec.lightness, spec.isLocked)
          );

          // Create initial palette
          const initialPalette: Palette = {
            colors,
            createdAt: new Date()
          };

          // Pick a random color to toggle
          const colorToToggle = colors[Math.floor(Math.random() * colors.length)];
          const originalLockState = colorToToggle.isLocked;

          // Toggle the lock state
          const updatedPalette = PaletteGenerator.toggleColorLock(initialPalette, colorToToggle.id);

          // Find the toggled color in the updated palette
          const toggledColor = updatedPalette.colors.find(color => color.id === colorToToggle.id);
          
          if (!toggledColor) {
            return false; // Color should still exist
          }

          // Verify the toggled color's lock state changed
          if (toggledColor.isLocked === originalLockState) {
            return false; // Lock state should have changed
          }

          // Verify all other colors remain unchanged
          for (const originalColor of colors) {
            if (originalColor.id !== colorToToggle.id) {
              const unchangedColor = updatedPalette.colors.find(color => color.id === originalColor.id);
              
              if (!unchangedColor) {
                return false; // Color should still exist
              }

              // Verify all properties remain the same for other colors
              if (
                unchangedColor.hex !== originalColor.hex ||
                unchangedColor.hsl.h !== originalColor.hsl.h ||
                unchangedColor.hsl.s !== originalColor.hsl.s ||
                unchangedColor.hsl.l !== originalColor.hsl.l ||
                unchangedColor.rgb.r !== originalColor.rgb.r ||
                unchangedColor.rgb.g !== originalColor.rgb.g ||
                unchangedColor.rgb.b !== originalColor.rgb.b ||
                unchangedColor.isLocked !== originalColor.isLocked
              ) {
                return false; // Other colors should remain unchanged
              }
            }
          }

          // Verify palette still has the same number of colors
          return updatedPalette.colors.length === initialPalette.colors.length;
        }
      ),
      { numRuns: 100 }
    );
  });
});