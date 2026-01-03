import React from 'react'

export function renderMessageContent(content: string | null | undefined, messageId?: string): React.ReactNode {
  if (!content) return null

  // Convert Markdown links [text](url) to clickable HTML links
  const processLinks = (text: string): React.ReactNode => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    const parts: React.ReactNode[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null
    let keyCounter = 0

    while ((match = linkRegex.exec(text)) !== null) {
      // Add text before the link
      if (match.index > lastIndex) {
        const beforeText = text.substring(lastIndex, match.index)
        if (beforeText) {
          parts.push(beforeText)
        }
      }

      // Add the link as a clickable element
      const linkText = match[1]
      const linkUrl = match[2]
      parts.push(
        React.createElement(
          'a',
          {
            key: `link-${keyCounter++}-${match.index}`,
            href: linkUrl,
            target: '_blank',
            rel: 'noopener noreferrer',
            className: 'text-blue-400 underline hover:text-blue-300 transition-colors break-all',
            onClick: (e: React.MouseEvent) => {
              e.stopPropagation()
            },
          },
          linkText
        )
      )

      lastIndex = match.index + match[0].length
    }

    // Add remaining text after the last link
    if (lastIndex < text.length) {
      const afterText = text.substring(lastIndex)
      if (afterText) {
        parts.push(afterText)
      }
    }

    // If no links were found, return the original text wrapped in a fragment
    if (parts.length === 0) {
      return React.createElement(React.Fragment, null, text)
    }

    // Return array of React nodes (React can handle arrays of nodes)
    return parts
  }

  const processedContent = processLinks(content)

  return React.createElement(
    'div',
    {
      className: 'whitespace-pre-wrap chatbot-message-content',
      style: { color: 'inherit' }
    },
    processedContent
  )
}

