# Tenant Customization - Visual Reference

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATABASE LAYER                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ tenants table                                              │  │
│  │  - id: string                                              │  │
│  │  - name: string                                            │  │
│  │  - settings: JSON {                                        │  │
│  │      customization: {                                      │  │
│  │        background: {...},                                  │  │
│  │        primaryButton: {...},                               │  │
│  │        otpForm: {...},                                     │  │
│  │        inputFields: {...}                                  │  │
│  │      }                                                      │  │
│  │    }                                                        │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER                                │
│  GET  /api/tenants/[id]/customization  → Fetch config           │
│  PUT  /api/tenants/[id]/customization  → Update config          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      REACT HOOKS LAYER                           │
│  useTenantCustomization(tenantId)                                │
│    - Fetches config from API                                     │
│    - Returns: { customization, loading, error }                  │
│                                                                   │
│  useCustomizationStyles(customization)                           │
│    - Applies CSS variables to :root                              │
│    - Auto-cleanup on unmount                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     COMPONENT LAYER                              │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │ OtpLoginClient  │  │ PhoneAuthGate    │  │ OtpInput       │ │
│  │  - Fetches      │→ │  - Buttons       │→ │  - OTP fields  │ │
│  │    config       │  │  - Input fields  │  │  - Colors      │ │
│  └─────────────────┘  └──────────────────┘  └────────────────┘ │
│           ↓                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ CustomizableBackground                                   │   │
│  │  - Solid / Gradient / Particles / Vanta.js              │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       USER SEES                                  │
│              Customized OTP Login Page                           │
└─────────────────────────────────────────────────────────────────┘
```

## Data Structure Visual

```typescript
TenantCustomization {
  
  background: {
    type: 'solid' | 'gradient' | 'particles' | 'vanta'
    
    // If type = 'solid'
    solidColor: '#1e3a8a'
    
    // If type = 'gradient'
    gradient: {
      type: 'linear' | 'radial'
      direction: 'to bottom'
      colors: ['#667eea', '#764ba2']
    }
    
    // If type = 'particles'
    particles: {
      colors: ['#10b981', '#059669']
      count: 100
      minAlpha: 0.3
    }
    
    // If type = 'vanta'
    vanta: {
      effect: 'fog' | 'waves' | 'clouds' | ...
      options: { /* effect-specific */ }
    }
  }
  
  primaryButton: {
    background: '#25d366'
    hover: '#1ebe5b'
    text: '#171717'
    disabled?: '#cccccc'
  }
  
  otpForm: {
    inputBorder: '#b6d9c4'
    inputBorderFocus: '#0c8f72'
    inputBackground: '#ffffff'
    inputBackgroundFilled: '#e9f7ef'
    inputText: '#0f3c34'
    inputBorderFilled: '#0c8f72'
  }
  
  inputFields: {
    background: '#f5f1ed'
    border: '#d1d5db'
    borderFocus: '#171717'
    text: '#0f172a'
    placeholder: '#64748b'
  }
  
  formContainer?: {
    background: '#ffffff'
    border: 'rgba(255, 255, 255, 0.2)'
    shadow: '0 20px 52px -28px rgba(0,0,0,0.3)'
  }
  
  textColors?: {
    heading: '#111827'
    description: '#4b5563'
    label: '#111827'
    error: '#111827'
  }
}
```

## Color Picker UI Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Background Configuration                                     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Type: [Solid ▼] [Gradient] [Particles] [Vanta.js]     │  │
│  │                                                         │  │
│  │ Color: [🎨 #1e3a8a]                                    │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│  Primary Button                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Background: [🎨 #25d366]                               │  │
│  │ Hover:      [🎨 #1ebe5b]                               │  │
│  │ Text:       [🎨 #171717]                               │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│  OTP Form                                                     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Border:       [🎨 #b6d9c4]                             │  │
│  │ Border Focus: [🎨 #0c8f72]                             │  │
│  │ Background:   [🎨 #ffffff]                             │  │
│  │ Filled BG:    [🎨 #e9f7ef]                             │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
OtpLoginClient.tsx
├── useTenantCustomization()        ← Fetches config
├── useCustomizationStyles()        ← Applies CSS vars
│
├── CustomizableBackground          ← Renders background
│   ├── Solid Color
│   ├── Gradient
│   ├── ParticleBackground
│   └── VantaBackground             ← Loads Vanta.js
│
└── PhoneAuthGate
    ├── Props: customization
    │
    ├── Button                      ← Uses customization.primaryButton
    │   └── Hover states
    │
    ├── OtpInput                    ← Uses customization.otpForm
    │   └── 6 input boxes
    │
    └── Input Fields                ← Uses customization.inputFields
        ├── Phone
        ├── Email
        └── Name
```

## State Flow

```
1. MOUNT
   OtpLoginClient mounts
   ↓
2. FETCH
   useTenantCustomization(tenantId)
   → fetch('/api/tenants/{id}/customization')
   ↓
3. LOAD
   { customization, loading, error }
   ↓
4. APPLY
   useCustomizationStyles(customization)
   → document.documentElement.style.setProperty()
   ↓
5. RENDER
   Components use customization props
   ↓
6. DISPLAY
   User sees customized page
```

## File Dependencies

