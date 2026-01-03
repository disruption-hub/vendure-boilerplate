import { crmPanelPlugin } from '@/domains/crm/panels/CrmChatPanel'
import { adminPanelPlugin } from '@/domains/admin/panels/AdminOperationsPanel'
import { communicationsPanelPlugin } from '@/domains/communications/panels/CommunicationsPanel'
import { registerRightPanelPlugin } from './right-panel-registry'

registerRightPanelPlugin(crmPanelPlugin)
registerRightPanelPlugin(adminPanelPlugin)
registerRightPanelPlugin(communicationsPanelPlugin)
