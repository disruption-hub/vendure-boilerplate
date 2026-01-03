import { Prisma, PrismaClient } from '@prisma/client'

import { renderTemplate } from '../src/lib/communication/template-renderer'

const prisma = new PrismaClient()

const BRAND_METADATA = {
  name: 'FlowBot',
  tagline: 'Automatiza cada conversación con inteligencia real',
  primaryColor: '#6366f1',
  darkColor: '#0f172a',
  lightColor: '#eef2ff',
  supportEmail: 'soporte@flowcast.chat',
  supportPhone: '+51 987 654 321',
  address: 'Av. Flow 123, Lima, Perú',
  website: 'https://flowcast.chat',
}

type CategorySeed = {
  name: string
  description: string
  sortOrder: number
}

type ComponentSeed = {
  componentKey: string
  name: string
  componentType: string
  description: string
  markup: string
  categoryName: string
  sortOrder: number
}

type TemplateSeed = {
  templateKey: string
  name: string
  description: string
  category: string
  subject: string
  content: string
  composition: string[]
  metadata?: Record<string, unknown>
}

const CATEGORY_SEEDS: CategorySeed[] = [
  {
    name: 'Encabezados',
    description: 'Bloques superiores con identidad FlowBot',
    sortOrder: 1,
  },
  {
    name: 'Contenido principal',
    description: 'Secciones centrales con mensajes clave',
    sortOrder: 2,
  },
  {
    name: 'Acciones',
    description: 'Botones y llamados a la acción',
    sortOrder: 3,
  },
  {
    name: 'Pie de página',
    description: 'Información de contacto y legal',
    sortOrder: 4,
  },
]

