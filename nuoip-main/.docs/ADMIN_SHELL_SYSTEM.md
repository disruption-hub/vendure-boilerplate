# Admin Shell System - Unified Layout Architecture

## Overview

The Admin Shell System provides a **unified layout architecture** with a top menu dropdown selector that allows seamless switching between different admin contexts (shells), each with its own dedicated left-side menu while maintaining consistent header styling.

## Architecture

### 🎯 Core Components

#### 1. **AdminShellLayout** (`src/components/layout/AdminShellLayout.tsx`)
The main layout wrapper that provides:
- ✅ Consistent top header with shell selector
- ✅ User profile menu
- ✅ Notifications bell
- ✅ Dynamic sidebar integration
- ✅ Main content area
- ✅ Responsive design

#### 2. **AdminShellSelector** (`src/components/layout/AdminShellSelector.tsx`)
Top menu dropdown for switching between shells:
- ✅ Visual shell identification with icons
- ✅ Active shell highlighting
- ✅ Badge support (e.g., "Nuevo")
- ✅ Smooth navigation

#### 3. **AdminDashboardSidebar** (`src/components/layout/AdminDashboardSidebar.tsx`)
Dedicated sidebar for admin dashboard:
- ✅ Categorized navigation (General, Gestión, Operaciones, Pagos, Configuración)
- ✅ Role-based visibility (Super Admin, Admin)
- ✅ Active tab highlighting
- ✅ Icon-based navigation

#### 4. **CommunicationHubSidebar** (`src/components/communications/CommunicationHubSidebar.tsx`)
Dedicated sidebar for communication hub:
- ✅ Communication-specific views
- ✅ Dropdown quick selector
- ✅ Tenant information display
- ✅ Organized by operational categories

## Shell Types

### 1. **Admin Dashboard Shell**
**Route:** `/admin`
**Purpose:** General system administration and management

**Features:**
- System overview and monitoring
- User and tenant management
- Calendar and appointment management
- Payment management
- System settings
- Conversation flow configuration

**Access:**
- Role: `admin` or `super_admin`
- Some features restricted to `super_admin` only

### 2. **Communication Hub Shell**
**Route:** `/admin/communications`
**Purpose:** Omnichannel communication management

**Features:**
- Executive overview dashboard
- Multi-channel composer
- Template management
- Visual template studio
- Connector configuration

**Access:**
- Role: `super_admin` only

## Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Header                                                       │
│  ┌──────────────────┐    ┌─────┐  ┌─────┐  ┌──────┐        │
│  │ Shell Selector ▼ │    │  🔔 │  │  👤 │  │ Menu │        │
│  └──────────────────┘    └─────┘  └─────┘  └──────┘        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────┬──────────────────────────────────────┐  │
│  │                │                                        │  │
│  │  Left Sidebar  │      Main Content Area                │  │
│  │                │                                        │  │
│  │  • Navigation  │      Dynamic content based on:        │  │
│  │  • Categories  │      - Current shell                  │  │
│  │  • Actions     │      - Selected tab/view              │  │
│  │                │                                        │  │
│  │                │                                        │  │
│  └────────────────┴──────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Shell Selector Features

### Visual Design
```typescript
┌──────────────────────────────────────┐
│  CAMBIAR VISTA                        │
├──────────────────────────────────────┤
│  [🏢] Admin Dashboard            ●   │
│       Gestión general del sistema    │
├──────────────────────────────────────┤
│  [💬] Communication Hub   [Nuevo]    │
│       Centro omnicanal de mensajería │
└──────────────────────────────────────┘
```

### Key Features:
- **Active Indicator:** Blue dot shows current shell
- **Icons:** Visual identification for each shell
- **Badges:** "Nuevo" or other status badges
- **Descriptions:** Clear purpose for each shell
- **One-Click Switch:** Instant navigation between shells

## Header Components

### 1. **Shell Selector Dropdown**
- Location: Top-left
- Function: Switch between admin contexts
- Always visible
- Shows current shell with icon and badge

### 2. **Notifications Bell**
- Location: Top-right
- Function: View system notifications
- Red dot for unread notifications

### 3. **User Profile Menu**
- Location: Top-right
- Function: User account management
- Displays:
  - User name
  - Email
  - Role badge (Super Admin / Admin)
- Actions:
  - Mi Perfil
  - Configuración
  - Cerrar Sesión

## Sidebar Features

### Admin Dashboard Sidebar

#### Categories:
1. **General**
   - System Overview
   - Memory Details

2. **Gestión de Entidades**
   - Tenant Management (Super Admin)
   - User Management
   - Tenant Registrations (Super Admin)

3. **Operaciones**
   - Schedule Templates (Super Admin)
   - Calendar Configuration (Super Admin)
   - Appointments & Leads (Super Admin)
   - CRM Management

4. **Pagos**
   - Payment Catalog (Super Admin)
   - Payment Links (Super Admin)
   - Payment Reports (Super Admin)

5. **Configuración**
   - Conversation Flow
   - Flow Calibration (Super Admin)
   - System Settings (Super Admin)
   - VAPID Keys (Super Admin)
   - Interface Theme

