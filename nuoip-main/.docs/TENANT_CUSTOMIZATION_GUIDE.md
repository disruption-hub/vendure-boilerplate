# Tenant Customization Guide

This guide explains how to customize the OTP login form, buttons, and backgrounds for each tenant.

## Overview

The tenant customization system allows you to configure:
- **Background**: Solid colors, gradients, particle animations, or Vanta.js effects
- **Button colors**: Primary and secondary button styling
- **OTP form styling**: Input field colors and borders
- **Input field styling**: Colors for text inputs (phone, email, etc.)
- **Form container**: Background, border, and shadow
- **Text colors**: Headings, descriptions, labels, and error messages

## Configuration Location

Customization settings are stored in the `settings` field of the `Tenant` table in your database:

```json
{
  "customization": {
    // Your customization config here
  }
}
```

## API Endpoints

### Get Tenant Customization
```bash
GET /api/tenants/{tenantId}/customization
```

### Update Tenant Customization
```bash
PUT /api/tenants/{tenantId}/customization
Content-Type: application/json

{
  "customization": {
    // Your config
  }
}
```

## Configuration Examples

### Example 1: Solid Blue Background with Custom Colors

```json
{
  "customization": {
    "background": {
      "type": "solid",
      "solidColor": "#1e3a8a"
    },
    "primaryButton": {
      "background": "#3b82f6",
      "hover": "#2563eb",
      "text": "#ffffff"
    },
    "otpForm": {
      "inputBorder": "#93c5fd",
      "inputBorderFocus": "#3b82f6",
      "inputBackground": "#ffffff",
      "inputBackgroundFilled": "#dbeafe",
      "inputText": "#1e3a8a",
      "inputBorderFilled": "#3b82f6"
    },
    "inputFields": {
      "background": "#f0f9ff",
      "border": "#93c5fd",
      "borderFocus": "#3b82f6",
      "text": "#1e3a8a",
      "placeholder": "#64748b"
    }
  }
}
```

### Example 2: Gradient Background

```json
{
  "customization": {
    "background": {
      "type": "gradient",
      "gradient": {
        "type": "linear",
        "direction": "135deg",
        "colors": ["#667eea", "#764ba2", "#f093fb"]
      }
    },
    "primaryButton": {
      "background": "#667eea",
      "hover": "#5568d3",
      "text": "#ffffff"
    }
  }
}
```

### Example 3: Custom Particle Background

```json
{
  "customization": {
    "background": {
      "type": "particles",
      "particles": {
        "colors": ["#ff6b6b", "#4ecdc4", "#45b7d1"],
        "count": 120,
        "minAlpha": 0.3
      }
    },
    "primaryButton": {
      "background": "#4ecdc4",
      "hover": "#3db8aa",
      "text": "#1a1a1a"
    }
  }
}
```

### Example 4: Vanta.js Fog Effect

```json
{
  "customization": {
    "background": {
      "type": "vanta",
      "vanta": {
        "effect": "fog",
        "options": {
          "highlightColor": 0x6b5e9f,
          "midtoneColor": 0x2c1e47,
          "lowlightColor": 0x0f0820,
          "baseColor": 0x0a0518,
          "blurFactor": 0.6,
          "speed": 1.5,
          "zoom": 1.2
        }
      }
    },
    "primaryButton": {
      "background": "#8b7ec8",
      "hover": "#7a6db7",
      "text": "#ffffff"
    }
  }
}
```

### Example 5: Vanta.js Waves Effect

```json
{
  "customization": {
    "background": {
      "type": "vanta",
      "vanta": {
        "effect": "waves",
        "options": {
          "color": 0x1e3a8a,
          "shininess": 30,
          "waveHeight": 15,
          "waveSpeed": 1.0,
          "zoom": 0.75
        }
      }
    }
  }
}
```

### Example 6: Vanta.js Clouds Effect

```json
{
  "customization": {
    "background": {
      "type": "vanta",
      "vanta": {
        "effect": "clouds",
        "options": {
          "skyColor": 0x68b8d7,
          "cloudColor": 0xadc1de,
          "cloudShadowColor": 0x183550,
          "sunColor": 0xff9919,
          "sunGlareColor": 0xff6633,
          "sunlightColor": 0xff9933,
          "speed": 1.0
        }
      }
    }
  }
}
```

### Example 7: Vanta.js NET Effect

```json
{
  "customization": {
    "background": {
      "type": "vanta",
      "vanta": {
        "effect": "net",
        "options": {
          "color": 0x00ff00,
          "backgroundColor": 0x000000,
          "points": 10.0,
          "maxDistance": 20.0,
          "spacing": 15.0,
          "showDots": true
        }
      }
    }
  }
}
```

## Available Vanta.js Effects

