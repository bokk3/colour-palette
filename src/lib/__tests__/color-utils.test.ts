/**
 * Property-based tests for color conversion utilities
 * Feature: color-palette-generator
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { ColorConverter } from '../color-utils';

describe('ColorConverter Property Tests', () => {
  /**
   * Property 4: Color Conversion Round-Trip
   * Feature: color-palette-generator, Property 4: Color Conversion Round-Trip
   * Validates: Requirements 2.1, 2.4
   */
  it('should maintain color values through HSL→RGB→HEX→HSL round-trip conversion', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 360 }), // hue
        fc.integer({ min: 60, max: 100 }), // saturation (palette generator range)
        fc.integer({ min: 40, max: 70 }), // lightness (palette generator range)
        (h, s, l) => {
          // Convert HSL → RGB → HEX → HSL
          const rgb = ColorConverter.hslToRgb(h, s, l);
          const hex = ColorConverter.rgbToHex(rgb.r, rgb.g, rgb.b);
          const finalHsl = ColorConverter.hexToHsl(hex);

          // Allow for small rounding errors due to precision limits
          const hueError = Math.abs(finalHsl.h - h);
          const satError = Math.abs(finalHsl.s - s);
          const lightError = Math.abs(finalHsl.l - l);

          // Handle hue wraparound (0 and 360 are the same)
          const normalizedHueError = Math.min(hueError, Math.abs(hueError - 360));

          // Tolerance for rounding errors in conversion
          const tolerance = 2;

          return (
            normalizedHueError <= tolerance &&
            satError <= tolerance &&
            lightError <= tolerance
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional round-trip test: RGB→HSL→RGB
   * Feature: color-palette-generator, Property 4: Color Conversion Round-Trip
   * Validates: Requirements 2.1, 2.4
   */
  it('should maintain color values through RGB→HSL→RGB round-trip conversion', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 20, max: 235 }), // red (reasonable range)
        fc.integer({ min: 20, max: 235 }), // green (reasonable range)
        fc.integer({ min: 20, max: 235 }), // blue (reasonable range)
        (r, g, b) => {
          // Skip colors that are too close to grayscale (where hue is unstable)
          const maxVal = Math.max(r, g, b);
          const minVal = Math.min(r, g, b);
          if (maxVal - minVal < 20) {
            return true; // Skip near-grayscale colors
          }

          // Convert RGB → HSL → RGB
          const hsl = ColorConverter.rgbToHsl(r, g, b);
          const finalRgb = ColorConverter.hslToRgb(hsl.h, hsl.s, hsl.l);

          // Allow for small rounding errors
          const tolerance = 3;

          return (
            Math.abs(finalRgb.r - r) <= tolerance &&
            Math.abs(finalRgb.g - g) <= tolerance &&
            Math.abs(finalRgb.b - b) <= tolerance
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * HEX round-trip test: HEX→RGB→HEX
   * Feature: color-palette-generator, Property 4: Color Conversion Round-Trip
   * Validates: Requirements 2.1, 2.4
   */
  it('should maintain color values through HEX→RGB→HEX round-trip conversion', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 })
        ),
        ([r, g, b]) => {
          // Create HEX from RGB values
          const hex = ColorConverter.rgbToHex(r, g, b);
          
          // Convert HEX → RGB → HEX
          const rgb = ColorConverter.hexToRgb(hex);
          const finalHex = ColorConverter.rgbToHex(rgb.r, rgb.g, rgb.b);

          return hex === finalHex;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Color Format Completeness Property Tests', () => {
  /**
   * Property 3: Color Format Completeness
   * Feature: color-palette-generator, Property 3: Color Format Completeness
   * Validates: Requirements 1.5
   */
  it('should provide valid HEX, RGB, and HSL formats for any generated color', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 360 }), // hue
        fc.integer({ min: 0, max: 100 }), // saturation
        fc.integer({ min: 0, max: 100 }), // lightness
        (h, s, l) => {
          const color = ColorConverter.createColorFromHsl(h, s, l);

          // Verify HEX format
          const hexValid = ColorConverter.isValidHex(color.hex);
          
          // Verify RGB format
          const rgbValid = ColorConverter.isValidRgb(color.rgb.r, color.rgb.g, color.rgb.b);
          
          // Verify HSL format
          const hslValid = ColorConverter.isValidHsl(color.hsl.h, color.hsl.s, color.hsl.l);

          // Verify all formats are present and valid
          return (
            hexValid &&
            rgbValid &&
            hslValid &&
            typeof color.hex === 'string' &&
            color.hex.length === 7 &&
            color.hex.startsWith('#') &&
            typeof color.rgb === 'object' &&
            typeof color.hsl === 'object' &&
            typeof color.id === 'string' &&
            color.id.length > 0 &&
            typeof color.isLocked === 'boolean'
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Color creation from RGB should provide complete formats
   * Feature: color-palette-generator, Property 3: Color Format Completeness
   * Validates: Requirements 1.5
   */
  it('should provide complete color formats when creating from RGB values', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 255 }), // red
        fc.integer({ min: 0, max: 255 }), // green
        fc.integer({ min: 0, max: 255 }), // blue
        (r, g, b) => {
          const color = ColorConverter.createColorFromRgb(r, g, b);

          return (
            ColorConverter.isValidHex(color.hex) &&
            ColorConverter.isValidRgb(color.rgb.r, color.rgb.g, color.rgb.b) &&
            ColorConverter.isValidHsl(color.hsl.h, color.hsl.s, color.hsl.l) &&
            color.rgb.r === r &&
            color.rgb.g === g &&
            color.rgb.b === b &&
            typeof color.id === 'string' &&
            color.id.length > 0
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Color creation from HEX should provide complete formats
   * Feature: color-palette-generator, Property 3: Color Format Completeness
   * Validates: Requirements 1.5
   */
  it('should provide complete color formats when creating from HEX values', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 })
        ),
        ([r, g, b]) => {
          // Create HEX from RGB values
          const hex = ColorConverter.rgbToHex(r, g, b);
          const color = ColorConverter.createColorFromHex(hex);

          return (
            color.hex === hex &&
            ColorConverter.isValidRgb(color.rgb.r, color.rgb.g, color.rgb.b) &&
            ColorConverter.isValidHsl(color.hsl.h, color.hsl.s, color.hsl.l) &&
            typeof color.id === 'string' &&
            color.id.length > 0
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});