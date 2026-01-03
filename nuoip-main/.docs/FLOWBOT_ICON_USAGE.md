# FlowBot Icon Usage Guide

The `flow-bot-icon.svg` has been added to your project and is now available for use throughout your application.

## File Location
- **Path**: `/public/flow-bot-icon.svg`
- **URL**: `https://yourdomain.com/flow-bot-icon.svg`

## Usage Methods

### 1. React Component (Recommended)
```tsx
import { FlowBotIcon } from '@/components/ui/FlowBotIcon';

// Basic usage
<FlowBotIcon size={48} />

// With custom styling
<FlowBotIcon 
  size={64} 
  className="rounded-lg shadow-lg" 
  alt="Bot Avatar"
/>
```

### 2. Next.js Image Component
```tsx
import Image from 'next/image';

<Image
  src="/flow-bot-icon.svg"
  alt="FlowBot Icon"
  width={48}
  height={48}
  className="object-contain"
/>
```

### 3. HTML img Tag
```html
<img 
  src="/flow-bot-icon.svg" 
  alt="FlowBot Icon" 
  width="48" 
  height="48"
/>
```

### 4. CSS Background
```css
.bot-icon {
  background-image: url('/flow-bot-icon.svg');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}
```

## Icon Specifications
- **Format**: SVG (Scalable Vector Graphics)
- **Dimensions**: 400x400px viewBox
- **Colors**: Marine blue background (#1e3a5f) with white bot design
- **Style**: Modern bot icon with flowing curves and antenna

## Demo Page
Visit `/icon-demo` to see various usage examples and styling options.

## Use Cases
- Bot avatars in chat interfaces
- Loading indicators
- Brand elements
- Favicon (when converted to ICO)
- Social media sharing images
- App icons

## Browser Support
- ✅ All modern browsers
- ✅ Mobile devices
- ✅ High DPI displays
- ✅ Dark/light themes
