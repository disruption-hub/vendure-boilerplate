
import { PrismaService } from '../src/common/prisma.service'

const prisma = new PrismaService()

async function diagnoseTenant(tenantId: string) {
  console.log('\n' + '='.repeat(80))
  console.log(`🔍 DIAGNOSTIC: Tenant ${tenantId} `)
  console.log('='.repeat(80) + '\n')

  // 1. Check WhatsApp Sessions
  console.log('📱 Checking WhatsApp Sessions...')
  const sessions = await prisma.whatsAppSession.findMany({
    where: { tenantId },
    select: {
      sessionId: true,
      status: true,
      phoneNumber: true,
      createdAt: true,
      updatedAt: true,
    },
  })
  console.log(`Found ${sessions.length} WhatsApp sessions: `)
  sessions.forEach((s: any) => {
    console.log(`  - ${s.sessionId}: ${s.status} (${s.phoneNumber || 'no phone'})`)
  })

  if (sessions.length === 0) {
    console.log('❌ No WhatsApp sessions found for this tenant!')
    console.log('   This explains why there are 0 WhatsAppContacts.')
    return
  }

  // 2. Check WhatsAppContacts for these sessions
  console.log('\n📇 Checking WhatsAppContacts...')
  const sessionIds = sessions.map((s: any) => s.sessionId)
  const whatsappContacts = await prisma.whatsAppContact.findMany({
    where: {
      sessionId: { in: sessionIds },
    },
    select: {
      id: true,
      sessionId: true,
      jid: true,
      name: true,
      phoneNumber: true,
      chatbotContactId: true,
      userId: true,
      metadata: true,
    },
  })
  console.log(`Found ${whatsappContacts.length} WhatsAppContacts: `)
  whatsappContacts.forEach((wc: any) => {
    console.log(`  - JID: ${wc.jid} `)
    console.log(`    Name: ${wc.name || 'N/A'} `)
    console.log(`    Phone: ${wc.phoneNumber || 'N/A'} `)
    console.log(`    ChatbotContactId: ${wc.chatbotContactId || 'N/A'} `)
    console.log(`    UserId: ${wc.userId || 'N/A'} `)
    console.log(`    Metadata keys: ${wc.metadata && typeof wc.metadata === 'object' ? Object.keys(wc.metadata as any).join(', ') : 'none'} `)
    console.log('')
  })

  // 3. Check ChatbotContacts
  console.log('💬 Checking ChatbotContacts...')
  const chatbotContacts = await prisma.chatbotContact.findMany({
    where: { tenantId },
    select: {
      id: true,
      displayName: true,
      phone: true,
      type: true,
      isDefaultFlowbot: true,
      metadata: true,
    },
  })
  console.log(`Found ${chatbotContacts.length} ChatbotContacts: `)
  chatbotContacts.forEach((cc: any) => {
    const metadata = cc.metadata && typeof cc.metadata === 'object' ? cc.metadata as any : {}
    console.log(`  - ${cc.displayName} (${cc.id})`)
    console.log(`    Phone: ${cc.phone || 'N/A'} `)
    console.log(`    Type: ${cc.type} `)
    console.log(`    IsFlowbot: ${cc.isDefaultFlowbot} `)
    console.log(`    WhatsApp SessionId: ${metadata.whatsappSessionId || 'MISSING'} `)
    console.log(`    WhatsApp JID: ${metadata.whatsappJid || 'MISSING'} `)
    console.log(`    Metadata keys: ${Object.keys(metadata).join(', ')} `)
    console.log('')
  })

  // 4. Check Users
  console.log('👥 Checking Users...')
  const users = await prisma.user.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      metadata: true,
    },
  })
  console.log(`Found ${users.length} Users: `)
  users.forEach((u: any) => {
    const metadata = u.metadata && typeof u.metadata === 'object' ? u.metadata as any : {}
    console.log(`  - ${u.name || u.email} (${u.id})`)
    console.log(`    Phone: ${u.phone || 'N/A'} `)
    console.log(`    Role: ${u.role} `)
    console.log(`    WhatsApp SessionId: ${metadata.whatsappSessionId || 'MISSING'} `)
    console.log(`    WhatsApp JID: ${metadata.whatsappJid || 'MISSING'} `)
    console.log(`    Metadata keys: ${Object.keys(metadata).join(', ')} `)
    console.log('')
  })

  // 5. Cross-reference: Which WhatsAppContacts are linked to ChatbotContacts?
  console.log('🔗 Checking WhatsAppContact → ChatbotContact links...')
  const linkedWC = whatsappContacts.filter((wc: any) => wc.chatbotContactId)
  console.log(`${linkedWC.length}/${whatsappContacts.length} WhatsAppContacts are linked to ChatbotContacts`)

  // 6. Recent WhatsApp messages
  console.log('\n📨 Checking recent WhatsApp messages...')
  const recentMessages = await prisma.whatsAppMessage.findMany({
    where: {
      sessionId: { in: sessionIds },
    },
    orderBy: { timestamp: 'desc' },
    take: 10,
    select: {
      messageId: true,
      remoteJid: true,
      fromMe: true,
      content: true,
      timestamp: true,
      status: true,
    },
  })
  console.log(`Found ${recentMessages.length} recent messages:`)
  recentMessages.forEach((m: any) => {
    console.log(`  - ${m.timestamp.toISOString()}: ${m.fromMe ? 'SENT' : 'RECEIVED'} - ${m.content?.substring(0, 50) || '[no content]'}`)
    console.log(`    From/To: ${m.remoteJid}`)
    console.log(`    Status: ${m.status}`)
  })

  console.log('\n' + '='.repeat(80))
  console.log('DIAGNOSIS COMPLETE')
  console.log('='.repeat(80))
}

// Get tenant ID from command line or use default
const tenantId = process.argv[2] || 'cmh9wylc60001tjs1qy2wm9ok'

diagnoseTenant(tenantId)
  .then(() => {
    console.log('\n✅ Diagnostic complete')
    process.exit(0)
  })
  .catch((error: Error) => {
    console.error('\n❌ Diagnostic failed:', error)
    process.exit(1)
  })