const COMPONENT_SEEDS: ComponentSeed[] = [
  {
    componentKey: 'flowbot_header_primary',
    name: 'FlowBot Encabezado Principal',
    componentType: 'header',
    description: 'Encabezado corporativo con branding FlowBot',
    categoryName: 'Encabezados',
    sortOrder: 1,
    markup: `
      <table width="100%" cellPadding="0" cellSpacing="0" role="presentation" style="background:${BRAND_METADATA.darkColor};color:#ffffff;">
        <tr>
          <td style="padding:32px 24px;text-align:center;">
            <div style="font-size:28px;font-weight:700;letter-spacing:-0.5px;">${BRAND_METADATA.name}</div>
            <div style="margin-top:8px;font-size:14px;line-height:20px;color:#cbd5f5;">${BRAND_METADATA.tagline}</div>
          </td>
        </tr>
      </table>
    `.trim(),
  },
  {
    componentKey: 'flowbot_hero_welcome',
    name: 'Mensaje de Bienvenida',
    componentType: 'content_block',
    description: 'Bloque hero dinámico para dar la bienvenida a nuevos usuarios',
    categoryName: 'Contenido principal',
    sortOrder: 2,
    markup: `
      <table width="100%" cellPadding="0" cellSpacing="0" role="presentation" style="background:#ffffff;">
        <tr>
          <td style="padding:32px 28px;">
            <h1 style="margin:0;font-size:26px;line-height:32px;color:${BRAND_METADATA.darkColor};">
              ¡Hola {{ recipient.firstName || 'FlowBotter' }}!
            </h1>
            <p style="margin:16px 0 0;font-size:15px;line-height:24px;color:#334155;">
              Gracias por confiar en <strong>${BRAND_METADATA.name}</strong>. Desde hoy tus conversaciones estarán orquestadas con IA y listas para convertir.
            </p>
            <p style="margin:16px 0 0;font-size:15px;line-height:24px;color:#334155;">
              Hemos configurado tu espacio con los canales favoritos de tus clientes. Tu panel ya está esperando.
            </p>
          </td>
        </tr>
      </table>
    `.trim(),
  },
  {
    componentKey: 'flowbot_highlight_features',
    name: 'Bloque de Destacados',
    componentType: 'content_block',
    description: 'Destaca funcionalidades claves de FlowBot',
    categoryName: 'Contenido principal',
    sortOrder: 3,
    markup: `
      <table width="100%" cellPadding="0" cellSpacing="0" role="presentation" style="background:${BRAND_METADATA.lightColor};">
        <tr>
          <td style="padding:28px 28px;">
            <h2 style="margin:0;font-size:20px;color:${BRAND_METADATA.darkColor};">Lo que ya puedes hacer con FlowBot</h2>
            <ul style="margin:16px 0 0;padding-left:18px;font-size:14px;line-height:22px;color:#475569;">
              <li>Programar campañas multicanal con un clic.</li>
              <li>Diseñar mensajes arrastrando componentes listos para usar.</li>
              <li>Automatizar recordatorios, onboarding y flujos de soporte.</li>
            </ul>
          </td>
        </tr>
      </table>
    `.trim(),
  },
  {
    componentKey: 'flowbot_cta_button_primary',
    name: 'Botón Primario',
    componentType: 'call_to_action',
    description: 'Botón principal adaptable a distintas acciones',
    categoryName: 'Acciones',
    sortOrder: 4,
    markup: `
      <table width="100%" role="presentation" style="background:#ffffff;">
        <tr>
          <td align="center" style="padding:24px 0;">
            <a href="{{ cta.url || '${BRAND_METADATA.website}' }}" style="display:inline-block;padding:14px 28px;border-radius:9999px;background:${BRAND_METADATA.primaryColor};color:#ffffff;font-weight:600;font-size:15px;text-decoration:none;">
              {{ cta.label || 'Ir al panel FlowBot' }}
            </a>
          </td>
        </tr>
      </table>
    `.trim(),
  },
  {
    componentKey: 'flowbot_transactional_details',
    name: 'Detalle Transaccional',
    componentType: 'content_block',
    description: 'Resumen con variables para confirmaciones u OTP',
    categoryName: 'Contenido principal',
    sortOrder: 5,
    markup: `
      <table width="100%" cellPadding="0" cellSpacing="0" role="presentation" style="background:#ffffff;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;">
        <tr>
          <td style="padding:24px 28px;">
            <h3 style="margin:0 0 12px;font-size:18px;color:${BRAND_METADATA.darkColor};">Detalles importantes</h3>
            <table width="100%" cellPadding="0" cellSpacing="0" role="presentation" style="font-size:14px;color:#475569;">
              <tr>
                <td style="padding:6px 0;width:40%;font-weight:600;">Código OTP</td>
                <td style="padding:6px 0;">{{ security.code || '000000' }}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-weight:600;">Expira en</td>
                <td style="padding:6px 0;">{{ security.expiresIn || '5 minutos' }}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-weight:600;">Próximo evento</td>
                <td style="padding:6px 0;">{{ appointment.date || 'Martes 15:00' }}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `.trim(),
  },
  {
    componentKey: 'flowbot_footer_contact',
    name: 'Pie de página FlowBot',
    componentType: 'footer',
    description: 'Información de soporte y redes FlowBot',
    categoryName: 'Pie de página',
    sortOrder: 6,
    markup: `
      <table width="100%" cellPadding="0" cellSpacing="0" role="presentation" style="background:${BRAND_METADATA.darkColor};color:#cbd5f5;">
        <tr>
          <td style="padding:28px 24px;text-align:center;font-size:13px;line-height:20px;">
            <div>¿Necesitas ayuda? Escríbenos a <a href="mailto:${BRAND_METADATA.supportEmail}" style="color:#e0e7ff;text-decoration:none;">${BRAND_METADATA.supportEmail}</a></div>
            <div style="margin-top:6px;">${BRAND_METADATA.supportPhone}</div>
            <div style="margin-top:6px;">${BRAND_METADATA.address}</div>
            <div style="margin-top:10px;font-size:12px;color:#94a3b8;">© {{ brand.currentYear || (new Date().getFullYear()) }} ${BRAND_METADATA.name}. Todos los derechos reservados.</div>
          </td>
        </tr>
      </table>
    `.trim(),
  },
]

const TEMPLATE_SEEDS: TemplateSeed[] = [
  {
    templateKey: 'flowbot_welcome_email',
    name: 'FlowBot · Bienvenida',
    description: 'Mensaje de bienvenida para nuevos administradores FlowBot',
    category: 'onboarding',
    subject: 'Bienvenido a FlowBot, {{ recipient.firstName }}',
    content:
      '<p>Hola {{ recipient.firstName }}, tu cuenta FlowBot está lista. Aquí tienes un resumen de lo que puedes hacer desde hoy.</p>',
    composition: ['flowbot_header_primary', 'flowbot_hero_welcome', 'flowbot_highlight_features', 'flowbot_cta_button_primary', 'flowbot_footer_contact'],
    metadata: {
      tags: ['welcome', 'marketing'],
    },
  },
  {
    templateKey: 'flowbot_security_otp',
    name: 'FlowBot · Código OTP',
    description: 'Entrega códigos OTP y recordatorios de seguridad',
    category: 'security',
    subject: 'Tu código FlowBot es {{ security.code }}',
    content:
      '<p>Usa este código para validar tu identidad. Mantente seguro con FlowBot.</p>',
    composition: ['flowbot_header_primary', 'flowbot_transactional_details', 'flowbot_cta_button_primary', 'flowbot_footer_contact'],
    metadata: {
      tags: ['otp', 'security'],
    },
  },
  {
    templateKey: 'flowbot_newsletter_update',
    name: 'FlowBot · Newsletter mensual',
    description: 'Newsletter con actualizaciones de producto y tips',
    category: 'newsletter',
    subject: 'Novedades FlowBot · {{ period.label || "Este mes" }}',
    content:
      '<p>Descubre las nuevas automatizaciones, integraciones y buenas prácticas para tu equipo.</p>',
    composition: ['flowbot_header_primary', 'flowbot_highlight_features', 'flowbot_cta_button_primary', 'flowbot_footer_contact'],
    metadata: {
      tags: ['newsletter'],
    },
  },
]

