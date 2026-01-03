'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Mail, Phone, Send, Instagram, Settings, Plus, CheckCircle } from 'lucide-react'

interface Channel {
  id: string
  name: string
  type: 'whatsapp' | 'email' | 'telegram' | 'sms'
  status: 'active' | 'inactive'
  description: string
  icon: typeof MessageSquare
}

export default function CommunicationHub() {
  const [loading, setLoading] = useState(true)
  const [channels, setChannels] = useState<Channel[]>([])

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setChannels([
        {
          id: '1',
          name: 'WhatsApp',
          type: 'whatsapp',
          status: 'active',
          description: 'Business messaging',
          icon: MessageSquare,
        },
        {
          id: '2',
          name: 'Email',
          type: 'email',
          status: 'active',
          description: 'Transactional emails',
          icon: Mail,
        },
        {
          id: '3',
          name: 'Telegram',
          type: 'telegram',
          status: 'inactive',
          description: 'Bot messaging',
          icon: Send,
        },
      ])
      setLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  const getChannelIconColor = (type: string) => {
    switch (type) {
      case 'whatsapp':
        return 'text-success'
      case 'email':
        return 'text-primary-500'
      case 'telegram':
        return 'text-info'
      default:
        return 'text-icon-primary'
    }
  }

  const recentActivity = [
    { type: 'whatsapp', message: 'WhatsApp message sent', time: '2 minutes ago', icon: MessageSquare, color: 'text-success' },
    { type: 'email', message: 'Email delivered', time: '5 minutes ago', icon: Mail, color: 'text-primary-500' },
    { type: 'sms', message: 'SMS sent', time: '10 minutes ago', icon: Phone, color: 'text-info' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Communications Hub</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage communication channels and messaging services
          </p>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-md text-bg-primary bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
          <Plus className="h-4 w-4 mr-2" />
          Add Channel
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Available Channels */}
        <div className="bg-bg-primary shadow-md rounded-lg border border-border-light">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-text-primary mb-4">
              Available Channels
            </h3>
            <div className="space-y-4">
              {channels.map((channel) => {
                const Icon = channel.icon
                return (
                  <div
                    key={channel.id}
                    className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg border border-border-light"
                  >
                    <div className="flex items-center">
                      <Icon className={`h-6 w-6 ${getChannelIconColor(channel.type)}`} />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-text-primary">{channel.name}</p>
                        <p className="text-xs text-text-secondary">{channel.description}</p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        channel.status === 'active'
                          ? 'bg-success-light border-success-dark text-text-primary'
                          : 'bg-bg-tertiary border-border text-text-secondary'
                      }`}
                    >
                      {channel.status === 'active' ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        'Inactive'
                      )}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-bg-primary shadow-md rounded-lg border border-border-light">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-text-primary mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => {
                const Icon = activity.icon
                return (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <Icon className={`h-5 w-5 ${activity.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-text-primary">{activity.message}</p>
                      <p className="text-xs text-text-secondary">{activity.time}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-bg-primary overflow-hidden shadow-md rounded-lg border border-border-light p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-md bg-primary-500">
                <MessageSquare className="h-6 w-6 text-bg-primary" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-text-secondary truncate">Total Messages</dt>
                <dd className="text-lg font-medium text-text-primary">1,234</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-bg-primary overflow-hidden shadow-md rounded-lg border border-border-light p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-md bg-success">
                <CheckCircle className="h-6 w-6 text-bg-primary" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-text-secondary truncate">Active Channels</dt>
                <dd className="text-lg font-medium text-text-primary">
                  {channels.filter(c => c.status === 'active').length}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-bg-primary overflow-hidden shadow-md rounded-lg border border-border-light p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-md bg-info">
                <Send className="h-6 w-6 text-bg-primary" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-text-secondary truncate">Success Rate</dt>
                <dd className="text-lg font-medium text-text-primary">98.5%</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

