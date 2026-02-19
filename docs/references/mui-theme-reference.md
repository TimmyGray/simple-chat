# MUI Theme Reference

Quick reference for the project's MUI 7 dark theme. Source: `frontend/src/theme.ts`.

## Colors

| Token | Value | Usage |
|-------|-------|-------|
| `primary.main` | `#7c4dff` | Buttons, links, user message gradient |
| `primary.light` | `#b47cff` | Hover states |
| `primary.dark` | `#3f1dcb` | Active states |
| `secondary.main` | `#00e5ff` | Accents, secondary actions |
| `background.default` | `#0a0a0f` | Page background |
| `background.paper` | `#12121a` | Cards, drawers, message bubbles |
| `text.primary` | `#e8e8ed` | Main text |
| `text.secondary` | `#9090a0` | Muted text, timestamps |
| `divider` | `rgba(255,255,255,0.08)` | Borders, separators |

## Usage in Components

```tsx
// Access via theme
<Box sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>

// Or via useTheme hook
const theme = useTheme();
theme.palette.primary.main // '#7c4dff'
```

## Typography
- Font: Inter (fallback: Roboto, Helvetica, Arial)
- h6 weight: 600
- Use MUI Typography component variants, not custom font styles

## Spacing
- `theme.spacing(1)` = 8px
- Standard padding: `theme.spacing(2)` = 16px
- Border radius: 12px (shape.borderRadius)
- Button border radius: 10px (override)

## Component Overrides
- **MuiButton:** no uppercase, weight 600, border-radius 10
- **MuiPaper:** no background image
- **MuiDrawer:** right border 1px solid divider color
