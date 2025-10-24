/**
 * LEAGO Brand Colors Configuration
 * Based on LEAGO brand guidelines with primary color #FF5C39 (Muted Orange)
 * Includes light and dark mode variations with proper contrast and accessibility
 */

const tintColorLight = "#FF5C39"; // LEAGO Primary - Muted Orange
const tintColorDark = "#FF7A5C"; // Lighter variation for dark mode visibility

export const Colors = {
  light: {
    // Primary brand colors
    primary: "#FF5C39", // Main LEAGO orange
    primaryLight: "#FF8A6B", // Lighter shade for hover states
    primaryDark: "#E04A29", // Darker shade for pressed states

    // Text colors
    text: "#11181C", // Primary text - dark gray
    textSecondary: "#63666A", // Secondary text - matches brand gray
    textMuted: "#8B8E93", // Muted text for less important content
    textInverse: "#FFFFFF", // White text for dark backgrounds

    // Background colors
    background: "#FFFFFF", // Main background
    backgroundSecondary: "#F8F9FA", // Secondary background
    backgroundTertiary: "#F1F3F4", // Cards, sections

    // Surface colors
    surface: "#FFFFFF", // Card surfaces
    surfaceElevated: "#FFFFFF", // Elevated surfaces (modals, etc.)

    // Interactive elements
    tint: tintColorLight, // Primary interactive color
    icon: "#63666A", // Default icon color (brand gray)
    iconSecondary: "#8B8E93", // Secondary icon color

    // Tab navigation
    tabIconDefault: "#63666A", // Inactive tab icons
    tabIconSelected: tintColorLight, // Active tab icons
    tabBackground: "#FFFFFF", // Tab bar background

    // Status colors
    success: "#28A745", // Success states
    warning: "#FFC107", // Warning states
    error: "#DC3545", // Error states
    info: "#17A2B8", // Info states

    // Border colors
    border: "#E1E5E9", // Default borders
    borderLight: "#F1F3F4", // Light borders
    borderDark: "#D1D5DB", // Darker borders
  },

  dark: {
    // Primary brand colors - adjusted for dark mode
    primary: "#FF7A5C", // Lighter orange for better visibility
    primaryLight: "#FF9B7D", // Even lighter for hover states
    primaryDark: "#FF5C39", // Original orange for pressed states

    // Text colors
    text: "#ECEDEE", // Primary text - light gray
    textSecondary: "#B8BCC2", // Secondary text
    textMuted: "#9BA1A6", // Muted text
    textInverse: "#11181C", // Dark text for light backgrounds

    // Background colors
    background: "#151718", // Main dark background
    backgroundSecondary: "#1C1E20", // Secondary background
    backgroundTertiary: "#242628", // Cards, sections

    // Surface colors
    surface: "#1C1E20", // Card surfaces
    surfaceElevated: "#242628", // Elevated surfaces

    // Interactive elements
    tint: tintColorDark, // Primary interactive color
    icon: "#9BA1A6", // Default icon color
    iconSecondary: "#6B7075", // Secondary icon color

    // Tab navigation
    tabIconDefault: "#9BA1A6", // Inactive tab icons
    tabIconSelected: tintColorDark, // Active tab icons
    tabBackground: "#1C1E20", // Tab bar background

    // Status colors - adjusted for dark mode
    success: "#34D058", // Brighter success for visibility
    warning: "#FFD93D", // Brighter warning
    error: "#F85149", // Brighter error
    info: "#58A6FF", // Brighter info

    // Border colors
    border: "#30363D", // Default borders
    borderLight: "#21262D", // Light borders
    borderDark: "#444950", // Darker borders
  },

  // Brand specific colors (mode-independent)
  brand: {
    orange: "#FF5C39", // Primary LEAGO orange
    orangeLight: "#FF8A6B", // Light orange
    orangeDark: "#E04A29", // Dark orange
    gray: "#63666A", // Brand gray
    white: "#FFFFFF", // Pure white
    black: "#000000", // Pure black
  },

  // Semantic colors for specific use cases
  semantic: {
    // Car category colors
    sedan: "#4A90E2", // Blue for sedan
    suv: "#7ED321", // Green for SUV
    mpv: "#F5A623", // Yellow for MPV

    // Status indicators
    available: "#28A745", // Available cars
    booked: "#FFC107", // Booked cars
    maintenance: "#DC3545", // Under maintenance

    // Pricing tiers
    economy: "#6C757D", // Economy tier
    standard: "#17A2B8", // Standard tier
    premium: "#6F42C1", // Premium tier
    luxury: "#E83E8C", // Luxury tier
  },
};

// Helper functions for color manipulation
export const ColorUtils = {
  /**
   * Add opacity to a hex color
   */
  withOpacity: (color: string, opacity: number): string => {
    const alpha = Math.round(opacity * 255)
      .toString(16)
      .padStart(2, "0");
    return `${color}${alpha}`;
  },

  /**
   * Get appropriate text color for a background
   */
  getTextColor: (
    backgroundColor: string,
    theme: "light" | "dark" = "light"
  ): string => {
    const darkColors = ["#151718", "#1C1E20", "#242628", "#FF5C39", "#E04A29"];
    const isDark = darkColors.some((color) =>
      backgroundColor.toLowerCase().includes(color.toLowerCase())
    );

    if (isDark) {
      return theme === "light" ? Colors.light.textInverse : Colors.dark.text;
    } else {
      return theme === "light" ? Colors.light.text : Colors.dark.textInverse;
    }
  },
};

export default Colors;
