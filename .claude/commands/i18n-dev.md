# i18n Development Guidelines

When developing any frontend UI in this project, you MUST follow these internationalization rules:

## Rules

1. **Never hardcode user-facing strings** in React components, hooks, or utilities. Always use the `t()` function from `react-i18next`.

2. **Import pattern for functional components and hooks:**
   ```tsx
   import { useTranslation } from 'react-i18next';

   export default function MyComponent() {
     const { t } = useTranslation();
     return <p>{t('namespace.key')}</p>;
   }
   ```

3. **Import pattern for class components:**
   ```tsx
   import i18n from '../i18n';
   // use i18n.t('namespace.key') in render
   ```

4. **When creating new UI text**, add the translation key to ALL 4 locale files:
   - `frontend/src/i18n/locales/en.json` (English)
   - `frontend/src/i18n/locales/ru.json` (Russian)
   - `frontend/src/i18n/locales/zh.json` (Chinese Simplified)
   - `frontend/src/i18n/locales/es.json` (Spanish/Mexican)

5. **Key naming convention** — use dot-separated namespaces:
   - `sidebar.*` — sidebar UI elements
   - `chat.*` — chat area UI elements
   - `dialog.*` — dialog/modal titles and messages
   - `common.*` — shared buttons and labels (Cancel, Delete, etc.)
   - `models.*` — model-related labels
   - `errors.*` — error messages

6. **Interpolation** — for dynamic values, use `{{variable}}` syntax:
   ```tsx
   t('errors.maxFileCount', { count: 5 })
   // en.json: "You can attach up to {{count}} files at a time."
   ```

7. **Date formatting** — use the i18n locale for `toLocaleDateString()`:
   ```tsx
   const { i18n } = useTranslation();
   new Date(timestamp).toLocaleDateString(i18n.language)
   ```

8. **Provide real translations** — do not leave placeholder text. Write proper translations for all 4 languages (English, Russian, Chinese, Spanish).

## Translation File Location
All translation files are at: `frontend/src/i18n/locales/{lang}.json`

## i18n Config
The i18n setup is at: `frontend/src/i18n/index.ts`