async function ensureGlobalConfig() {
  let config = await prisma.communicationConfig.findFirst({
    where: { tenantId: null },
    include: { channels: true },
  })

  if (!config) {
    config = await prisma.communicationConfig.create({
      data: {
        tenantId: null,
        isActive: true,
        name: 'FlowBot Global Communications',
        defaultFromEmail: 'noreply@flowcast.chat',
        defaultFromName: 'FlowBot',
        defaultReplyToEmail: 'soporte@flowcast.chat',
        adminEmail: 'soporte@flowcast.chat',
        metadata: BRAND_METADATA as Prisma.JsonObject,
        channels: {
          create: [
            {
              channel: 'EMAIL',
              provider: 'BREVO',
              isEnabled: true,
            },
            {
              channel: 'WHATSAPP',
              provider: 'WHATSAPP_CLOUD',
              isEnabled: false,
            },
            {
              channel: 'SMS',
              provider: 'LABSMOBILE',
              isEnabled: false,
            },
          ],
        },
      },
      include: { channels: true },
    })
  } else {
    const existingMetadata =
      config.metadata && typeof config.metadata === 'object' && !Array.isArray(config.metadata)
        ? (config.metadata as Record<string, unknown>)
        : {}

    const metadata = { ...existingMetadata, brand: BRAND_METADATA }

    config = await prisma.communicationConfig.update({
      where: { id: config.id },
      data: {
        defaultFromEmail: config.defaultFromEmail ?? 'noreply@flowcast.chat',
        defaultFromName: config.defaultFromName ?? 'FlowBot',
        defaultReplyToEmail: config.defaultReplyToEmail ?? BRAND_METADATA.supportEmail,
        adminEmail: config.adminEmail ?? BRAND_METADATA.supportEmail,
        metadata: metadata as Prisma.JsonObject,
      },
      include: { channels: true },
    })
  }

  const hasBrevoChannel = config.channels.some(channel => channel.channel === 'EMAIL' && channel.provider === 'BREVO')

  if (!hasBrevoChannel) {
    await prisma.communicationChannelSetting.upsert({
      where: {
        configId_channel: {
          configId: config.id,
          channel: 'EMAIL',
        },
      },
      update: {
        provider: 'BREVO',
        isEnabled: true,
      },
      create: {
        configId: config.id,
        channel: 'EMAIL',
        provider: 'BREVO',
        isEnabled: true,
      },
    })
  }

  return config
}

async function upsertCategory(seed: CategorySeed) {
  const existing = await prisma.communicationComponentCategory.findFirst({
    where: { name: seed.name },
  })

  if (existing) {
    await prisma.communicationComponentCategory.update({
      where: { id: existing.id },
      data: {
        description: seed.description,
        sortOrder: seed.sortOrder,
      },
    })
    return existing.id
  }

  const created = await prisma.communicationComponentCategory.create({
    data: {
      name: seed.name,
      description: seed.description,
      sortOrder: seed.sortOrder,
    },
  })

  return created.id
}

async function upsertComponent(seed: ComponentSeed, categoryId: number) {
  const existing = await prisma.communicationComponent.findUnique({
    where: { componentKey: seed.componentKey },
  })

  if (existing) {
    const updated = await prisma.communicationComponent.update({
      where: { id: existing.id },
      data: {
        name: seed.name,
        description: seed.description,
        componentType: seed.componentType,
        markup: seed.markup,
        categoryId,
        sortOrder: seed.sortOrder,
        channel: 'EMAIL',
        isActive: true,
      },
    })
    return updated
  }

  return prisma.communicationComponent.create({
    data: {
      componentKey: seed.componentKey,
      name: seed.name,
      description: seed.description,
      componentType: seed.componentType,
      markup: seed.markup,
      categoryId,
      sortOrder: seed.sortOrder,
      channel: 'EMAIL',
      isActive: true,
    },
  })
}

