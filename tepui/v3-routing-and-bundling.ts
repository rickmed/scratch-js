/**
 * File-Based Routing System with Lazy Loading & Type Safety
 *
 * Solves the bundle bloat problem of auto-discovery systems by using
 * centralized route definitions with lazy loading. Heavy route dependencies
 * only load when routes are actually hit.
 *
 * Features:
 * - Zero bundle bloat (lazy loading)
 * - Type-safe parameter extraction for basic routes
 * - Multiple components per file support
 * - Clean Comp() helper syntax
 * - Support for React components, vanilla functions, API handlers
 *
 * @example
 * ```typescript
 * const routes = createRoutes({
 *   "products/:category/:subcategory": Comp(() => import("./routes/shop.js"), "ProductListing"),
 *   "cart/:action?": Comp(() => import("./routes/shop.js"), "ShoppingCart"),
 *   "admin/users/:page?": Comp(() => import("./routes/admin.tsx"), "UserManagement"),
 * });
 *
 * const productUrl = routes.link("products/:category/:subcategory", "electronics", "phones");
 * ```
 */

// ==================================================================================
// TYPE DEFINITIONS
// ==================================================================================

/**
 * Extracts parameter names from route pattern as tuple
 * Works for basic patterns like "users/:id" or "products/:category/:subcategory"
 *
 * TypeScript limitations:
 * - Cannot distinguish optional parameters (:param?)
 * - Cannot handle wildcards (*path)
 * - Cannot handle mixed patterns
 */
type ExtractParams<T extends string> =
   T extends `${string}:${infer Param}/${infer Rest}`
      ? [Param, ...ExtractParams<Rest>]
      : T extends `${string}:${infer Param}`
      ? [Param]
      : []

/**
 * Converts parameter tuple to string array for function parameters
 */
type ParamsTuple<T extends readonly string[]> = {
   [K in keyof T]: string
}

/**
 * Route entry - can be original function format or Comp helper result
 */
type RouteEntry =
   | (() => Promise<{ default: Function }>) // Original format
   | ReturnType<typeof Comp> // Comp helper result

/**
 * Route configuration object
 */
type RouteConfig = {
   [path: string]: RouteEntry
}

/**
 * Extract route parameters for all routes in config
 */
type RouteParams<T extends RouteConfig> = {
   [K in keyof T]: ExtractParams<K & string>
}

// ==================================================================================
// COMP HELPER FUNCTION
// ==================================================================================

/**
 * Helper function to create clean component route configs
 * Eliminates verbose .then(m => ({ default: m.ComponentName })) syntax
 *
 * @param importFn - Function that returns Promise with module
 * @param componentName - Optional component name (uses default export if omitted)
 *
 * @example
 * ```typescript
 * // Named export
 * Comp(() => import("./routes/shop.js"), "ProductListing")
 *
 * // Default export
 * Comp(() => import("./routes/about.js"))
 * ```
 */
function Comp<T = any>(
   importFn: () => Promise<T>,
   componentName?: keyof T
): { import: () => Promise<T>; component?: string } {
   return {
      import: importFn,
      component: componentName as string,
   }
}

// ==================================================================================
// MAIN ROUTING SYSTEM
// ==================================================================================

/**
 * Creates a routing system with type-safe parameter extraction and lazy loading
 *
 * @param routes - Route configuration object mapping patterns to components
 * @returns Object with matchRoute and link functions
 */
