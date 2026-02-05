# Google Analytics Setup Guide

## Overview
LetzPocket now has comprehensive Google Analytics tracking implemented with the following features:

- **Page View Tracking**: Automatic tracking of all page navigation
- **Event Tracking**: CTA clicks, form submissions, feature usage
- **Error Tracking**: Application errors and API failures
- **Conversion Tracking**: Newsletter signups, free review requests

## Setup Instructions

### 1. Update Google Analytics Measurement ID
Replace `GA_MEASUREMENT_ID` in `public/index.html` with your actual Google Analytics measurement ID:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID', {
    page_title: document.title,
    page_location: window.location.href,
  });
</script>
```

### 2. Update Analytics Utility
Also update the measurement ID in `src/lib/analytics.ts`:

```typescript
window.gtag('config', 'GA_MEASUREMENT_ID', {
  page_title: title,
  page_location: window.location.href,
  page_path: window.location.pathname,
});
```

## Tracking Implementation

### Page Names
- `home`: Landing page
- `dashboard`: Main dashboard
- `agreement_review`: Tenancy agreement checker
- `yield_calculator`: Property yield calculator
- `price_estimator`: Property price estimator
- `property_analytics`: Property portfolio analytics
- `admin_panel`: Administrator panel

### Event Categories
- `navigation`: Page navigation and routing
- `authentication`: Login, signup, logout actions
- `feature_usage`: Tool and feature interactions
- `conversion`: CTA clicks and signups
- `error`: Application errors
- `form_submission`: Form interactions

### Key CTA Events Tracked
- **Header Navigation**: Free review, sign in buttons
- **Hero Section**: Chatbot start, view features
- **Free Review Section**: Start review, form submission
- **Pricing Section**: Plan selection (free, professional, enterprise)
- **Newsletter**: Email subscription
- **Chatbot**: Message sending, errors

### Form Tracking
- Form start (when user begins interaction)
- Form completion (successful submission)
- Form abandonment (can be tracked with additional implementation)
- Validation errors

### Error Tracking
- API failures
- Chatbot errors
- Form submission failures
- Authentication errors

## Testing

### 1. Browser Console
Open browser console and check:
```javascript
// Check if gtag is available
typeof window.gtag !== 'undefined'

// Test event tracking
window.gtag('event', 'test_event', {
  event_category: 'testing',
  event_label: 'manual_test'
});
```

### 2. Google Analytics Real-time
1. Go to Google Analytics dashboard
2. Navigate to Real-time > Overview
3. Interact with the website
4. Verify events appear in real-time reports

### 3. Debug Mode
For debugging, you can add debug mode:
```html
gtag('config', 'GA_MEASUREMENT_ID', {
  debug_mode: true
});
```

## Event Examples

### CTA Click
```javascript
trackCTAClick('free_review_start', 'free_review_section');
```

### Form Interaction
```javascript
trackFormInteraction(EVENT_ACTIONS.FORM_COMPLETE, 'newsletter_signup');
```

### Feature Usage
```javascript
trackFeatureUsage('chatbot', 'message_sent', 'lettings_assistant');
```

### Error Tracking
```javascript
trackError('api_error', 'Failed to fetch data', 'dashboard');
```

## Best Practices

1. **Consistent Naming**: Use the predefined constants for event names and categories
2. **Descriptive Labels**: Include context in event labels (button_location, feature_name)
3. **Value Tracking**: Add numeric values for conversion events when applicable
4. **Privacy**: Ensure GDPR compliance and proper data handling

## Next Steps

1. Set up Google Analytics property and get measurement ID
2. Update the placeholder GA_MEASUREMENT_ID in both files
3. Configure goals and conversions in Google Analytics
4. Set up custom dashboards for key metrics
5. Monitor and analyze user behavior data
