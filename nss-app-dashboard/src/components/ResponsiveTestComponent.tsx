"use client";

import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";

export function ResponsiveTestComponent() {
  const layout = useResponsiveLayout();

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs z-50 backdrop-blur">
      <div className="space-y-1">
        <div>Screen: {layout.screenSize}</div>
        <div>Width: {layout.windowWidth}px</div>
        <div>Height: {layout.windowHeight}px</div>
        <div>Mobile: {layout.isMobile ? "Yes" : "No"}</div>
        <div>Tablet: {layout.isTablet ? "Yes" : "No"}</div>
        <div>Desktop: {layout.isDesktop ? "Yes" : "No"}</div>
        <div>Sidebar: {layout.sidebarCollapsed ? "Collapsed" : "Expanded"}</div>
        <div>Mobile Menu: {layout.showMobileMenu ? "Open" : "Closed"}</div>
      </div>
    </div>
  );
}
