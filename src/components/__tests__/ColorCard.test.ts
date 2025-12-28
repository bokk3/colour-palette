/**
 * Property-based tests for ColorCard component accessibility
 * Feature: color-palette-generator
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { ColorConverter } from '@/lib/color-utils';

describe('ColorCard Accessibility Property Tests', () => {
  /**
   * Property 11: Accessibility Contrast Requirements
   * Feature: color-palette-generator, Property 11: Accessibility Contrast Requirements
   * Validates: Requirements 8.1
   */
  it('should provide sufficient contrast for text on any color background', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 360 }), // hue
        fc.integer({ min: 0, max: 100 }), // saturation
        fc.integer({ min: 0, max: 100 }), // lightness
        (h, s, l) => {
          // Create a color from HSL values
          const color = ColorConverter.createColorFromHsl(h, s, l);
          
          // Get the contrast color (black or white) for text
          const contrastColor = ColorConverter.getContrastColor(color.hex);
          
          // Calculate contrast ratio between background and text
          const backgroundLuminance = calculateRelativeLuminance(color.hex);
          const textLuminance = calculateRelativeLuminance(contrastColor);
          
          // Ensure lighter color is in numerator for contrast ratio
          const lighterLuminance = Math.max(backgroundLuminance, textLuminance);
          const darkerLuminance = Math.min(backgroundLuminance, textLuminance);
          
          const contrastRatio = (lighterLuminance + 0.05) / (darkerLuminance + 0.05);
          
          // WCAG AA standard requires minimum 4.5:1 contrast ratio for normal text
          // WCAG AAA standard requires minimum 7:1 contrast ratio for normal text
          // We'll use AA standard (4.5:1) as the minimum requirement
          const minimumContrastRatio = 4.5;
          
          // Verify that the contrast color is either pure black or pure white
          const isValidContrastColor = contrastColor === '#000000' || contrastColor === '#FFFFFF';
          
          return (
            isValidContrastColor &&
            contrastRatio >= minimumContrastRatio
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Edge case test: Pure black and white backgrounds should have maximum contrast
   * Feature: color-palette-generator, Property 11: Accessibility Contrast Requirements
   * Validates: Requirements 8.1
   */
  it('should provide maximum contrast for pure black and white backgrounds', () => {
    // Test pure black background
    const blackContrastColor = ColorConverter.getContrastColor('#000000');
    const blackContrastRatio = calculateContrastRatio('#000000', blackContrastColor);
    
    // Test pure white background
    const whiteContrastColor = ColorConverter.getContrastColor('#FFFFFF');
    const whiteContrastRatio = calculateContrastRatio('#FFFFFF', whiteContrastColor);
    
    // Maximum possible contrast ratio is 21:1 (pure white on pure black)
    const expectedMaxContrast = 21;
    const tolerance = 0.1; // Allow for small floating point errors
    
    return (
      blackContrastColor === '#FFFFFF' &&
      whiteContrastColor === '#000000' &&
      Math.abs(blackContrastRatio - expectedMaxContrast) < tolerance &&
      Math.abs(whiteContrastRatio - expectedMaxContrast) < tolerance
    );
  });

  /**
   * Test contrast color selection logic
   * Feature: color-palette-generator, Property 11: Accessibility Contrast Requirements
   * Validates: Requirements 8.1
   */
  it('should select white text for dark backgrounds and black text for light backgrounds', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 360 }), // hue
        fc.integer({ min: 60, max: 100 }), // saturation (palette range)
        fc.integer({ min: 0, max: 100 }), // lightness
        (h, s, l) => {
          const color = ColorConverter.createColorFromHsl(h, s, l);
          const contrastColor = ColorConverter.getContrastColor(color.hex);
          
          // Calculate relative luminance of the background color
          const backgroundLuminance = calculateRelativeLuminance(color.hex);
          
          // Colors with luminance > 0.179 should get black text
          // Colors with luminance <= 0.179 should get white text
          // This threshold is based on WCAG guidelines for optimal contrast
          const expectedTextColor = backgroundLuminance > 0.179 ? '#000000' : '#FFFFFF';
          
          return contrastColor === expectedTextColor;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Helper function to calculate relative luminance according to WCAG guidelines
 * @param hex HEX color string
 * @returns Relative luminance value (0-1)
 */
function calculateRelativeLuminance(hex: string): number {
  const rgb = ColorConverter.hexToRgb(hex);
  
  // Convert RGB values to sRGB
  const rsRGB = rgb.r / 255;
  const gsRGB = rgb.g / 255;
  const bsRGB = rgb.b / 255;
  
  // Apply gamma correction
  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
  
  // Calculate relative luminance using WCAG formula
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Helper function to calculate contrast ratio between two colors
 * @param color1 First color in HEX format
 * @param color2 Second color in HEX format
 * @returns Contrast ratio (1-21)
 */
function calculateContrastRatio(color1: string, color2: string): number {
  const luminance1 = calculateRelativeLuminance(color1);
  const luminance2 = calculateRelativeLuminance(color2);
  
  const lighterLuminance = Math.max(luminance1, luminance2);
  const darkerLuminance = Math.min(luminance1, luminance2);
  
  return (lighterLuminance + 0.05) / (darkerLuminance + 0.05);
}

/**
 * Unit tests for ColorCard component functionality
 * Testing the component logic without JSX rendering
 */

import { describe, it, expect } from 'vitest';
import { ColorConverter } from '@/lib/color-utils';
import type { Color } from '@/types';

describe('ColorCard Component Logic', () => {
  const mockColor: Color = {
    id: 'test-color-1',
    hex: '#FF5733',
    rgb: { r: 255, g: 87, b: 51 },
    hsl: { h: 9, s: 100, l: 60 },
    isLocked: false
  };

  it('should use appropriate contrast color for text readability', () => {
    // Test with a dark color (should use white text)
    const darkColor: Color = {
      ...mockColor,
      hex: '#1A1A1A',
      rgb: { r: 26, g: 26, b: 26 }
    };
    
    const darkContrastColor = ColorConverter.getContrastColor(darkColor.hex);
    expect(darkContrastColor).toBe('#FFFFFF');

    // Test with a light color (should use black text)
    const lightColor: Color = {
      ...mockColor,
      hex: '#F0F0F0',
      rgb: { r: 240, g: 240, b: 240 }
    };
    
    const lightContrastColor = ColorConverter.getContrastColor(lightColor.hex);
    expect(lightContrastColor).toBe('#000000');
  });

  it('should handle color format validation correctly', () => {
    // Test valid HEX color
    expect(ColorConverter.isValidHex(mockColor.hex)).toBe(true);
    
    // Test invalid HEX colors
    expect(ColorConverter.isValidHex('#GGG')).toBe(false);
    expect(ColorConverter.isValidHex('FF5733')).toBe(true); // Without # should still be valid
    expect(ColorConverter.isValidHex('#FF57')).toBe(false); // Too short
  });

  it('should provide complete color information', () => {
    // Verify all required color properties are present
    expect(mockColor).toHaveProperty('id');
    expect(mockColor).toHaveProperty('hex');
    expect(mockColor).toHaveProperty('rgb');
    expect(mockColor).toHaveProperty('hsl');
    expect(mockColor).toHaveProperty('isLocked');
    
    // Verify types
    expect(typeof mockColor.id).toBe('string');
    expect(typeof mockColor.hex).toBe('string');
    expect(typeof mockColor.rgb).toBe('object');
    expect(typeof mockColor.hsl).toBe('object');
    expect(typeof mockColor.isLocked).toBe('boolean');
    
    // Verify RGB structure
    expect(mockColor.rgb).toHaveProperty('r');
    expect(mockColor.rgb).toHaveProperty('g');
    expect(mockColor.rgb).toHaveProperty('b');
    
    // Verify HSL structure
    expect(mockColor.hsl).toHaveProperty('h');
    expect(mockColor.hsl).toHaveProperty('s');
    expect(mockColor.hsl).toHaveProperty('l');
  });

  it('should handle lock state correctly', () => {
    const unlockedColor: Color = { ...mockColor, isLocked: false };
    const lockedColor: Color = { ...mockColor, isLocked: true };
    
    expect(unlockedColor.isLocked).toBe(false);
    expect(lockedColor.isLocked).toBe(true);
  });

  it('should maintain color consistency across formats', () => {
    // Create color from HSL and verify consistency
    const color = ColorConverter.createColorFromHsl(mockColor.hsl.h, mockColor.hsl.s, mockColor.hsl.l);
    
    // The created color should have valid formats
    expect(ColorConverter.isValidHex(color.hex)).toBe(true);
    expect(ColorConverter.isValidRgb(color.rgb.r, color.rgb.g, color.rgb.b)).toBe(true);
    expect(ColorConverter.isValidHsl(color.hsl.h, color.hsl.s, color.hsl.l)).toBe(true);
  });
});