'use client'

import { useState, useEffect } from 'react'
import { BREAKPOINTS, PWA_CONSTANTS } from '@/utils/responsive'

export type ScreenSize = 'mobile' | 'tablet' | 'desktop'

export interface ResponsiveLayoutState {
  screenSize: ScreenSize
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isMobileOrTablet: boolean
  sidebarCollapsed: boolean
  showMobileMenu: boolean
  windowWidth: number
  windowHeight: number
}

export const useResponsiveLayout = () => {
  const [state, setState] = useState<ResponsiveLayoutState>({
    screenSize: 'desktop',
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isMobileOrTablet: false,
    sidebarCollapsed: false,
    showMobileMenu: false,
    windowWidth: 1024,
    windowHeight: 768,
  })

  const getScreenSize = (width: number): ScreenSize => {
    if (width < BREAKPOINTS.md) return 'mobile'
    if (width < BREAKPOINTS.lg) return 'tablet'
    return 'desktop'
  }

  const updateLayout = () => {
    if (typeof window === 'undefined') return

    const width = window.innerWidth
    const height = window.innerHeight
    const screenSize = getScreenSize(width)
    const isMobile = screenSize === 'mobile'
    const isTablet = screenSize === 'tablet'
    const isDesktop = screenSize === 'desktop'
    const isMobileOrTablet = isMobile || isTablet

    setState(prev => ({
      ...prev,
      screenSize,
      isMobile,
      isTablet,
      isDesktop,
      isMobileOrTablet,
      windowWidth: width,
      windowHeight: height,
      // Auto-collapse sidebar on mobile/tablet
      sidebarCollapsed: isMobileOrTablet ? true : prev.sidebarCollapsed,
      // Close mobile menu when switching to desktop
      showMobileMenu: isDesktop ? false : prev.showMobileMenu,
    }))
  }

  useEffect(() => {
    // Initial setup
    updateLayout()

    // Add resize listener
    const handleResize = () => updateLayout()
    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [updateLayout])

  const toggleSidebar = () => {
    setState(prev => ({
      ...prev,
      sidebarCollapsed: !prev.sidebarCollapsed
    }))
  }

  const toggleMobileMenu = () => {
    setState(prev => ({
      ...prev,
      showMobileMenu: !prev.showMobileMenu
    }))
  }

  const closeMobileMenu = () => {
    setState(prev => ({
      ...prev,
      showMobileMenu: false
    }))
  }

  const getSidebarWidth = () => {
    if (state.isMobile) {
      return state.showMobileMenu ? PWA_CONSTANTS.MOBILE_SIDEBAR_WIDTH : 0
    }
    return state.sidebarCollapsed 
      ? PWA_CONSTANTS.COLLAPSED_SIDEBAR_WIDTH 
      : PWA_CONSTANTS.DESKTOP_SIDEBAR_WIDTH
  }

  const getHeaderHeight = () => {
    return state.isMobile 
      ? PWA_CONSTANTS.MOBILE_HEADER_HEIGHT 
      : PWA_CONSTANTS.HEADER_HEIGHT
  }

  const getContentPadding = () => {
    if (state.isMobile) return 'p-4'
    if (state.isTablet) return 'p-6'
    return 'p-8'
  }

  const getGridColumns = () => {
    if (state.isMobile) return 'grid-cols-1'
    if (state.isTablet) return 'grid-cols-2'
    
    // Desktop: Check if screen is very large (> 2000px) for 5 columns
    const isVeryLargeScreen = state.windowWidth > 2000
    
    return isVeryLargeScreen
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  }

  return {
    ...state,
    toggleSidebar,
    toggleMobileMenu,
    closeMobileMenu,
    getSidebarWidth,
    getHeaderHeight,
    getContentPadding,
    getGridColumns,
    updateLayout,
  }
} 