import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { RealtimeProvider } from "@/contexts/RealtimeContext";
import { Toaster } from "@/components/ui/toast";
import { ChatbotThemeProvider } from "@/components/chatbot/theme/ChatbotThemeContext";
import { ChatbotThemeConfigurator } from "@/components/chatbot/theme/ChatbotThemeConfigurator";

export const metadata: Metadata = {
  title: "Flowcast - AI-Powered Business Communication Platform",
  description: "The ultimate platform for AI-powered chatbot management, WhatsApp Business integration, and comprehensive customer relationship management. Built for modern businesses.",
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>
        {/* Vanta.js dependencies - loaded early with afterInteractive strategy */}
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"
          strategy="afterInteractive"
        />
        {/* Suppress console warnings and logs from third-party scripts and Pusher */}
        <Script
          id="suppress-console-warnings"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Guard against multiple executions
                if (window.__consoleSuppressionInitialized) {
                  return;
                }
                window.__consoleSuppressionInitialized = true;
                
                // Suppress MetaMask errors early - before any other scripts load
                const isMetaMaskError = (message) => {
                  if (!message) return false;
                  const messageStr = typeof message === 'string' ? message : String(message);
                  const lowerMessage = messageStr.toLowerCase();
                  return lowerMessage.includes('metamask') || 
                         lowerMessage.includes('chrome-extension') ||
                         lowerMessage.includes('failed to connect') ||
                         lowerMessage.includes('metamask extension not found') ||
                         lowerMessage.includes('nkbihfbeogaeaoehlefnkodbefgpgknn') ||
                         messageStr.includes('inpage.js') ||
                         messageStr.includes('chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn') ||
                         (messageStr.includes('i:') && lowerMessage.includes('metamask'));
                };

                // Global error handler - catch all errors before they propagate
                const originalOnError = window.onerror;
                window.onerror = function(message, source, lineno, colno, error) {
                  if (isMetaMaskError(message) || 
                      (source && (source.includes('chrome-extension') || source.includes('nkbihfbeogaeaoehlefnkodbefgpgknn'))) ||
                      (error && (isMetaMaskError(error.message) || isMetaMaskError(error.stack)))) {
                    return true; // Suppress the error
                  }
                  if (originalOnError) {
                    return originalOnError.call(this, message, source, lineno, colno, error);
                  }
                  return false;
                };

                const originalWarn = console.warn;
                const originalLog = console.log;
                const originalError = console.error;
                
                // Suppress errors (including MetaMask and passive event listener violations)
                console.error = function(...args) {
                  const message = args.join(' ');
                  // Filter out passive event listener violations (from third-party scripts like feedback.js)
                  // Check for all variations of the violation message
                  if ((message.includes('non-passive event listener') || 
                       message.includes('[Violation]') ||
                       message.includes('Added non-passive event listener') ||
                       message.includes('scroll-blocking')) &&
                      (message.includes('touchstart') || message.includes('touch'))) {
                    return;
                  }
                  // Filter out MetaMask errors
                  if (isMetaMaskError(message)) {
                    return;
                  }
                  // Check if error object contains MetaMask references
                  if (args.some(arg => {
                    if (!arg) return false;
                    if (typeof arg === 'object') {
                      const argMessage = arg.message || '';
                      const argStack = arg.stack || '';
                      const argString = String(arg);
                      return isMetaMaskError(argMessage) ||
                             isMetaMaskError(argStack) ||
                             isMetaMaskError(argString) ||
                             (argString.includes('i:') && argString.toLowerCase().includes('metamask'));
                    }
                    const argString = String(arg);
                    return isMetaMaskError(argString) ||
                           (argString.includes('i:') && argString.toLowerCase().includes('metamask'));
                  })) {
                    return;
                  }
                  originalError.apply(console, args);
                };
                
                // Suppress warnings
                console.warn = function(...args) {
                  const message = args.join(' ');
                  // Filter out MetaMask warnings
                  if (isMetaMaskError(message)) {
                    return;
                  }
                  // Filter out THREE.BufferAttribute .length deprecation warnings
                  if (message.includes('THREE.BufferAttribute') && message.includes('.length has been deprecated')) {
                    return;
                  }
                  // Filter out passive event listener violations (from third-party scripts like feedback.js)
                  // Check for all variations of the violation message
                  if ((message.includes('non-passive event listener') || 
                       message.includes('[Violation]') ||
                       message.includes('Added non-passive event listener') ||
                       message.includes('scroll-blocking')) &&
                      (message.includes('touchstart') || message.includes('touch'))) {
                    return;
                  }
                  originalWarn.apply(console, args);
                };
                
                // Suppress verbose connection logs
                console.log = function(...args) {
                  const message = args.join(' ');
                  // Suppress MetaMask logs
                  if (isMetaMaskError(message)) {
                    return;
                  }
                  // Suppress simple "connected" messages (likely from Pusher or other libraries)
                  if (message.trim() === 'connected' || message.trim() === 'Connected') {
                    return;
                  }
                  // Filter out passive event listener violations in logs (all variations)
                  if (message.includes('non-passive event listener') || 
                      message.includes('[Violation]') ||
                      message.includes('Added non-passive event listener') ||
                      message.includes('scroll-blocking')) {
                    if (message.includes('touchstart') || message.includes('touch')) {
                      return;
                    }
                  }
                  // Suppress Pusher connection state logs
                  if (message.includes('Pusher') && (message.includes('connected') || message.includes('Connected'))) {
                    return;
                  }
                  originalLog.apply(console, args);
                };

                // Suppress unhandled runtime errors from MetaMask (capture phase - highest priority)
                window.addEventListener('error', function(event) {
                  const errorMessage = event.message || '';
                  const errorSource = event.filename || event.source || '';
                  const errorTarget = event.target;
                  
                  // Check message, source, and target
                  if (isMetaMaskError(errorMessage) || 
                      isMetaMaskError(errorSource) ||
                      errorSource.includes('chrome-extension') ||
                      errorSource.includes('nkbihfbeogaeaoehlefnkodbefgpgknn') ||
                      (errorTarget && errorTarget.src && errorTarget.src.includes('chrome-extension'))) {
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    return false;
                  }
                }, true); // Use capture phase for earliest interception

                // Suppress unhandled promise rejections from MetaMask (capture phase)
                window.addEventListener('unhandledrejection', function(event) {
                  const reason = event.reason;
                  if (!reason) return;
                  
                  const errorMessage = reason.message || reason.toString() || '';
                  const errorStack = reason.stack || '';
                  const errorString = String(reason);
                  
                  // Check all possible error formats
                  const allErrorText = [errorMessage, errorStack, errorString].join(' ').toLowerCase();
                  
                  if (isMetaMaskError(errorMessage) || 
                      isMetaMaskError(errorStack) ||
                      isMetaMaskError(errorString) ||
                      errorStack.includes('chrome-extension') ||
                      errorStack.includes('nkbihfbeogaeaoehlefnkodbefgpgknn') ||
                      errorStack.includes('inpage.js') ||
                      errorString.includes('Failed to connect to MetaMask') ||
                      allErrorText.includes('metamask extension not found') ||
                      (errorString.includes('i:') && allErrorText.includes('metamask'))) {
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    return false;
                  }
                }, true); // Use capture phase for earliest interception

                // Prevent MetaMask from injecting and causing errors
                if (typeof window !== 'undefined') {
                  try {
                    // Wrap window.ethereum access to prevent errors
                    const ethereumDescriptor = Object.getOwnPropertyDescriptor(window, 'ethereum');
                    if (ethereumDescriptor && ethereumDescriptor.configurable) {
                      Object.defineProperty(window, 'ethereum', {
                        get: function() {
                          try {
                            return ethereumDescriptor.get ? ethereumDescriptor.get() : ethereumDescriptor.value;
                          } catch (e) {
                            // Silently fail if MetaMask is not available
                            return undefined;
                          }
                        },
                        set: function(value) {
                          try {
                            if (ethereumDescriptor.set) {
                              ethereumDescriptor.set(value);
                            } else {
                              ethereumDescriptor.value = value;
                            }
                          } catch (e) {
                            // Silently fail
                          }
                        },
                        configurable: true,
                        enumerable: true
                      });
                    }
                  } catch (e) {
                    // Ignore errors during MetaMask property wrapping
                  }
                }
              })();
            `,
          }}
        />
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"
          strategy="afterInteractive"
        />
        {/* Load VANTA.js - load all individual effect files like the working version */}
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/vanta/0.5.24/vanta.fog.min.js"
          strategy="afterInteractive"
        />
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/vanta/0.5.24/vanta.waves.min.js"
          strategy="afterInteractive"
        />
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/vanta/0.5.24/vanta.clouds.min.js"
          strategy="afterInteractive"
        />
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/vanta/0.5.24/vanta.birds.min.js"
          strategy="afterInteractive"
        />
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/vanta/0.5.24/vanta.net.min.js"
          strategy="afterInteractive"
        />
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/vanta/0.5.24/vanta.cells.min.js"
          strategy="afterInteractive"
        />
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/vanta/0.5.24/vanta.trunk.min.js"
          strategy="afterInteractive"
        />
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/vanta/0.5.24/vanta.topology.min.js"
          strategy="afterInteractive"
        />
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/vanta/0.5.24/vanta.dots.min.js"
          strategy="afterInteractive"
        />
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/vanta/0.5.24/vanta.rings.min.js"
          strategy="afterInteractive"
        />
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/vanta/0.5.24/vanta.halo.min.js"
          strategy="afterInteractive"
        />
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/vanta/0.5.24/vanta.globe.min.js"
          strategy="afterInteractive"
        />
        <ChatbotThemeProvider>
          <RealtimeProvider>
            {children}
            <Toaster />
            <ChatbotThemeConfigurator />
          </RealtimeProvider>
        </ChatbotThemeProvider>
      </body>
    </html>
  );
}