function createRoutes<T extends RouteConfig>(routes: T) {
   type RouteMap = RouteParams<T>
   type RoutePaths = keyof T & string

   // ================================================================================
   // ROUTE NORMALIZATION
   // ================================================================================

   /**
    * Normalize different route config formats to standard loader format
    */
   const normalizedRoutes = Object.fromEntries(
      Object.entries(routes).map(([path, config]) => {
         if (typeof config === "function") {
            // Original format: () => Promise<{ default: Function }>
            return [path, { loader: config }]
         } else {
            // Comp helper result: { import: ..., component?: ... }
            const loader = config.component
               ? () =>
                    config
                       .import()
                       .then((module) => ({
                          default: module[config.component!],
                       }))
               : config.import
            return [path, { loader }]
         }
      })
   )

   // ================================================================================
   // ROUTE COMPILATION
   // ================================================================================

   /**
    * Compile route patterns into regex matchers with parameter extraction
    * Supports:
    * - Basic parameters: :param
    * - Optional parameters: :param?
    * - Wildcards: *param
    * - Mixed patterns: :required/*rest
    */
   function compileRoute(pattern: string) {
      let regex = pattern
      const paramNames: string[] = []
      const paramTypes: ("required" | "optional" | "wildcard")[] = []

      // Handle optional parameters :param?
      regex = regex.replace(/:([^/?]+)\?/g, (_, param) => {
         paramNames.push(param)
         paramTypes.push("optional")
         return "([^/]*)?" // Optional capture group
      })

      // Handle required parameters :param
      regex = regex.replace(/:([^/?]+)/g, (_, param) => {
         paramNames.push(param)
         paramTypes.push("required")
         return "([^/]+)" // Required capture group
      })

      // Handle wildcards *param
      regex = regex.replace(/\*([^/]*)/g, (_, param) => {
         paramNames.push(param || "rest")
         paramTypes.push("wildcard")
         return "(.*)" // Capture everything
      })

      return {
         regex: new RegExp(`^${regex}$`),
         paramNames,
         paramTypes,
      }
   }

   const compiledRoutes = Object.entries(normalizedRoutes).map(
      ([pattern, { loader }]) => ({
         pattern,
         compiled: compileRoute(pattern),
         loader,
      })
   )

   // ================================================================================
   // ROUTE MATCHING
   // ================================================================================

   /**
    * Match incoming path against compiled routes and load handler
    *
    * @param path - URL path to match (e.g., "/products/electronics/phones")
    * @returns Promise resolving to { handler, params } or null if no match
    *
    * @example
    * ```typescript
    * const match = await matchRoute("/products/electronics/phones");
    * if (match) {
    *   const result = match.handler(match.params);
    * }
    * ```
    */
   async function matchRoute(path: string) {
      for (const route of compiledRoutes) {
         const match = path.match(route.compiled.regex)
         if (match) {
            const params: any = {}

            // Extract parameters based on their types
            route.compiled.paramNames.forEach((name, i) => {
               const value = match[i + 1]
               const type = route.compiled.paramTypes[i]

               if (type === "wildcard") {
                  // *path becomes array of path segments
                  params[name] = value ? value.split("/").filter(Boolean) : []
               } else if (type === "optional") {
                  // :param? can be undefined
                  params[name] = value || undefined
               } else {
                  // :param is always string
                  params[name] = value
               }
            })

            // Load the route handler module
            const module = await route.loader()
            return { handler: module.default, params }
         }
      }
      return null
   }

   // ================================================================================
   // LINK GENERATION
   // ================================================================================

   /**
    * Generate type-safe URLs from route patterns and parameters
    *
    * TypeScript provides full type safety for basic parameter routes.
    * Advanced routes (optional params, wildcards) require manual typing.
    *
    * @param path - Route pattern (must match a key in route config)
    * @param params - Parameters in order they appear in pattern
    * @returns Generated URL string
    *
    * @example
    * ```typescript
    * // Basic routes (fully typed)
    * const userUrl = link("users/:id", "123");
    * const productUrl = link("products/:category/:subcategory", "electronics", "phones");
    *
    * // Advanced routes (manual typing needed)
    * const blogUrl = link("blog/:slug/:page?" as any, "my-post", "2");
    * const fileUrl = link("files/*path" as any, ["docs", "guide.pdf"] as any);
    * ```
    */
   function link<P extends RoutePaths>(
      path: P,
      ...params: ParamsTuple<RouteMap[P]>
   ): string {
      let result = path
      let paramIndex = 0

      // Replace optional parameters :param?
      result = result.replace(/:([^/?]+)\?/g, () => {
         const value = params[paramIndex++]
         return value !== undefined ? value : ""
      })

      // Replace required parameters :param
      result = result.replace(/:([^/?]+)/g, () => {
         return params[paramIndex++] || ""
      })

      // Replace wildcards *param
      result = result.replace(/\*[^/]*/g, () => {
         const value = params[paramIndex++] as any
         return Array.isArray(value) ? value.join("/") : value || ""
      })

      return result
   }

   // ================================================================================
   // RETURN PUBLIC API
   // ================================================================================

   return {
      matchRoute,
      link,
      // Internal for debugging
      _internal: {
         compiledRoutes,
         normalizedRoutes,
      },
   }
}

