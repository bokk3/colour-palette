/**
 * Color conversion utilities with high precision
 * Supports HSL, RGB, and HEX format conversions
 */

import type { Color } from '@/types';

export class ColorConverter {
  /**
   * Converts HSL values to RGB
   * @param h Hue (0-360)
   * @param s Saturation (0-100)
   * @param l Lightness (0-100)
   * @returns RGB object with r, g, b values (0-255)
   */
  static hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    // Normalize values
    h = ((h % 360) + 360) % 360; // Ensure positive hue
    s = Math.max(0, Math.min(100, s)) / 100;
    l = Math.max(0, Math.min(100, l)) / 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) {
      r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
      r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
      r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
      r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
      r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
      r = c; g = 0; b = x;
    }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    };
  }

  /**
   * Converts RGB values to HSL
   * @param r Red (0-255)
   * @param g Green (0-255)
   * @param b Blue (0-255)
   * @returns HSL object with h, s, l values
   */
  static rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    // Normalize RGB values
    r = Math.max(0, Math.min(255, r)) / 255;
    g = Math.max(0, Math.min(255, g)) / 255;
    b = Math.max(0, Math.min(255, b)) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    // Lightness
    const l = (max + min) / 2;

    let h = 0;
    let s = 0;

    if (diff !== 0) {
      // Saturation
      s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);

      // Hue
      switch (max) {
        case r:
          h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / diff + 2) / 6;
          break;
        case b:
          h = ((r - g) / diff + 4) / 6;
          break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  /**
   * Converts RGB values to HEX string
   * @param r Red (0-255)
   * @param g Green (0-255)
   * @param b Blue (0-255)
   * @returns HEX string (e.g., "#FF5733")
   */
  static rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number): string => {
      const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }

  /**
   * Converts HEX string to RGB values
   * @param hex HEX string (e.g., "#FF5733" or "FF5733")
   * @returns RGB object with r, g, b values (0-255)
   */
  static hexToRgb(hex: string): { r: number; g: number; b: number } {
    // Remove # if present and ensure uppercase
    const cleanHex = hex.replace('#', '').toUpperCase();
    
    if (cleanHex.length !== 6) {
      throw new Error(`Invalid HEX color format: ${hex}`);
    }

    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);

    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      throw new Error(`Invalid HEX color format: ${hex}`);
    }

    return { r, g, b };
  }

  /**
   * Converts HEX string to HSL values
   * @param hex HEX string (e.g., "#FF5733")
   * @returns HSL object with h, s, l values
   */
  static hexToHsl(hex: string): { h: number; s: number; l: number } {
    const rgb = this.hexToRgb(hex);
    return this.rgbToHsl(rgb.r, rgb.g, rgb.b);
  }

  /**
   * Converts HSL values to HEX string
   * @param h Hue (0-360)
   * @param s Saturation (0-100)
   * @param l Lightness (0-100)
   * @returns HEX string (e.g., "#FF5733")
   */
  static hslToHex(h: number, s: number, l: number): string {
    const rgb = this.hslToRgb(h, s, l);
    return this.rgbToHex(rgb.r, rgb.g, rgb.b);
  }

  /**
   * Determines the best contrast color (black or white) for text on a given background
   * @param hex Background color in HEX format
   * @returns "#000000" or "#FFFFFF" for optimal contrast
   */
  static getContrastColor(hex: string): string {
    const rgb = this.hexToRgb(hex);
    
    // Calculate relative luminance using WCAG formula
    const getLuminance = (c: number): number => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };

    const r = getLuminance(rgb.r);
    const g = getLuminance(rgb.g);
    const b = getLuminance(rgb.b);

    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    // Return white for dark backgrounds, black for light backgrounds
    return luminance > 0.179 ? '#000000' : '#FFFFFF';
  }

  /**
   * Validates if a string is a valid HEX color
   * @param hex String to validate
   * @returns true if valid HEX color
   */
  static isValidHex(hex: string): boolean {
    const cleanHex = hex.replace('#', '');
    return /^[0-9A-Fa-f]{6}$/.test(cleanHex);
  }

  /**
   * Validates HSL values
   * @param h Hue (0-360)
   * @param s Saturation (0-100)
   * @param l Lightness (0-100)
   * @returns true if all values are valid
   */
  static isValidHsl(h: number, s: number, l: number): boolean {
    return (
      typeof h === 'number' && h >= 0 && h <= 360 &&
      typeof s === 'number' && s >= 0 && s <= 100 &&
      typeof l === 'number' && l >= 0 && l <= 100
    );
  }

  /**
   * Validates RGB values
   * @param r Red (0-255)
   * @param g Green (0-255)
   * @param b Blue (0-255)
   * @returns true if all values are valid
   */
  static isValidRgb(r: number, g: number, b: number): boolean {
    return (
      typeof r === 'number' && r >= 0 && r <= 255 &&
      typeof g === 'number' && g >= 0 && g <= 255 &&
      typeof b === 'number' && b >= 0 && b <= 255
    );
  }

  /**
   * Creates a complete Color object from HSL values
   * @param h Hue (0-360)
   * @param s Saturation (0-100)
   * @param l Lightness (0-100)
   * @param isLocked Whether the color is locked (default: false)
   * @returns Complete Color object with all formats
   */
  static createColorFromHsl(h: number, s: number, l: number, isLocked: boolean = false): Color {
    if (!this.isValidHsl(h, s, l)) {
      throw new Error(`Invalid HSL values: h=${h}, s=${s}, l=${l}`);
    }

    const rgb = this.hslToRgb(h, s, l);
    const hex = this.rgbToHex(rgb.r, rgb.g, rgb.b);

    return {
      id: crypto.randomUUID(),
      hex,
      rgb,
      hsl: { h, s, l },
      isLocked
    };
  }

  /**
   * Creates a complete Color object from RGB values
   * @param r Red (0-255)
   * @param g Green (0-255)
   * @param b Blue (0-255)
   * @param isLocked Whether the color is locked (default: false)
   * @returns Complete Color object with all formats
   */
  static createColorFromRgb(r: number, g: number, b: number, isLocked: boolean = false): Color {
    if (!this.isValidRgb(r, g, b)) {
      throw new Error(`Invalid RGB values: r=${r}, g=${g}, b=${b}`);
    }

    const hex = this.rgbToHex(r, g, b);
    const hsl = this.rgbToHsl(r, g, b);

    return {
      id: crypto.randomUUID(),
      hex,
      rgb: { r, g, b },
      hsl,
      isLocked
    };
  }

  /**
   * Creates a complete Color object from HEX string
   * @param hex HEX color string
   * @param isLocked Whether the color is locked (default: false)
   * @returns Complete Color object with all formats
   */
  static createColorFromHex(hex: string, isLocked: boolean = false): Color {
    if (!this.isValidHex(hex)) {
      throw new Error(`Invalid HEX color: ${hex}`);
    }

    const rgb = this.hexToRgb(hex);
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);

    return {
      id: crypto.randomUUID(),
      hex: hex.toUpperCase(),
      rgb,
      hsl,
      isLocked
    };
  }
}