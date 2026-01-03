// Handle runtime errors and browser extension conflicts
(function() {
  'use strict';

  function shouldSuppress(value) {
    if (!value) {
      return false;
    }

    let text = '';
    try {
      if (typeof value === 'string') {
        text = value;
      } else if (value && typeof value.message === 'string') {
        text = value.message;
      } else if (value && typeof value.toString === 'function') {
        text = value.toString();
      }
    } catch (_error) {
      // If extracting text fails, don't suppress
      return false;
    }

    if (!text) {
      return false;
    }

    const textLower = text.toLowerCase();
    
    return (
      text.includes('initEternlDomAPI') ||
      text.includes('yoroi') ||
      text.includes('dapp-connector') ||
      text.includes('chrome-extension://') ||
      text.includes('runtime.lastError') ||
      text.includes('The message port closed before a response was received') ||
      text.includes('MetaMask:') ||
      textLower.includes('react devtools') ||
      textLower.includes('download the react devtools') ||
      textLower.includes('react.dev/link/react-devtools') ||
      text.includes('was preloaded using link preload but not used') ||
      text.includes('preload but not used within a few seconds') ||
      text.includes('[Fast Refresh]') ||
      text.includes('Fast Refresh')
    );
  }

  function wrapConsoleMethod(methodName) {
    const original = console[methodName];
    if (typeof original !== 'function') {
      return;
    }

    console[methodName] = function(...args) {
      try {
        // Check all arguments for suppression patterns
        const shouldSkip = args.some(arg => {
          if (shouldSuppress(arg)) {
            return true;
          }
          // Also check string concatenation of all args
          try {
            const combined = args.map(a => String(a)).join(' ');
            return shouldSuppress(combined);
          } catch {
            return false;
          }
        });
        
        if (shouldSkip) {
          return;
        }
        original.apply(console, args);
      } catch (_error) {
        // If wrapping fails, fall back to original
        try {
          original.apply(console, args);
        } catch {
          // Ignore errors in fallback
        }
      }
    };
  }

  // Suppress specific browser extension noise across console methods
  // Wrap these BEFORE React DevTools initializes
  wrapConsoleMethod('error');
  wrapConsoleMethod('warn');
  wrapConsoleMethod('log');
  wrapConsoleMethod('info');
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    try {
      const reason = event.reason;

      // Suppress browser extension related rejections
      if (shouldSuppress(reason)) {
        event.preventDefault();
        return;
      }

      // Log other unhandled rejections
      console.warn('Unhandled promise rejection:', reason);
    } catch (_error) {
      // If handling fails, prevent default to avoid noise
      event.preventDefault();
    }
  });

  // Handle runtime errors
  window.addEventListener('error', function(event) {
    try {
      const message = event.message;

      // Suppress browser extension related errors and our own script errors
      if (shouldSuppress(message) || 
          (event.filename && event.filename.includes('extension-error-suppressor.js'))) {
        event.preventDefault();
        return;
      }

      // Log other errors
      console.error('Runtime error:', message, event.filename, event.lineno);
    } catch (_error) {
      // If handling fails, prevent default to avoid noise
      event.preventDefault();
    }
  });
  
  // Clean up any existing extension scripts
  try {
    const scripts = document.querySelectorAll('script[src*="eternl"], script[src*="yoroi"], script[src*="dapp-connector"]');
    scripts.forEach(script => {
      try {
        script.remove();
      } catch {
        // Ignore removal errors
      }
    });
  } catch {
    // Ignore cleanup errors
  }
  
})();
