// Schema
const CommentParams = z.object({
   commentId: z.string().optional(),
   postId: z.string().optional(),
   category: z.string().optional(),
})

// Component
function Comment() {
   const { commentId, postId, category } = params(CommentParams)

   if (!commentId && !postId) {
      return h.div({}, `Category: ${category}`)
   }

   if (!commentId) {
      return h.div({}, `Post: ${postId} in ${category}`)
   }

   return h.div({}, `Comment ${commentId} on post ${postId}`)
}

// Registration
// throws on startup if duplicate strings.
route(Comment, CommentParams)

// Usage in other components
Link(Comment, { commentId: "123", postId: "my-post" }, "View Comment")

// 1. Home page - no params
const HomeParams = z.object({})

function HomePage() {
   const {} = params(HomeParams)
   return h.div(
      { class: "home" },
      h.h1({}, "Welcome to TodoMVC"),
      h.p({}, "Organize your tasks efficiently")
   )
}

route(HomePage, HomeParams)
// URL: /homepage or just /

// 2. Todo list with optional filtering
const TodoListParams = z.object({
   filter: z.enum(["all", "active", "completed"]).optional(),
   search: z.string().optional(),
})

function TodoList() {
   const { filter, search } = params(TodoListParams)

   return h.div(
      { class: "todo-list" },
      h.h2({}, "Your Todos")
      // Filter and search logic here
   )
}

route(TodoList, TodoListParams)
// URLs:
// /todolist
// /todolist?filter=active
// /todolist?filter=completed&search=groceries

// 3. Individual todo item
const TodoItemParams = z.object({
   todoId: z.string(),
   edit: z.boolean().optional(),
})

function TodoItem() {
   const { todoId, edit } = params(TodoItemParams)

   return h.div(
      { class: "todo-item" },
      edit ? h.input({}) : h.span({}, `Todo ${todoId}`)
   )
}

route(TodoItem, TodoItemParams)
// URLs:
// /todoitem?todoId=123
// /todoitem?todoId=123&edit=true

// 4. User profile with tabs
const UserProfileParams = z.object({
   userId: z.string(),
   tab: z.enum(["profile", "settings", "todos"]).optional(),
})

function UserProfile() {
   const { userId, tab = "profile" } = params(UserProfileParams)

   return h.div(
      { class: "user-profile" },
      h.h1({}, `User ${userId}`),
      h.div({ class: `tab-${tab}` }, `${tab} content`)
   )
}

route(UserProfile, UserProfileParams)
// URLs:
// /userprofile?userId=456
// /userprofile?userId=456&tab=settings
// /userprofile?userId=456&tab=todos

// 5. Search results with pagination
const SearchResultsParams = z.object({
   query: z.string(),
   page: z.number().optional(),
   sortBy: z.enum(["relevance", "date", "title"]).optional(),
   category: z.string().optional(),
})

function SearchResults() {
   const {
      query,
      page = 1,
      sortBy = "relevance",
      category,
   } = params(SearchResultsParams)

   return h.div(
      { class: "search-results" },
      h.h2({}, `Results for "${query}"`),
      h.p({}, `Page ${page}, sorted by ${sortBy}`)
   )
}

route(SearchResults, SearchResultsParams)
// URLs:
// /searchresults?query=javascript
// /searchresults?query=javascript&page=2&sortBy=date
// /searchresults?query=javascript&category=tutorials&page=3

// 6. Complex e-commerce product page
const ProductPageParams = z.object({
   productId: z.string(),
   variant: z.string().optional(),
   color: z.string().optional(),
   size: z.string().optional(),
   reviewsPage: z.number().optional(),
})

function ProductPage() {
   const { productId, variant, color, size, reviewsPage } =
      params(ProductPageParams)

   return h.div(
      { class: "product-page" },
      h.h1({}, `Product ${productId}`),
      variant && h.span({}, `Variant: ${variant}`),
      color && h.span({}, `Color: ${color}`)
   )
}

route(ProductPage, ProductPageParams)
// URLs:
// /productpage?productId=abc123
// /productpage?productId=abc123&variant=deluxe&color=red&size=large
// /productpage?productId=abc123&reviewsPage=2

/* Route Params

Arrays: Comma-separated (tags=a,b,c)
Nested Objects: Explicit dot notation (user.name=john)
Complex Data: Force component to flatten it themselves

✅ SEO friendly (no encoded characters)
✅ Human readable
✅ Copy-pasteable
✅ Simple parsing (split on comma, split on dot)
✅ Component decides its own serialization strategy

If a component needs deeply nested state, they should either flatten it
explicitly or rethink if it belongs in the URL. Most URL-worthy state is
pretty flat anyway.

Use cases for component base URL params

Real-World Examples You're Thinking Of:
GitHub:
/repo/issues?assignee=john&milestone=v2.0&sort=updated&page=3

Issues component needs: assignee, milestone
Pagination component needs: page
Sort component needs: sort

Google Maps:
/maps?location=nyc&zoom=12&layer=traffic&sidebar=directions

Map component needs: location, zoom, layer
Sidebar component needs: sidebar state

E-commerce:
/products?category=shoes&brand=nike&price=50-200&page=2&view=grid

Filter component needs: category, brand, price
Pagination needs: page
View component needs: view

*/

