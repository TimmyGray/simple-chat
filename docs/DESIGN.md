# UI/UX Design System

Design reference for the Simple Chat frontend. Use this when implementing new components, adjusting styles, or maintaining visual consistency.

## Theme Configuration

**File:** `frontend/src/theme.ts`

MUI 7 `createTheme` with `mode: 'dark'`.

---

## Color Palette

### Primary

| Token | Value | Usage |
|---|---|---|
| `primary.main` | `#7c4dff` | Buttons, focus rings, active states, typing indicator dots |
| `primary.light` | `#b47cff` | Links in markdown, selected language toggle text |
| `primary.dark` | `#3f1dcb` | Button hover states |

### Secondary

| Token | Value | Usage |
|---|---|---|
| `secondary.main` | `#00e5ff` | Assistant avatar gradient start |

### Background

| Token | Value | Usage |
|---|---|---|
| `background.default` | `#0a0a0f` | Page background (very dark, near-black) |
| `background.paper` | `#12121a` | Sidebar, cards, drawers |

### Text

| Token | Value | Usage |
|---|---|---|
| `text.primary` | `#e8e8ed` | Primary body text |
| `text.secondary` | `#9090a0` | Muted labels, timestamps, captions |

### Divider

| Token | Value | Usage |
|---|---|---|
| `divider` | `rgba(255, 255, 255, 0.08)` | Borders between sections, drawer border |

### Semantic Colors (MUI defaults, dark mode)

| Token | Usage |
|---|---|
| `error.main` | Delete button, error Snackbar, delete icon hover |
| `success` | "Free" model badge chip |

---

## Typography

| Property | Value |
|---|---|
| Font family | `"Inter", "Roboto", "Helvetica", "Arial", sans-serif` |
| h6 font weight | 600 |
| Code font family | `"Fira Code", "Consolas", monospace` |
| Code font size | `0.85rem` |

### Text Sizes in Use

| Context | Variant / Size |
|---|---|
| Sidebar title | `h6` (600 weight) |
| Message content | `body2` |
| Timestamps, captions | `caption` + `text.secondary` |
| Code blocks | `0.85rem` monospace |
| Model selector text | `0.8rem` |
| Language switcher | `0.7rem` |
| "Free" badge | `0.65rem` |
| Chat input | `0.95rem`, line-height 1.5 |

---

## Shape

| Property | Value |
|---|---|
| Default border radius | `12px` (theme.shape.borderRadius) |
| Button border radius | `10px` |
| Conversation item radius | `8px` (borderRadius: 2 = 2 * 4px) |
| Chat input container radius | `12px` (borderRadius: 3) |
| Code block radius | `8px` |

---

## Component Overrides

### MuiButton
- `textTransform: 'none'` -- no uppercase
- `fontWeight: 600`
- `borderRadius: 10`

### MuiPaper
- `backgroundImage: 'none'` -- removes default MUI gradient overlay

### MuiDrawer
- `paper.borderRight: '1px solid rgba(255, 255, 255, 0.08)'`

---

## Layout

### Desktop (>= 900px, `md` breakpoint)

```
+------------------+----------------------------------------+
|                  |                                        |
|  Sidebar (280px) |           Chat Area (flex: 1)          |
|  persistent      |                                        |
|  background.paper|  background.default                    |
|                  |                                        |
|  1px right border|  px: 32px (md)                         |
|                  |                                        |
+------------------+----------------------------------------+
```

### Mobile (< 900px)

```
+----------------------------------------+
| [Menu] (fixed, top-left)               |
|                                        |
|           Chat Area (100%)             |
|           px: 16px (xs)                |
|                                        |
+----------------------------------------+

Sidebar opens as temporary MUI Drawer (280px width)
Menu button hidden when drawer is open
```

### Key Dimensions

| Element | Value |
|---|---|
| Sidebar width | `280px` |
| Mobile breakpoint | `md` (900px) |
| Full height | `100vh` with `overflow: hidden` on root |
| Message max width | `75%` of container |
| Avatar size | `34px` circle |
| Send button | `36px` square |
| Model selector min width | `140px` |

---

## Spacing Scale