The following Vanta.js effects are supported:
- `fog` - Animated fog effect
- `waves` - Ocean waves
- `clouds` - Animated clouds
- `birds` - Flocking birds
- `net` - Connected network nodes
- `cells` - Organic cell-like animation
- `trunk` - Tree trunk effect
- `topology` - Topological network
- `dots` - Animated dots
- `rings` - Concentric rings
- `halo` - Halo effect
- `globe` - 3D globe

For more details on each effect and their options, visit:
- [Vanta.js Official Website](https://www.vantajs.com/)
- [Vanta.js Gallery](https://www.vantajs.com/)

## TypeScript Types

```typescript
// Background Types
type BackgroundType = 'solid' | 'gradient' | 'particles' | 'vanta'

interface BackgroundConfig {
  type: BackgroundType
  solidColor?: string
  gradient?: GradientConfig
  particles?: ParticleConfig
  vanta?: VantaConfig
}

// Button Colors
interface ButtonColors {
  background: string
  hover: string
  text: string
  disabled?: string
}

// OTP Form Colors
interface OtpFormColors {
  inputBorder: string
  inputBorderFocus: string
  inputBackground: string
  inputBackgroundFilled: string
  inputText: string
  inputBorderFilled?: string
}

// Input Field Colors
interface InputFieldColors {
  background: string
  border: string
  borderFocus: string
  text: string
  placeholder: string
}

// Complete Customization
interface TenantCustomization {
  background: BackgroundConfig
  primaryButton: ButtonColors
  secondaryButton?: ButtonColors
  otpForm: OtpFormColors
  inputFields: InputFieldColors
  formContainer?: {
    background?: string
    border?: string
    shadow?: string
  }
  textColors?: {
    heading?: string
    description?: string
    label?: string
    error?: string
  }
}
```

## How to Apply Customization

### For Administrators

1. **Using the API**:
   ```bash
   curl -X PUT https://your-domain.com/api/tenants/TENANT_ID/customization \
     -H "Content-Type: application/json" \
     -d '{
       "customization": {
         "background": { "type": "solid", "solidColor": "#1e3a8a" },
         "primaryButton": {
           "background": "#3b82f6",
           "hover": "#2563eb",
           "text": "#ffffff"
         }
       }
     }'
   ```

2. **Directly in Database**:
   Update the `settings` field in the `tenants` table:
   ```sql
   UPDATE tenants 
   SET settings = jsonb_set(
     COALESCE(settings, '{}'::jsonb),
     '{customization}',
     '{"background": {"type": "solid", "solidColor": "#1e3a8a"}}'::jsonb
   )
   WHERE id = 'TENANT_ID';
   ```

### Testing

After applying customization:
1. Navigate to the OTP login page for that tenant
2. The customization should be applied automatically
3. If customization fails to load, the system falls back to default styling

## Best Practices

1. **Colors**: Use hex colors (#RRGGBB) for consistency
2. **Contrast**: Ensure sufficient contrast between text and background colors
3. **Button Colors**: The hover color should be darker/lighter than the background
4. **Vanta.js Performance**: Some effects (especially on mobile) may be resource-intensive
5. **Fallback**: Always test that the default styling works if customization fails
6. **Testing**: Test on multiple devices and screen sizes

## Troubleshooting

### Customization Not Showing
- Check that the tenant ID is correct
- Verify the customization data is properly stored in the database
- Check browser console for any errors
- Ensure the API endpoint is accessible

### Vanta.js Not Loading
- Check browser console for script loading errors
- Ensure CDN is accessible
- Try a different Vanta effect
- Consider using particle or gradient backgrounds as fallback

### Colors Not Applying
- Verify color format (use hex: #RRGGBB)
- Check that all required color properties are provided
- Clear browser cache
- Check for CSS conflicts

## Default Configuration

If no customization is provided, the system uses these defaults:

```json
{
  "background": {
    "type": "particles",
    "particles": {
      "colors": ["#7bff3a", "#0c8f72", "#5ce7c5"],
      "count": 90,
      "minAlpha": 0.28
    }
  },
  "primaryButton": {
    "background": "#25d366",
    "hover": "#1ebe5b",
    "text": "#171717"
  },
  "otpForm": {
    "inputBorder": "#b6d9c4",
    "inputBorderFocus": "#0c8f72",
    "inputBackground": "#ffffff",
    "inputBackgroundFilled": "#e9f7ef",
    "inputText": "#0f3c34",
    "inputBorderFilled": "#0c8f72"
  },
  "inputFields": {
    "background": "#f5f1ed",
    "border": "#d1d5db",
    "borderFocus": "#171717",
    "text": "#0f172a",
    "placeholder": "#64748b"
  }
}
```

## Support

For questions or issues with tenant customization:
1. Check this guide first
2. Review the TypeScript type definitions
3. Test with the default configuration
4. Check the browser console for errors
5. Contact the development team with specific error messages

