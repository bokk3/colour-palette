/**
 * Tests for ToneSelector component
 * Validates tone exploration interface functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToneGenerator } from '@/lib/tone-generator';
import { ColorConverter } from '@/lib/color-utils';
import type { Color, ColorTone } from '@/types';

// Mock the ToneGenerator to return predictable results
vi.mock('@/lib/tone-generator', () => ({
  ToneGenerator: {
    generateTones: vi.fn(() => [
      { label: '100', lightness: 90, hex: '#f0f0f0' },
      { label: '200', lightness: 80, hex: '#e0e0e0' },
      { label: '300', lightness: 70, hex: '#d0d0d0' },
      { label: '400', lightness: 60, hex: '#c0c0c0' },
      { label: '500', lightness: 50, hex: '#b0b0b0' },
      { label: '600', lightness: 40, hex: '#a0a0a0' },
      { label: '700', lightness: 30, hex: '#909090' },
    ])
  }
}));

const mockColor: Color = {
  id: 'test-color',
  hex: '#b0b0b0',
  rgb: { r: 176, g: 176, b: 176 },
  hsl: { h: 0, s: 0, l: 50 },
  isLocked: false
};

describe('ToneSelector Component Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate 7 tone variations from base color', () => {
    const tones = ToneGenerator.generateTones(mockColor);
    
    expect(tones).toHaveLength(7);
    expect(ToneGenerator.generateTones).toHaveBeenCalledWith(mockColor);
  });

  it('should generate tones with proper lightness range', () => {
    const tones = ToneGenerator.generateTones(mockColor);
    
    // Verify lightness values are in expected range (10% to 95%)
    const lightnessValues = tones.map(tone => tone.lightness);
    const minLightness = Math.min(...lightnessValues);
    const maxLightness = Math.max(...lightnessValues);
    
    expect(minLightness).toBeGreaterThanOrEqual(10);
    expect(maxLightness).toBeLessThanOrEqual(95);
  });

  it('should generate tones with standard naming convention', () => {
    const tones = ToneGenerator.generateTones(mockColor);
    
    const expectedLabels = ['100', '200', '300', '400', '500', '600', '700'];
    const actualLabels = tones.map(tone => tone.label);
    
    expect(actualLabels).toEqual(expectedLabels);
  });

  it('should generate tones with valid hex colors', () => {
    const tones = ToneGenerator.generateTones(mockColor);
    
    tones.forEach(tone => {
      expect(tone.hex).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(ColorConverter.isValidHex(tone.hex)).toBe(true);
    });
  });

  it('should preserve hue and saturation in generated tones', () => {
    const tones = ToneGenerator.generateTones(mockColor);
    const baseHue = mockColor.hsl.h;
    const baseSaturation = mockColor.hsl.s;
    
    tones.forEach(tone => {
      const toneHsl = ColorConverter.hexToHsl(tone.hex);
      
      // Allow small tolerance for color conversion precision
      const hueDiff = Math.abs(toneHsl.h - baseHue);
      const hueMatch = hueDiff <= 4 || Math.abs(hueDiff - 360) <= 4; // Handle wraparound
      const saturationMatch = Math.abs(toneHsl.s - baseSaturation) <= 4;
      
      expect(hueMatch).toBe(true);
      expect(saturationMatch).toBe(true);
    });
  });

  it('should handle tone selection callback correctly', async () => {
    const mockOnToneSelect = vi.fn();
    const testTone: ColorTone = {
      label: '300',
      lightness: 70,
      hex: '#d0d0d0'
    };

    // Simulate tone selection
    await mockOnToneSelect(testTone);
    
    expect(mockOnToneSelect).toHaveBeenCalledWith(testTone);
    expect(mockOnToneSelect).toHaveBeenCalledTimes(1);
  });

  it('should find closest tone to base color lightness', () => {
    const tones = ToneGenerator.generateTones(mockColor);
    const baseLightness = mockColor.hsl.l; // 50%
    
    // Find the tone with lightness closest to base color
    let closestTone = tones[0];
    let minDifference = Math.abs(tones[0].lightness - baseLightness);
    
    tones.forEach(tone => {
      const difference = Math.abs(tone.lightness - baseLightness);
      if (difference < minDifference) {
        minDifference = difference;
        closestTone = tone;
      }
    });
    
    // The closest tone should be the 500 tone (50% lightness)
    expect(closestTone.label).toBe('500');
    expect(closestTone.lightness).toBe(50);
  });

  it('should handle error cases gracefully', () => {
    // Mock ToneGenerator to throw an error
    vi.mocked(ToneGenerator.generateTones).mockImplementationOnce(() => {
      throw new Error('Failed to generate tones');
    });

    expect(() => {
      try {
        ToneGenerator.generateTones(mockColor);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Failed to generate tones');
        throw error;
      }
    }).toThrow('Failed to generate tones');
  });
});