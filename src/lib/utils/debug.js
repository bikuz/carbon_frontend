/**
 * Debug utility for development purposes only
 * This module provides console logging that will be stripped out in production builds
 */

/**
 * Check if we're in development mode
 * In production builds, this will be replaced with false by the bundler
 */
const isDevelopment = import.meta.env.DEV;

/**
 * Debug logger that only works in development
 * @param {string} category - Category/tag for the log message
 * @param {...any} args - Arguments to log
 */
export function debug(category, ...args) {
  if (isDevelopment) {
    console.log(`[DEBUG:${category}]`, ...args);
  }
}

/**
 * Debug logger with timestamp
 * @param {string} category - Category/tag for the log message
 * @param {...any} args - Arguments to log
 */
export function debugTime(category, ...args) {
  if (isDevelopment) {
    const timestamp = new Date().toISOString();
    console.log(`[DEBUG:${category}] ${timestamp}`, ...args);
  }
}

/**
 * Debug logger for API calls
 * @param {string} method - HTTP method
 * @param {string} url - API endpoint
 * @param {any} data - Request/response data
 * @param {string} type - 'request' or 'response'
 */
export function debugAPI(method, url, data, type = 'request') {
  if (isDevelopment) {
    const timestamp = new Date().toISOString();
    console.group(`[DEBUG:API] ${type.toUpperCase()} ${method} ${url} - ${timestamp}`);
    console.log('Data:', data);
    console.groupEnd();
  }
}

/**
 * Debug logger for component lifecycle
 * @param {string} component - Component name
 * @param {string} lifecycle - Lifecycle event (mount, update, destroy, etc.)
 * @param {...any} args - Additional arguments
 */
export function debugComponent(component, lifecycle, ...args) {
  if (isDevelopment) {
    console.log(`[DEBUG:${component}] ${lifecycle}`, ...args);
  }
}

/**
 * Debug logger for state changes
 * @param {string} store - Store/state name
 * @param {any} oldValue - Previous value
 * @param {any} newValue - New value
 */
export function debugState(store, oldValue, newValue) {
  if (isDevelopment) {
    console.group(`[DEBUG:STATE] ${store} changed`);
    console.log('Previous:', oldValue);
    console.log('Current:', newValue);
    console.groupEnd();
  }
}

/**
 * Debug logger for performance timing
 * @param {string} label - Performance label
 * @param {number} startTime - Start time from performance.now()
 */
export function debugPerformance(label, startTime) {
  if (isDevelopment) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    console.log(`[DEBUG:PERF] ${label}: ${duration.toFixed(2)}ms`);
  }
}

/**
 * Debug logger for errors (always logs, even in production)
 * @param {string} category - Error category
 * @param {Error|string} error - Error object or message
 * @param {...any} context - Additional context
 */
export function debugError(category, error, ...context) {
  console.error(`[ERROR:${category}]`, error, ...context);
}

/**
 * Debug logger for warnings (always logs, even in production)
 * @param {string} category - Warning category
 * @param {string} message - Warning message
 * @param {...any} context - Additional context
 */
export function debugWarn(category, message, ...context) {
  console.warn(`[WARN:${category}]`, message, ...context);
}

/**
 * Conditional debug logger
 * @param {boolean} condition - Condition to check
 * @param {string} category - Category/tag for the log message
 * @param {...any} args - Arguments to log
 */
export function debugIf(condition, category, ...args) {
  if (isDevelopment && condition) {
    console.log(`[DEBUG:${category}]`, ...args);
  }
}

/**
 * Debug logger with custom styling
 * @param {string} category - Category/tag for the log message
 * @param {string} style - CSS style string
 * @param {...any} args - Arguments to log
 */
export function debugStyled(category, style, ...args) {
  if (isDevelopment) {
    console.log(`%c[DEBUG:${category}]`, style, ...args);
  }
}

/**
 * Debug logger that groups related messages
 * @param {string} groupName - Name for the console group
 * @param {Function} callback - Function containing debug calls
 */
export function debugGroup(groupName, callback) {
  if (isDevelopment) {
    console.group(`[DEBUG:GROUP] ${groupName}`);
    callback();
    console.groupEnd();
  }
}

/**
 * Debug logger for data quality checks
 * @param {string} checkType - Type of quality check
 * @param {any} data - Data being checked
 * @param {any} results - Check results
 */
export function debugQualityCheck(checkType, data, results) {
  if (isDevelopment) {
    console.group(`[DEBUG:QUALITY] ${checkType}`);
    console.log('Data:', data);
    console.log('Results:', results);
    console.groupEnd();
  }
}

/**
 * Debug logger for outlier detection
 * @param {string} method - Outlier detection method
 * @param {any} outliers - Detected outliers
 * @param {any} statistics - Statistical summary
 */
export function debugOutliers(method, outliers, statistics) {
  if (isDevelopment) {
    console.group(`[DEBUG:OUTLIERS] ${method}`);
    console.log('Outliers:', outliers);
    console.log('Statistics:', statistics);
    console.groupEnd();
  }
}

// Default export with all debug functions
export default {
  debug,
  debugTime,
  debugAPI,
  debugComponent,
  debugState,
  debugPerformance,
  debugError,
  debugWarn,
  debugIf,
  debugStyled,
  debugGroup,
  debugQualityCheck,
  debugOutliers
};
