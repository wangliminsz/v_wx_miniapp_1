# i18n Implementation Guide for Vue Storefront

## Overview
This document provides guidelines and best practices for implementing and maintaining internationalization (i18n) in the Vue Storefront application. The application uses Vue I18n for localization support.

## Project Structure

### i18n Files
```
src/i18n/
├── index.js          # Main i18n configuration
└── locales/
    ├── en.js         # English translations
    └── zh.js         # Chinese translations
```

## Adding New Translations

### 1. Adding New Translation Keys

When adding new text elements to the application, follow these steps:

1. **Add the translation key** to the appropriate language files (`src/i18n/locales/en.js` and `src/i18n/locales/zh.js`)
2. **Use the key in components** with `{{ t('namespace.key') }}`

### 2. Translation Key Structure

Translation keys are organized by context:

- **common.** - Common terms used across the application
- **home.** - Homepage-specific terms
- **header.** - Header component terms
- **account.** - User account-related terms
- **checkout.** - Checkout process terms
- **product.** - Product-related terms
- **collection.** - Collection-related terms
- **blog.** - Blog-related terms
- **auth.** - Authentication-related terms

## Best Practices

### 1. Component Implementation

#### Using i18n in Components

```vue
<template>
  <div>
    <!-- Using translation keys -->
    <h1>{{ t('common.home') }}</h1>
    
    <!-- Using dynamic content with translations -->
    <p>{{ t('common.welcome', { name: user.name }) }}</p>
  </div>
</template>

<script>
import { useI18n } from 'vue-i18n'

export default {
  setup() {
    const { t } = useI18n()
    
    return {
      t
    }
  }
}
</script>
```

### 2. Language Switcher

The language switcher component (`LanguageSwitcher.vue`) is used to allow users to change the application language. It is included in both the desktop and mobile headers.

### 3. Persistence

Language preferences are stored in `localStorage` to maintain the user's language choice across sessions.

### 4. Fallback Locale

The fallback locale is set to English (`en`) to ensure all text is displayed even if translations are missing in other languages.

## Maintenance Guidelines

### 1. Adding New Languages

To add a new language:

1. Create a new translation file in `src/i18n/locales/` (e.g., `fr.js` for French)
2. Import the new language file in `src/i18n/index.js`
3. Add the language to the `messages` object in `src/i18n/index.js`
4. Update the `LanguageSwitcher.vue` component to include the new language

### 2. Updating Translations

When updating translations:

1. Update all language files consistently
2. Test the changes in all supported languages
3. Ensure that dynamic content (e.g., product names, collection names) is handled appropriately

### 3. Testing

When testing i18n functionality:

1. Verify that all text elements are properly translated
2. Check that the language switcher works correctly
3. Test that language preferences persist across page reloads
4. Ensure that fallback behavior works when translations are missing

### 4. Dynamic Content

For dynamic content (products, collections, etc.) that comes from the backend:

1. The Vendure backend should be configured to support multiple languages
2. Backend content should be translated in the Vendure admin panel
3. The frontend will display the content as provided by the backend

## Troubleshooting

### Common Issues

1. **Missing Translations**
   - Check that the translation key exists in all language files
   - Verify that the key is being used correctly in the component

2. **Language Switcher Not Working**
   - Check that the `LanguageSwitcher` component is properly imported
   - Verify that the `setLanguage` action is being called correctly

3. **Language Preference Not Persisting**
   - Check that `localStorage` is enabled in the browser
   - Verify that the `setLanguage` method in the store is updating `localStorage`

### Debugging Tips

- Use the browser console to check for translation errors
- Verify that the `i18n` instance is properly initialized
- Check network requests to ensure backend content is being fetched correctly

## Conclusion

This i18n implementation provides a solid foundation for supporting multiple languages in the Vue Storefront application. By following these guidelines, you can ensure that the application remains accessible and user-friendly for customers around the world.
