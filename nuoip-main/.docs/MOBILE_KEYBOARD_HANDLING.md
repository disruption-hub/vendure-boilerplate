# Mobile Keyboard Handling Guide

## Overview

This application implements comprehensive mobile keyboard handling to ensure input fields always remain visible when the keyboard opens. This is a critical UX feature for mobile devices.

## Implementation

### 1. Global Keyboard Handler

The `MobileKeyboardHandler` component is integrated into the root layout (`src/app/layout.tsx`) and provides:

- **Automatic scroll-into-view** for focused inputs
- **Visual Viewport API** integration for accurate keyboard detection
- **Cross-platform support** for iOS and Android
- **Modal and fixed position** element handling
- **Font size enforcement** to prevent iOS zoom on input focus

### 2. Custom Hook

The `useMobileKeyboard` hook (`src/hooks/useMobileKeyboard.ts`) is available for custom implementations:

```typescript
import { useMobileKeyboard } from '@/hooks/useMobileKeyboard'

function MyComponent() {
  const { isKeyboardOpen, keyboardHeight } = useMobileKeyboard({
    autoScroll: true,      // Auto-scroll inputs into view
    scrollOffset: 20,      // Offset from keyboard (px)
    scrollDelay: 300,      // Delay before scrolling (ms)
  })

  return (
    <div style={{ paddingBottom: isKeyboardOpen ? keyboardHeight : 0 }}>
      <input type="text" placeholder="This will stay visible!" />
    </div>
  )
}
```

### 3. CSS Support

Mobile-specific keyboard styles are in `src/styles/mobile.css`:

#### CSS Custom Properties
```css
--keyboard-height: 0px;  /* Current keyboard height */
--keyboard-open: 0;       /* 1 when keyboard is open, 0 when closed */
```

#### CSS Classes

**Body Class**
```css
body.keyboard-open {
  /* Applied when keyboard is open */
}
```

**Keyboard-Aware Container**
```css
.keyboard-aware-container {
  /* Adjusts padding when keyboard opens */
}
```

### 4. Viewport Configuration

The viewport meta tag is optimized for mobile keyboard handling:

```html
<meta 
  name="viewport" 
  content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content" 
/>
```

Key properties:
- `interactive-widget=resizes-content` - Modern browsers: ensures keyboard resizes viewport
- `maximum-scale=1, user-scalable=no` - Prevents zoom on input focus (iOS)
- `viewport-fit=cover` - Support for notched devices

### 5. Capacitor Configuration

For native mobile apps (`capacitor.config.ts`):

```typescript
plugins: {
  Keyboard: {
    resize: 'body',           // Resize mode
    style: 'dark',            // Keyboard style
    resizeOnFullScreen: true  // Resize even in fullscreen
  }
}
```

## Features

### ✅ Automatic Input Scrolling

When a user focuses an input field:
1. The Visual Viewport API detects the keyboard opening
2. The input's position is calculated relative to the visible viewport
3. If the input would be hidden by the keyboard, it's scrolled into view
4. Both window and parent containers are scrolled as needed

### ✅ iOS Zoom Prevention

All inputs automatically have a minimum `font-size: 16px` to prevent iOS from zooming when focusing inputs.

```css
input:not([type="checkbox"]):not([type="radio"]),
textarea,
select {
  font-size: 16px !important;
}
```

### ✅ Modal and Fixed Position Support

When the keyboard opens:
- Modals and dialogs adjust their max-height
- Fixed position elements account for keyboard height
- Background scrolling is prevented

### ✅ Smooth Animations

All scroll and keyboard transitions use:
- `behavior: 'smooth'` for native smooth scrolling
- 300ms delays to sync with keyboard animations
- Proper `transition` CSS properties

## Usage Examples

### Basic Input Form

```tsx
export function MyForm() {
  return (
    <form>
      <input 
        type="text" 
        placeholder="Name"
        // Automatically handles keyboard visibility
      />
      <input 
        type="email" 
        placeholder="Email"
        // Automatically handles keyboard visibility
      />
      <button type="submit">Submit</button>
    </form>
  )
}
```

### Modal with Inputs

```tsx
export function MyModal() {
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="keyboard-aware-container bg-white rounded-lg p-6">
        <input type="text" placeholder="Search..." />
        {/* Content here */}
      </div>
    </div>
  )
}
```

### Custom Keyboard Detection

