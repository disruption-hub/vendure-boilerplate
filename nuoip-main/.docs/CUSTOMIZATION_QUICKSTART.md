# 🎨 Tenant Customization - Quick Start

## What's New?

Tenants can now fully customize their OTP login page including:
- ✨ **Animated backgrounds** (Vanta.js effects like fog, waves, clouds)
- 🎨 **Button colors** (background, hover, text)
- 📱 **OTP form styling** (colors, borders, filled states)
- 📝 **Input field colors** (phone, email, name inputs)
- 🎭 **Multiple background types** (solid, gradient, particles, Vanta.js)

## Quick Test (5 minutes)

### 1. Find Your Tenant ID
```sql
SELECT id, name FROM tenants LIMIT 5;
```

### 2. Apply a Theme
```bash
# Edit scripts/test-tenant-customization.ts and update TENANT_ID
# Then run:
npm run test-customization ocean    # Apply ocean theme
npm run test-customization list     # See all themes
npm run test-customization show     # Show current theme
```

### 3. Test It
Navigate to `/otp-login` and see your changes!

## Available Preset Themes

| Theme | Background | Colors |
|-------|-----------|--------|
| `ocean` | Vanta.js Waves | Blue/Cyan |
| `sunset` | Gradient | Red/Orange/Pink |
| `forest` | Particles | Green |
| `minimal` | Solid Gray | Black/White |
| `fog` | Vanta.js Fog | Purple |
| `waves` | Vanta.js Waves | Cyan |
| `default` | Current default | Green (WhatsApp-like) |

## API Usage

### Get Current Customization
```bash
curl https://your-domain.com/api/tenants/{tenantId}/customization
```

### Update Customization
```bash
curl -X PUT https://your-domain.com/api/tenants/{tenantId}/customization \
  -H "Content-Type: application/json" \
  -d '{
    "customization": {
      "background": {
        "type": "vanta",
        "vanta": {
          "effect": "fog"
        }
      },
      "primaryButton": {
        "background": "#8b7ec8",
        "hover": "#7a6db7",
        "text": "#ffffff"
      }
    }
  }'
```

## Database Update

```sql
UPDATE tenants 
SET settings = jsonb_set(
  COALESCE(settings, '{}'::jsonb),
  '{customization}',
  '{
    "background": {
      "type": "solid",
      "solidColor": "#1e3a8a"
    }
  }'::jsonb
)
WHERE id = 'your-tenant-id';
```

## Admin UI

Use the customization editor component:

```tsx
import { TenantCustomizationEditor } from '@/components/admin/TenantCustomizationEditor'

<TenantCustomizationEditor 
  tenantId="tenant-123"
  onSave={() => alert('Saved!')}
/>
```

## Vanta.js Effects

Available animated backgrounds from [vantajs.com](https://www.vantajs.com/):

- `fog` - Atmospheric fog
- `waves` - Ocean waves
- `clouds` - Clouds with sun
- `birds` - Flocking birds
- `net` - Network nodes
- `cells` - Organic cells
- `trunk` - Tree trunk
- `topology` - Topology
- `dots` - Dot matrix
- `rings` - Rings
- `halo` - Halo effect
- `globe` - 3D globe

## Example Configuration

### Purple Fog Theme
```json
{
  "customization": {
    "background": {
      "type": "vanta",
      "vanta": {
        "effect": "fog",
        "options": {
          "highlightColor": 6905503,
          "midtoneColor": 2891335,
          "lowlightColor": 984096,
          "baseColor": 656664,
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
    },
    "otpForm": {
      "inputBorder": "#c4b5fd",
      "inputBorderFocus": "#8b7ec8",
      "inputBackground": "#ffffff",
      "inputBackgroundFilled": "#f5f3ff",
      "inputText": "#4c1d95"
    }
  }
}
```

### Simple Blue Theme
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
    }
  }
}
```

## Files Reference

| File | Purpose |
|------|---------|
| `TENANT_CUSTOMIZATION_GUIDE.md` | Complete documentation |
| `CUSTOMIZATION_EXAMPLES.tsx` | Code examples & presets |
| `IMPLEMENTATION_SUMMARY.md` | Technical implementation details |
| `scripts/test-tenant-customization.ts` | CLI testing tool |
| `src/types/tenant-customization.ts` | TypeScript types |
| `src/components/admin/TenantCustomizationEditor.tsx` | Admin UI component |

## Troubleshooting

**Customization not showing?**
- Check tenant ID is correct
- Clear browser cache
- Check browser console for errors
- Verify data is in database: `SELECT settings->'customization' FROM tenants WHERE id='...'`

**Vanta.js not loading?**
- Check browser console for CDN errors
- Try a different effect
- Check internet connection
- Use particle or gradient as fallback

**Colors not applying?**
- Use hex format: `#RRGGBB`
- Check all required fields are provided
- Verify JSON syntax is correct

## Support

- 📚 Full Guide: `TENANT_CUSTOMIZATION_GUIDE.md`
- 💻 Code Examples: `CUSTOMIZATION_EXAMPLES.tsx`
- 🔧 Implementation: `IMPLEMENTATION_SUMMARY.md`

## What's Kept?

✅ **100% Backward Compatible**
- Old OTP login still works
- Default styling unchanged
- No breaking changes
- Opt-in customization

---

**Need help?** Check the full documentation in `TENANT_CUSTOMIZATION_GUIDE.md`

