/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function upsertDepartment(tenantId: string, name: string, isDefault = false) {
  const dept = await prisma.department.upsert({
    where: { tenantId_name: { tenantId, name } },
    update: { isDefault },
    create: { tenantId, name, isDefault },
  })
  return dept
}

async function ensureGeneralSchedule(tenantId: string, departmentId: string) {
  const existing = await prisma.scheduleTemplate.findFirst({
    where: { tenantId, departmentId, name: 'General Office Hours' },
  })
  if (existing) return existing

  const template = await prisma.scheduleTemplate.create({
    data: {
      tenantId,
      departmentId,
      name: 'General Office Hours',
      description: 'Mon-Fri 09:00-17:00',
      isActive: true,
      recurringType: 'weekly',
      recurringDays: [1, 2, 3, 4, 5],
      timeZone: 'America/Lima',
    },
  })

  await prisma.scheduleSlot.create({
    data: {
      templateId: template.id,
      startTime: '09:00',
      endTime: '17:00',
      duration: 60,
      bufferTime: 15,
      isActive: true,
    },
  })

  return template
}

async function main() {
  const tenants = await prisma.tenant.findMany()
  if (!tenants.length) {
    console.warn('No tenants found, creating default tenant...')
    const t = await prisma.tenant.create({ data: { name: 'Default', isActive: true } })
    tenants.push(t)
  }

  for (const tenant of tenants) {
    console.log(`Seeding departments and schedules for tenant ${tenant.id}`)
    const general = await upsertDepartment(tenant.id, 'General', true)
    await ensureGeneralSchedule(tenant.id, general.id)

    // Optional: sample departments
    const sales = await upsertDepartment(tenant.id, 'Sales')
    const support = await upsertDepartment(tenant.id, 'Support')
    await ensureGeneralSchedule(tenant.id, sales.id)
    await ensureGeneralSchedule(tenant.id, support.id)
  }

  console.log('Seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


