import React, { useState } from 'react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  const sizeClasses = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className={`relative bg-white rounded-2xl shadow-xl w-full ${sizeClasses[size]} mx-4 max-h-[90vh] overflow-hidden`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800 text-lg">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">{children}</div>
      </div>
    </div>
  );
};

const Toast = ({ message, type, isVisible, onClose }) => {
  if (!isVisible) return null;
  const bgColor = type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#5a9080';
  return (
    <div className="fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg text-white shadow-lg flex items-center gap-2" style={{ backgroundColor: bgColor }}>
      {type === 'success' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M5 13l4 4L19 7"/></svg>}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-80">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>
  );
};

const WhatsAppCRM = () => {
  const [message, setMessage] = useState('');
  const [activeChat, setActiveChat] = useState(0);
  const [activeTab, setActiveTab] = useState('detalle');
  const [activityFilter, setActivityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [ticketSearch, setTicketSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [leftPanelTab, setLeftPanelTab] = useState('chats');
  
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isSessionSummaryModalOpen, setIsSessionSummaryModalOpen] = useState(false);
  const [isProductDetailModalOpen, setIsProductDetailModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });
  const [newTicket, setNewTicket] = useState({ title: '', description: '', priority: 'Medium', type: 'support' });
  const [newTask, setNewTask] = useState({ title: '', dueDate: '', priority: 'Medium' });
  const [newNote, setNewNote] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newAppointment, setNewAppointment] = useState({ title: '', date: '', time: '', duration: '30', type: 'consultation', notes: '' });
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', address: '', company: '', position: '', membershipType: '', preferredTime: '' });
  
  const [products] = useState([
    { id: 1, name: 'Yoga Mat Premium', price: 49.99, category: 'Equipment', image: '🧘', description: 'High-density eco-friendly yoga mat', stock: 25, sku: 'YM-001' },
    { id: 2, name: 'Monthly Membership', price: 99.00, category: 'Membership', image: '💳', description: 'Unlimited access to all classes', stock: 999, sku: 'MEM-001' },
    { id: 3, name: 'Personal Training (5 sessions)', price: 299.00, category: 'Services', image: '🏋️', description: '5 one-on-one personal training sessions', stock: 50, sku: 'PT-005' },
    { id: 4, name: 'Protein Shake Pack', price: 34.99, category: 'Nutrition', image: '🥤', description: 'Pack of 12 protein shakes', stock: 100, sku: 'NS-012' },
    { id: 5, name: 'Pilates Class (Single)', price: 25.00, category: 'Classes', image: '🤸', description: 'Drop-in pilates class', stock: 999, sku: 'CL-PIL' },
    { id: 6, name: 'Resistance Bands Set', price: 29.99, category: 'Equipment', image: '🎯', description: 'Set of 5 resistance bands', stock: 40, sku: 'RB-005' },
    { id: 7, name: 'Annual VIP Membership', price: 899.00, category: 'Membership', image: '⭐', description: 'VIP access with exclusive perks', stock: 999, sku: 'MEM-VIP' },
    { id: 8, name: 'Massage Therapy (60 min)', price: 85.00, category: 'Services', image: '💆', description: 'Relaxing full body massage', stock: 30, sku: 'MT-060' },
  ]);

  const [appointments, setAppointments] = useState([
    { id: 1, title: 'Fitness Consultation', clientName: 'Lucia Meza', date: '2024-03-20', time: '10:00', duration: '30', type: 'consultation', status: 'confirmed', notes: 'First consultation' },
    { id: 2, title: 'Personal Training', clientName: 'Johan Cliente', date: '2024-03-20', time: '14:00', duration: '60', type: 'training', status: 'pending', notes: 'Strength training focus' },
    { id: 3, title: 'Yoga Class', clientName: 'Alberto Saco', date: '2024-03-21', time: '09:00', duration: '45', type: 'class', status: 'confirmed', notes: 'Beginner level' },
  ]);

  const [sessionSummaries, setSessionSummaries] = useState([
    { id: 1, chatId: 4, clientName: 'Lucia Meza', date: '2024-03-18', duration: '15 min',
      summary: 'Cliente interesada en clases de yoga y pilates. Tuvo problemas con el pago pero se resolvió enviando nuevo enlace. Alta probabilidad de conversión a membresía Premium.',
      topics: ['Payment Issue', 'Class Interest', 'Membership Inquiry'], sentiment: 'positive',
      nextActions: ['Follow up on membership decision', 'Send class schedule'],
      aiInsights: 'Customer shows high engagement. Recommend offering trial class to convert.' }
  ]);
  const [currentSessionSummary, setCurrentSessionSummary] = useState(null);

  const [tickets, setTickets] = useState([
    { id: '#1235', title: 'Payment Issue', description: 'Customer unable to complete payment', status: 'Open', priority: 'High', date: '03/18/2024' },
    { id: '#1236', title: 'Class Inquiry', description: 'Questions about yoga classes schedule', status: 'Resolved', priority: 'Medium', date: '03/15/2024' },
    { id: '#1237', title: 'Technical Support', description: 'App not loading properly', status: 'Pending', priority: 'Low', date: '03/10/2024' },
  ]);
  
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Follow up on payment', dueDate: 'Today', priority: 'High', completed: false },
    { id: 2, title: 'Send class schedule', dueDate: 'Tomorrow', priority: 'Medium', completed: false },
    { id: 3, title: 'Update contact info', dueDate: 'Mar 20', priority: 'Low', completed: true },
    { id: 4, title: 'Schedule onboarding call', dueDate: 'Mar 22', priority: 'Medium', completed: false },
  ]);
  
  const [activities, setActivities] = useState([
    { id: 1, type: 'message', text: 'Sent payment link', time: '2 hours ago', icon: 'message' },
    { id: 2, type: 'call', text: 'Outbound call - 5 min', time: '5 hours ago', icon: 'phone' },
    { id: 3, type: 'email', text: 'Email sent: Class confirmation', time: 'Yesterday', icon: 'email' },
    { id: 4, type: 'note', text: 'Added note about preferences', time: 'Yesterday', icon: 'note' },
    { id: 5, type: 'ticket', text: 'Ticket #1235 created', time: '2 days ago', icon: 'ticket' },
    { id: 6, type: 'product', text: 'Sent: Monthly Membership info', time: '2 days ago', icon: 'product' },
    { id: 7, type: 'appointment', text: 'Scheduled consultation', time: '3 days ago', icon: 'calendar' },
  ]);
  
  const [contactDetails, setContactDetails] = useState({
    name: 'Lucia Meza', source: 'WhatsApp', email: '', phone: '', whatsapp: '+1980877302',
    address: '', company: '', position: '', createdAt: 'Mar 10, 2024', lastContact: 'Today',
    tags: [], notes: '', isRegistered: false,
    customFields: [{ label: 'Membership Type', value: '' }, { label: 'Classes Attended', value: '0' }, { label: 'Preferred Time', value: '' }]
  });

  const aiSummary = {
    customerSummary: "Lucia is a potential new customer interested in fitness classes, specifically yoga and pilates. She reached out via WhatsApp inquiring about class schedules and pricing. She has shown strong interest but encountered a payment issue that needs resolution.",
    sentiment: { score: 72, label: 'Positive', trend: 'improving', details: "Customer started neutral but became more positive after receiving helpful responses. Last messages show engagement and interest." },
    keyInsights: [
      { type: 'urgent', icon: '🔴', text: 'Open payment issue requires immediate attention', source: 'Ticket #1235' },
      { type: 'task', icon: '📋', text: 'Follow up on payment scheduled for today', source: 'Tasks' },
      { type: 'opportunity', icon: '💡', text: 'High conversion potential - interested in Premium membership', source: 'Conversation' },
      { type: 'preference', icon: '⏰', text: 'Prefers morning class sessions', source: 'Activity notes' },
    ],
    behaviorMetrics: { responseTime: 'Fast (< 5 min)', engagementLevel: 'High', messageCount: 12, lastActive: '2 hours ago' },
    recommendations: ['Resolve payment issue first to maintain positive sentiment', 'Offer trial class to convert to paid membership', 'Send personalized morning class schedule'],
    riskLevel: 'Low', conversionProbability: 78, lifetimeValue: '$1,200', predictedChurn: '12%',
    bestContactTime: '9:00 AM - 11:00 AM', preferredChannel: 'WhatsApp',
    interestProfile: ['Yoga', 'Pilates', 'Morning Classes', 'Premium Membership'],
    purchaseHistory: [{ item: 'Trial Class', date: '2024-03-10', amount: '$0' }],
    suggestedProducts: [{ id: 2, name: 'Monthly Membership', reason: 'High interest shown' }, { id: 5, name: 'Pilates Class', reason: 'Matches preferences' }]
  };
  
  const [chatMessages, setChatMessages] = useState([
    { id: 1, text: 'Haz clic aquí para abrir el enlace de pago', type: 'link', time: '03:10 PM', status: 'ARCHIVED' },
    { id: 2, text: '🎉 El enlace se actualiza en tiempo real al completar el pago.', time: '03:10 PM', status: 'ARCHIVED' },
    { id: 3, text: 'Gracias Lucia, quieres reservar una clase en MatMov?', time: '05:15 PM', status: 'RECEIVED' },
    { id: 4, text: 'Esto lo estoy enviando del el app del cel', time: '06:44 PM', status: 'RESENT' },
    { id: 5, text: 'Lo leísto 9', time: '06:48 PM', status: 'NEEDED' },
    { id: 6, text: 'ok', time: '06:55 PM', status: 'NEEDED' },
  ]);

  const chats = [
    { id: 0, name: 'Flowbot', initials: '', isBot: true, preview: "Hi there! I'm Flowbot...", time: '00:56 PM', online: true, sessionActive: true },
    { id: 1, name: 'Johan Cliente 2', initials: 'JC', preview: 'Sin mensaje todavía', time: '00:27 PM', online: true, sessionActive: true },
    { id: 2, name: 'Alberto Saco', initials: 'AS', preview: 'super_admin', time: '00:25 AM', online: true, sessionActive: false },
    { id: 3, name: 'Holos App', initials: 'HA', preview: 'Sin mensaje todavía', time: '04:01 PM', online: true, sessionActive: false },
    { id: 4, name: 'Lucia Meza Whatsapp', initials: 'LM', preview: 'Ya', time: '02:49 AM', online: true, sessionActive: true },
    { id: 5, name: 'Rodrigo Vásquez', initials: 'RV', preview: 'froer', time: '08:46 AM', online: true, sessionActive: false },
    { id: 6, name: 'MatMex', initials: 'MK', preview: 'Sin mensaje todavía', time: '04:21 AM', online: true, sessionActive: false },
    { id: 7, name: 'Lucie Mese', initials: 'LM', preview: 'supes_admin', time: '11:42 AM', online: true, sessionActive: true },
  ];

  const colors = {
    messageBubble: '#5a9080', linkBox: '#4a7a6c', chatBg: '#d9d3c7', headerBg: '#ededed',
    online: '#22c55e', sendButton: '#5a9080', ticketOpen: '#ef4444', ticketResolved: '#22c55e',
    ticketPending: '#eab308', avatarBg: '#9ca3af',
  };

  const showToast = (msg, type = 'success') => { setToast({ isVisible: true, message: msg, type }); setTimeout(() => setToast({ isVisible: false, message: '', type: 'success' }), 3000); };
  const generateId = () => '#' + Math.floor(1000 + Math.random() * 9000);

  const handleSendMessage = () => {
    if (message.trim()) {
      setChatMessages([...chatMessages, { id: chatMessages.length + 1, text: message, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), status: 'SENT' }]);
      setActivities([{ id: activities.length + 1, type: 'message', text: 'Sent message', time: 'Just now', icon: 'message' }, ...activities]);
      setMessage(''); showToast('Message sent');
    }
  };

  const handleSendProduct = (product) => {
    const productMessage = `📦 *${product.name}*\n💰 Price: $${product.price.toFixed(2)}\n📝 ${product.description}\n\n¿Te gustaría más información sobre este producto?`;
    setChatMessages([...chatMessages, { id: chatMessages.length + 1, text: productMessage, type: 'product', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), status: 'SENT', productId: product.id }]);
    setActivities([{ id: activities.length + 1, type: 'product', text: `Sent: ${product.name}`, time: 'Just now', icon: 'product' }, ...activities]);
    showToast(`Product "${product.name}" sent to chat`);
  };

  const handleCreateAppointment = () => {
    if (newAppointment.title.trim() && newAppointment.date && newAppointment.time) {
      const apt = { id: appointments.length + 1, ...newAppointment, clientName: contactDetails.name, status: 'pending' };
      setAppointments([apt, ...appointments]);
      setActivities([{ id: activities.length + 1, type: 'appointment', text: `Scheduled: ${apt.title}`, time: 'Just now', icon: 'calendar' }, ...activities]);
      const aptMsg = `📅 *Cita Programada*\n📌 ${apt.title}\n📆 ${apt.date} a las ${apt.time}\n⏱️ Duración: ${apt.duration} min\n\n¡Te esperamos!`;
      setChatMessages([...chatMessages, { id: chatMessages.length + 1, text: aptMsg, type: 'appointment', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), status: 'SENT' }]);
      setNewAppointment({ title: '', date: '', time: '', duration: '30', type: 'consultation', notes: '' });
      setIsAppointmentModalOpen(false); showToast('Appointment scheduled and sent to chat');
    }
  };

  const handleCloseSession = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    const summary = {
      id: sessionSummaries.length + 1, chatId: activeChat, clientName: chats[activeChat]?.name || 'Unknown',
      date: new Date().toISOString().split('T')[0], duration: '15 min',
      summary: `Sesión con ${chats[activeChat]?.name}. Se discutieron temas relacionados con membresías y clases. El cliente mostró interés en productos de fitness. Sentimiento general positivo con alta probabilidad de conversión.`,
      topics: ['Membership', 'Classes', 'Payment'], sentiment: 'positive',
      nextActions: ['Follow up in 2 days', 'Send promotional offer'],
      aiInsights: 'Customer engagement high. Recommend personalized follow-up within 48 hours.',
      followUp: {
        enabled: true,
        date: tomorrow.toISOString().split('T')[0],
        time: '10:00',
        reminder: '1day',
        note: `Follow up with ${chats[activeChat]?.name || 'client'}`
      }
    };
    setCurrentSessionSummary(summary); setIsSessionSummaryModalOpen(true);
  };

  const handleSaveSessionSummary = () => {
    if (currentSessionSummary) {
      setSessionSummaries([currentSessionSummary, ...sessionSummaries]);
      
      // Create follow-up task if enabled
      if (currentSessionSummary.followUp?.enabled && currentSessionSummary.followUp?.date) {
        const followUpTask = {
          id: tasks.length + 1,
          title: `📞 Follow up: ${currentSessionSummary.clientName}`,
          dueDate: currentSessionSummary.followUp.date,
          dueTime: currentSessionSummary.followUp.time,
          priority: 'High',
          completed: false,
          reminder: currentSessionSummary.followUp.reminder,
          note: currentSessionSummary.followUp.note,
          type: 'followup',
          clientName: currentSessionSummary.clientName
        };
        setTasks([followUpTask, ...tasks]);
        setActivities([
          { id: activities.length + 1, type: 'note', text: 'Session closed with summary', time: 'Just now', icon: 'note' },
          { id: activities.length + 2, type: 'calendar', text: `Follow-up scheduled: ${currentSessionSummary.followUp.date}`, time: 'Just now', icon: 'calendar' },
          ...activities
        ]);
        showToast('Session saved & follow-up task created');
      } else {
        setActivities([{ id: activities.length + 1, type: 'note', text: 'Session closed with summary', time: 'Just now', icon: 'note' }, ...activities]);
        showToast('Session summary saved');
      }
      
      setIsSessionSummaryModalOpen(false); setCurrentSessionSummary(null);
    }
  };

  const handleCreateTicket = () => {
    if (newTicket.title.trim()) {
      const ticket = { id: generateId(), ...newTicket, status: 'Open', date: new Date().toLocaleDateString() };
      setTickets([ticket, ...tickets]);
      setActivities([{ id: activities.length + 1, type: 'ticket', text: 'Ticket ' + ticket.id + ' created (' + newTicket.type + ')', time: 'Just now', icon: 'ticket' }, ...activities]);
      setNewTicket({ title: '', description: '', priority: 'Medium', type: 'support' }); setIsTicketModalOpen(false); showToast('Ticket created');
    }
  };

  const handleCreateTask = () => {
    if (newTask.title.trim()) {
      setTasks([{ id: tasks.length + 1, ...newTask, dueDate: newTask.dueDate || 'No date', completed: false }, ...tasks]);
      setNewTask({ title: '', dueDate: '', priority: 'Medium' }); setIsTaskModalOpen(false); showToast('Task created');
    }
  };

  const handleToggleTask = (taskId) => { setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)); showToast('Task updated'); };
  const handleAddNote = () => { if (newNote.trim()) { setContactDetails({ ...contactDetails, notes: contactDetails.notes ? contactDetails.notes + '\n\n' + newNote : newNote }); setActivities([{ id: activities.length + 1, type: 'note', text: 'Added note', time: 'Just now', icon: 'note' }, ...activities]); setNewNote(''); setIsNoteModalOpen(false); showToast('Note added'); } };
  const handleAddTag = () => { if (newTag.trim() && !contactDetails.tags.includes(newTag)) { setContactDetails({ ...contactDetails, tags: [...contactDetails.tags, newTag] }); setNewTag(''); setIsTagModalOpen(false); showToast('Tag added'); } };
  const handleRemoveTag = (tag) => { setContactDetails({ ...contactDetails, tags: contactDetails.tags.filter(t => t !== tag) }); showToast('Tag removed'); };

  const openEditModal = () => { setEditForm({ name: contactDetails.name, email: contactDetails.email, phone: contactDetails.phone, address: contactDetails.address, company: contactDetails.company, position: contactDetails.position, membershipType: contactDetails.customFields[0]?.value || '', preferredTime: contactDetails.customFields[2]?.value || '' }); setIsEditModalOpen(true); };
  const openRegisterModal = () => { setEditForm({ name: contactDetails.name, email: '', phone: contactDetails.whatsapp, address: '', company: '', position: '', membershipType: 'Basic', preferredTime: 'Morning' }); setIsRegisterModalOpen(true); };

  const handleEditSave = () => {
    setContactDetails({ ...contactDetails, name: editForm.name, email: editForm.email, phone: editForm.phone, address: editForm.address, company: editForm.company, position: editForm.position,
      customFields: [{ label: 'Membership Type', value: editForm.membershipType }, { label: 'Classes Attended', value: contactDetails.customFields[1]?.value || '0' }, { label: 'Preferred Time', value: editForm.preferredTime }] });
    setIsEditModalOpen(false); setActivities([{ id: activities.length + 1, type: 'note', text: 'Contact updated', time: 'Just now', icon: 'note' }, ...activities]); showToast('Contact updated');
  };

  const handleRegisterSave = () => {
    setContactDetails({ ...contactDetails, name: editForm.name, email: editForm.email, phone: editForm.phone, address: editForm.address, company: editForm.company, position: editForm.position, isRegistered: true,
      customFields: [{ label: 'Membership Type', value: editForm.membershipType }, { label: 'Classes Attended', value: '0' }, { label: 'Preferred Time', value: editForm.preferredTime }] });
    setIsRegisterModalOpen(false); setActivities([{ id: activities.length + 1, type: 'note', text: 'Contact registered', time: 'Just now', icon: 'note' }, ...activities]); showToast('Contact registered successfully');
  };

  const handleDeleteItem = () => {
    if (itemToDelete?.type === 'ticket') setTickets(tickets.filter(t => t.id !== itemToDelete.id));
    if (itemToDelete?.type === 'task') setTasks(tasks.filter(t => t.id !== itemToDelete.id));
    if (itemToDelete?.type === 'appointment') setAppointments(appointments.filter(a => a.id !== itemToDelete.id));
    setIsDeleteConfirmOpen(false); setItemToDelete(null); showToast('Deleted successfully');
  };

  const handleUpdateTicketStatus = (id, status) => { setTickets(tickets.map(t => t.id === id ? { ...t, status } : t)); showToast('Status updated'); };
  const handleUpdateAppointmentStatus = (id, status) => { setAppointments(appointments.map(a => a.id === id ? { ...a, status } : a)); showToast('Appointment status updated'); };

  const getActivityIcon = (type) => {
    const icons = {
      message: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>,
      phone: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>,
      email: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>,
      note: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>,
      ticket: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/></svg>,
      product: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>,
      calendar: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
    };
    return icons[type] || null;
  };

  const filteredChats = chats.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredTickets = tickets.filter(t => t.title.toLowerCase().includes(ticketSearch.toLowerCase()) || t.id.toLowerCase().includes(ticketSearch.toLowerCase()));
  const filteredActivities = activityFilter === 'all' ? activities : activities.filter(a => activityFilter === 'messages' ? a.type === 'message' : activityFilter === 'calls' ? a.type === 'phone' : activityFilter === 'emails' ? a.type === 'email' : true);
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.category.toLowerCase().includes(productSearch.toLowerCase()));
  const productCategories = [...new Set(products.map(p => p.category))];
  const getSentimentColor = (score) => score >= 70 ? '#22c55e' : score >= 40 ? '#eab308' : '#ef4444';
  const getAppointmentTypeColor = (type) => ({ consultation: '#3b82f6', training: '#8b5cf6', class: '#22c55e', massage: '#ec4899', other: '#6b7280' })[type] || '#6b7280';



  const renderTabContent = () => {
    switch (activeTab) {
      case 'detalle':
        return (
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {/* AI Customer Summary */}
            <div className="mb-4 mt-4">
              <div className="flex items-center gap-2 mb-3"><div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center"><svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg></div><h4 className="text-sm font-semibold text-gray-800">AI Customer Summary</h4></div>
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-100"><p className="text-sm text-gray-700 leading-relaxed">{aiSummary.customerSummary}</p></div>
            </div>
            {/* Interest Profile */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3"><div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center"><svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg></div><h4 className="text-sm font-semibold text-gray-800">Interest Profile</h4></div>
              <div className="flex flex-wrap gap-2">{aiSummary.interestProfile.map((interest, i) => (<span key={i} className="px-3 py-1 text-xs font-medium rounded-full bg-pink-100 text-pink-700">{interest}</span>))}</div>
            </div>
            {/* AI Suggested Products */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3"><div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center"><svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg></div><h4 className="text-sm font-semibold text-gray-800">AI Suggested Products</h4></div>
              <div className="space-y-2">{aiSummary.suggestedProducts.map((s) => { const p = products.find(x => x.id === s.id); return p ? (<div key={s.id} className="flex items-center justify-between bg-amber-50 rounded-lg p-3 border border-amber-200"><div className="flex items-center gap-3"><span className="text-2xl">{p.image}</span><div><p className="text-sm font-medium text-gray-800">{p.name}</p><p className="text-xs text-amber-600">{s.reason}</p></div></div><button onClick={() => handleSendProduct(p)} className="px-3 py-1.5 text-xs font-medium rounded-lg text-white hover:opacity-90" style={{ backgroundColor: colors.messageBubble }}>Send</button></div>) : null; })}</div>
            </div>
            {/* Sentiment Analysis */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3"><div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center"><svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div><h4 className="text-sm font-semibold text-gray-800">Sentiment Analysis</h4></div>
              <div className="bg-white rounded-xl p-4 border border-gray-200"><div className="flex items-center justify-between mb-3"><div className="flex items-center gap-3"><div className="text-3xl font-bold" style={{ color: getSentimentColor(aiSummary.sentiment.score) }}>{aiSummary.sentiment.score}%</div><div><div className="font-medium text-gray-800">{aiSummary.sentiment.label}</div><div className="text-xs text-gray-500">{aiSummary.sentiment.trend}</div></div></div></div><p className="text-xs text-gray-600">{aiSummary.sentiment.details}</p></div>
            </div>
          </div>
        );
      case 'catalog':
        return (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <div className="relative mb-4"><svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" strokeWidth="2"/><path strokeWidth="2" d="m21 21-4.35-4.35"/></svg><input type="text" placeholder="Search products..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg text-sm border border-gray-200"/></div>
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2"><button onClick={() => setProductSearch('')} className={`px-3 py-1 text-xs font-medium rounded-full ${!productSearch ? 'text-white' : 'bg-gray-100 text-gray-600'}`} style={!productSearch ? { backgroundColor: colors.messageBubble } : {}}>All</button>{productCategories.map((c) => (<button key={c} onClick={() => setProductSearch(c)} className={`px-3 py-1 text-xs font-medium rounded-full ${productSearch === c ? 'text-white' : 'bg-gray-100 text-gray-600'}`} style={productSearch === c ? { backgroundColor: colors.messageBubble } : {}}>{c}</button>))}</div>
            </div>
            <div className="px-4 pb-4 space-y-3">{filteredProducts.map((p) => (<div key={p.id} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100"><div className="flex items-start gap-3"><div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center text-2xl shadow-sm">{p.image}</div><div className="flex-1"><div className="flex justify-between"><div><h4 className="font-semibold text-gray-800 text-sm">{p.name}</h4><p className="text-xs text-gray-500">{p.category}</p></div><span className="font-bold">${p.price.toFixed(2)}</span></div><p className="text-xs text-gray-600 mt-1">{p.description}</p><div className="flex justify-between mt-3"><span className="text-xs text-gray-500">Stock: {p.stock}</span><button onClick={() => handleSendProduct(p)} className="px-3 py-1.5 text-xs font-medium rounded-lg text-white" style={{ backgroundColor: colors.messageBubble }}>Send to Chat</button></div></div></div></div>))}</div>
          </div>
        );
      case 'appointments':
        return (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4"><button onClick={() => setIsAppointmentModalOpen(true)} className="w-full py-2 rounded-lg text-white font-medium flex items-center justify-center gap-2" style={{ backgroundColor: colors.messageBubble }}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M12 4v16m8-8H4"/></svg>Schedule Appointment</button></div>
            <div className="px-4 pb-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Today</h4>
              <div className="space-y-3 mb-6">{appointments.filter(a => a.date === '2024-03-20').map((a) => (<div key={a.id} className="bg-gray-50 rounded-xl p-4 group"><div className="flex items-start gap-3"><div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: getAppointmentTypeColor(a.type) }}>{a.time.split(':')[0]}</div><div className="flex-1"><div className="flex justify-between"><div><h4 className="font-semibold text-gray-800 text-sm">{a.title}</h4><p className="text-xs text-gray-500">{a.clientName}</p></div><select value={a.status} onChange={(e) => handleUpdateAppointmentStatus(a.id, e.target.value)} className={`px-2 py-1 text-xs rounded-full border-0 ${a.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="cancelled">Cancelled</option></select></div><p className="text-xs text-gray-500 mt-1">{a.time} ({a.duration} min) • {a.type}</p></div></div></div>))}</div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Upcoming</h4>
              <div className="space-y-3">{appointments.filter(a => a.date !== '2024-03-20').map((a) => (<div key={a.id} className="bg-gray-50 rounded-xl p-4"><div className="flex items-start gap-3"><div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: getAppointmentTypeColor(a.type) }}>{a.date.split('-')[2]}</div><div className="flex-1"><h4 className="font-semibold text-gray-800 text-sm">{a.title}</h4><p className="text-xs text-gray-500">{a.clientName} • {a.date}</p></div></div></div>))}</div>
            </div>
          </div>
        );
      case 'tickets':
        const ticketTypeIcons = { support: '🛠️', refund: '💰', billing: '🧾', complaint: '😤', inquiry: '❓', technical: '⚙️', other: '📋' };
        return (<><div className="p-4"><div className="relative"><svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" strokeWidth="2"/><path strokeWidth="2" d="m21 21-4.35-4.35"/></svg><input type="text" placeholder="Search Tickets..." value={ticketSearch} onChange={(e) => setTicketSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg text-sm border border-gray-200"/></div></div><div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">{filteredTickets.map((t) => (<div key={t.id} className="bg-gray-50 rounded-xl p-4 group"><div className="flex justify-between mb-2"><div className="flex items-start gap-2"><span className="text-xl">{ticketTypeIcons[t.type] || '🎫'}</span><div><div className="flex items-center gap-2"><span className="text-sm font-medium text-gray-800">{t.id}</span><span className="px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-600 capitalize">{t.type || 'support'}</span></div><h4 className="font-semibold text-gray-800">{t.title}</h4></div></div><select value={t.status} onChange={(e) => handleUpdateTicketStatus(t.id, e.target.value)} className="px-2 py-1 text-xs rounded-full text-white border-0 h-fit" style={{ backgroundColor: t.status === 'Open' ? colors.ticketOpen : t.status === 'Resolved' ? colors.ticketResolved : colors.ticketPending }}><option value="Open">Open</option><option value="Pending">Pending</option><option value="Resolved">Resolved</option></select></div><p className="text-sm text-gray-500 ml-8">{t.priority} Priority • {t.date}</p></div>))}<button onClick={() => setIsTicketModalOpen(true)} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 flex items-center justify-center gap-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M12 4v16m8-8H4"/></svg>Create New Ticket</button></div></>);
      case 'activity':
        return (<div className="flex-1 overflow-y-auto px-4 pb-4"><div className="flex gap-2 mb-4">{['all', 'messages', 'calls', 'emails'].map((f) => (<button key={f} onClick={() => setActivityFilter(f)} className={`px-3 py-1 text-xs font-medium rounded-full ${activityFilter === f ? 'text-white' : 'bg-gray-100 text-gray-600'}`} style={activityFilter === f ? { backgroundColor: colors.messageBubble } : {}}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>))}</div><div className="space-y-4">{filteredActivities.map((a) => (<div key={a.id} className="flex gap-4"><div className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: colors.messageBubble }}>{getActivityIcon(a.icon)}</div><div className="flex-1 bg-gray-50 rounded-lg p-3"><p className="text-sm text-gray-800 font-medium">{a.text}</p><p className="text-xs text-gray-500 mt-1">{a.time}</p></div></div>))}</div></div>);
      case 'tasks':
        const reminderLabels = { '15min': '15 min', '30min': '30 min', '1hour': '1 hr', '3hours': '3 hrs', '1day': '1 day', '2days': '2 days' };
        return (<><div className="p-4"><button onClick={() => setIsTaskModalOpen(true)} className="w-full py-2 rounded-lg text-white font-medium flex items-center justify-center gap-2" style={{ backgroundColor: colors.messageBubble }}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M12 4v16m8-8H4"/></svg>Add New Task</button></div><div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3"><div><h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Pending ({tasks.filter(t => !t.completed).length})</h4><div className="space-y-2">{tasks.filter(t => !t.completed).map((t) => (<div key={t.id} className={`rounded-xl p-4 ${t.type === 'followup' ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}><div className="flex items-start gap-3"><button onClick={() => handleToggleTask(t.id)} className="mt-0.5 w-5 h-5 rounded-full border-2 border-gray-300 hover:border-green-500 flex-shrink-0"></button><div className="flex-1"><div className="flex items-center gap-2"><h4 className="font-medium text-gray-800">{t.title}</h4>{t.type === 'followup' && <span className="px-1.5 py-0.5 text-xs rounded bg-amber-200 text-amber-700">Follow-up</span>}</div><div className="flex items-center gap-2 mt-1 flex-wrap"><span className="text-xs text-gray-500">📅 {t.dueDate}{t.dueTime ? ` at ${t.dueTime}` : ''}</span><span className="px-2 py-0.5 text-xs rounded-full" style={{ backgroundColor: t.priority === 'High' ? '#fef2f2' : '#fefce8', color: t.priority === 'High' ? colors.ticketOpen : colors.ticketPending }}>{t.priority}</span>{t.reminder && <span className="text-xs text-amber-600 flex items-center gap-1">⏰ {reminderLabels[t.reminder] || t.reminder}</span>}</div>{t.note && <p className="text-xs text-gray-500 mt-1 italic">"{t.note}"</p>}{t.clientName && <p className="text-xs text-blue-600 mt-1">👤 {t.clientName}</p>}</div></div></div>))}</div></div><div><h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Completed ({tasks.filter(t => t.completed).length})</h4><div className="space-y-2">{tasks.filter(t => t.completed).map((t) => (<div key={t.id} className="bg-gray-50 rounded-xl p-4 opacity-60"><div className="flex items-start gap-3"><button onClick={() => handleToggleTask(t.id)} className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: colors.ticketResolved }}><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="3" d="M5 13l4 4L19 7"/></svg></button><h4 className="font-medium text-gray-500 line-through">{t.title}</h4></div></div>))}</div></div></div></>);
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast({ ...toast, isVisible: false })} />
      
      {/* Modals */}
      <Modal isOpen={isTicketModalOpen} onClose={() => setIsTicketModalOpen(false)} title="Create New Ticket">
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Type *</label><select value={newTicket.type} onChange={(e) => setNewTicket({ ...newTicket, type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg"><option value="support">🛠️ Support</option><option value="refund">💰 Refund</option><option value="billing">🧾 Billing</option><option value="complaint">😤 Complaint</option><option value="inquiry">❓ Inquiry</option><option value="technical">⚙️ Technical</option><option value="other">📋 Other</option></select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Title *</label><input type="text" value={newTicket.title} onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Enter title"/></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={newTicket.description} onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none" rows={3}/></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Priority</label><select value={newTicket.priority} onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg"><option>Low</option><option>Medium</option><option>High</option></select></div>
          <div className="flex gap-3 pt-4"><button onClick={() => setIsTicketModalOpen(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium">Cancel</button><button onClick={handleCreateTicket} className="flex-1 py-2 rounded-lg text-white font-medium" style={{ backgroundColor: colors.messageBubble }}>Create</button></div>
        </div>
      </Modal>

      <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title="Add New Task">
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Title *</label><input type="text" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg"/></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label><input type="date" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg"/></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Priority</label><select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg"><option>Low</option><option>Medium</option><option>High</option></select></div>
          <div className="flex gap-3 pt-4"><button onClick={() => setIsTaskModalOpen(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium">Cancel</button><button onClick={handleCreateTask} className="flex-1 py-2 rounded-lg text-white font-medium" style={{ backgroundColor: colors.messageBubble }}>Add Task</button></div>
        </div>
      </Modal>

      <Modal isOpen={isAppointmentModalOpen} onClose={() => setIsAppointmentModalOpen(false)} title="Schedule Appointment">
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Title *</label><input type="text" value={newAppointment.title} onChange={(e) => setNewAppointment({ ...newAppointment, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="e.g., Fitness Consultation"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Date *</label><input type="date" value={newAppointment.date} onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg"/></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Time *</label><input type="time" value={newAppointment.time} onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg"/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Duration</label><select value={newAppointment.duration} onChange={(e) => setNewAppointment({ ...newAppointment, duration: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg"><option value="15">15 min</option><option value="30">30 min</option><option value="45">45 min</option><option value="60">60 min</option></select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label><select value={newAppointment.type} onChange={(e) => setNewAppointment({ ...newAppointment, type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg"><option value="consultation">Consultation</option><option value="training">Training</option><option value="class">Class</option><option value="massage">Massage</option></select></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea value={newAppointment.notes} onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none" rows={2}/></div>
          <div className="flex gap-3 pt-4"><button onClick={() => setIsAppointmentModalOpen(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium">Cancel</button><button onClick={handleCreateAppointment} className="flex-1 py-2 rounded-lg text-white font-medium" style={{ backgroundColor: colors.messageBubble }}>Schedule & Send</button></div>
        </div>
      </Modal>

      <Modal isOpen={isSessionSummaryModalOpen} onClose={() => setIsSessionSummaryModalOpen(false)} title="📋 Session Summary" size="lg">
        {currentSessionSummary && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <div><h4 className="font-semibold text-gray-800">{currentSessionSummary.clientName}</h4><p className="text-xs text-gray-500">{currentSessionSummary.date} • {currentSessionSummary.duration}</p></div>
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">{currentSessionSummary.sentiment}</span>
              </div>
              <p className="text-sm text-gray-700">{currentSessionSummary.summary}</p>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Topics</label><div className="flex flex-wrap gap-2">{currentSessionSummary.topics.map((t, i) => (<span key={i} className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">{t}</span>))}</div></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">🤖 AI Insights</label><div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200"><p className="text-sm text-indigo-800">{currentSessionSummary.aiInsights}</p></div></div>
            
            {/* Follow-up Section */}
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-800">
                  <span className="text-lg">📅</span> Schedule Follow-up
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={currentSessionSummary.followUp?.enabled || false} onChange={(e) => setCurrentSessionSummary({...currentSessionSummary, followUp: {...currentSessionSummary.followUp, enabled: e.target.checked}})} className="sr-only peer"/>
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>
              {currentSessionSummary.followUp?.enabled && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                      <input type="date" value={currentSessionSummary.followUp?.date || ''} onChange={(e) => setCurrentSessionSummary({...currentSessionSummary, followUp: {...currentSessionSummary.followUp, date: e.target.value}})} className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm bg-white"/>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Time</label>
                      <input type="time" value={currentSessionSummary.followUp?.time || ''} onChange={(e) => setCurrentSessionSummary({...currentSessionSummary, followUp: {...currentSessionSummary.followUp, time: e.target.value}})} className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm bg-white"/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">⏰ Reminder</label>
                    <select value={currentSessionSummary.followUp?.reminder || '1day'} onChange={(e) => setCurrentSessionSummary({...currentSessionSummary, followUp: {...currentSessionSummary.followUp, reminder: e.target.value}})} className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm bg-white">
                      <option value="15min">15 minutes before</option>
                      <option value="30min">30 minutes before</option>
                      <option value="1hour">1 hour before</option>
                      <option value="3hours">3 hours before</option>
                      <option value="1day">1 day before</option>
                      <option value="2days">2 days before</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Note</label>
                    <input type="text" value={currentSessionSummary.followUp?.note || ''} onChange={(e) => setCurrentSessionSummary({...currentSessionSummary, followUp: {...currentSessionSummary.followUp, note: e.target.value}})} placeholder="Add a note for the follow-up..." className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm bg-white"/>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 pt-4"><button onClick={() => setIsSessionSummaryModalOpen(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium">Discard</button><button onClick={handleSaveSessionSummary} className="flex-1 py-2 rounded-lg text-white font-medium" style={{ backgroundColor: colors.messageBubble }}>{currentSessionSummary.followUp?.enabled ? 'Save & Create Task' : 'Save Summary'}</button></div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Contact">
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg"/></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg"/></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="tel" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg"/></div>
          <div className="flex gap-3 pt-4"><button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium">Cancel</button><button onClick={handleEditSave} className="flex-1 py-2 rounded-lg text-white font-medium" style={{ backgroundColor: colors.messageBubble }}>Save</button></div>
        </div>
      </Modal>

      <Modal isOpen={isRegisterModalOpen} onClose={() => setIsRegisterModalOpen(false)} title="Register Contact">
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg"/></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label><input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg"/></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Membership</label><select value={editForm.membershipType} onChange={(e) => setEditForm({ ...editForm, membershipType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg"><option>Basic</option><option>Premium</option><option>VIP</option></select></div>
          <div className="flex gap-3 pt-4"><button onClick={() => setIsRegisterModalOpen(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium">Cancel</button><button onClick={handleRegisterSave} className="flex-1 py-2 rounded-lg text-white font-medium" style={{ backgroundColor: colors.messageBubble }}>Register</button></div>
        </div>
      </Modal>

      <Modal isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} title="Confirm Delete">
        <div className="space-y-4">
          <p className="text-gray-600">Are you sure you want to delete this {itemToDelete?.type}?</p>
          <div className="flex gap-3 pt-4"><button onClick={() => setIsDeleteConfirmOpen(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium">Cancel</button><button onClick={handleDeleteItem} className="flex-1 py-2 rounded-lg text-white font-medium bg-red-500">Delete</button></div>
        </div>
      </Modal>

      {/* Left Sidebar */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.messageBubble }}><svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></div>
            <div><div className="font-semibold text-gray-800 text-sm">Flowbot Workspace</div><div className="text-xs text-gray-500">18 estate</div></div>
          </div>
        </div>
        <div className="flex border-b border-gray-200">
          <button onClick={() => setLeftPanelTab('chats')} className={`flex-1 py-3 text-sm font-medium ${leftPanelTab === 'chats' ? 'border-b-2' : 'text-gray-500'}`} style={leftPanelTab === 'chats' ? { color: colors.messageBubble, borderColor: colors.messageBubble } : {}}>Chats</button>
          <button onClick={() => setLeftPanelTab('whatsapp')} className={`flex-1 py-3 text-sm font-medium ${leftPanelTab === 'whatsapp' ? 'border-b-2' : 'text-gray-500'}`} style={leftPanelTab === 'whatsapp' ? { color: colors.messageBubble, borderColor: colors.messageBubble } : {}}>Whatsapp</button>
          <button onClick={() => setLeftPanelTab('users')} className={`flex-1 py-3 text-sm font-medium ${leftPanelTab === 'users' ? 'border-b-2' : 'text-gray-500'}`} style={leftPanelTab === 'users' ? { color: colors.messageBubble, borderColor: colors.messageBubble } : {}}>Users</button>
        </div>
        <div className="p-3"><div className="relative"><svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" strokeWidth="2"/><path strokeWidth="2" d="m21 21-4.35-4.35"/></svg><input type="text" placeholder="Buscar o iniciar un chat" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg text-sm border-0"/></div></div>
        <div className="flex-1 overflow-y-auto">
          {filteredChats.map((chat, i) => (
            <div key={chat.id} onClick={() => setActiveChat(i)} className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 ${activeChat === i ? 'bg-gray-100' : ''}`}>
              <div className="relative">
                {chat.isBot ? <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.messageBubble }}><svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg></div> : <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white" style={{ backgroundColor: colors.avatarBg }}>{chat.initials}</div>}
                {chat.online && <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: colors.online }}></div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center"><span className="font-medium text-gray-800 text-sm truncate">{chat.name}</span><span className="text-xs text-gray-400 ml-2">{chat.time}</span></div>
                <div className="flex items-center gap-2"><p className="text-xs text-gray-500 truncate flex-1">{chat.preview}</p>{chat.sessionActive && <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></span>}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col" style={{ backgroundColor: colors.chatBg }}>
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200" style={{ backgroundColor: colors.headerBg }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white" style={{ backgroundColor: colors.avatarBg }}>LM</div>
            <div><div className="font-semibold text-gray-800">Lucia Meza Whatsapp</div><div className="text-xs text-gray-500">Ultimo visto 05:40 PM</div></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleCloseSession} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-orange-300 text-orange-600 hover:bg-orange-50 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>Close Session
            </button>
            <button className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3" strokeWidth="2"/></svg></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {chatMessages.map((msg) => (
            <div key={msg.id} className="flex justify-end">
              <div className={`rounded-lg px-4 py-3 max-w-md text-white ${msg.type === 'product' || msg.type === 'appointment' ? 'border-l-4 border-yellow-400' : ''}`} style={{ backgroundColor: msg.type === 'link' ? colors.linkBox : colors.messageBubble }}>
                {msg.type === 'link' ? (<div className="flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg><span className="underline cursor-pointer">{msg.text}</span></div>) : (<p className="whitespace-pre-line">{msg.text}</p>)}
                <div className="flex items-center justify-end gap-1 mt-1"><span className="text-xs opacity-80">{msg.status} - {msg.time}</span><svg className="w-4 h-4 opacity-80" fill="currentColor" viewBox="0 0 24 24"><path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/></svg></div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 py-3" style={{ backgroundColor: colors.headerBg }}>
          <div className="flex items-center gap-3 bg-white rounded-full px-4 py-2 shadow-sm">
            <input type="text" placeholder="escribe aquí" value={message} onChange={(e) => setMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} className="flex-1 bg-transparent border-0 focus:outline-none text-gray-700"/>
            <button className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg></button>
            <button className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg></button>
            <button onClick={handleSendMessage} className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: colors.sendButton }}><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>
          </div>
        </div>
      </div>

      {/* CRM Dashboard - Right Panel */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">CRM Dashboard</h2>
          <button className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3" strokeWidth="2"/></svg></button>
        </div>
        <div className="p-6 border-b border-gray-200">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div><h3 className="font-semibold text-gray-800 text-lg">{contactDetails.name}</h3><p className="text-sm text-gray-500">{contactDetails.source}</p></div>
              <div className="flex gap-2">
                <button onClick={openEditModal} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100">Edit</button>
                <button onClick={openRegisterModal} className="px-3 py-1.5 text-xs font-medium rounded-lg text-white hover:opacity-90" style={{ backgroundColor: colors.messageBubble }}>Register</button>
              </div>
            </div>
          </div>
        </div>
        {/* Tab Groups */}
        <div className="border-b border-gray-200">
          {/* Primary Tabs Row - Sales Tools */}
          <div className="flex px-2 pt-2">
            {[
              { id: 'detalle', icon: '🤖', label: 'AI CRM' },
              { id: 'catalog', icon: '📦', label: 'Catálogo' },
              { id: 'appointments', icon: '📅', label: 'Citas' },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex flex-col items-center py-2 px-1 rounded-t-lg transition-all ${activeTab === tab.id ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
                <span className="text-lg">{tab.icon}</span>
                <span className={`text-xs font-medium mt-0.5 ${activeTab === tab.id ? 'text-gray-800' : 'text-gray-500'}`} style={activeTab === tab.id ? { color: colors.messageBubble } : {}}>{tab.label}</span>
              </button>
            ))}
          </div>
          {/* Secondary Tabs Row - CRM Management */}
          <div className="flex bg-gray-100 px-2 py-1.5 gap-1.5 border-t border-gray-200">
            {[
              { id: 'tickets', icon: '🎫', label: 'Tickets', count: 3 },
              { id: 'tasks', icon: '✅', label: 'Tareas', count: 4 },
              { id: 'activity', icon: '📊', label: 'Actividad', count: null },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${activeTab === tab.id ? 'bg-white shadow-md ring-1 ring-gray-200' : 'bg-gray-50 hover:bg-white hover:shadow-sm text-gray-600 hover:text-gray-800'}`} style={activeTab === tab.id ? { backgroundColor: '#f0f7f5', color: colors.messageBubble, boxShadow: '0 2px 4px rgba(90,144,128,0.15)' } : {}}>
                <span className="text-sm">{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count && <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${activeTab === tab.id ? 'bg-white text-gray-600' : 'bg-gray-200 text-gray-500'}`} style={activeTab === tab.id ? { backgroundColor: colors.messageBubble, color: 'white' } : {}}>{tab.count}</span>}
              </button>
            ))}
          </div>
        </div>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default WhatsAppCRM;
