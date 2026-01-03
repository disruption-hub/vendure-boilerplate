# File Structure

Complete file structure of the Evoque application.

```
evoque-new/
├── components.json
├── eslint.config.mjs
├── FERN_DIAGRAM_PROMPT.md
├── jest.config.js
├── LICENSE
├── mcp.config.json
├── next.config.ts
├── next-env.d.ts
├── package.json
├── package-lock.json
├── playwright.config.ts
├── postcss.config.mjs
├── README.md
├── tailwind.config.js
├── tsconfig.json
│
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   ├── seed-complete-showcase.ts
│   ├── seed-complete.ts
│   ├── seed-evoque.ts
│   └── seed.ts
│
├── public/
│   ├── assets/
│   └── avatars/
│
└── src/
    ├── app/
    │   ├── (dashboard)/
    │   │   └── admin/
    │   │       ├── (auth)/
    │   │       │   ├── notifications/
    │   │       │   │   └── page.tsx
    │   │       │   ├── permissions/
    │   │       │   │   └── page.tsx
    │   │       │   ├── roles/
    │   │       │   │   └── page.tsx
    │   │       │   ├── sessions/
    │   │       │   │   └── page.tsx
    │   │       │   └── users/
    │   │       │       └── page.tsx
    │   │       ├── (settings)/
    │   │       │   ├── analytics/
    │   │       │   │   └── page.tsx
    │   │       │   └── settings/
    │   │       │       └── page.tsx
    │   │       ├── (studio)/
    │   │       │   ├── forms/
    │   │       │   │   ├── page.tsx
    │   │       │   │   └── submissions/
    │   │       │   │       ├── [id]/
    │   │       │   │       │   └── page.tsx
    │   │       │   │       └── page.tsx
    │   │       │   ├── media/
    │   │       │   │   └── page.tsx
    │   │       │   ├── menu/
    │   │       │   │   └── page.tsx
    │   │       │   └── website/
    │   │       │       ├── live-editor/
    │   │       │       │   └── page.tsx
    │   │       │       ├── pages/
    │   │       │       │   └── page.tsx
    │   │       │       └── templates/
    │   │       │           └── page.tsx
    │   │       ├── layout.tsx
    │   │       └── page.tsx
    │   │
    │   ├── [locale]/
    │   │   ├── [slug]/
    │   │   │   ├── layout.tsx
    │   │   │   └── page.tsx
    │   │   ├── balloons-edit/
    │   │   │   └── page.tsx
    │   │   ├── layout.tsx
    │   │   ├── login/
    │   │   │   ├── LoginPageClient.tsx
    │   │   │   └── page.tsx
    │   │   ├── page.tsx
    │   │   └── test-gsap/
    │   │       └── page.tsx
    │   │
    │   ├── api/
    │   │   └── v1/
    │   │       ├── admin/
    │   │       │   ├── analytics/
    │   │       │   │   └── route.ts
    │   │       │   ├── aws-config/
    │   │       │   │   ├── credentials/
    │   │       │   │   │   └── route.ts
    │   │       │   │   ├── route.ts
    │   │       │   │   └── test/
    │   │       │   │       └── route.ts
    │   │       │   ├── check-permission/
    │   │       │   │   └── route.ts
    │   │       │   ├── components/
    │   │       │   │   ├── [id]/
    │   │       │   │   │   └── route.ts
    │   │       │   │   └── metadata/
    │   │       │   │       └── route.ts
    │   │       │   ├── debug/
    │   │       │   │   └── media/
    │   │       │   │       └── route.ts
    │   │       │   ├── forms/
    │   │       │   │   ├── [id]/
    │   │       │   │   │   ├── route.ts
    │   │       │   │   │   └── visibility/
    │   │       │   │   │       └── route.ts
    │   │       │   │   ├── by-slug/
    │   │       │   │   │   └── [slug]/
    │   │       │   │   │       └── route.ts
    │   │       │   │   ├── route.ts
    │   │       │   │   └── submissions/
    │   │       │   │       ├── [id]/
    │   │       │   │       │   └── route.ts
    │   │       │   │       └── route.ts
    │   │       │   ├── media/
    │   │       │   │   ├── [id]/
    │   │       │   │   │   └── route.ts
    │   │       │   │   ├── delete/
    │   │       │   │   │   └── route.ts
    │   │       │   │   ├── folders/
    │   │       │   │   │   └── route.ts
    │   │       │   │   ├── preview/
    │   │       │   │   │   └── route.ts
    │   │       │   │   ├── route.ts
    │   │       │   │   ├── sync/
    │   │       │   │   │   ├── count/
    │   │       │   │   │   │   └── route.ts
    │   │       │   │   │   ├── progress/
    │   │       │   │   │   │   └── route.ts
    │   │       │   │   │   └── route.ts
    │   │       │   │   └── upload/
    │   │       │   │       └── route.ts
    │   │       │   ├── menu-sections/
    │   │       │   │   ├── [id]/
    │   │       │   │   │   └── route.ts
    │   │       │   │   ├── bulk-update/
    │   │       │   │   │   └── route.ts
    │   │       │   │   ├── reorder/
    │   │       │   │   │   └── route.ts
    │   │       │   │   └── route.ts
    │   │       │   ├── menus/
    │   │       │   │   ├── [id]/
    │   │       │   │   │   ├── items/
    │   │       │   │   │   │   ├── [itemId]/
    │   │       │   │   │   │   │   ├── route.ts
    │   │       │   │   │   │   │   └── visibility/
    │   │       │   │   │   │   │       └── route.ts
    │   │       │   │   │   │   └── route.ts
    │   │       │   │   │   └── route.ts
    │   │       │   │   ├── reorder/
    │   │       │   │   │   └── route.ts
    │   │       │   │   └── route.ts
    │   │       │   ├── notifications/
    │   │       │   │   ├── [id]/
    │   │       │   │   │   └── route.ts
    │   │       │   │   ├── broadcast/
    │   │       │   │   │   └── route.ts
    │   │       │   │   ├── route.ts
    │   │       │   │   └── stats/
    │   │       │   │       └── route.ts
    │   │       │   ├── pages/
    │   │       │   │   ├── [id]/
    │   │       │   │   │   ├── menu-sections/
    │   │       │   │   │   │   └── route.ts
    │   │       │   │   │   └── route.ts
    │   │       │   │   └── route.ts
    │   │       │   ├── permissions/
    │   │       │   │   ├── [id]/
    │   │       │   │   │   └── route.ts
    │   │       │   │   └── route.ts
    │   │       │   ├── revalidate/
    │   │       │   │   └── route.ts
    │   │       │   ├── roles/
    │   │       │   │   ├── [id]/
    │   │       │   │   │   └── permissions/
    │   │       │   │   │       └── route.ts
    │   │       │   │   └── route.ts
    │   │       │   ├── scroll-configurations/
    │   │       │   │   └── route.ts
    │   │       │   ├── section-templates/
    │   │       │   │   └── route.ts
    │   │       │   ├── sections/
    │   │       │   │   ├── [id]/
    │   │       │   │   │   ├── components/
    │   │       │   │   │   │   ├── [componentId]/
    │   │       │   │   │   │   │   ├── route.ts
    │   │       │   │   │   │   │   └── styles/
    │   │       │   │   │   │   │       └── route.ts
    │   │       │   │   │   │   ├── reorder/
    │   │       │   │   │   │   │   └── route.ts
    │   │       │   │   │   │   └── route.ts
    │   │       │   │   │   └── route.ts
    │   │       │   │   ├── reorder/
    │   │       │   │   │   └── route.ts
    │   │       │   │   ├── route.ts
    │   │       │   │   └── validate/
    │   │       │   │       └── route.ts
    │   │       │   ├── sessions/
    │   │       │   │   ├── [id]/
    │   │       │   │   │   └── route.ts
    │   │       │   │   └── route.ts
    │   │       │   ├── settings/
    │   │       │   │   └── route.ts
    │   │       │   ├── stats/
    │   │       │   │   └── route.ts
    │   │       │   ├── users/
    │   │       │   │   ├── [id]/
    │   │       │   │   │   └── permissions/
    │   │       │   │   │       └── route.ts
    │   │       │   │   └── route.ts
    │   │       │   └── website/
    │   │       │       ├── forms/
    │   │       │       │   ├── [id]/
    │   │       │       │   │   ├── route.ts
    │   │       │       │   │   └── visibility/
    │   │       │       │   │       └── route.ts
    │   │       │       │   └── route.ts
    │   │       │       ├── menu-sections/
    │   │       │       │   ├── [id]/
    │   │       │       │   │   └── route.ts
    │   │       │       │   └── route.ts
    │   │       │       ├── menus/
    │   │       │       │   ├── [id]/
    │   │       │       │   │   ├── items/
    │   │       │       │   │   │   ├── [itemId]/
    │   │       │       │   │   │   │   ├── route.ts
    │   │       │       │   │   │   │   └── visibility/
    │   │       │       │   │   │   │       └── route.ts
    │   │       │       │   │   │   └── route.ts
    │   │       │       │   │   └── route.ts
    │   │       │       │   └── route.ts
    │   │       │       ├── sections/
    │   │       │       │   ├── [id]/
    │   │       │       │   │   └── route.ts
    │   │       │       │   ├── reorder/
    │   │       │       │   │   └── route.ts
    │   │       │       │   ├── route.ts
    │   │       │       │   └── validate/
    │   │       │       │       └── route.ts
    │   │       │       ├── settings/
    │   │       │       │   └── route.ts
    │   │       │       └── templates/
    │   │       │           ├── [id]/
    │   │       │           │   └── route.ts
    │   │       │           └── route.ts
    │   │       ├── auth/
    │   │       │   ├── login/
    │   │       │   │   └── route.ts
    │   │       │   ├── logout/
    │   │       │   │   └── route.ts
    │   │       │   └── me/
    │   │       │       └── route.ts
    │   │       ├── docs/
    │   │       │   └── route.ts
    │   │       ├── forms/
    │   │       │   ├── [formId]/
    │   │       │   │   ├── route.ts
    │   │       │   │   └── submit/
    │   │       │   │       └── route.ts
    │   │       │   ├── by-slug/
    │   │       │   │   └── [slug]/
    │   │       │   │       └── route.ts
    │   │       │   ├── route.ts
    │   │       │   └── submit/
    │   │       │       └── route.ts
    │   │       ├── media/
    │   │       │   ├── download/
    │   │       │   │   └── route.ts
    │   │       │   └── stats/
    │   │       │       └── route.ts
    │   │       ├── menu-sections/
    │   │       │   └── route.ts
    │   │       ├── menus/
    │   │       │   ├── [menuId]/
    │   │       │   │   └── items/
    │   │       │   │       └── route.ts
    │   │       │   ├── languages/
    │   │       │   │   └── route.ts
    │   │       │   └── route.ts
    │   │       ├── pages/
    │   │       │   └── [pageId]/
    │   │       │       └── duplicate/
    │   │       │           └── route.ts
    │   │       ├── sections/
    │   │       │   └── route.ts
    │   │       └── website/
    │   │           └── scroll-behavior/
    │   │               └── route.ts
    │   │
    │   ├── config/
    │   │   └── pages.ts
    │   │
    │   ├── continuous-background.css
    │   ├── dynamic-variables.css
    │   ├── globals.css
    │   └── layout.tsx
    │
    ├── components/
    │   ├── (pages)/
    │   │   ├── admin/
    │   │   │   ├── (auth)/
    │   │   │   │   ├── (notifications)/
    │   │   │   │   │   └── page/
    │   │   │   │   │       └── index.tsx
    │   │   │   │   ├── permissions/
    │   │   │   │   │   └── page/
    │   │   │   │   │       ├── components/
    │   │   │   │   │       │   └── RBACGuard.tsx
    │   │   │   │   │       └── index.tsx
    │   │   │   │   ├── roles/
    │   │   │   │   │   └── page/
    │   │   │   │   │       └── index.tsx
    │   │   │   │   ├── sessions/
    │   │   │   │   │   └── page/
    │   │   │   │   │       └── index.tsx
    │   │   │   │   └── users/
    │   │   │   │       └── page/
    │   │   │   │           └── index.tsx
    │   │   │   ├── (settings)/
    │   │   │   │   ├── analytics/
    │   │   │   │   │   └── page/
    │   │   │   │   │       └── index.tsx
    │   │   │   │   └── page/
    │   │   │   │       ├── components/
    │   │   │   │       │   └── S3ConfigurationForm.tsx
    │   │   │   │       └── index.tsx
    │   │   │   ├── (studio)/
    │   │   │   │   └── pages/
    │   │   │   │       ├── forms/
    │   │   │   │       │   ├── config/
    │   │   │   │       │   │   └── types.ts
    │   │   │   │       │   └── page/
    │   │   │   │       │       ├── components/
    │   │   │   │       │       │   └── FormManagementView.tsx
    │   │   │   │       │       └── index.tsx
    │   │   │   │       ├── live-editor/
    │   │   │   │       │   ├── components/
    │   │   │   │       │   │   └── PublishProgressModal.tsx
    │   │   │   │       │   ├── config/
    │   │   │   │       │   │   └── types.ts
    │   │   │   │       │   ├── layout/
    │   │   │   │       │   │   ├── config.ts
    │   │   │   │       │   │   ├── header/
    │   │   │   │       │   │   │   └── index.tsx
    │   │   │   │       │   │   ├── index.tsx
    │   │   │   │       │   │   ├── schema.ts
    │   │   │   │       │   │   └── toolbar/
    │   │   │   │       │   │       └── index.tsx
    │   │   │   │       │   ├── page/
    │   │   │   │       │   │   ├── components/
    │   │   │   │       │   │   │   └── CreateSectionDialog.tsx
    │   │   │   │       │   │   └── index.tsx
    │   │   │   │       │   ├── shared/
    │   │   │   │       │   │   ├── BackgroundSelector.tsx
    │   │   │   │       │   │   ├── DeviceSelector.tsx
    │   │   │   │       │   │   ├── MediaSelectorButton.tsx
    │   │   │   │       │   │   ├── PageSelector.tsx
    │   │   │   │       │   │   └── QuickPageSelector.tsx
    │   │   │   │       │   ├── tabs/
    │   │   │   │       │   │   ├── code/
    │   │   │   │       │   │   │   └── index.tsx
    │   │   │   │       │   │   ├── design/
    │   │   │   │       │   │   │   └── index.tsx
    │   │   │   │       │   │   ├── index.tsx
    │   │   │   │       │   │   └── settings/
    │   │   │   │       │   │       └── index.tsx
    │   │   │   │       │   └── types.ts
    │   │   │   │       ├── media/
    │   │   │   │       │   └── page/
    │   │   │   │       │       └── index.tsx
    │   │   │   │       ├── menus/
    │   │   │   │       │   └── components/
    │   │   │   │       │       ├── MenuItemVisibilityManager.tsx
    │   │   │   │       │       └── MenuView.tsx
    │   │   │   │       ├── pages/
    │   │   │   │       │   └── page/
    │   │   │   │       │       └── index.tsx
    │   │   │   │       └── templates/
    │   │   │   │           ├── page/
    │   │   │   │           │   └── index.tsx
    │   │   │   │           └── skeletons/
    │   │   │   │               └── TemplatesPageSkeleton.tsx
    │   │   │   ├── index.tsx
    │   │   │   ├── layout/
    │   │   │   │   ├── AdminLoader.tsx
    │   │   │   │   ├── header/
    │   │   │   │   │   ├── components/
    │   │   │   │   │   │   ├── GlobalSearch.tsx
    │   │   │   │   │   │   └── UserModal.tsx
    │   │   │   │   │   └── index.tsx
    │   │   │   │   └── sidebar/
    │   │   │   │       └── index.tsx
    │   │   │   ├── pages/
    │   │   │   │   └── PageDuplicator.tsx
    │   │   │   ├── sections/
    │   │   │   │   └── ParallaxEditor.tsx
    │   │   │   └── shared/
    │   │   │       ├── Badge.tsx
    │   │   │       ├── Button.tsx
    │   │   │       ├── DashboardStatsCard.tsx
    │   │   │       ├── DashboardStatsCardItem.tsx
    │   │   │       ├── DataTable.tsx
    │   │   │       ├── MediaSelector.tsx
    │   │   │       ├── PageHeader.tsx
    │   │   │       ├── SearchBar.tsx
    │   │   │       ├── StatCard.tsx
    │   │   │       └── index.ts
    │   │   ├── client/
    │   │   │   └── website/
    │   │   │       ├── preview/
    │   │   │       │   ├── PreviewModal.tsx
    │   │   │       │   └── WebsitePreview.tsx
    │   │   │       └── production/
    │   │   │           └── WebsiteProduction.tsx
    │   │   └── layout/
    │   │       └── ClientInitializer.tsx
    │   │
    │   ├── editor/
    │   │   ├── components/
    │   │   │   ├── config.ts
    │   │   │   ├── config/
    │   │   │   │   └── index.tsx
    │   │   │   ├── hooks/
    │   │   │   │   ├── useComponentEditorIntegration.ts
    │   │   │   │   ├── useComponentHistory.ts
    │   │   │   │   └── useComponentTypeChange.ts
    │   │   │   ├── index.tsx
    │   │   │   ├── tabs/
    │   │   │   │   ├── content/
    │   │   │   │   │   ├── config.ts
    │   │   │   │   │   ├── index.tsx
    │   │   │   │   │   ├── style-field-status.ts
    │   │   │   │   │   └── variant-styles.ts
    │   │   │   │   ├── effects/
    │   │   │   │   │   └── index.tsx
    │   │   │   │   ├── settings/
    │   │   │   │   │   ├── config.ts
    │   │   │   │   │   └── index.tsx
    │   │   │   │   └── style/
    │   │   │   │       ├── config.ts
    │   │   │   │       └── index.tsx
    │   │   │   ├── widgets/
    │   │   │   │   ├── ComponentBackupManager.ts
    │   │   │   │   ├── ComponentSelector.tsx
    │   │   │   │   └── ComponentTypeChangeDialog.tsx
    │   │   │   └── wrapper/
    │   │   │       ├── config.ts
    │   │   │       └── index.tsx
    │   │   ├── forms/
    │   │   │   ├── index.tsx
    │   │   │   └── tabs/
    │   │   │       └── styles/
    │   │   │           ├── FormStyleEditor.tsx
    │   │   │           └── index.tsx
    │   │   ├── index.tsx
    │   │   ├── menu-sections/
    │   │   │   ├── index.tsx
    │   │   │   ├── menus/
    │   │   │   │   ├── content/
    │   │   │   │   │   └── index.tsx
    │   │   │   │   └── index.tsx
    │   │   │   └── models/
    │   │   │       ├── aside/
    │   │   │       │   └── index.tsx
    │   │   │       ├── footer/
    │   │   │       │   └── index.tsx
    │   │   │       └── header/
    │   │   │           └── index.tsx
    │   │   ├── scroll/
    │   │   │   ├── index.tsx
    │   │   │   ├── LandingZoneEditor.tsx
    │   │   │   └── TitleAnimationEditor.tsx
    │   │   ├── sections/
    │   │   │   ├── config.ts
    │   │   │   ├── index.tsx
    │   │   │   └── tabs/
    │   │   │       ├── content/
    │   │   │       │   ├── ContentTab.tsx
    │   │   │       │   ├── config.ts
    │   │   │       │   └── index.tsx
    │   │   │       ├── settings/
    │   │   │       │   ├── config.ts
    │   │   │       │   ├── effects.tsx
    │   │   │       │   └── index.tsx
    │   │   │       └── styles/
    │   │   │           ├── config.ts
    │   │   │           ├── index.tsx
    │   │   │           └── PreviewMiniSection.tsx
    │   │   ├── style/
    │   │   │   ├── README.md
    │   │   │   └── schema.ts
    │   │   ├── toolbar/
    │   │   │   ├── toolbarConfig.ts
    │   │   │   ├── toolbarDataFetcher.ts
    │   │   │   └── TypographyToolbar.tsx
    │   │   └── unified/
    │   │       ├── README.md
    │   │       ├── UnifiedEditor.tsx
    │   │       ├── adapters/
    │   │       │   ├── README.md
    │   │       │   └── SectionEditorAdapter.tsx
    │   │       └── tabs/
    │   │           ├── ContentTabRenderer.tsx
    │   │           ├── SettingsTabRenderer.tsx
    │   │           └── StylesTabRenderer.tsx
    │   │
    │   ├── render/
    │   │   ├── components/
    │   │   │   ├── config.ts
    │   │   │   ├── config/
    │   │   │   │   └── content.ts
    │   │   │   ├── fallback/
    │   │   │   │   └── GenericComponent.tsx
    │   │   │   ├── metadata.ts
    │   │   │   ├── models/
    │   │   │   │   ├── advanced/
    │   │   │   │   │   ├── card/
    │   │   │   │   │   │   ├── config.ts
    │   │   │   │   │   │   ├── index.tsx
    │   │   │   │   │   │   └── skeleton.tsx
    │   │   │   │   │   ├── chart/
    │   │   │   │   │   │   ├── config.ts
    │   │   │   │   │   │   ├── index.tsx
    │   │   │   │   │   │   └── skeleton.tsx
    │   │   │   │   │   ├── gallery/
    │   │   │   │   │   │   ├── config.ts
    │   │   │   │   │   │   ├── index.tsx
    │   │   │   │   │   │   └── skeleton.tsx
    │   │   │   │   │   ├── index.ts
    │   │   │   │   │   ├── map/
    │   │   │   │   │   │   ├── config.ts
    │   │   │   │   │   │   ├── index.tsx
    │   │   │   │   │   │   └── skeleton.tsx
    │   │   │   │   │   └── social/
    │   │   │   │   │       ├── config.ts
    │   │   │   │   │       ├── index.tsx
    │   │   │   │   │       └── skeleton.tsx
    │   │   │   │   ├── content/
    │   │   │   │   │   ├── avatar/
    │   │   │   │   │   │   ├── config.ts
    │   │   │   │   │   │   └── index.tsx
    │   │   │   │   │   ├── badge/
    │   │   │   │   │   │   ├── config.ts
    │   │   │   │   │   │   ├── constants.ts
    │   │   │   │   │   │   ├── index.tsx
    │   │   │   │   │   │   └── skeleton.tsx
    │   │   │   │   │   ├── chip/
    │   │   │   │   │   │   ├── config.ts
    │   │   │   │   │   │   ├── index.tsx
    │   │   │   │   │   │   └── skeleton.tsx
    │   │   │   │   │   ├── heading/
    │   │   │   │   │   │   ├── config.ts
    │   │   │   │   │   │   ├── index.tsx
    │   │   │   │   │   │   └── skeleton.tsx
    │   │   │   │   │   ├── icon/
    │   │   │   │   │   │   ├── config.ts
    │   │   │   │   │   │   └── index.tsx
    │   │   │   │   │   ├── image/
    │   │   │   │   │   │   ├── config.ts
    │   │   │   │   │   │   ├── index.tsx
    │   │   │   │   │   │   └── skeleton.tsx
    │   │   │   │   │   ├── index.ts
    │   │   │   │   │   ├── list/
    │   │   │   │   │   │   ├── config.ts
    │   │   │   │   │   │   ├── index.tsx
    │   │   │   │   │   │   └── skeleton.tsx
    │   │   │   │   │   ├── paragraph/
    │   │   │   │   │   │   ├── config.ts
    │   │   │   │   │   │   ├── index.tsx
    │   │   │   │   │   │   └── skeleton.tsx
    │   │   │   │   │   ├── quote/
    │   │   │   │   │   │   ├── config.ts
    │   │   │   │   │   │   ├── index.tsx
    │   │   │   │   │   │   └── skeleton.tsx
    │   │   │   │   │   ├── richText/
    │   │   │   │   │   │   ├── config.ts
    │   │   │   │   │   │   ├── index.tsx
    │   │   │   │   │   │   └── skeleton.tsx
    │   │   │   │   │   ├── testimonial/
    │   │   │   │   │   │   ├── config.ts
    │   │   │   │   │   │   ├── index.tsx
    │   │   │   │   │   │   └── skeleton.tsx
    │   │   │   │   │   ├── text/
    │   │   │   │   │   │   ├── animation-config.ts
    │   │   │   │   │   │   ├── animation-types.ts
    │   │   │   │   │   │   ├── config.ts
    │   │   │   │   │   │   ├── index.tsx
    │   │   │   │   │   │   └── skeleton.tsx
    │   │   │   │   │   └── video/
    │   │   │   │   │       ├── config.ts
    │   │   │   │   │       ├── index.tsx
    │   │   │   │   │       └── skeleton.tsx
    │   │   │   │   ├── detector-browser.ts
    │   │   │   │   ├── index.ts
    │   │   │   │   ├── interactive/
    │   │   │   │   │   ├── alert/
    │   │   │   │   │   │   ├── config.ts
    │   │   │   │   │   │   ├── index.tsx
    │   │   │   │   │   │   └── skeleton.tsx
    │   │   │   │   │   ├── button/
    │   │   │   │   │   │   ├── config.ts
    │   │   │   │   │   │   ├── index.tsx
    │   │   │   │   │   │   └── skeleton.tsx
    │   │   │   │   │   ├── cta/
    │   │   │   │   │   │   ├── config.ts
    │   │   │   │   │   │   ├── index.tsx
    │   │   │   │   │   │   └── skeleton.tsx
    │   │   │   │   │   ├── form/
    │   │   │   │   │   │   ├── config.ts
    │   │   │   │   │   │   ├── index.tsx
    │   │   │   │   │   │   └── skeleton.tsx
    │   │   │   │   │   ├── index.ts
    │   │   │   │   │   ├── modal/
    │   │   │   │   │   │   ├── config.ts
    │   │   │   │   │   │   ├── index.tsx
    │   │   │   │   │   │   └── skeleton.tsx
    │   │   │   │   │   ├── notification/
    │   │   │   │   │   │   ├── config.ts
    │   │   │   │   │   │   ├── index.tsx
    │   │   │   │   │   │   └── skeleton.tsx
    │   │   │   │   │   └── progress/
    │   │   │   │   │       ├── config.ts
    │   │   │   │   │       ├── index.tsx
    │   │   │   │   │       └── skeleton.tsx
    │   │   │   │   ├── layout/
    │   │   │   │   │   ├── divider/
    │   │   │   │   │   │   ├── config.ts
    │   │   │   │   │   │   ├── index.tsx
    │   │   │   │   │   │   └── skeleton.tsx
    │   │   │   │   │   ├── index.ts
    │   │   │   │   │   └── spacer/
    │   │   │   │   │       ├── config.ts
    │   │   │   │   │       ├── index.tsx
    │   │   │   │   │       └── skeleton.tsx
    │   │   │   │   ├── principalVariants.ts
    │   │   │   │   ├── showcase/
    │   │   │   │   │   ├── cta-banner/
    │   │   │   │   │   │   ├── config.ts
    │   │   │   │   │   │   ├── index.tsx
    │   │   │   │   │   │   └── skeleton.tsx
    │   │   │   │   │   ├── hero/
    │   │   │   │   │   │   ├── config.ts
    │   │   │   │   │   │   ├── index.tsx
    │   │   │   │   │   │   └── skeleton.tsx
    │   │   │   │   │   ├── index.ts
    │   │   │   │   │   ├── metric-highlight/
    │   │   │   │   │   │   ├── config.ts
    │   │   │   │   │   │   ├── index.tsx
    │   │   │   │   │   │   └── skeleton.tsx
    │   │   │   │   │   ├── service/
    │   │   │   │   │   │   ├── config.ts
    │   │   │   │   │   │   ├── index.tsx
    │   │   │   │   │   │   └── skeleton.tsx
    │   │   │   │   │   └── testimonial/
    │   │   │   │   │       ├── config.ts
    │   │   │   │   │       ├── index.tsx
    │   │   │   │   │       └── skeleton.tsx
    │   │   │   │   └── wrappers/
    │   │   │   │       ├── accordion/
    │   │   │   │       │   ├── config.ts
    │   │   │   │       │   └── index.tsx
    │   │   │   │       ├── config.ts
    │   │   │   │       ├── container/
    │   │   │   │       │   ├── config.ts
    │   │   │   │       │   └── index.tsx
    │   │   │   │       ├── flex/
    │   │   │   │       │   ├── config.ts
    │   │   │   │       │   └── index.tsx
    │   │   │   │       ├── grid/
    │   │   │   │       │   ├── config.ts
    │   │   │   │       │   └── index.tsx
    │   │   │   │       ├── index.ts
    │   │   │   │       ├── loader.ts
    │   │   │   │       ├── masonry/
    │   │   │   │       │   ├── config.ts
    │   │   │   │       │   └── index.tsx
    │   │   │   │       ├── renderer.tsx
    │   │   │   │       ├── stack/
    │   │   │   │       │   ├── config.ts
    │   │   │   │       │   └── index.tsx
    │   │   │   │       └── tabs/
    │   │   │   │           ├── config.ts
    │   │   │   │           └── index.tsx
    │   │   │   ├── renderer.tsx
    │   │   │   ├── widgets/
    │   │   │   │   └── content/
    │   │   │   │       ├── ButtonContent.tsx
    │   │   │   │       ├── ImageContent.tsx
    │   │   │   │       ├── TextContent.tsx
    │   │   │   │       ├── VideoContent.tsx
    │   │   │   │       └── interactive/
    │   │   │   │           └── AccordionContent.tsx
    │   │   │   └── wizard/
    │   │   │       ├── index.tsx
    │   │   │       └── steps/
    │   │   │           ├── complete.tsx
    │   │   │           ├── content-config.tsx
    │   │   │           ├── index.ts
    │   │   │           ├── preview.tsx
    │   │   │           ├── styling-config.tsx
    │   │   │           ├── type-selection.tsx
    │   │   │           └── variant-selection.tsx
    │   │   ├── forms/
    │   │   │   ├── config.ts
    │   │   │   ├── config/
    │   │   │   │   ├── content.ts
    │   │   │   │   └── types.ts
    │   │   │   └── renderer.tsx
    │   │   ├── menu-sections/
    │   │   │   ├── config.ts
    │   │   │   ├── menus/
    │   │   │   │   ├── content/
    │   │   │   │   │   └── editor/
    │   │   │   │   │       └── index.tsx
    │   │   │   │   └── editor/
    │   │   │   │       └── index.tsx
    │   │   │   ├── models/
    │   │   │   │   ├── aside/
    │   │   │   │   │   └── index.tsx
    │   │   │   │   ├── footer/
    │   │   │   │   │   ├── index.tsx
    │   │   │   │   │   └── variants.ts
    │   │   │   │   ├── header/
    │   │   │   │   │   └── index.tsx
    │   │   │   │   └── index.ts
    │   │   │   ├── renderer.tsx
    │   │   │   └── wizard.tsx
    │   │   ├── pages/
    │   │   │   ├── components/
    │   │   │   │   └── ComponentNavigation.tsx
    │   │   │   ├── config.ts
    │   │   │   └── renderer.tsx
    │   │   ├── scroll.ts
    │   │   └── section/
    │   │       ├── components/
    │   │       │   └── CarouselBackground.tsx
    │   │       ├── config.ts
    │   │       ├── models/
    │   │       │   ├── avatar/
    │   │       │   │   ├── config.ts
    │   │       │   │   ├── index.tsx
    │   │       │   │   ├── types.ts
    │   │       │   │   └── variants/
    │   │       │   │       ├── carousel.tsx
    │   │       │   │       ├── grid.tsx
    │   │       │   │       ├── masonry.tsx
    │   │       │   │       └── registry.tsx
    │   │       │   ├── parallax/
    │   │       │   │   ├── config.ts
    │   │       │   │   ├── index.tsx
    │   │       │   │   ├── types.ts
    │   │       │   │   ├── utils.ts
    │   │       │   │   └── variants/
    │   │       │   │       ├── classic/
    │   │       │   │       │   └── index.tsx
    │   │       │   │       ├── depth-3d/
    │   │       │   │       │   └── index.tsx
    │   │       │   │       ├── element/
    │   │       │   │       │   └── index.tsx
    │   │       │   │       ├── horizontal/
    │   │       │   │       │   └── index.tsx
    │   │       │   │       ├── morphing/
    │   │       │   │       │   └── index.tsx
    │   │       │   │       ├── mouse/
    │   │       │   │       │   └── index.tsx
    │   │       │   │       ├── multi-layer/
    │   │       │   │       │   └── index.tsx
    │   │       │   │       ├── registry.tsx
    │   │       │   │       ├── reveal/
    │   │       │   │       │   └── index.tsx
    │   │       │   │       ├── split/
    │   │       │   │       │   └── index.tsx
    │   │       │   │       ├── stub.tsx
    │   │       │   │       ├── tilt/
    │   │       │   │       │   └── index.tsx
    │   │       │   │       ├── video/
    │   │       │   │       │   └── index.tsx
    │   │       │   │       └── zoom/
    │   │       │   │           └── index.tsx
    │   │       │   ├── promotion/
    │   │       │   │   ├── config.ts
    │   │       │   │   ├── index.tsx
    │   │       │   │   ├── types.ts
    │   │       │   │   └── variants/
    │   │       │   │       ├── registry.tsx
    │   │       │   │       ├── simple.tsx
    │   │       │   │       └── wrapper.tsx
    │   │       │   └── scroll/
    │   │       │       ├── config.ts
    │   │       │       ├── index.tsx
    │   │       │       ├── types.ts
    │   │       │       └── variants/
    │   │       │           ├── FoundationText.tsx
    │   │       │           ├── ImageColumn.tsx
    │   │       │           ├── ImageColumnSkeleton.tsx
    │   │       │           ├── ScrollDebugLog.tsx
    │   │       │           ├── TextColumn.tsx
    │   │       │           ├── TextColumnSkeleton.tsx
    │   │       │           ├── bubble-list-scroll.tsx
    │   │       │           ├── registry.tsx
    │   │       │           ├── tabs-scroll.tsx
    │   │       │           ├── text-image-scroll.tsx
    │   │       │           ├── title-scale-scroll.tsx
    │   │       │           └── zoom.tsx
    │   │       ├── renderer.tsx
    │   │       ├── wizard.tsx
    │   │       └── wizard/
    │   │           └── steps/
    │   │               ├── complete.tsx
    │   │               ├── content-config.tsx
    │   │               ├── index.ts
    │   │               ├── preview.tsx
    │   │               ├── styling-config.tsx
    │   │               ├── type-selection.tsx
    │   │               └── variant-selection.tsx
    │   │
    │   ├── shared/
    │   │   ├── config/
    │   │   │   ├── forms.ts
    │   │   │   ├── section-editor.ts
    │   │   │   ├── sections.ts
    │   │   │   ├── style-editor.ts
    │   │   │   └── styles.ts
    │   │   ├── IconSelectorButton.tsx
    │   │   ├── S3FilePreview.tsx
    │   │   ├── TabsContent.tsx
    │   │   └── skeletons/
    │   │       ├── BadgeLoadingSkeleton.tsx
    │   │       ├── ButtonLoader.tsx
    │   │       ├── ButtonLoadingSkeleton.tsx
    │   │       ├── ButtonSkeleton.tsx
    │   │       ├── CircularLoader.tsx
    │   │       ├── ComponentLoadingSkeleton.tsx
    │   │       ├── EditorSidebarSkeleton.tsx
    │   │       ├── FormLoadingSkeleton.tsx
    │   │       ├── FormSubmissionsPageSkeleton.tsx
    │   │       ├── FormsManagementPageSkeleton.tsx
    │   │       ├── FormsManagerSkeleton.tsx
    │   │       ├── FormsPageSkeleton.tsx
    │   │       ├── InlineLoader.tsx
    │   │       ├── LivePreviewPageSkeleton.tsx
    │   │       ├── MediaLibraryPageSkeleton.tsx
    │   │       ├── MediaSelectorSkeleton.tsx
    │   │       ├── MenuEditorSkeleton.tsx
    │   │       ├── MenuPageSkeleton.tsx
    │   │       ├── MenusManagerSkeleton.tsx
    │   │       ├── NotificationsManagementPageSkeleton.tsx
    │   │       ├── PageSectionsManagerSkeleton.tsx
    │   │       ├── PageSelectorSkeleton.tsx
    │   │       ├── PageTransitionSkeleton.tsx
    │   │       ├── PageVisibilitySettingsSkeleton.tsx
    │   │       ├── PagesManagementPageSkeleton.tsx
    │   │       ├── PermissionsManagementPageSkeleton.tsx
    │   │       ├── RBACGuardSkeleton.tsx
    │   │       ├── RolesManagementPageSkeleton.tsx
    │   │       ├── S3ConfigSkeleton.tsx
    │   │       ├── SectionCardSkeleton.tsx
    │   │       ├── SessionsManagementPageSkeleton.tsx
    │   │       ├── ShimmerSkeleton.tsx
    │   │       ├── SubmitButtonSkeleton.tsx
    │   │       ├── TableSkeleton.tsx
    │   │       ├── TemplatesPageSkeleton.tsx
    │   │       ├── TextSkeleton.tsx
    │   │       ├── UserManagementPageSkeleton.tsx
    │   │       ├── WebsiteSettingsSkeleton.tsx
    │   │       └── index.ts
    │   │
    │   ├── sidebar/
    │   │   ├── components/
    │   │   │   ├── CategorySection.tsx
    │   │   │   ├── ComponentsCategory.tsx
    │   │   │   ├── forms/
    │   │   │   │   ├── FormItem.tsx
    │   │   │   │   └── FormsCategory.tsx
    │   │   │   ├── header.tsx
    │   │   │   ├── menu-sections/
    │   │   │   │   └── MenuSectionsCategory.tsx
    │   │   │   ├── menus/
    │   │   │   │   ├── MenuItem.tsx
    │   │   │   │   └── MenusCategory.tsx
    │   │   │   └── sections/
    │   │   │       └── category/
    │   │   │           ├── components/
    │   │   │           │   └── SectionItem.tsx
    │   │   │           └── index.tsx
    │   │   └── index.tsx
    │   │
    │   └── ui/
    │       ├── accordion.tsx
    │       ├── alert-dialog.tsx
    │       ├── alert.tsx
    │       ├── aspect-ratio.tsx
    │       ├── avatar.tsx
    │       ├── badge.tsx
    │       ├── breadcrumb.tsx
    │       ├── button.tsx
    │       ├── calendar.tsx
    │       ├── card.tsx
    │       ├── carousel.tsx
    │       ├── chart.tsx
    │       ├── checkbox.tsx
    │       ├── collapsible.tsx
    │       ├── command.tsx
    │       ├── context-menu.tsx
    │       ├── dialog.tsx
    │       ├── drawer.tsx
    │       ├── dropdown-menu.tsx
    │       ├── form.tsx
    │       ├── hover-card.tsx
    │       ├── input-otp.tsx
    │       ├── input.tsx
    │       ├── label.tsx
    │       ├── menubar.tsx
    │       ├── navigation-menu.tsx
    │       ├── pagination.tsx
    │       ├── popover.tsx
    │       ├── progress.tsx
    │       ├── radio-group.tsx
    │       ├── resizable.tsx
    │       ├── scroll-area.tsx
    │       ├── select.tsx
    │       ├── separator.tsx
    │       ├── sheet.tsx
    │       ├── sidebar.tsx
    │       ├── skeleton.tsx
    │       ├── slider.tsx
    │       ├── sonner.tsx
    │       ├── switch.tsx
    │       ├── table.tsx
    │       ├── tabs.tsx
    │       ├── textarea.tsx
    │       ├── toggle-group.tsx
    │       ├── toggle.tsx
    │       └── tooltip.tsx
    │
    ├── config/
    │   ├── api/
    │   │   ├── forms.ts
    │   │   ├── media.ts
    │   │   ├── menus.ts
    │   │   └── sections.ts
    │   ├── cms.ts
    │   ├── constants.ts
    │   ├── design-tokens.ts
    │   ├── index.ts
    │   ├── optimized.ts
    │   ├── page-render.ts
    │   ├── styles/
    │   │   └── unified-config.ts
    │   ├── styles.ts
    │   └── ui.ts
    │
    ├── contexts/
    │   ├── _deprecated/
    │   │   ├── scroll-config-usage.tsx
    │   │   └── UnifiedScrollContext.tsx
    │   ├── AuthContext.tsx
    │   ├── AuthPreviewContext.tsx
    │   ├── ContinuousScrollContext.tsx
    │   ├── GSAPContext.tsx
    │   ├── PageActionsContext.tsx
    │   ├── ScrollContext.tsx
    │   ├── ScrollManagerContext.tsx
    │   ├── SearchContext.tsx
    │   └── SectionEditorContext.tsx
    │
    ├── editor/
    │   └── style/
    │       ├── README.md
    │       └── schema.ts
    │
    ├── hooks/
    │   ├── config/
    │   │   └── forms.ts
    │   ├── sections/
    │   │   ├── styles/
    │   │   │   └── useStyleEditor.ts
    │   │   └── useSections.ts
    │   ├── use-mobile.ts
    │   ├── useAvailableLanguages.ts
    │   ├── useBackgroundImageUrl.ts
    │   ├── useCarouselBackgroundUrls.ts
    │   ├── useComponentMetadata.ts
    │   ├── useComponentStyles.ts
    │   ├── useContinuousScrollDetection.ts
    │   ├── useDebounceEffect.ts
    │   ├── useErrorHandling.ts
    │   ├── useForm.ts
    │   ├── useFormData.ts
    │   ├── useGSAPAnimation.ts
    │   ├── useGlobalScroll.ts
    │   ├── useInstantPreview.ts
    │   ├── useMedia.ts
    │   ├── useMediaSelector.ts
    │   ├── useMenu.ts
    │   ├── useMenuSection.ts
    │   ├── useMenuSectionsWithDrafts.ts
    │   ├── usePerformanceMonitoring.ts
    │   ├── usePerformanceOptimization.ts
    │   ├── useResizableSidebar.ts
    │   ├── useS3FileCache.ts
    │   ├── useScrollConfigurations.ts
    │   ├── useScrollSectionDetection.ts
    │   └── useTestimonialGSAP.ts
    │
    ├── lib/
    │   ├── accessibility-utils.ts
    │   ├── api-response.ts
    │   ├── auth-utils.ts
    │   ├── auth.ts
    │   ├── brand-colors.ts
    │   ├── cache.ts
    │   ├── component-defaults.ts
    │   ├── config-accessors/
    │   ├── cors.ts
    │   ├── editor-config-loader.ts
    │   ├── encryption.ts
    │   ├── jwt.ts
    │   ├── lang/
    │   │   ├── i18n.ts
    │   │   ├── locales/
    │   │   │   ├── en.json
    │   │   │   └── es.json
    │   │   └── useI18n.ts
    │   ├── microservices.ts
    │   ├── monitoring/
    │   │   └── sentry.ts
    │   ├── plugin-system.ts
    │   ├── prisma.ts
    │   ├── render-config-metadata.ts
    │   ├── s3/
    │   │   ├── databaseConfig.ts
    │   │   └── s3Service.ts
    │   ├── scroll-behavior.ts
    │   ├── styles.ts
    │   ├── utils/
    │   │   ├── backgroundTypeUtils.ts
    │   │   ├── media.ts
    │   │   ├── mediaUrlTransform.ts
    │   │   └── serialization.ts
    │   ├── utils.ts
    │   └── webhooks.ts
    │
    ├── mcp/
    │   └── server.ts
    │
    ├── modules/
    │   ├── analytics/
    │   │   ├── dto.ts
    │   │   └── schema.ts
    │   ├── auth/
    │   │   ├── dto.ts
    │   │   ├── repository.ts
    │   │   ├── schema.ts
    │   │   └── service.ts
    │   ├── forms/
    │   │   ├── controller.ts
    │   │   ├── dto.ts
    │   │   ├── repository.ts
    │   │   ├── schema.ts
    │   │   └── service.ts
    │   ├── interpretation/
    │   │   ├── dto.ts
    │   │   └── schema.ts
    │   ├── media/
    │   │   ├── dto.ts
    │   │   └── schema.ts
    │   ├── menus/
    │   │   ├── dto.ts
    │   │   └── schema.ts
    │   ├── notifications/
    │   │   ├── dto.ts
    │   │   └── schema.ts
    │   ├── pages/
    │   │   ├── dto.ts
    │   │   └── schema.ts
    │   ├── permissions/
    │   │   ├── dto.ts
    │   │   └── schema.ts
    │   ├── roles/
    │   │   ├── dto.ts
    │   │   └── schema.ts
    │   ├── users/
    │   │   ├── controller.ts
    │   │   ├── dto.ts
    │   │   ├── repository.ts
    │   │   ├── schema.ts
    │   │   └── service.ts
    │   └── website/
    │       ├── dto.ts
    │       └── schema.ts
    │
    ├── providers/
    │   ├── ClientInitializer.tsx
    │   ├── ErrorBoundary.tsx
    │   ├── ErrorBoundaryProvider.tsx
    │   ├── ReduxProvider.tsx
    │   ├── ScrollBehaviorProvider.tsx
    │   └── StyleEditorProvider.tsx
    │
    ├── proxy.ts
    │
    ├── store/
    │   ├── config.ts
    │   ├── index.ts
    │   ├── middleware/
    │   │   └── styleSyncMiddleware.ts
    │   ├── selectors/
    │   │   └── index.ts
    │   └── slices/
    │       ├── authSlice.ts
    │       ├── cmsSlice.ts
    │       ├── draftSlice.ts
    │       ├── editorSlice.ts
    │       ├── performanceSlice.ts
    │       ├── scrollConfigSlice.ts
    │       ├── styleEditorSlice.ts
    │       ├── unifiedEditorSlice.ts
    │       └── unifiedSlice.ts
    │
    └── types/
        ├── effects-config.ts
        ├── forms.ts
        ├── global.d.ts
        ├── media.ts
        ├── next.d.ts
        ├── scroll-config.ts
        ├── section-editor.ts
        ├── section-effects.ts
        ├── sections.ts
        ├── style-editor.ts
        ├── unified-editor.ts
        ├── website.ts
        └── wrappers.ts
```

## Notes

- Build artifacts (`.next/`, `node_modules/`, `.git/`) are excluded from this structure
- Empty directories are shown but may not contain files
- All file extensions are preserved for clarity
- The structure reflects the actual source code organization