// Component just declares what it needs
function BlogComponent() {
   const state = params("blog", {
      category: "tech", // string
      tags: ["js", "react"], // array → comma-separated
      "filter.price": "50-200", // nested → explicit key
      "user.id": "123", // nested → explicit key
   })
}

// ?blog.category=tech&blog.tags=js,react&blog.filter.price=50-200&blog.user.id=123

/**** Bundling *****/

// Bundling Strategy Summary
//
// File Structure:
// - One route per file: routes/comment.js → /comment route
// - Standard exports: Each route file exports component and params
// - Type generation: Framework scans all route files to generate links.d.ts
//
// Development Mode (Lazy Bundling):
// - Startup: Import all routes to generate types + route manifest, then discard modules
// - Request time: Lazy import + bundle on-demand using esbuild
// - Caching: Memory + disk cache with content hashing for cache busting
// - Hot reload: File watcher invalidates caches when routes change
//
// Production Mode (Eager Bundling):
// - Startup: Import all routes + bundle everything upfront
// - Request time: Serve pre-built cached bundles
// - Optimization: All bundles ready immediately, no request-time CPU cost
//
// Key Benefits:
// - No chicken-and-egg: Route manifest built from filesystem scan
// - Typed links: Auto-generated links.d.ts from Zod schemas
// - Cache-friendly: Content hashing for proper browser caching across deployments
// - No waterfalls: Single bundle per route includes all dependencies
// - Flexible: Lazy (dev) vs eager (prod) bundling modes
//
// Bundle Flow:
// routes/comment.js → Import for types → Bundle with deps → Cache as comment-{hash}.js → Serve
//
// The filesystem becomes your route registry, bundling happens at the right time for each
// environment, and users get fast, cacheable bundles. Simple and effective!
// File Structure Example:
// routes/comment.js -> handles "/comment"

// Your component (not important for typing, just here to show it exists)
export default function Post() {
   const { id, tab } = Route(Params)
}

// The ONLY thing we need for types: export the Zod schema object
export const Params = z.object({
   id: z.string(),
   tab: z.string().optional(),
})

// routes.js
import type { z } from "zod"

/**
 * Infer the plain TS type from a Zod schema object.
 */
type InferZod<T> = T extends z.ZodTypeAny ? z.infer<T> : never

/**
 * Given a loader like: () => import("./routes/post")
 * extract the module type, then grab its exported `Params` (a Zod object),
 * and finally infer its runtime shape as a TS type.
 */
type ParamsFromLoader<L> = L extends () => Promise<infer M> // M is the module
   ? M extends { Params: infer P } // pick exported `Params`
      ? P extends z.ZodTypeAny
         ? InferZod<P> // z.infer<typeof Params>
         : never
      : never
   : never

/**
 * The returned `links` object will have one function per route key,
 * each requiring the *inferred* params type from that module's `Params`.
 */
type LinksFor<Config extends Record<string, () => Promise<any>>> = {
   [K in keyof Config & string]: (params: ParamsFromLoader<Config[K]>) => string
}

/**
 * Minimal "router" that only builds typed link functions.
 * Note: This has *no* runtime dependency on route modules; it uses types only.
 */
export function createRoutes<Config extends Record<string, () => Promise<any>>>(
   config: Config
) {
   const links = {} as LinksFor<Config>

   // Optional tiny runtime: build a link by serializing the params.
   // (This is not relevant to typing; it just shows a plausible shape.)
   for (const [path] of Object.entries(config)) {
      const name = (
         path.startsWith("/") ? path.slice(1) : path
      ) as keyof LinksFor<Config> & string
      ;(links as any)[name] = (params: Record<string, unknown>) => {
         const usp = new URLSearchParams()
         for (const [k, v] of Object.entries(params ?? {})) {
            // naive stringification; fine for demo
            usp.set(k, String(v))
         }
         return `${path}?${usp.toString()}`
      }
   }

   return { links }
}

// Notice: we NEVER import the route modules directly here.
// We only hand createRoutes() dynamic import *functions*.
const { links } = createRoutes({
   post: () => import("./scratch2.js"), // <- your route files here
})

// ✅ Correct usage: types inferred from each module's exported `Params`.
const a = links.post({ id: "123" }) // tab optional
// Proxy maps 'post' → '/post'