MUI default spacing unit: `8px`. Values in the codebase use the multiplier.

| MUI Value | Pixels | Common Usage |
|---|---|---|
| `0.5` | 4px | Small gaps (attachment chips, dot spacing) |
| `0.75` | 6px | Toolbar padding |
| `1` | 8px | Component gaps, list item margin |
| `1.5` | 12px | Message gap, bubble padding-y, mobile menu offset |
| `2` | 16px | Standard container padding, section spacing |
| `3` | 24px | Chat input container radius (borderRadius: 3) |
| `4` | 32px | Desktop message list horizontal padding, loading spinner top padding |

---

## Message Bubble Styles

### User Messages (right-aligned)

```
Background:  rgba(124, 77, 255, 0.12)   -- purple tint
Border:      1px solid rgba(124, 77, 255, 0.2)
Radius:      16px 16px 4px 16px          -- flat bottom-right corner
Text:        body2, white-space: pre-wrap
Avatar:      linear-gradient(135deg, #7c4dff, #448aff) -- purple to blue
Icon:        PersonIcon (white)
```

### Assistant Messages (left-aligned)

```
Background:  rgba(255, 255, 255, 0.05)  -- subtle light tint
Border:      1px solid rgba(255, 255, 255, 0.08)
Radius:      16px 16px 16px 4px          -- flat bottom-left corner
Text:        Full Markdown via ReactMarkdown
Avatar:      linear-gradient(135deg, #00e5ff, #1de9b6) -- cyan to mint
Icon:        SmartToyIcon (black)
Model tag:   caption, text.secondary, opacity 0.6
```

### Markdown Rendering (assistant only)