### Communication Hub Sidebar

#### Categories:
1. **Paneles**
   - Resumen Ejecutivo (Overview)

2. **Operaciones**
   - Composer Multi-Canal
   - Plantillas y Contenidos
   - Template Studio

3. **Configuración**
   - Conectores & Credenciales

## Implementation Details

### Using the Shell Layout

```typescript
import { AdminShellLayout } from '@/components/layout/AdminShellLayout'
import { AdminDashboardSidebar } from '@/components/layout/AdminDashboardSidebar'

export default function MyAdminPage() {
  return (
    <AdminShellLayout
      sidebar={
        <AdminDashboardSidebar
          currentTab={activeTab}
          onTabChange={setActiveTab}
          isSuperAdmin={isSuperAdmin}
          canManageUsers={canManageUsers}
        />
      }
      shellTitle="Optional Shell Title"
      shellDescription="Optional description"
    >
      {/* Your page content */}
    </AdminShellLayout>
  )
}
```

### Adding a New Shell

1. **Create the route**: `/admin/[your-shell]`
2. **Create a dedicated sidebar component**
3. **Add to shell selector** in `AdminShellSelector.tsx`:
   ```typescript
   {
     id: 'your-shell',
     name: 'Your Shell Name',
     description: 'Your shell description',
     icon: YourIcon,
     path: '/admin/your-shell',
   }
   ```
4. **Update shell detection logic**

## Styling Consistency

### Design Tokens
- **Primary Color:** Blue-to-Purple gradient
- **Active States:** Primary color with 10% opacity background
- **Icons:** 16px (h-4 w-4) or 20px (h-5 w-5)
- **Spacing:** Consistent 12px-24px gaps
- **Borders:** Subtle muted borders
- **Shadows:** Soft elevation shadows

### Responsive Design
- **Desktop (lg+):** Full sidebar visible
- **Tablet:** Collapsible sidebar
- **Mobile:** Drawer-based navigation

## Permission Management

### Role Hierarchy
1. **super_admin**: Full access to all features
2. **admin**: Limited access, cannot manage tenants or system settings
3. **user**: No admin access

### Feature Visibility
Features automatically show/hide based on user role:
```typescript
{
  visible: isSuperAdmin // Only Super Admins see this
}
{
  visible: canManageUsers // Admins and Super Admins
}
{
  visible: true // Everyone with admin access
}
```

## Navigation Flow

### Switching Shells
1. User clicks **Shell Selector** dropdown
2. Dropdown shows all available shells
3. User selects target shell
4. Page navigates to shell route
5. New shell's sidebar loads
6. Content updates to default view

### Within a Shell
1. User clicks sidebar item
2. Active tab state updates
3. Main content area renders new component
4. Sidebar highlights active item
5. URL remains on shell route

## Benefits

### For Users
✅ **Consistent Experience** - Same header and layout across all admin areas
✅ **Easy Navigation** - Quick shell switching via dropdown
✅ **Clear Context** - Always know which shell you're in
✅ **Role-Based UI** - Only see features you have access to

### For Developers
✅ **Modular Design** - Easy to add new shells
✅ **Reusable Components** - Shared layout logic
✅ **Type Safety** - TypeScript support throughout
✅ **Maintainable** - Centralized layout management

## File Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── AdminShellLayout.tsx          # Main layout wrapper
│   │   ├── AdminShellSelector.tsx        # Shell switcher dropdown
│   │   └── AdminDashboardSidebar.tsx     # Admin dashboard sidebar
│   └── communications/
│       └── CommunicationHubSidebar.tsx   # Communication hub sidebar
├── app/(admin)/
│   └── admin/
│       ├── page.tsx                      # Admin dashboard (uses shell)
│       └── communications/
│           └── page.tsx                  # Communication hub (uses shell)
```

## Migration Notes

### Old Layout (MainLayout)
- Custom sidebar per page
- No shell concept
- Inconsistent headers
- Difficult to maintain

### New Layout (AdminShellLayout)
- Unified shell system
- Consistent top header
- Shell selector dropdown
- Modular sidebars
- Easy to extend

### Breaking Changes
- None for end users
- Developers: Update admin pages to use new shell layout
- Old layouts backed up as `page-old-layout.tsx`

## Future Enhancements

- [ ] Shell-specific keyboard shortcuts
- [ ] Recent shells quick access
- [ ] Shell-level breadcrumbs
- [ ] Mobile-optimized shell drawer
- [ ] Shell state persistence
- [ ] Shell-level settings
- [ ] Custom shell themes

## Troubleshooting

### Shell Selector Not Showing
- **Issue:** Dropdown not visible
- **Solution:** Check if AdminShellLayout is being used

### Wrong Sidebar Appearing
- **Issue:** Communication sidebar in admin dashboard
- **Solution:** Verify correct sidebar component passed to shell layout

### Permission Errors
- **Issue:** Cannot access certain shells
- **Solution:** Check user role in session data

## Support

For questions or issues with the Admin Shell System, please contact the development team.

---

**Version:** 1.0.0  
**Last Updated:** November 3, 2025  
**Status:** ✅ Active and Deployed


