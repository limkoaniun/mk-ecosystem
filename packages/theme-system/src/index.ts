/**
 * Placeholder theme system for theme-system package
 * This will be expanded during the training program
 */

export interface SeedToken {
  colorPrimary?: string;
  colorSuccess?: string;
  colorWarning?: string;
  colorError?: string;
  fontSize?: number;
  borderRadius?: number;
}

export interface AliasToken extends SeedToken {
  colorText?: string;
  colorBg?: string;
  controlHeight?: number;
}

export interface ThemeConfig {
  token?: Partial<SeedToken>;
}

/**
 * Creates a theme from seed tokens
 * @param seed - Seed token values
 * @returns Complete alias token set
 */
export function createTheme(seed?: Partial<SeedToken>): AliasToken {
  return {
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    fontSize: 14,
    borderRadius: 6,
    colorText: '#000000d9',
    colorBg: '#ffffff',
    controlHeight: 32,
    ...seed,
  };
}

export { type SeedToken as Seed, type AliasToken as Token };