// ==================================================================================
// USAGE EXAMPLES
// ==================================================================================

/**
 * Example route configuration showing various patterns
 */
const exampleRoutes = createRoutes({
   // ================================================================================
   // BASIC ROUTES (Fully TypeScript typed)
   // ================================================================================

   // Simple routes with no parameters
   about: () => import("./routes/about.js"),
   contact: () => import("./routes/contact.js"),

   // Single parameter routes
   "users/:id": Comp(() => import("./routes/user.js"), "UserProfile"),
   "blog/:slug": Comp(() => import("./routes/blog.js"), "BlogPost"),

   // Multiple parameter routes
   "products/:category/:subcategory": Comp(
      () => import("./routes/shop.js"),
      "ProductListing"
   ),
   "admin/:section/:page": Comp(() => import("./routes/admin.js"), "AdminPage"),

   // ================================================================================
   // MULTIPLE COMPONENTS FROM SAME FILE
   // ================================================================================

   // Shop-related routes sharing heavy e-commerce dependencies
   "cart/:action?": Comp(() => import("./routes/shop.js"), "ShoppingCart"),
   "checkout/:step?": Comp(() => import("./routes/shop.js"), "CheckoutFlow"),
   "orders/:userId/:orderId?": Comp(
      () => import("./routes/shop.js"),
      "OrderHistory"
   ),

   // Admin routes sharing admin UI components
   "admin/users/:page?": Comp(
      () => import("./routes/admin.js"),
      "UserManagement"
   ),
   "admin/settings/:section?": Comp(
      () => import("./routes/admin.js"),
      "AdminSettings"
   ),
   "admin/analytics/:timeframe?": Comp(
      () => import("./routes/admin.js"),
      "AdminAnalytics"
   ),

   // ================================================================================
   // REACT COMPONENTS
   // ================================================================================

   // React components with TypeScript
   "dashboard/:widget?": Comp(
      () => import("./routes/dashboard.tsx"),
      "DashboardHome"
   ),
   "profile/:userId/edit": Comp(
      () => import("./routes/user-profile.tsx"),
      "ProfileEditor"
   ),
   "settings/:tab?": Comp(
      () => import("./routes/settings.tsx"),
      "SettingsPage"
   ),

   // ================================================================================
   // API ENDPOINTS
   // ================================================================================

   // API handlers from same file
   "api/users/:id": Comp(() => import("./routes/api.js"), "UserAPI"),
   "api/products/:category": Comp(
      () => import("./routes/api.js"),
      "ProductAPI"
   ),
   "api/orders/:userId": Comp(() => import("./routes/api.js"), "OrderAPI"),

   // ================================================================================
   // ADVANCED PATTERNS (Limited TypeScript support)
   // ================================================================================

   // Optional parameters - manual typing needed
   "blog/:slug/:page?": Comp(() => import("./routes/blog.js"), "BlogPost"),

   // Wildcards - manual typing needed
   "files/*path": Comp(() => import("./routes/file-browser.js"), "FileBrowser"),
   "docs/*sections": Comp(
      () => import("./routes/documentation.js"),
      "DocsViewer"
   ),

   // Mixed patterns - manual typing needed
   "users/:id/files/*path": Comp(
      () => import("./routes/user-files.js"),
      "UserFileBrowser"
   ),

   // Catch-all route (put last)
   "*notFound": Comp(() => import("./routes/404.js"), "NotFoundPage"),
})

// ================================================================================
// TYPE-SAFE LINK GENERATION EXAMPLES
// ================================================================================

const { link } = exampleRoutes

// ✅ Fully typed - TypeScript knows parameter requirements
const userUrl = link("users/:id", "123")
const productUrl = link(
   "products/:category/:subcategory",
   "electronics",
   "phones"
)
const adminUrl = link("admin/:section/:page", "users", "1")