```
tenant-customization.ts (Types)
    ↓
    ├→ CustomizableBackground.tsx
    ├→ useTenantCustomization.ts
    ├→ PhoneAuthGate.tsx
    ├→ OtpInput.tsx
    └→ TenantCustomizationEditor.tsx

useTenantCustomization.ts
    ↓
    ← /api/tenants/[id]/customization
          ↓
          ← prisma.tenant.findUnique()
```

## CSS Variables Applied

```css
:root {
  /* Buttons */
  --tenant-primary-button-bg: #25d366;
  --tenant-primary-button-hover: #1ebe5b;
  --tenant-primary-button-text: #171717;
  
  /* OTP Form */
  --tenant-otp-border: #b6d9c4;
  --tenant-otp-border-focus: #0c8f72;
  --tenant-otp-bg: #ffffff;
  --tenant-otp-bg-filled: #e9f7ef;
  --tenant-otp-text: #0f3c34;
  
  /* Input Fields */
  --tenant-input-bg: #f5f1ed;
  --tenant-input-border: #d1d5db;
  --tenant-input-border-focus: #171717;
  --tenant-input-text: #0f172a;
  --tenant-input-placeholder: #64748b;
  
  /* Text */
  --tenant-text-heading: #111827;
  --tenant-text-description: #4b5563;
  --tenant-text-label: #111827;
}
```

## API Response Format

### GET /api/tenants/[id]/customization

```json
{
  "success": true,
  "customization": {
    "background": { "type": "solid", "solidColor": "#1e3a8a" },
    "primaryButton": { "background": "#3b82f6", "hover": "#2563eb", "text": "#fff" },
    "otpForm": { ... },
    "inputFields": { ... }
  }
}
```

### PUT /api/tenants/[id]/customization

Request:
```json
{
  "customization": {
    "background": { "type": "vanta", "vanta": { "effect": "fog" } }
  }
}
```

Response:
```json
{
  "success": true,
  "customization": { ... }
}
```

## Vanta.js Integration

```javascript
// 1. Load Three.js
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js">

// 2. Load Vanta Effect
<script src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.fog.min.js">

// 3. Initialize
VANTA.FOG({
  el: element,
  highlightColor: 0x6b5e9f,
  midtoneColor: 0x2c1e47,
  // ... options
})
```

## Preset Themes Visual

```
┌─────────────┬──────────────┬─────────────┬──────────────┐
│   OCEAN     │    SUNSET    │   FOREST    │   MINIMAL    │
├─────────────┼──────────────┼─────────────┼──────────────┤
│ 🌊 Waves    │ 🌅 Gradient  │ 🌲 Particles│ ⚪ Solid     │
│ Blue/Cyan   │ Red/Orange   │ Green       │ Gray/White   │
│ Vanta.js    │ Linear       │ Animated    │ Simple       │
└─────────────┴──────────────┴─────────────┴──────────────┘

┌─────────────┬──────────────┐
│     FOG     │    WAVES     │
├─────────────┼──────────────┤
│ 🌫️ Fog      │ 🌊 Waves     │
│ Purple      │ Cyan/Blue    │
│ Vanta.js    │ Vanta.js     │
└─────────────┴──────────────┘
```

## Testing Matrix

| Feature | Test | Status |
|---------|------|--------|
| Solid BG | Set solid color | ⬜ |
| Gradient | Linear/Radial | ⬜ |
| Particles | Custom colors | ⬜ |
| Vanta Fog | Purple fog | ⬜ |
| Vanta Waves | Blue waves | ⬜ |
| Button Colors | BG/Hover/Text | ⬜ |
| OTP Styling | 6 inputs | ⬜ |
| Input Fields | Phone/Email | ⬜ |
| API GET | Fetch config | ⬜ |
| API PUT | Update config | ⬜ |
| Admin UI | Visual editor | ⬜ |
| CLI Tool | Test script | ⬜ |
| Mobile | Responsive | ⬜ |
| Fallback | No config | ⬜ |
| Performance | Load time | ⬜ |

## Quick Commands

```bash
# List all themes
npm run test-customization list

# Apply ocean theme
npm run test-customization ocean

# Show current theme
npm run test-customization show

# Apply sunset theme
npm run test-customization sunset

# Reset to default
npm run test-customization default
```

## Color Conversion

```javascript
// Hex to RGB
#1e3a8a → rgb(30, 58, 138)

// Hex to Decimal (for Vanta.js)
#1e3a8a → 1981066 (0x1e3a8a)

// RGB to Hex
rgb(30, 58, 138) → #1e3a8a

// Useful tool: https://www.color-hex.com/
```

## Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 90+ | ✅ Full |
| Firefox | 88+ | ✅ Full |
| Safari | 14+ | ✅ Full |
| Edge | 90+ | ✅ Full |
| Mobile Safari | 14+ | ✅ Full |
| Mobile Chrome | 90+ | ✅ Full |

## Performance Metrics

| Feature | Load Time | Notes |
|---------|-----------|-------|
| Solid BG | ~0ms | Instant |
| Gradient | ~0ms | Instant |
| Particles | ~50ms | Canvas render |
| Vanta.js | ~500ms | Script + init |
| API Call | ~100ms | Network |

---

**Need more info?** Check:
- Types: `src/types/tenant-customization.ts`
- Guide: `TENANT_CUSTOMIZATION_GUIDE.md`
- Examples: `CUSTOMIZATION_EXAMPLES.tsx`

