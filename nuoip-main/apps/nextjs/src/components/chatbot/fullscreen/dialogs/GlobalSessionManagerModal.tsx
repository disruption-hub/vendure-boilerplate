"use client"

import { useState, useMemo } from 'react'
import {
    X,
    MessageSquare,
    Clock,
    ArrowLeft,
    Users,
} from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SidebarEntry } from '@/components/chatbot/types'
import { CloseSessionForm } from './CloseSessionForm'

interface GlobalSessionManagerModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    openSessions: SidebarEntry[]
    onCloseSession: (contactId: string, data: any) => Promise<void>
    isClosing?: boolean
}

export function GlobalSessionManagerModal({
    open,
    onOpenChange,
    openSessions,
    onCloseSession,
    isClosing: externalIsClosing = false,
}: GlobalSessionManagerModalProps) {
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    const selectedContact = useMemo(() =>
        openSessions.find(s => s.id === selectedContactId),
        [openSessions, selectedContactId]
    )

    const handleClose = (open: boolean) => {
        if (!open) {
            setSelectedContactId(null)
        }
        onOpenChange(open)
    }

    const handleConfirmClosure = async (data: any) => {
        if (!selectedContactId) return
        setIsProcessing(true)
        try {
            await onCloseSession(selectedContactId, data)
            setSelectedContactId(null)
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[600px] overflow-hidden flex flex-col max-h-[90vh]" overlayClassName="bg-black/80">
                <DialogHeader className="border-b border-slate-800 pb-4 shrink-0">
                    <div className="flex items-center gap-2">
                        {selectedContactId && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedContactId(null)}
                                aria-label="Volver al listado"
                                className="h-8 w-8 text-slate-400 hover:text-white"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        )}
                        <DialogTitle className="flex items-center gap-2 text-xl text-slate-100">
                            <Users className="w-5 h-5 text-emerald-400" />
                            {selectedContactId ? 'Cerrar Sesión' : 'Sesiones Abiertas'}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-slate-400 pt-1">
                        {selectedContactId
                            ? (
                                <>
                                    Finalizando conversación con <span className="text-white font-medium">{selectedContact?.name || 'contacto'}</span>
                                </>
                            )
                            : `Actualmente hay ${openSessions.length} sesiones activas que requieren atención.`}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4 px-1 min-h-[300px]">
                    {selectedContactId && selectedContact ? (
                        <CloseSessionForm
                            contactId={selectedContact.id}
                            sessionStartTime={selectedContact.sessionStartTime}
                            onCancel={() => setSelectedContactId(null)}
                            onSubmit={handleConfirmClosure}
                            isLoading={isProcessing || externalIsClosing}
                        />
                    ) : openSessions.length > 0 ? (
                        <div className="space-y-2">
                            {openSessions.map((session) => (
                                <div
                                    key={session.id}
                                    className="group flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:bg-slate-800/60 hover:border-slate-700 transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                            <MessageSquare className="h-5 w-5 text-emerald-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-slate-100">{session.name}</h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Clock className="h-3 w-3 text-slate-500" />
                                                <span className="text-xs text-slate-400">
                                                    {session.sessionStartTime ? (
                                                        (() => {
                                                            const diff = new Date().getTime() - new Date(session.sessionStartTime).getTime()
                                                            const mins = Math.max(0, Math.round(diff / 60000))
                                                            return `Activa hace ${mins} min`
                                                        })()
                                                    ) : 'Iniciada recientemente'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => setSelectedContactId(session.id)}
                                        variant="ghost"
                                        className="h-9 px-4 border border-slate-700 bg-slate-900/50 hover:bg-emerald-600 hover:border-emerald-500 hover:text-white text-slate-200 transition-colors"
                                    >
                                        Cerrar
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
                            <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 mb-2">
                                <Users className="h-8 w-8 text-slate-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-slate-200">No hay sesiones abiertas</h3>
                                <p className="text-sm text-slate-500 max-w-[250px] mx-auto mt-1">
                                    Todas las conversaciones de WhatsApp han sido cerradas o no se han iniciado nuevas.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="mt-4 border-slate-700 text-slate-400 hover:text-white"
                            >
                                Entendido
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