```tsx
import { useMobileKeyboard } from '@/hooks/useMobileKeyboard'

export function CustomInput() {
  const { isKeyboardOpen, keyboardHeight } = useMobileKeyboard()

  return (
    <div 
      className="relative"
      style={{ 
        paddingBottom: isKeyboardOpen ? `${keyboardHeight}px` : '0px' 
      }}
    >
      <input type="text" />
      {isKeyboardOpen && (
        <p className="text-sm text-gray-500 mt-2">
          Keyboard is open! Height: {keyboardHeight}px
        </p>
      )}
    </div>
  )
}
```

### Chat Interface

```tsx
export function ChatInterface() {
  return (
    <div className="mobile-app-container">
      <div className="mobile-app-content">
        {/* Messages */}
      </div>
      <div className="mobile-app-input">
        <textarea 
          placeholder="Type a message..."
          // Automatically stays visible above keyboard
        />
      </div>
    </div>
  )
}
```

## Browser Support

- ✅ **iOS Safari** (12+)
- ✅ **Android Chrome** (61+)
- ✅ **iOS Chrome** 
- ✅ **Samsung Internet**
- ⚠️ **Fallback** for older browsers (uses window resize detection)

## Testing

### Manual Testing Checklist

1. **Basic Input**
   - [ ] Focus input at bottom of screen
   - [ ] Keyboard opens and input scrolls into view
   - [ ] Input remains visible above keyboard

2. **Multiple Inputs**
   - [ ] Tab through multiple inputs
   - [ ] Each input scrolls into view when focused
   - [ ] Smooth transitions between inputs

3. **Modals**
   - [ ] Open modal with inputs
   - [ ] Focus input in modal
   - [ ] Modal adjusts for keyboard height

4. **Scrollable Forms**
   - [ ] Long form with many inputs
   - [ ] Focus input at bottom
   - [ ] Parent container scrolls correctly

5. **iOS Specific**
   - [ ] No zoom when focusing inputs
   - [ ] Keyboard dismisses on blur
   - [ ] Safe area insets respected

6. **Android Specific**
   - [ ] Keyboard resize works correctly
   - [ ] No layout jumping
   - [ ] Back button dismisses keyboard

### Debugging

Enable console logging:

```typescript
// Add to MobileKeyboardHandler.tsx
console.log('Keyboard height:', keyboardHeight)
console.log('Keyboard open:', isKeyboardOpen)
console.log('Viewport height:', viewport?.height)
```

Check CSS variables in DevTools:

```javascript
// In browser console
console.log(getComputedStyle(document.documentElement).getPropertyValue('--keyboard-height'))
console.log(getComputedStyle(document.documentElement).getPropertyValue('--keyboard-open'))
```

## Troubleshooting

### Input is still hidden behind keyboard

1. Check if input has `font-size: 16px` (prevents iOS zoom)
2. Verify Visual Viewport API is supported (`window.visualViewport`)
3. Check if parent has `overflow: hidden` blocking scroll
4. Increase `scrollOffset` in hook options

### Layout jumps when keyboard opens

1. Ensure viewport meta tag is correct
2. Check Capacitor keyboard config
3. Remove conflicting CSS (e.g., `position: fixed` on body)
4. Use `keyboard-aware-container` class on containers

### Keyboard height is incorrect

1. Visual Viewport API may not be supported - check fallback
2. Wait for keyboard animation to complete (300ms)
3. Check for browser-specific issues
4. Test on real device (not emulator)

## Performance

The keyboard handler is optimized for performance:

- Uses passive event listeners where possible
- Debounces scroll events
- Only runs on mobile devices (via media queries)
- Minimal DOM manipulation
- No layout thrashing

## Best Practices

1. **Always use 16px font size** for mobile inputs
2. **Test on real devices**, not just emulators
3. **Add `keyboard-aware-container`** class to forms/modals
4. **Avoid fixed positioning** for input containers
5. **Use the hook** for custom keyboard-aware components
6. **Test both iOS and Android** - behavior differs
7. **Consider landscape mode** - keyboard takes more space

## Related Files

- `src/components/mobile/MobileKeyboardHandler.tsx` - Global handler
- `src/hooks/useMobileKeyboard.ts` - Custom hook
- `src/styles/mobile.css` - Mobile styles
- `src/app/layout.tsx` - Integration point
- `capacitor.config.ts` - Native app config

## References

- [Visual Viewport API](https://developer.mozilla.org/en-US/docs/Web/API/Visual_Viewport_API)
- [iOS Safari Viewport](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)
- [Android Keyboard Handling](https://developer.android.com/training/keyboard-input/visibility)
- [Capacitor Keyboard Plugin](https://capacitorjs.com/docs/apis/keyboard)

