import { colors } from './tokens';

const tintColorDark = colors.accent.default;

// Backward-compat wrapper — old code uses Colors.colors.*
// New code should import from tokens.ts directly
const legacyColors = {
  bg: { base: colors.bg.base, card: colors.bg.surface, elevated: colors.bg.elevated },
  text: { primary: colors.text.primary, secondary: colors.text.tertiary },
  purple: { default: colors.accent.decorative, light: colors.accent.default },
  success: colors.success,
  danger: colors.danger,
  warning: colors.warning,
  info: colors.info,
  border: colors.border.default,
};

export default {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorDark,
    tabIconDefault: '#687076',
    tabIconSelected: tintColorDark,
  },
  dark: {
    text: colors.text.primary,
    background: colors.bg.base,
    tint: tintColorDark,
    tabIconDefault: colors.text.muted,
    tabIconSelected: tintColorDark,
  },
  colors: legacyColors,
};