async function upsertTemplate(configId: number, seed: TemplateSeed, componentMap: Map<string, number>) {
  let template = await prisma.communicationTemplate.findFirst({
    where: { templateKey: seed.templateKey, configId },
  })

  if (!template) {
    template = await prisma.communicationTemplate.create({
      data: {
        configId,
        templateKey: seed.templateKey,
        name: seed.name,
        description: seed.description,
        channel: 'EMAIL',
        category: seed.category,
        isActive: true,
        isDefault: false,
        metadata: seed.metadata ? (seed.metadata as Prisma.JsonObject) : Prisma.JsonNull,
      },
    })
  } else {
    template = await prisma.communicationTemplate.update({
      where: { id: template.id },
      data: {
        name: seed.name,
        description: seed.description,
        category: seed.category,
        metadata: seed.metadata ? (seed.metadata as Prisma.JsonObject) : Prisma.JsonNull,
        updatedAt: new Date(),
      },
    })
  }

  await prisma.communicationTemplateTranslation.deleteMany({ where: { templateId: template.id } })
  await prisma.communicationTemplateTranslation.createMany({
    data: [
      {
        templateId: template.id,
        language: 'es',
        subject: seed.subject,
        content: seed.content,
      },
    ],
  })

  await prisma.communicationTemplateComponent.deleteMany({ where: { templateId: template.id } })

  const compositionData = seed.composition
    .map((componentKey, index) => {
      const componentId = componentMap.get(componentKey)
      if (!componentId) {
        console.warn(`⚠️  Component key "${componentKey}" not found. Skipping in template ${seed.templateKey}.`)
        return null
      }

      return {
        templateId: template.id,
        componentId,
        sortOrder: index,
        slot: null,
        settings: Prisma.JsonNull,
      }
    })
    .filter(Boolean) as Array<{ templateId: number; componentId: number; sortOrder: number; slot: string | null; settings: Prisma.JsonValue }>

  if (compositionData.length) {
    await prisma.communicationTemplateComponent.createMany({ data: compositionData, skipDuplicates: true })
  }

  return template
}

async function testTemplates(templateIds: number[]) {
  const sampleVariables = {
    recipient: { firstName: 'Carla', lastName: 'Vega' },
    cta: { label: 'Abrir FlowBot', url: BRAND_METADATA.website },
    appointment: { date: 'Martes 12 de noviembre · 15:00', time: '15:00', timezone: 'GMT-5' },
    security: { code: '842199', expiresIn: '5 minutos' },
    period: { label: 'Este mes' },
    brand: { ...BRAND_METADATA, currentYear: new Date().getFullYear() },
  }

  for (const templateId of templateIds) {
    const template = await prisma.communicationTemplate.findUnique({
      where: { id: templateId },
      include: {
        translations: true,
        components: {
          orderBy: { sortOrder: 'asc' },
          include: { component: true },
        },
      },
    })

    if (!template) continue

    const markup = template.components
      .map(item => (item.component.markup ?? ''))
      .filter(Boolean)
      .join('\n')

    const rendered = renderTemplate(markup, { variables: sampleVariables })

    console.log(`🧪  Render preview for ${template.templateKey}: ${rendered.length} characters, ${template.components.length} blocks`)
  }
}

async function main() {
  console.log('🌱 Seeding FlowBot communication templates...')

  const config = await ensureGlobalConfig()
  console.log(`✅ Global communication config ready (id=${config.id})`)

  const categoryMap = new Map<string, number>()
  for (const category of CATEGORY_SEEDS) {
    const id = await upsertCategory(category)
    categoryMap.set(category.name, id)
  }
  console.log(`✅ Seeded ${categoryMap.size} component categories`)

  const componentMap = new Map<string, number>()
  for (const componentSeed of COMPONENT_SEEDS) {
    const categoryId = categoryMap.get(componentSeed.categoryName)
    if (!categoryId) {
      console.warn(`⚠️  Category ${componentSeed.categoryName} not found, skipping component ${componentSeed.componentKey}`)
      continue
    }
    const component = await upsertComponent(componentSeed, categoryId)
    componentMap.set(component.componentKey, component.id)
  }
  console.log(`✅ Seeded ${componentMap.size} reusable components`)

  const templateIds: number[] = []
  for (const templateSeed of TEMPLATE_SEEDS) {
    const template = await upsertTemplate(config.id, templateSeed, componentMap)
    templateIds.push(template.id)
  }
  console.log(`✅ Seeded ${templateIds.length} FlowBot templates`)

  console.log('🧪 Generating previews for sanity check...')
  await testTemplates(templateIds)

  console.log('✨ FlowBot communication templates successfully prepared.')
}

main()
  .catch(error => {
    if ((error as any)?.code === 'P2021') {
      console.error('❌ Communication Hub tables are missing. Run the latest Prisma migrations before seeding (e.g. `npx prisma migrate deploy`).')
    } else {
      console.error('❌ Failed to seed FlowBot templates', error)
    }
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
