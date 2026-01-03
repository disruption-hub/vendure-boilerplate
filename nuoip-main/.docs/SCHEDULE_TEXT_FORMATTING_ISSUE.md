# Schedule Text Formatting Issue - Context for Next Agent

## 🚨 **Current Problem**
The chat embedded window is not properly handling schedule text formatting. Schedule text appears as a single line instead of being formatted with proper line breaks, making it difficult to read.

## 📋 **Issue Description**
When the chatbot displays appointment schedules, the text appears like this:
```
No problem! Moving on. Here's what I have this week: 📅 **Thu Oct 23** 🕐 9:00 AM - 10:00 AM 🕐 10:15 AM - 11:15 AM 🕐 1:00 PM - 2:00 PM 🕐 3:30 PM - 4:30 PM 💬 Just tell me the number you like. 💬 Want to see more available days? Just say "next week" or "show more days".
```

**Expected format should be:**
```
No problem! Moving on. Here's what I have this week:

📅 **Thu Oct 23**
   🕐 9:00 AM - 10:00 AM
   🕐 10:15 AM - 11:15 AM
   🕐 1:00 PM - 2:00 PM
   🕐 3:30 PM - 4:30 PM

💬 Just tell me the number you like.

💬 Want to see more available days? Just say "next week" or "show more days".
```

## 🔍 **Root Cause Analysis**
1. **AI Service Processing**: The AI service is converting multi-line schedule text to single-line format
2. **Line Break Stripping**: Line breaks are being removed during message processing
3. **Formatting Loss**: Visual structure (emojis, indentation, spacing) is not preserved

## 📁 **Key Files Involved**

### 1. Schedule Generation
- **File**: `src/lib/chatbot/handlers/slots.ts`
- **Function**: `buildSlotChoices()`
- **Function**: `formatSlotsForDisplay()`
- **Status**: ✅ Generates correct format with line breaks

### 2. Message Rendering (Main Chat)
- **File**: `src/features/chat/components/ChatMessageList.tsx`
- **Function**: `renderMessageContent()`
- **Status**: ⚠️ Has single-line detection logic but may need improvement

### 3. Message Rendering (Embedded Chatbot)
- **File**: `src/components/chatbot/ui/ChatMessages.tsx`
- **Function**: `renderMessageContent()`
- **Status**: ⚠️ Has single-line detection logic but may need improvement

### 4. Schedule Integration
- **File**: `src/lib/chatbot/integrations/scheduling.ts`
- **Function**: `formatSlotsForDisplay()`
- **Status**: ✅ Generates correct format

## 🛠️ **Previous Attempts Made**

### Attempt 1: Marker System
- Added `<!-- SCHEDULE_TEXT -->` marker to preserve formatting
- **Result**: Marker was visible to users
- **Status**: ❌ Removed

### Attempt 2: Single-Line Detection
- Added logic to detect single-line schedule text
- Added regex parsing to reformat content
- **Result**: Partially working but still has issues
- **Status**: ⚠️ Needs improvement

## 🎯 **Current Implementation**

### Single-Line Detection Logic
```typescript
// Check if this is a single-line schedule text that needs to be reformatted
let processedContent = normalized
if (normalized.includes('📅') && normalized.includes('🕐') && normalized.split('\n').length === 1) {
  const scheduleMatch = normalized.match(/(.*?)(📅 \*\*.*?\*\*)(.*?)(💬.*)/s)
  if (scheduleMatch) {
    const [, prefix, schedulePart, timeSlots, closing] = scheduleMatch
    
    // Split the time slots by 🕐 emoji and reformat
    const timeSlotParts = timeSlots.split('🕐').filter(part => part.trim())
    const formattedTimeSlots = timeSlotParts.map(part => `   🕐${part.trim()}`).join('\n')
    
    // Split closing text by 💬 emoji and format each part
    const closingParts = closing.split('💬').filter(part => part.trim())
    const formattedClosing = closingParts.map(part => `💬${part.trim()}`).join('\n\n')
    
    // Reconstruct with proper line breaks
    processedContent = `${prefix.trim()}\n\n${schedulePart}\n${formattedTimeSlots}\n\n${formattedClosing}`
  }
}
```

## 🔧 **Potential Solutions to Try**

### Option 1: Improve Regex Pattern
The current regex might not be capturing all variations of schedule text. Consider:
- More flexible pattern matching
- Better handling of different date formats
- Improved emoji detection

### Option 2: Pre-processing at Source
Instead of fixing at rendering level, prevent the issue at generation:
- Modify the AI service to preserve line breaks
- Use different formatting approach in `buildSlotChoices()`
- Implement content type detection

### Option 3: Enhanced Message Processing
Improve the message rendering logic:
- Better single-line detection
- More robust text parsing
- Improved line break reconstruction

### Option 4: CSS-Based Solution
Use CSS to handle the formatting:
- Apply specific styles to schedule content
- Use CSS `white-space: pre-line` for line breaks
- Implement responsive design

## 🧪 **Testing Approach**

### Test Cases to Verify
1. **Single-line schedule text** (current issue)
2. **Multi-line schedule text** (should work)
3. **Different date formats**
4. **Various time slot counts**
5. **Mobile responsiveness**

### Test Script Example
```javascript
const testCases = [
  "No problem! Moving on. Here's what I have this week: 📅 **Thu Oct 23** 🕐 9:00 AM - 10:00 AM 🕐 10:15 AM - 11:15 AM 🕐 1:00 PM - 2:00 PM 🕐 3:30 PM - 4:30 PM 💬 Just tell me the number you like. 💬 Want to see more available days? Just say \"next week\" or \"show more days\".",
  // Add more test cases
]
```

## 📱 **Expected Behavior**
- Schedule text should display with proper line breaks
- Time slots should be indented under dates
- Emojis should be properly spaced
- Mobile responsive design
- Consistent formatting across all chat interfaces

## 🚀 **Next Steps for Agent**
1. **Analyze current implementation** in the mentioned files
2. **Test the single-line detection logic** with various inputs
3. **Identify why the regex pattern might be failing**
4. **Implement a more robust solution**
5. **Test across different scenarios**
6. **Verify mobile responsiveness**

## 📝 **Additional Context**
- This affects both the main chat interface and embedded chatbot
- The issue occurs when AI services process the schedule text
- Line breaks are being stripped during message processing
- The solution needs to work for both English and Spanish content
- Mobile responsiveness is important for the chat interface

## 🔗 **Related Files to Check**
- `src/lib/chatbot/conversation-router.ts`
- `src/lib/services/ai/chatbot-contact-service.ts`
- `src/lib/ai/tenant-chatbot/tenant-chatbot-service.ts`
- `src/app/api/tenant-chatbot/stream/route.ts`

The issue is complex and involves multiple layers of the application. The next agent should focus on understanding the message flow and implementing a robust solution that handles all edge cases.
