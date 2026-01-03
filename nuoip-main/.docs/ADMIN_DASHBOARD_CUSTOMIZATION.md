# Admin Dashboard - Tenant Customization Access

## 🎯 How to Access Tenant Customization

The tenant customization feature is now fully integrated into the admin dashboard!

### Quick Access Steps

1. **Navigate to Admin Dashboard**
   - Go to `/admin`
   - Log in as a super admin

2. **Open Tenant Management**
   - Click on **"Tenant Management"** in the sidebar (under "Gestión de Entidades")
   - Or use the `tenants` tab

3. **Customize a Tenant**
   - Find the tenant card you want to customize
   - Click the **"Customize"** button (purple button, next to "Personalize")
   - The customization modal will open

4. **Configure Settings**
   - Choose background type (Solid, Gradient, Particles, or Vanta.js)
   - Set button colors (background, hover, text)
   - Customize OTP form colors
   - Configure input field styling
   - Click **"Save Customization"** when done

## 📍 Location in Admin Dashboard

```
Admin Dashboard (/admin)
  └─ Tenant Management Tab
      └─ Tenant Cards
          └─ "Customize" Button (purple)
              └─ Customization Modal
                  └─ TenantCustomizationEditor Component
```

## 🎨 What You Can Customize

### Background Options
- **Solid Color** - Single color background
- **Gradient** - Linear or radial gradients
- **Particles** - Animated particle system (current default)
- **Vanta.js Effects** - 12+ animated backgrounds:
  - Fog, Waves, Clouds, Birds
  - Net, Cells, Trunk, Topology
  - Dots, Rings, Halo, Globe

### Color Customization
- **Primary Button**: Background, hover, text colors
- **OTP Form**: Input borders, backgrounds, filled states
- **Input Fields**: Phone, email, name input styling
- **Form Container**: Background, border, shadow

## 🔍 Visual Guide

### Tenant Card Buttons

```
┌─────────────────────────────────────────┐
│  [Tenant Logo]  Tenant Name             │
│                                         │
│  Domain: example.com                    │
│  Email: contact@example.com             │
│                                         │
│  [Personalize] [Customize] [Edit] [Del] │
│     Indigo     Purple    Blue    Red   │
└─────────────────────────────────────────┘
```

### Customization Modal

```
┌──────────────────────────────────────────────┐
│  Customize OTP Login Page                     │
│  Customize the appearance for [Tenant Name]  │
├──────────────────────────────────────────────┤
│  Background Configuration                    │
│  ┌──────────────────────────────────────┐  │
│  │ Type: [Solid ▼]                        │  │
│  │ Color: [🎨 #1e3a8a]                    │  │
│  └──────────────────────────────────────┘  │
│                                              │
│  Primary Button                              │
│  ┌──────────────────────────────────────┐  │
│  │ Background: [🎨 #25d366]              │  │
│  │ Hover:      [🎨 #1ebe5b]              │  │
│  │ Text:       [🎨 #171717]              │  │
│  └──────────────────────────────────────┘  │
│                                              │
│  [Save Customization] [Reset to Default]    │
└──────────────────────────────────────────────┘
```

## 🚀 Usage Example

### Step-by-Step: Apply Vanta.js Fog Effect

1. Go to Admin Dashboard → Tenant Management
2. Find your tenant in the list
3. Click **"Customize"** button
4. In the modal:
   - Background Type: Select **"Vanta.js Effect"**
   - Vanta Effect: Select **"Fog"**
   - Primary Button Background: Click color picker, choose purple (`#8b7ec8`)
   - Primary Button Hover: Choose darker purple (`#7a6db7`)
   - Primary Button Text: Choose white (`#ffffff`)
5. Click **"Save Customization"**
6. Test it: Navigate to `/otp-login` for that tenant

### Step-by-Step: Apply Gradient Background

1. Go to Admin Dashboard → Tenant Management
2. Click **"Customize"** on a tenant
3. In the modal:
   - Background Type: Select **"Gradient"**
   - Gradient Type: Select **"Linear"**
   - Colors: Enter `#667eea, #764ba2, #f093fb`
4. Configure button colors to match
5. Click **"Save Customization"**

## 📱 Testing Your Changes

After saving customization:

1. **Test Locally**
   - Navigate to `/otp-login?tenantId=YOUR_TENANT_ID`
   - Or use the tenant's subdomain/domain

2. **Verify Changes**
   - Background should match your selection
   - Button colors should be applied
   - OTP inputs should use custom colors
   - Input fields should match your settings

3. **Check Mobile**
   - Test on mobile devices
   - Some Vanta.js effects may be heavy on mobile
   - Consider using simpler backgrounds for mobile

## 🔧 Technical Details

### Components Used
- `TenantCustomizationModal` - Modal wrapper
- `TenantCustomizationEditor` - Main editor component
- API endpoint: `/api/tenants/[id]/customization`

### Data Storage
Customization is stored in:
```json
{
  "settings": {
    "customization": {
      "background": { ... },
      "primaryButton": { ... },
      "otpForm": { ... },
      "inputFields": { ... }
    }
  }
}
```

### API Integration
- **GET** `/api/tenants/[id]/customization` - Fetches current customization
- **PUT** `/api/tenants/[id]/customization` - Updates customization

## 🎯 Preset Themes

You can also use preset themes via CLI:

```bash
npm run test-customization ocean    # Vanta.js waves
npm run test-customization fog     # Vanta.js fog
npm run test-customization sunset   # Gradient
npm run test-customization forest   # Particles
```

## 💡 Tips

1. **Color Contrast**: Ensure sufficient contrast between text and backgrounds
2. **Button Hover**: Hover color should be darker/lighter than base color
3. **Vanta.js Performance**: Test on target devices - some effects are resource-intensive
4. **Mobile Testing**: Always test on mobile before deploying
5. **Fallback**: System falls back to defaults if customization fails

## 🔍 Troubleshooting

### Customization Not Showing?
- Check browser console for errors
- Verify API endpoint is accessible
- Check tenant ID is correct
- Clear browser cache

### Modal Not Opening?
- Check browser console for errors
- Verify you're logged in as super admin
- Check tenant exists in database

### Changes Not Saving?
- Check API endpoint response
- Verify database connection
- Check browser console for errors
- Ensure tenant ID is valid

## 📚 Related Documentation

- **Complete Guide**: `TENANT_CUSTOMIZATION_GUIDE.md`
- **Quick Start**: `CUSTOMIZATION_QUICKSTART.md`
- **Code Examples**: `CUSTOMIZATION_EXAMPLES.tsx`
- **Implementation**: `IMPLEMENTATION_SUMMARY.md`

---

**Need Help?** Check the documentation files or contact the development team.

