'use client'

import React, { useState } from 'react'
import { Lock, AlertTriangle, Loader2, X } from 'lucide-react'

interface ContactLockedOverlayProps {
    contactName: string
    ownerName: string
    ownerEmail?: string
    hasPendingRequest: boolean
    onRequestTransfer: (message?: string) => Promise<void>
    onCancelRequest?: () => Promise<void>
    onClose?: () => void
}

export function ContactLockedOverlay({
    contactName,
    ownerName,
    ownerEmail,
    hasPendingRequest,
    onRequestTransfer,
    onCancelRequest,
    onClose,
}: ContactLockedOverlayProps) {
    const [message, setMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [showRequestForm, setShowRequestForm] = useState(false)

    const handleRequestTransfer = async () => {
        setIsLoading(true)
        try {
            await onRequestTransfer(message || undefined)
            setShowRequestForm(false)
            setMessage('')
        } catch (error) {
            console.error('Failed to request transfer:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancelRequest = async () => {
        if (!onCancelRequest) return
        setIsLoading(true)
        try {
            await onCancelRequest()
        } catch (error) {
            console.error('Failed to cancel request:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="contact-locked-overlay">
            <style jsx>{`
                .contact-locked-overlay {
                    position: absolute;
                    inset: 0;
                    backdrop-filter: blur(8px);
                    background: rgba(0, 0, 0, 0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 50;
                }
                
                .locked-card {
                    background: linear-gradient(145deg, #1e1e2e, #252535);
                    border-radius: 16px;
                    padding: 32px;
                    max-width: 400px;
                    width: 90%;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    text-align: center;
                }
                
                .lock-icon-container {
                    width: 80px;
                    height: 80px;
                    background: linear-gradient(135deg, #ef4444, #dc2626);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 24px;
                    box-shadow: 0 10px 40px rgba(239, 68, 68, 0.3);
                }
                
                .lock-icon {
                    color: white;
                    width: 40px;
                    height: 40px;
                }
                
                .locked-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: white;
                    margin-bottom: 8px;
                }
                
                .locked-subtitle {
                    font-size: 0.9rem;
                    color: rgba(255, 255, 255, 0.7);
                    margin-bottom: 24px;
                }
                
                .owner-info {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    padding: 16px;
                    margin-bottom: 24px;
                }
                
                .owner-label {
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.5);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 4px;
                }
                
                .owner-name {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: white;
                }
                
                .owner-email {
                    font-size: 0.85rem;
                    color: rgba(255, 255, 255, 0.6);
                }
                
                .pending-status {
                    background: linear-gradient(135deg, #f59e0b, #d97706);
                    border-radius: 12px;
                    padding: 16px;
                    margin-bottom: 24px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .pending-icon {
                    flex-shrink: 0;
                }
                
                .pending-text {
                    text-align: left;
                }
                
                .pending-title {
                    font-weight: 600;
                    color: white;
                    margin-bottom: 2px;
                }
                
                .pending-subtitle {
                    font-size: 0.8rem;
                    color: rgba(255, 255, 255, 0.8);
                }
                
                .request-form {
                    margin-bottom: 16px;
                }
                
                .request-textarea {
                    width: 100%;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    padding: 12px;
                    color: white;
                    font-size: 0.9rem;
                    resize: none;
                    min-height: 80px;
                    margin-bottom: 16px;
                }
                
                .request-textarea::placeholder {
                    color: rgba(255, 255, 255, 0.4);
                }
                
                .request-textarea:focus {
                    outline: none;
                    border-color: rgba(99, 102, 241, 0.5);
                }
                
                .button-group {
                    display: flex;
                    gap: 12px;
                }
                
                .btn {
                    flex: 1;
                    padding: 12px 20px;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }
                
                .btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                
                .btn-primary {
                    background: linear-gradient(135deg, #6366f1, #4f46e5);
                    color: white;
                }
                
                .btn-primary:hover:not(:disabled) {
                    background: linear-gradient(135deg, #4f46e5, #4338ca);
                    transform: translateY(-1px);
                }
                
                .btn-secondary {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                }
                
                .btn-secondary:hover:not(:disabled) {
                    background: rgba(255, 255, 255, 0.15);
                }
                
                .btn-danger {
                    background: rgba(239, 68, 68, 0.2);
                    color: #ef4444;
                }
                
                .btn-danger:hover:not(:disabled) {
                    background: rgba(239, 68, 68, 0.3);
                }
                
                .close-button {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    border-radius: 50%;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: rgba(255, 255, 255, 0.6);
                    transition: all 0.2s;
                }
                
                .close-button:hover {
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                }
            `}</style>

            <div className="locked-card" style={{ position: 'relative' }}>
                {onClose && (
                    <button className="close-button" onClick={onClose}>
                        <X size={16} />
                    </button>
                )}

                <div className="lock-icon-container">
                    <Lock className="lock-icon" />
                </div>

                <h2 className="locked-title">Contacto Bloqueado</h2>
                <p className="locked-subtitle">
                    Este contacto tiene una sesión abierta con otro operador
                </p>

                <div className="owner-info">
                    <div className="owner-label">Operador asignado</div>
                    <div className="owner-name">{ownerName}</div>
                    {ownerEmail && <div className="owner-email">{ownerEmail}</div>}
                </div>

                {hasPendingRequest ? (
                    <>
                        <div className="pending-status">
                            <AlertTriangle className="pending-icon" size={24} />
                            <div className="pending-text">
                                <div className="pending-title">Solicitud pendiente</div>
                                <div className="pending-subtitle">
                                    Esperando aprobación del supervisor
                                </div>
                            </div>
                        </div>
                        {onCancelRequest && (
                            <button
                                className="btn btn-danger"
                                onClick={handleCancelRequest}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="animate-spin" size={16} />
                                ) : (
                                    'Cancelar solicitud'
                                )}
                            </button>
                        )}
                    </>
                ) : showRequestForm ? (
                    <div className="request-form">
                        <textarea
                            className="request-textarea"
                            placeholder="Motivo de la solicitud (opcional)"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                        <div className="button-group">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowRequestForm(false)}
                                disabled={isLoading}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleRequestTransfer}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="animate-spin" size={16} />
                                ) : (
                                    'Enviar solicitud'
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowRequestForm(true)}
                        style={{ width: '100%' }}
                    >
                        Solicitar Transferencia
                    </button>
                )}
            </div>
        </div>
    )
}
