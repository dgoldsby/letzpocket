// Google Analytics utility functions
import React from 'react';

declare global {
  interface Window {
    gtag: (command: string, ...args: any[]) => void;
  }
}

// Page names for consistent tracking
export const PAGE_NAMES = {
  HOME: 'home',
  DASHBOARD: 'dashboard',
  LOGIN: 'login',
  SIGNUP: 'signup',
  AGREEMENT_REVIEW: 'agreement_review',
  PRICE_ESTIMATOR: 'price_estimator',
  PROPERTY_ANALYTICS: 'property_analytics',
  YIELD_CALCULATOR: 'yield_calculator',
  CONTENT_MANAGEMENT: 'content_management',
  ADMIN_PANEL: 'admin_panel',
} as const;

// Event categories for consistent tracking
export const EVENT_CATEGORIES = {
  NAVIGATION: 'navigation',
  AUTHENTICATION: 'authentication',
  FEATURE_USAGE: 'feature_usage',
  CONVERSION: 'conversion',
  ERROR: 'error',
  FORM_SUBMISSION: 'form_submission',
} as const;

// Event actions for consistent tracking
export const EVENT_ACTIONS = {
  // Navigation
  CLICK_NAVIGATION: 'click_navigation',
  PAGE_VIEW: 'page_view',
  
  // Authentication
  LOGIN_ATTEMPT: 'login_attempt',
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  SIGNUP_ATTEMPT: 'signup_attempt',
  SIGNUP_SUCCESS: 'signup_success',
  SIGNUP_FAILED: 'signup_failed',
  LOGOUT: 'logout',
  
  // Feature Usage
  UPLOAD_AGREEMENT: 'upload_agreement',
  START_REVIEW: 'start_review',
  CALCULATE_PRICE: 'calculate_price',
  CALCULATE_YIELD: 'calculate_yield',
  VIEW_ANALYTICS: 'view_analytics',
  DOWNLOAD_REPORT: 'download_report',
  
  // CTA Actions - More specific naming
  CTA_BOT_START: 'cta_bot_start',
  CTA_FEATURES_VIEW: 'cta_features_view',
  CTA_SIGN_IN: 'cta_sign_in',
  CTA_FREE_REVIEW_START: 'cta_free_review_start',
  CTA_FREE_REVIEW_NAVIGATION: 'cta_free_review_navigation',
  CTA_FREE_REVIEW_PRICING: 'cta_free_review_pricing',
  CTA_PROFESSIONAL_PLAN: 'cta_professional_plan',
  CTA_ENTERPRISE_PLAN: 'cta_enterprise_plan',
  CTA_NEWSLETTER_SUBSCRIBE: 'cta_newsletter_subscribe',
  CTA_CHATBOT_START: 'cta_chatbot_start',
  
  // Form Submission
  FORM_START: 'form_start',
  FORM_COMPLETE: 'form_complete',
  FORM_ABANDON: 'form_abandon',
  VALIDATION_ERROR: 'validation_error',
  
  // Error
  ERROR_OCCURRED: 'error_occurred',
  API_ERROR: 'api_error',
} as const;

// Check if gtag is available
const isGtagAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
};

// Track page views
export const trackPageView = (pageName: string, pageTitle?: string): void => {
  if (!isGtagAvailable()) return;

  const title = pageTitle || pageName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  window.gtag('config', 'G-GJV6TEN7VC', {
    page_title: title,
    page_location: window.location.href,
    page_path: window.location.pathname,
  });
  
  // Also send as event for better tracking
  window.gtag('event', EVENT_ACTIONS.PAGE_VIEW, {
    event_category: EVENT_CATEGORIES.NAVIGATION,
    page_name: pageName,
    page_title: title,
  });
};

// Track custom events
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
): void => {
  if (!isGtagAvailable()) return;

  const eventParams: any = {
    event_category: category,
  };

  if (label) eventParams.event_label = label;
  if (value !== undefined) eventParams.value = value;

  window.gtag('event', action, eventParams);
};

// Track specific CTA clicks with unique action names
export const trackCTAClick = (ctaAction: string, location: string, value?: number): void => {
  trackEvent(
    ctaAction,
    EVENT_CATEGORIES.CONVERSION,
    location,
    value
  );
};

// Track form interactions
export const trackFormInteraction = (
  action: string,
  formName: string,
  step?: string
): void => {
  const label = step ? `${formName}_${step}` : formName;
  trackEvent(action, EVENT_CATEGORIES.FORM_SUBMISSION, label);
};

// Track errors
export const trackError = (errorType: string, errorMessage: string, context?: string): void => {
  const label = context ? `${errorType}_${context}` : errorType;
  trackEvent(EVENT_ACTIONS.ERROR_OCCURRED, EVENT_CATEGORIES.ERROR, label);
};

// Track feature usage
export const trackFeatureUsage = (featureName: string, action: string, details?: string): void => {
  const label = details ? `${featureName}_${action}_${details}` : `${featureName}_${action}`;
  trackEvent(action, EVENT_CATEGORIES.FEATURE_USAGE, label);
};

// Hook for tracking page views in React components
export const usePageTracking = (pageName: string, pageTitle?: string) => {
  React.useEffect(() => {
    trackPageView(pageName, pageTitle);
  }, [pageName, pageTitle]);
};
