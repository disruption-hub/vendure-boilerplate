# Communication Hub Guide

## Overview

The Communication Hub is now a **dedicated interface** with its own left-side navigation menu and dropdown selector for easy access to all communication features.

## Features

### 🎯 Dedicated Page
- **Route:** `/admin/communications`
- **Access Level:** Super Admin only
- Full-screen interface with dedicated left sidebar

### 🎨 Left-Side Navigation Menu

The Communication Hub includes a comprehensive sidebar with:

1. **Dropdown Selector** - Quick navigation between different sections
2. **Section Categories:**
   - **Paneles** - Dashboard views
   - **Operaciones** - Communication operations
   - **Configuración** - Settings and connectors

### 📋 Available Views

#### 1. **Resumen Ejecutivo** (Overview)
- Real-time communication metrics
- Message statistics across all channels
- Performance indicators

#### 2. **Composer Multi-Canal** (Multi-Channel Composer)
- Send messages through multiple channels
- SMS, Email, Push notifications
- Batch messaging capabilities

#### 3. **Plantillas y Contenidos** (Templates & Content)
- Manage reusable message templates
- Content library
- Template versioning

#### 4. **Template Studio**
- Visual template designer
- Drag-and-drop layout builder
- Component-based design system

#### 5. **Conectores & Credenciales** (Connectors & Credentials)
- Configure communication channels
- Manage provider credentials
- API key management

## How to Access

### From Main Sidebar
1. Navigate to the main application sidebar
2. Look for the **"Comunicaciones"** section
3. Click on **"Communication Hub"** (marked with "Nuevo" badge)

### From Admin Panel
1. Go to `/admin`
2. Click on the **"Communication Hub"** tab in the admin navigation
3. Click the **"Ir al Communication Hub"** button

### Direct Access
Navigate directly to: `/admin/communications`

## Interface Components

### Sidebar Features
- **View Selector Dropdown** - Quickly switch between sections
- **Navigation Menu** - Visual navigation with icons and descriptions
- **Tenant Info** - Shows current active tenant
- **Responsive Design** - Works on desktop and tablet devices

### Main Content Area
- **Header** - Context-aware titles and descriptions
- **Content Panel** - Dynamic content based on selected view
- **Full Width Layout** - Maximum space for communication management

## Permission Requirements

- **Role Required:** `super_admin`
- **Tenant Association:** Must have a valid tenant ID
- **Session:** Must be authenticated via NextAuth

## Technical Details

### File Structure
```
src/
├── app/(admin)/admin/communications/
│   └── page.tsx                          # Main Communication Hub page
├── components/communications/
│   └── CommunicationHubSidebar.tsx      # Dedicated sidebar component
└── features/communications/components/
    ├── CommunicationOverview.tsx
    ├── CommunicationComposer.tsx
    ├── CommunicationTemplatesManager.tsx
    ├── CommunicationTemplateStudio.tsx
    └── CommunicationSettingsPanel.tsx
```

### Key Components

#### `CommunicationHubSidebar`
- Props:
  - `currentView`: Current active view
  - `onViewChange`: Callback for view changes
  - `tenantId`: Optional tenant identifier
  - `className`: Optional styling

#### `CommunicationHubPage`
- Authentication check
- View state management
- Conditional rendering based on selected view

## Dropdown Menu Features

The dropdown menu includes:
- ✅ Section grouping (Paneles, Operaciones, Configuración)
- ✅ Icons for visual identification
- ✅ Descriptions for each option
- ✅ Keyboard navigation support
- ✅ Click-to-select functionality

## Best Practices

1. **Navigation:** Use the dropdown for quick access, use the sidebar menu for detailed navigation
2. **Workflows:** 
   - Start with Overview to see metrics
   - Use Composer for immediate communications
   - Manage Templates for recurring messages
   - Configure Connectors before first use
3. **Permissions:** Always verify super_admin access before attempting to access

## Future Enhancements

- [ ] Real-time notification badges
- [ ] Recent activity quick access
- [ ] Favorite views bookmarking
- [ ] Multi-tenant switching
- [ ] Mobile responsive sidebar

## Troubleshooting

### Cannot Access Communication Hub
- **Issue:** "Acceso Denegado" message
- **Solution:** Verify your account has `super_admin` role

### Sidebar Not Showing
- **Issue:** Sidebar missing on desktop
- **Solution:** Check browser window width (minimum 1024px recommended)

### View Not Loading
- **Issue:** Content area is blank
- **Solution:** Check browser console for errors, verify API endpoints

## Support

For issues or feature requests related to the Communication Hub, please contact the development team or create a ticket in the project management system.

---

**Version:** 1.0.0  
**Last Updated:** November 3, 2025  
**Status:** ✅ Active and Deployed


