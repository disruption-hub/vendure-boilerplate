export interface FileValidationResult {
  valid: boolean
  error?: string
}

export interface FileConstraints {
  maxSize: number
  allowedTypes: string[]
  maxFiles?: number
}

export class FileValidator {
  static readonly DEFAULT_CONSTRAINTS: FileConstraints = {
    maxSize: 90 * 1024 * 1024, // 90MB
    allowedTypes: [
      // Images
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',

      // Videos
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/wmv',
      'video/flv',
      'video/webm',
      'video/mkv',

      // PDFs
      'application/pdf',
    ],
    maxFiles: 10,
  }

  static validateFile(file: File, constraints: FileConstraints = this.DEFAULT_CONSTRAINTS): FileValidationResult {
    // Check file size
    if (file.size > constraints.maxSize) {
      return {
        valid: false,
        error: `File "${file.name}" exceeds maximum size of ${Math.round(constraints.maxSize / (1024 * 1024))}MB`,
      }
    }

    // Check MIME type
    if (!constraints.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type "${file.type}" not allowed. Allowed types: images, videos, PDFs`,
      }
    }

    return { valid: true }
  }

  static validateFiles(files: File[], constraints: FileConstraints = this.DEFAULT_CONSTRAINTS): FileValidationResult {
    // Check number of files
    if (constraints.maxFiles && files.length > constraints.maxFiles) {
      return {
        valid: false,
        error: `Maximum ${constraints.maxFiles} files allowed`,
      }
    }

    // Check total size
    const totalSize = files.reduce((sum, file) => sum + file.size, 0)
    if (totalSize > constraints.maxSize) {
      return {
        valid: false,
        error: `Total file size exceeds ${Math.round(constraints.maxSize / (1024 * 1024))}MB limit`,
      }
    }

    // Validate each file
    for (const file of files) {
      const result = this.validateFile(file, constraints)
      if (!result.valid) {
        return result
      }
    }

    return { valid: true }
  }

  static getFileType(file: File): 'image' | 'video' | 'pdf' | 'unknown' {
    if (file.type.startsWith('image/')) return 'image'
    if (file.type.startsWith('video/')) return 'video'
    if (file.type === 'application/pdf') return 'pdf'
    return 'unknown'
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}
