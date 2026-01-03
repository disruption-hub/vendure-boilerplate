'use client'

import React, { useCallback, useState } from 'react'
import { Upload, X, File, Image as ImageIcon, Video, FileText } from 'lucide-react'
import { FileValidator } from '@/lib/utils/file-validator'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void
  onFilesCleared: () => void
  selectedFiles: File[]
  disabled?: boolean
  className?: string
}

export function FileUpload({
  onFilesSelected,
  onFilesCleared,
  selectedFiles,
  disabled = false,
  className,
}: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    const validation = FileValidator.validateFiles(fileArray)

    if (!validation.valid) {
      setError(validation.error || 'Invalid files')
      return
    }

    setError(null)
    onFilesSelected(fileArray)
  }, [onFilesSelected])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setDragOver(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (!disabled) {
      handleFileSelect(e.dataTransfer.files)
    }
  }, [disabled, handleFileSelect])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
  }, [handleFileSelect])

  const removeFile = useCallback((index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    if (newFiles.length === 0) {
      onFilesCleared()
    } else {
      onFilesSelected(newFiles)
    }
  }, [selectedFiles, onFilesSelected, onFilesCleared])

  const getFileIcon = (file: File) => {
    const type = FileValidator.getFileType(file)
    switch (type) {
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

  return (
    <div className={cn('space-y-2', className)}>
      {/* File Input Area */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-4 text-center transition-colors',
          dragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'border-gray-300 dark:border-gray-600',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'cursor-pointer hover:border-gray-400 dark:hover:border-gray-500'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept="image/*,video/*,.pdf"
          onChange={handleFileInput}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <div className="flex flex-col items-center gap-2">
          <Upload className={cn('h-8 w-8', dragOver ? 'text-blue-500' : 'text-gray-400')} />
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {dragOver ? (
              'Drop files here'
            ) : (
              <span>
                Drag & drop files or <span className="text-blue-500 underline">browse</span>
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">
            Images, videos, PDFs • Max 90MB per file • Up to 10 files
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 p-2 rounded">
          {error}
        </div>
      )}

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={onFilesCleared}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Clear all
            </button>
          </div>

          <div className="space-y-1 max-h-32 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border"
              >
                {getFileIcon(file)}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {file.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {FileValidator.formatFileSize(file.size)}
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            Total: {FileValidator.formatFileSize(selectedFiles.reduce((sum, file) => sum + file.size, 0))}
          </div>
        </div>
      )}
    </div>
  )
}
