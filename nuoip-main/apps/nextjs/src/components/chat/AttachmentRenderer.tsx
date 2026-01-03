'use client'

import React, { useState } from 'react'
import { File, Image as ImageIcon, Video, FileText, Download, ExternalLink, Loader2, X } from 'lucide-react'
import { ChatAttachment } from '@/components/chatbot/types'
import { FileValidator } from '@/lib/utils/file-validator'
import { cn } from '@/lib/utils'

interface AttachmentRendererProps {
  attachment: ChatAttachment
  className?: string
}

export function AttachmentRenderer({ attachment, className }: AttachmentRendererProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const fileType = FileValidator.getFileType({
    type: attachment.mimeType,
    name: attachment.originalName,
  } as File)

  const isImage = fileType === 'image'

  const getFileIcon = () => {
    switch (fileType) {
      case 'image':
        return <ImageIcon className="h-4 w-4" />
      case 'video':
        return <Video className="h-4 w-4" />
      case 'pdf':
        return <FileText className="h-4 w-4" />
      default:
        return <File className="h-4 w-4" />
    }
  }

  const handleDownload = () => {
    // Create a temporary link to download the file
    const link = document.createElement('a')
    link.href = attachment.url
    link.download = attachment.originalName
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleView = () => {
    if (isImage) {
      setShowModal(true)
    } else {
      window.open(attachment.url, '_blank')
    }
  }

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  const handleImageError = () => {
    setImageError(true)
  }

  if (isImage && !imageError) {
    return (
      <div className={cn('rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800', className)}>
        <div className="relative">
          {!imageLoaded && (
            <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-700 h-48">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          )}
          <img
            src={attachment.url}
            alt={attachment.originalName}
            loading="lazy"
            className={cn(
              'max-w-full h-auto transition-opacity duration-200',
              imageLoaded ? 'opacity-100' : 'opacity-0',
              'cursor-pointer hover:opacity-90'
            )}
            style={{
              maxHeight: '300px',
              maxWidth: '100%',
              objectFit: 'contain',
              borderRadius: '4px'
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
            onClick={handleView}
          />
          {imageLoaded && (
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleView()
                }}
                className="p-1 bg-gray-900/50 hover:bg-gray-900/70 rounded text-white transition-colors"
                title="View full size"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDownload()
                }}
                className="p-1 bg-gray-900/50 hover:bg-gray-900/70 rounded text-white transition-colors"
                title="Download"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div className="p-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {getFileIcon()}
              <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                {attachment.originalName}
              </span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 whitespace-nowrap">
              {(attachment.size / 1024).toFixed(1)} KB
            </span>
          </div>
        </div>

        {/* Image modal */}
        {showModal && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4"
            onClick={() => setShowModal(false)}
          >
            <div className="relative max-w-full max-h-full">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-2 bg-gray-900/50 hover:bg-gray-900/70 rounded-full text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
              <img
                src={attachment.url}
                alt={attachment.originalName}
                className="max-w-full max-h-[90vh] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  // Show error placeholder for failed image loads or 404s
  if (isImage && imageError) {
    return (
      <div className={cn('rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800', className)}>
        <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-700 h-48">
          <div className="text-center px-4">
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Image not available</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{attachment.originalName}</p>
          </div>
        </div>
      </div>
    )
  }

  // Fallback for non-image files or when image fails to load
  return (
    <>
      <div className={cn('flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700', className)}>
        <div className="flex-shrink-0">
          {getFileIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {attachment.originalName}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {FileValidator.formatFileSize(attachment.size)}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {(fileType === 'image' || fileType === 'video') && (
            <button
              onClick={handleView}
              className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded"
              title="View file"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={handleDownload}
            className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded"
            title="Download file"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Image Modal for image files */}
      {isImage && (
        <ImageModal
          attachment={attachment}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}

interface AttachmentsListProps {
  attachments: ChatAttachment[]
  className?: string
}

export function AttachmentsList({ attachments, className }: AttachmentsListProps) {
  if (!attachments || attachments.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-2', className)}>
      {attachments.map((attachment) => (
        <AttachmentRenderer key={attachment.id} attachment={attachment} />
      ))}
    </div>
  )
}

// Image Modal Component for full-size viewing
interface ImageModalProps {
  attachment: ChatAttachment | null
  isOpen: boolean
  onClose: () => void
}

export function ImageModal({ attachment, isOpen, onClose }: ImageModalProps) {
  if (!isOpen || !attachment) return null

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = attachment.url
    link.download = attachment.originalName
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-4xl max-h-full">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Download button */}
        <button
          onClick={handleDownload}
          className="absolute top-4 left-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
          title="Download image"
        >
          <Download className="h-6 w-6" />
        </button>

        {/* Image */}
        <img
          src={attachment.url}
          alt={attachment.originalName}
          className="max-w-full max-h-full object-contain rounded-lg"
          style={{ maxHeight: '90vh' }}
        />

        {/* Image info */}
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 rounded-b-lg">
          <div className="font-medium">{attachment.originalName}</div>
          <div className="text-sm opacity-75">
            {FileValidator.formatFileSize(attachment.size)}
          </div>
        </div>
      </div>
    </div>
  )
}
