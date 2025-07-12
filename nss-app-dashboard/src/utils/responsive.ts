// Responsive utilities and constants for NSS Dashboard
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export const PWA_CONSTANTS = {
  MIN_TOUCH_TARGET: 44, // minimum 44px touch targets for PWA
  MOBILE_SIDEBAR_WIDTH: 280,
  DESKTOP_SIDEBAR_WIDTH: 224, // 56 * 4 = 224px (w-56)
  COLLAPSED_SIDEBAR_WIDTH: 70,
  HEADER_HEIGHT: 64, // 16 * 4 = 64px (h-16)
  MOBILE_HEADER_HEIGHT: 56,
} as const;

export const RESPONSIVE_CLASSES = {
  // Container classes for different screen sizes
  container: {
    mobile: "px-4 py-3",
    tablet: "px-6 py-4",
    desktop: "px-8 py-6",
  },
  // Grid responsive classes
  grid: {
    mobile: "grid-cols-1",
    tablet: "grid-cols-2 lg:grid-cols-3",
    desktop: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  },
  // Text size responsive classes
  text: {
    title: "text-lg md:text-xl lg:text-2xl",
    subtitle: "text-sm md:text-base",
    body: "text-xs md:text-sm",
    caption: "text-xs",
  },
  // Spacing responsive classes
  spacing: {
    section: "space-y-4 md:space-y-6",
    element: "space-y-2 md:space-y-3",
    inline: "space-x-2 md:space-x-3",
  },
} as const;

// Hook for responsive behavior
export const useResponsive = () => {
  const getScreenSize = () => {
    if (typeof window === "undefined") return "desktop";

    const width = window.innerWidth;
    if (width < BREAKPOINTS.md) return "mobile";
    if (width < BREAKPOINTS.lg) return "tablet";
    return "desktop";
  };

  return {
    screenSize: getScreenSize(),
    isMobile: () => getScreenSize() === "mobile",
    isTablet: () => getScreenSize() === "tablet",
    isDesktop: () => getScreenSize() === "desktop",
    isMobileOrTablet: () => ["mobile", "tablet"].includes(getScreenSize()),
  };
};

// Utility functions for responsive design
export const getResponsiveValue = <T>(
  mobile: T,
  tablet: T = mobile,
  desktop: T = tablet,
): T => {
  if (typeof window === "undefined") return desktop;

  const width = window.innerWidth;
  if (width < BREAKPOINTS.md) return mobile;
  if (width < BREAKPOINTS.lg) return tablet;
  return desktop;
};

export const generateResponsiveClasses = (
  mobileClass: string,
  tabletClass?: string,
  desktopClass?: string,
): string => {
  const classes = [mobileClass];
  if (tabletClass) classes.push(`md:${tabletClass}`);
  if (desktopClass) classes.push(`lg:${desktopClass}`);
  return classes.join(" ");
};