- **Plugin stack:** remarkGfm + rehypeSanitize
- **Code blocks:** Prism syntax highlighter with `oneDark` theme, 8px border radius
- **Inline code:** `rgba(255, 255, 255, 0.1)` background, 4px padding-x
- **Links:** `primary.light` color (#b47cff)
- **Tables:** collapsed borders, `rgba(255, 255, 255, 0.15)` border, alternating row tint
- **Blockquotes:** 3px left border in `primary.main`, 1.5 left padding, 0.8 opacity
- **Lists:** 16px left padding

---

## Interactive States

### Chat Input Focus

```
Default border:  divider color (rgba(255, 255, 255, 0.08))
Focused border:  primary.main (#7c4dff)
Focus ring:      box-shadow 0 0 0 2px rgba(124, 77, 255, 0.15)
Transition:      border-color 0.2s ease, box-shadow 0.2s ease
```

### Conversation Item

```
Default:         transparent background
Hover:           MUI default ListItemButton hover
Selected:        rgba(124, 77, 255, 0.12) background
Selected hover:  rgba(124, 77, 255, 0.18) background
Delete icon:     opacity 0 -> 1 on hover (0.2s transition)
Delete hover:    color changes to error.main
```

### New Chat Button

```
Default:   linear-gradient(135deg, #7c4dff 0%, #448aff 100%)
Hover:     linear-gradient(135deg, #651fff 0%, #2979ff 100%)
```

### Language Switcher

```
Default:         text.secondary color, divider borders
Selected:        rgba(124, 77, 255, 0.15) background, primary.light text
Selected hover:  rgba(124, 77, 255, 0.25) background
```

### Send Button

```
Default:     primary.main background, white icon
Hover:       primary.dark background
Disabled:    action.disabledBackground, action.disabled color
```

### Model Selector

```
Border default:  rgba(255, 255, 255, 0.08)
Border hover:    rgba(255, 255, 255, 0.16)
Border focused:  primary.main, 1px width
```

---

## Animations

### Typing Indicator

Three dots with bouncing animation:

```css
@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}

/* Per dot: */
animation: bounce 1.2s infinite;
animation-delay: 0s, 0.15s, 0.3s; /* staggered */

/* Dot specs: */
width: 8px;
height: 8px;
border-radius: 50%;
color: primary.main;
```

### Auto-scroll

`MessageList` scrolls to bottom on new messages and streaming content changes using `scrollIntoView({ behavior: 'smooth' })`.

---

## Gradients Reference

| Name | Value | Used In |
|---|---|---|
| User avatar | `linear-gradient(135deg, #7c4dff 0%, #448aff 100%)` | MessageBubble, NewChatButton |
| User avatar hover | `linear-gradient(135deg, #651fff 0%, #2979ff 100%)` | NewChatButton hover |
| Assistant avatar | `linear-gradient(135deg, #00e5ff 0%, #1de9b6 100%)` | MessageBubble |

---

## Transparency Levels

These rgba values are used consistently throughout the codebase:

| Value | Usage |
|---|---|
| `rgba(255, 255, 255, 0.03)` | Chat input background, table alternating rows |
| `rgba(255, 255, 255, 0.04)` | Chat input toolbar border |
| `rgba(255, 255, 255, 0.05)` | Assistant message bubble background |
| `rgba(255, 255, 255, 0.08)` | Dividers, borders, table headers, model selector border, drawer border |
| `rgba(255, 255, 255, 0.10)` | Inline code background |
| `rgba(255, 255, 255, 0.15)` | Table cell borders |
| `rgba(255, 255, 255, 0.16)` | Model selector hover border |
| `rgba(124, 77, 255, 0.12)` | User bubble background, selected conversation, selected language |
| `rgba(124, 77, 255, 0.15)` | Chat input focus ring, language switcher selected |
| `rgba(124, 77, 255, 0.18)` | Selected conversation hover |
| `rgba(124, 77, 255, 0.20)` | User bubble border |
| `rgba(124, 77, 255, 0.25)` | Language switcher selected hover |

---

## Accessibility

### Color Contrast

- Text primary (`#e8e8ed`) on default background (`#0a0a0f`): **~17:1** ratio (AAA)
- Text secondary (`#9090a0`) on default background (`#0a0a0f`): **~7.5:1** ratio (AAA)
- Text primary on paper background (`#12121a`): **~15:1** ratio (AAA)
- Primary color (`#7c4dff`) on dark background: **~4.6:1** ratio (AA for large text)

### Keyboard Navigation

- Tab order follows document flow.
- Enter key sends messages in ChatInput.
- Shift+Enter inserts newline.
- MUI Dialog traps focus when open (ConfirmDialog).
- MUI Drawer manages focus on open/close.
- Delete icon buttons are keyboard-accessible (in tab order).

### Focus Indicators

- Chat input: visible focus ring (`box-shadow` + border color change).
- Buttons, list items, toggles: MUI default focus-visible outlines.
- Model selector: border color change on focus.

### Screen Reader Support

- Semantic MUI components (`Button`, `List`, `ListItemButton`, `Dialog`, `Typography`).
- Tooltip on send button and attach button provides accessible labels.
- Dialog has `DialogTitle` and `DialogContentText` for screen reader context.
- Empty state uses heading + descriptive text hierarchy.

---

## Design Tokens Quick Reference

Copy-paste reference for common values:

```typescript
// Backgrounds
'background.default'              // #0a0a0f -- page
'background.paper'                // #12121a -- surfaces
'rgba(255, 255, 255, 0.03)'       // input backgrounds
'rgba(255, 255, 255, 0.05)'       // assistant bubble
'rgba(124, 77, 255, 0.12)'        // user bubble, selected states

// Text
'text.primary'                    // #e8e8ed
'text.secondary'                  // #9090a0
'primary.light'                   // #b47cff -- links

// Borders
'divider'                         // rgba(255, 255, 255, 0.08)
'rgba(124, 77, 255, 0.2)'         // user bubble border

// Actions
'primary.main'                    // #7c4dff -- buttons, focus
'primary.dark'                    // #3f1dcb -- hover
'error.main'                      // delete actions

// Gradients
'linear-gradient(135deg, #7c4dff 0%, #448aff 100%)'   // primary action
'linear-gradient(135deg, #00e5ff 0%, #1de9b6 100%)'   // assistant accent

// Sizing
SIDEBAR_WIDTH = 280               // pixels
MESSAGE_MAX_WIDTH = '75%'
AVATAR_SIZE = 34                  // pixels
SEND_BUTTON_SIZE = 36             // pixels
```
