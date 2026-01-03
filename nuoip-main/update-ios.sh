#!/bin/bash

# IPNUO Chatbot iOS Update Script

echo "🤖 IPNUO Chatbot iOS Update Helper"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "capacitor.config.ts" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📱 Updating iOS project..."

# Copy web assets to iOS project
echo "🔄 Copying web assets..."
npx cap copy ios

if [ $? -eq 0 ]; then
    echo "✅ Web assets copied successfully"
else
    echo "❌ Failed to copy web assets"
    exit 1
fi

echo ""
echo "🎉 Update complete!"
echo ""
echo "Next steps:"
echo "1. Go to Xcode (should already be open)"
echo "2. Click Run (▶️) to build and test your app"
echo "3. Your chatbot app will launch with the latest changes!"
echo ""
echo "💡 Tip: Keep Xcode open and just click Run after each update"
