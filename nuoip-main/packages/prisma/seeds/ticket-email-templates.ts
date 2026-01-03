/**
 * Default ticket email templates for Communication Hub
 * 
 * Run this script to create default ticket notification templates:
 * npx ts-node prisma/seeds/ticket-email-templates.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const templates = [
  {
    templateKey: 'ticket-created',
    name: 'Ticket Creado - Notificación al Operador',
    description: 'Email enviado al operador asignado cuando se crea un nuevo ticket',
    channel: 'EMAIL' as const,
    category: 'tickets',
    isActive: true,
    isDefault: true,
    translations: [
      {
        language: 'es',
        subject: '🎫 Nuevo Ticket: {{ticket.title}} [{{ticket.number}}]',
        content: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .ticket-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .info-label { font-weight: bold; color: #6b7280; }
    .info-value { color: #111827; }
    .priority-urgent { color: #dc2626; font-weight: bold; }
    .priority-high { color: #f97316; font-weight: bold; }
    .priority-medium { color: #eab308; font-weight: bold; }
    .priority-low { color: #10b981; font-weight: bold; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🎫 Nuevo Ticket Creado</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Ticket #{{ticket.number}}</p>
    </div>
    <div class="content">
      <div class="ticket-info">
        <h2 style="margin-top: 0; color: #111827;">{{ticket.title}}</h2>
        <p style="color: #6b7280; margin-bottom: 20px;">{{ticket.description}}</p>
        
        <div class="info-row">
          <span class="info-label">Tipo:</span>
          <span class="info-value">{{ticket.typeLabel}}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Prioridad:</span>
          <span class="info-value priority-{{ticket.priority}}">{{ticket.priorityLabel}}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Cliente:</span>
          <span class="info-value">{{customer.name}}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Creado por:</span>
          <span class="info-value">{{createdBy.name}}</span>
        </div>
        <div class="info-row" style="border-bottom: none;">
          <span class="info-label">Fecha:</span>
          <span class="info-value">{{ticket.createdAtFormatted}}</span>
        </div>
      </div>
      
      <a href="{{ticket.link}}" class="button">Ver Ticket</a>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
        Este ticket requiere tu atención. Por favor, revisa los detalles y toma las acciones necesarias.
      </p>
    </div>
    <div class="footer">
      <p>Este es un correo automático del sistema de tickets. Por favor no respondas a este mensaje.</p>
    </div>
  </div>
</body>
</html>`,
      },
      {
        language: 'en',
        subject: '🎫 New Ticket: {{ticket.title}} [{{ticket.number}}]',
        content: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .ticket-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .info-label { font-weight: bold; color: #6b7280; }
    .info-value { color: #111827; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🎫 New Ticket Created</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Ticket #{{ticket.number}}</p>
    </div>
    <div class="content">
      <div class="ticket-info">
        <h2 style="margin-top: 0; color: #111827;">{{ticket.title}}</h2>
        <p style="color: #6b7280; margin-bottom: 20px;">{{ticket.description}}</p>
        
        <div class="info-row">
          <span class="info-label">Type:</span>
          <span class="info-value">{{ticket.typeLabel}}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Priority:</span>
          <span class="info-value">{{ticket.priorityLabel}}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Customer:</span>
          <span class="info-value">{{customer.name}}</span>
        </div>
        <div class="info-row" style="border-bottom: none;">
          <span class="info-label">Date:</span>
          <span class="info-value">{{ticket.createdAtFormatted}}</span>
        </div>
      </div>
      
      <a href="{{ticket.link}}" class="button">View Ticket</a>
    </div>
    <div class="footer">
      <p>This is an automated email from the ticket system.</p>
    </div>
  </div>
</body>
</html>`,
      },
    ],
  },
  {
    templateKey: 'ticket-comment-added',
    name: 'Ticket - Nuevo Comentario',
    description: 'Email enviado al cliente cuando se agrega un comentario público al ticket',
    channel: 'EMAIL' as const,
    category: 'tickets',
    isActive: true,
    isDefault: true,
    translations: [
      {
        language: 'es',
        subject: '💬 Nueva respuesta en tu ticket: {{ticket.title}} [{{ticket.number}}]',
        content: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .comment-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
    .author { font-weight: bold; color: #1d4ed8; margin-bottom: 10px; }
    .comment-content { color: #111827; line-height: 1.8; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">💬 Nueva Respuesta en tu Ticket</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Ticket #{{ticket.number}}: {{ticket.title}}</p>
    </div>
    <div class="content">
      <p>Hola {{customer.name}},</p>
      <p>Hemos añadido una nueva respuesta a tu ticket:</p>
      
      <div class="comment-box">
        <div class="author">{{comment.author}}</div>
        <div class="comment-content">{{comment.contentFormatted}}</div>
      </div>
      
      <a href="{{ticket.link}}" class="button">Ver Ticket Completo</a>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
        Si tienes más preguntas o necesitas información adicional, no dudes en responder.
      </p>
    </div>
    <div class="footer">
      <p>Este es un correo automático del sistema de tickets. Puedes responder directamente a este mensaje.</p>
    </div>
  </div>
</body>
</html>`,
      },
      {
        language: 'en',
        subject: '💬 New response on your ticket: {{ticket.title}} [{{ticket.number}}]',
        content: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .comment-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
    .author { font-weight: bold; color: #1d4ed8; margin-bottom: 10px; }
    .comment-content { color: #111827; line-height: 1.8; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">💬 New Response on Your Ticket</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Ticket #{{ticket.number}}: {{ticket.title}}</p>
    </div>
    <div class="content">
      <p>Hello {{customer.name}},</p>
      <p>We have added a new response to your ticket:</p>
      
      <div class="comment-box">
        <div class="author">{{comment.author}}</div>
        <div class="comment-content">{{comment.contentFormatted}}</div>
      </div>
      
      <a href="{{ticket.link}}" class="button">View Full Ticket</a>
    </div>
    <div class="footer">
      <p>This is an automated email from the ticket system.</p>
    </div>
  </div>
</body>
</html>`,
      },
    ],
  },
  {
    templateKey: 'ticket-status-changed',
    name: 'Ticket - Cambio de Estado',
    description: 'Email enviado al cliente cuando el estado del ticket cambia',
    channel: 'EMAIL' as const,
    category: 'tickets',
    isActive: true,
    isDefault: true,
    translations: [
      {
        language: 'es',
        subject: '{{statusEmoji}} Actualización de ticket: {{ticket.title}} [{{ticket.number}}]',
        content: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .status-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .status-change { font-size: 24px; margin: 20px 0; }
    .old-status { color: #ef4444; text-decoration: line-through; }
    .new-status { color: #10b981; font-weight: bold; }
    .arrow { color: #6b7280; margin: 0 10px; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
    .resolved-notice { background: #d1fae5; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">{{statusEmoji}} Estado del Ticket Actualizado</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Ticket #{{ticket.number}}: {{ticket.title}}</p>
    </div>
    <div class="content">
      <p>Hola {{customer.name}},</p>
      <p>El estado de tu ticket ha sido actualizado:</p>
      
      <div class="status-box">
        <div class="status-change">
          <span class="old-status">{{ticket.oldStatusLabel}}</span>
          <span class="arrow">→</span>
          <span class="new-status">{{ticket.newStatusLabel}}</span>
        </div>
        <p style="color: #6b7280; margin: 0;">Actualizado por {{updatedBy.name}}</p>
      </div>
      
      <p class="resolved-notice" style="display: {{isResolved}};">
        <strong>✅ ¡Tu ticket ha sido resuelto!</strong><br>
        Si el problema persiste o tienes alguna duda adicional, no dudes en contactarnos.
      </p>
      
      <a href="{{ticket.link}}" class="button">Ver Detalles del Ticket</a>
    </div>
    <div class="footer">
      <p>Este es un correo automático del sistema de tickets.</p>
    </div>
  </div>
</body>
</html>`,
      },
      {
        language: 'en',
        subject: '{{statusEmoji}} Ticket update: {{ticket.title}} [{{ticket.number}}]',
        content: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .status-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .status-change { font-size: 24px; margin: 20px 0; }
    .old-status { color: #ef4444; text-decoration: line-through; }
    .new-status { color: #10b981; font-weight: bold; }
    .arrow { color: #6b7280; margin: 0 10px; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">{{statusEmoji}} Ticket Status Updated</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Ticket #{{ticket.number}}: {{ticket.title}}</p>
    </div>
    <div class="content">
      <p>Hello {{customer.name}},</p>
      <p>Your ticket status has been updated:</p>
      
      <div class="status-box">
        <div class="status-change">
          <span class="old-status">{{ticket.oldStatusLabel}}</span>
          <span class="arrow">→</span>
          <span class="new-status">{{ticket.newStatusLabel}}</span>
        </div>
        <p style="color: #6b7280; margin: 0;">Updated by {{updatedBy.name}}</p>
      </div>
      
      <a href="{{ticket.link}}" class="button">View Ticket Details</a>
    </div>
    <div class="footer">
      <p>This is an automated email from the ticket system.</p>
    </div>
  </div>
</body>
</html>`,
      },
    ],
  },
]

async function main() {
  console.log('🌱 Seeding ticket email templates...')

  for (const templateData of templates) {
    console.log(`\n📧 Creating template: ${templateData.name}`)

    // Check if template already exists
    const existing = await prisma.communicationTemplate.findFirst({
      where: {
        templateKey: templateData.templateKey,
        configId: null, // Default templates have no configId
      },
    })

    if (existing) {
      console.log(`   ⚠️  Template already exists, skipping...`)
      continue
    }

    const { translations, ...templateInfo } = templateData

    const template = await prisma.communicationTemplate.create({
      data: {
        ...templateInfo,
        translations: {
          create: translations,
        },
      },
      include: {
        translations: true,
      },
    })

    console.log(`   ✅ Created template with ${template.translations.length} translations`)
  }

  console.log('\n✨ Ticket email templates seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding templates:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

