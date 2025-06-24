/**
 * Debug logging utility with call stack tracking and configurable output
 

# Example usage:

// Create a logger instance
const debug = new DebugLogger({
  debugMode: true, // Enable/disable debug logging
  prefix: '[MyApp]' // Custom prefix for log messages
});

// Usage examples
function someFunction() {
  debug.log('This is a debug message');
  
  try {
    // Some code that might throw
    throw new Error('Something went wrong');
  } catch (error) {
    debug.error('An error occurred', error);
  }
  
  debug.warn('This is a warning message');
}

// Output examples:
// [MyApp] [someFunction @ script.js:5] This is a debug message
// [MyApp] [someFunction @ script.js:11] An error occurred: Error: Something went wrong
// [MyApp] [someFunction @ script.js:14] This is a warning message

# To Use
// CommonJS (Node.js)
const DebugLogger = require('./debug-logger');

// ES Modules
import DebugLogger from './debug-logger';

// Browser (global)
const debug = new window.DebugLogger();

*/


class DebugLogger {
  constructor(options = {}) {
    this.settings = {
      debugMode: options.debugMode || false,
      prefix: options.prefix || '[Debug]',
      ...options
    };
  }

  getCallerInfo() {
    try {
      const error = new Error();
      const stackLines = error.stack.split('\n');
      
      // Find the first relevant stack frame (skip Error, getCallerInfo, and log methods)
      for (let i = 3; i < stackLines.length; i++) {
        const line = stackLines[i].trim();
        
        // Enhanced patterns with better function name extraction
        const patterns = [
          // Named function with file info
          {
            pattern: /at ([^(]+) \((.+?):(\d+):(\d+)\)/,
            extract: (match) => ({
              func: match[1].split('.').pop().trim(),
              file: match[2],
              line: match[3]
            })
          },
          // Anonymous function or method with file info
          {
            pattern: /at (.+?):(\d+):(\d+)/,
            extract: (match) => ({
              func: 'anonymous',
              file: match[1],
              line: match[2]
            })
          },
          // Function call without line info
          {
            pattern: /at ([^(]+) \((.+)\)/,
            extract: (match) => ({
              func: match[1].split('.').pop().trim(),
              file: match[2],
              line: '?'
            })
          }
        ];

        for (const { pattern, extract } of patterns) {
          const match = line.match(pattern);
          if (match) {
            const { func, file, line } = extract(match);
            const shortFile = file.split('/').pop().split('\\').pop();
            const cleanName = func
              .replace('async ', '')
              .replace('(anonymous)', 'anonymous')
              .replace(/^Function$/, 'anonymous')
              .replace(/^Object\./, '')
              .trim();
            
            return `[${cleanName} @ ${shortFile}:${line}]`;
          }
        }

        // If no patterns match but we have a line, try to extract something useful
        const fallbackMatch = line.match(/at (.+)/);
        if (fallbackMatch) {
          const cleanName = fallbackMatch[1]
            .split(' ')[0]
            .split('.').pop()
            .replace('async ', '')
            .replace(/[(<].*/, '')
            .trim();
          return `[${cleanName}]`;
        }
      }
    } catch (error) {
      console.error('Error in getCallerInfo:', error);
    }
    return '[unknown]';
  }

  log(message, ...args) {
    if (this.settings.debugMode) {
      const callerInfo = this.getCallerInfo();
      console.log(`${this.settings.prefix} ${callerInfo} ${message}`, ...args);
    }
  }

  error(message, error, ...args) {
    if (this.settings.debugMode) {
      const callerInfo = this.getCallerInfo();
      console.error(`${this.settings.prefix} ${callerInfo} ${message}:`, error, ...args);
    }
  }

  warn(message, ...args) {
    if (this.settings.debugMode) {
      const callerInfo = this.getCallerInfo();
      console.warn(`${this.settings.prefix} ${callerInfo} ${message}`, ...args);
    }
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DebugLogger;
} else if (typeof define === 'function' && define.amd) {
  define([], () => DebugLogger);
} else {
  window.DebugLogger = DebugLogger;
}