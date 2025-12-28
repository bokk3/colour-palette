/**
 * Core type definitions for the Color Palette Generator
 */

export interface Color {
  readonly id: string;
  readonly hex: string;
  readonly rgb: { r: number; g: number; b: number };
  readonly hsl: { h: number; s: number; l: number };
  readonly isLocked: boolean;
}

export interface ColorTone {
  readonly label: string;
  readonly lightness: number;
  readonly hex: string;
}

export interface Palette {
  readonly colors: readonly Color[];
  readonly name?: string;
  readonly createdAt: Date;
}

export interface PaletteGenerationOptions {
  readonly preserveLocked: boolean;
  readonly harmonyType: 'random' | 'analogous' | 'complementary';
  readonly saturationRange: readonly [number, number];
  readonly lightnessRange: readonly [number, number];
}