// ❌ TypeScript errors - wrong parameter count
// const badUrl1 = link("users/:id"); // Missing required parameter
// const badUrl2 = link("users/:id", "123", "extra"); // Too many parameters

// ⚠️ Advanced routes need manual typing (but work at runtime)
const blogUrl = link("blog/:slug/:page?" as any, "my-post", "2")
const fileUrl = link("files/*path" as any, ["documents", "report.pdf"] as any)

// ================================================================================
// HELPER FUNCTIONS FOR ADVANCED ROUTES
// ================================================================================

/**
 * Type-safe helpers for advanced route patterns
 * Since TypeScript can't infer complex patterns, create manual helpers
 */

function blogLink(slug: string, page?: string): string {
   return link("blog/:slug/:page?" as any, slug, page as any)
}

function fileLink(path: string[]): string {
   return link("files/*path" as any, path as any)
}

function userFileLink(userId: string, path: string[]): string {
   return link("users/:id/files/*path" as any, userId, path as any)
}

// Usage with proper typing
const typedBlogUrl = blogLink("my-post", "2")
const typedFileUrl = fileLink(["docs", "guide.pdf"])
const typedUserFileUrl = userFileLink("123", ["photos", "vacation.jpg"])

// ================================================================================
// RUNTIME USAGE EXAMPLE
// ================================================================================

/**
 * Example request handler using the routing system
 */
async function handleRequest(path: string): Promise<string> {
   const match = await exampleRoutes.matchRoute(path)

   if (match) {
      try {
         // Call the matched route handler with extracted parameters
         const result = await match.handler(match.params)
         return result
      } catch (error) {
         console.error("Route handler error:", error)
         return '<div class="error">Internal Server Error</div>'
      }
   }

   // No route matched
   return '<div class="error">404 - Page Not Found</div>'
}

// Example usage:
// handleRequest("/products/electronics/phones")
// → Loads ./routes/shop.js, calls ProductListing({ category: "electronics", subcategory: "phones" })

// handleRequest("/users/123")
// → Loads ./routes/user.js, calls UserProfile({ id: "123" })

// handleRequest("/files/documents/report.pdf")
// → Loads ./routes/file-browser.js, calls FileBrowser({ path: ["documents", "report.pdf"] })

// ==================================================================================
// EXPORTS
// ==================================================================================

export {
   createRoutes,
   Comp,
   type RouteConfig,
   type RouteEntry,
   type ExtractParams,
   type ParamsTuple,
}

// ==================================================================================
// FILE STRUCTURE EXAMPLE
// ==================================================================================

/**
 * Example file structure for routes:
 *
 * routes/
 * ├── shop.js              # ProductListing, ShoppingCart, CheckoutFlow, OrderHistory
 * ├── admin.js             # UserManagement, AdminSettings, AdminAnalytics, AdminPage
 * ├── blog.js              # BlogPost, BlogEditor, BlogArchive
 * ├── user.js              # UserProfile, UserSettings
 * ├── dashboard.tsx        # DashboardHome, DashboardWidget (React)
 * ├── user-profile.tsx     # ProfileEditor, ProfileViewer (React)
 * ├── settings.tsx         # SettingsPage (React)
 * ├── api.js               # UserAPI, ProductAPI, OrderAPI
 * ├── file-browser.js      # FileBrowser, FileUploader
 * ├── documentation.js     # DocsViewer, DocsSearch
 * ├── user-files.js        # UserFileBrowser, UserFileUploader
 * ├── about.js             # About page (default export)
 * ├── contact.js           # Contact page (default export)
 * └── 404.js               # NotFoundPage (default export)
 *
 * main.js:
 * import { createRoutes, Comp } from './routing-system.js';
 *
 * const routes = createRoutes({
 *   // Heavy dependencies only load when routes are hit
 *   "products/:category/:subcategory": Comp(() => import("./routes/shop.js"), "ProductListing"),
 *   "cart/:action?": Comp(() => import("./routes/shop.js"), "ShoppingCart"),
 *   // ... more routes
 * });
 *
 * // Handle incoming requests
 * app.use(async (req, res) => {
 *   const result = await handleRequest(req.path);
 *   res.send(result);
 * });
 */
