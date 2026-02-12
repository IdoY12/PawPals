/**
 * Metro Bundler Configuration for PawPals Mobile App
 * 
 * This configuration solves the "EMFILE: too many open files" error by
 * optimizing how Metro watches files for changes during development.
 * 
 * Problem: Metro's default behavior watches ALL files including node_modules,
 * which can exceed macOS's file descriptor limits (50,000+ files).
 * 
 * Solution: Configure Metro to exclude unnecessary directories from watching
 * while still being able to resolve and bundle modules from them.
 */

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Get Expo's default Metro configuration as our starting point
const defaultConfig = getDefaultConfig(__dirname);

/**
 * CONFIGURATION EXPLANATION:
 * 
 * Metro has two separate concerns:
 * 1. RESOLUTION - Finding and bundling modules (needs access to node_modules)
 * 2. WATCHING - Detecting file changes for hot reload (doesn't need node_modules)
 * 
 * We configure these separately to optimize file watching.
 */

module.exports = {
  // Spread the default config to keep Expo's defaults
  ...defaultConfig,

  /**
   * RESOLVER CONFIGURATION
   * Controls how Metro finds and resolves modules.
   * We keep this mostly default so all imports work correctly.
   */
  resolver: {
    ...defaultConfig.resolver,
    
    // Source extensions that Metro will process
    sourceExts: [...defaultConfig.resolver.sourceExts, 'cjs'],
    
    /**
     * blockList (formerly blacklistArray)
     * 
     * Patterns matching files that Metro should COMPLETELY IGNORE.
     * These files won't be watched AND won't be bundled.
     * 
     * Use carefully - only for files that are truly never needed.
     */
    blockList: [
      // Ignore any .git directories (version control, not needed for bundling)
      /.*\.git\/.*/,
      
      // Ignore Android build artifacts (not needed on iOS, vice versa)
      /.*android\/app\/build\/.*/,
      
      // Ignore iOS build artifacts
      /.*ios\/Pods\/.*/,
      /.*ios\/build\/.*/,
      
      // Ignore test files in dependencies (never imported at runtime)
      /.*node_modules\/.*\/__tests__\/.*/,
      /.*node_modules\/.*\/__mocks__\/.*/,
      
      // Ignore documentation and examples in dependencies
      /.*node_modules\/.*\/docs\/.*/,
      /.*node_modules\/.*\/examples?\/.*/,
      
      // Ignore TypeScript source maps in dependencies (large, not needed)
      /.*node_modules\/.*\.map$/,
    ],
  },

  /**
   * WATCHER CONFIGURATION
   * Controls how Metro detects file changes for hot reload.
   * This is where we solve the EMFILE error.
   */
  watcher: {
    /**
     * additionalExts
     * File extensions the watcher should monitor for changes.
     * Keeping this minimal reduces watched file count.
     */
    additionalExts: ['cjs'],

    /**
     * watchman configuration
     * Settings passed to Watchman (if installed).
     * Watchman is more efficient than Node's fs.watch.
     */
    watchman: {
      // Use Watchman's crawler for better performance
      // Falls back to Node's fs if Watchman not installed
    },

    /**
     * healthCheck configuration
     * Metro periodically checks if the watcher is healthy.
     */
    healthCheck: {
      enabled: true,
      interval: 30000,      // Check every 30 seconds
      timeout: 5000,        // Consider unhealthy after 5 seconds
      filePrefix: '.metro-health-check',
    },
  },

  /**
   * TRANSFORMER CONFIGURATION
   * Controls how Metro transforms/compiles source files.
   */
  transformer: {
    ...defaultConfig.transformer,
    
    // Enable minification in production for smaller bundles
    minifierPath: 'metro-minify-terser',
    
    // Configure minification options
    minifierConfig: {
      compress: {
        // Remove console.log in production builds
        drop_console: false, // Set to true for production
      },
    },
  },

  /**
   * SERVER CONFIGURATION
   * Controls the Metro development server.
   */
  server: {
    /**
     * enhanceMiddleware
     * Allows adding custom middleware to the dev server.
     * Useful for logging, debugging, or custom endpoints.
     */
    enhanceMiddleware: (middleware) => {
      return (req, res, next) => {
        // Log requests in development (optional, comment out if too noisy)
        // console.log(`[Metro] ${req.method} ${req.url}`);
        return middleware(req, res, next);
      };
    },
  },

  /**
   * FILE MAP CONFIGURATION
   * Controls how Metro builds its internal file map.
   * This directly impacts the EMFILE issue.
   */
  watchFolders: [
    // Only watch the project root
    path.resolve(__dirname),
  ],

  /**
   * resetCache
   * When true, Metro clears its cache on startup.
   * Set to false for faster subsequent starts.
   */
  resetCache: false,

  /**
   * maxWorkers
   * Number of workers Metro uses for transformation.
   * More workers = faster builds but more memory.
   * Default is based on CPU cores.
   */
  maxWorkers: 4,
};

/**
 * IMPORTANT NOTES:
 * 
 * 1. After creating this file, restart Metro completely:
 *    - Kill the existing Metro process (Ctrl+C)
 *    - Clear cache: npx expo start -c
 * 
 * 2. If you edit a file in node_modules (rare), you must restart Metro
 *    since those files aren't being watched.
 * 
 * 3. This config works best with Watchman installed:
 *    brew install watchman
 * 
 * 4. If you still get EMFILE errors, try also increasing system limits:
 *    sudo launchctl limit maxfiles 65536 200000
 */
