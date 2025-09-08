/*
REACTIVE STORES WITH BACKEND MUTATIONS - ARCHITECTURE SUMMARY
===========================================================

Core Concept:
- User mutates reactive entities like normal objects (user.name = 'Jane')
- Mutations automatically trigger backend persistence via extensible middleware pipelines
- Zero config for basic CRUD, extensible for complex business logic
- Manual optimistic updates for collections (localCollection.add/delete)

Key Features:
✅ Proxy-based reactive entities with automatic backend sync
✅ Express-style middleware pipelines with before/after hooks
✅ Entity-level callbacks (User.before/after('db'))
✅ Global app-level middleware (onReq, onDataReq, onDataRes, onRes)
✅ Error handling via returned Error objects (stops pipeline)
✅ Manual optimistic updates for collections
✅ Authentication at route/file-system level
✅ Authorization in entity pipelines
✅ Schema-based validation (Zod/Drizzle integration)
*/

// ============================================================================
// 1. ENTITY DEFINITION (Using Drizzle as example)
// ============================================================================

import { pgTable, serial, varchar, integer, boolean } from 'drizzle-orm/pg-core';
import { eq } from 'drizzle-orm';

// Define database schema (also provides TypeScript types)
const User = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 256 }),
  email: varchar('email', { length: 256 }),
  age: integer('age'),
  isActive: boolean('is_active').default(true)
});

const Todo = pgTable('todos', {
  id: serial('id').primaryKey(),
  text: varchar('text', { length: 512 }),
  completed: boolean('completed').default(false),
  teamId: varchar('team_id', { length: 256 }),
  userId: integer('user_id')
});

// ============================================================================
// 2. REACTIVE ENTITY CREATION
// ============================================================================

// Create reactive entity - TypeScript typed from schema
const user = User.create({
  name: 'John',
  email: 'john@example.com',
  age: 30
}); // Returns reactive proxy object

// Mutations trigger automatic backend sync
user.name = 'Jane';           // → PATCH /api/users/:id { name: 'Jane' }
user.email = 'jane@email.com'; // → PATCH /api/users/:id { email: 'jane@email.com' }

// ============================================================================
// 3. PIPELINE SYSTEM - Extensible Middleware
// ============================================================================

// Context object passed through pipeline
interface PipelineContext {
  // Mutation data
  entity: string;      // 'user'
  id: string | number; // Entity ID
  field: string;       // Field being changed
  value: any;          // New value
  previousValue?: any; // Previous value

  // Request context
  userId?: string;     // Current user ID
  currentUser?: any;   // Current user object

  // Server-only data (deleted before sending to client)
  server: {
    requestId?: string;
    startTime?: number;
    logData?: any;
    [key: symbol]: any; // For logging symbols, etc.
  };

  // Results
  result?: any;        // Database result after execution
  dbError?: Error;     // Database error if any
}

// Base pipeline - just the database execution
class MutationPipeline {
  steps: Array<{ name: string; handler: (ctx: PipelineContext) => Promise<void | Error> }> = [];

  before(stepName: string, handler: (ctx: PipelineContext) => Promise<void | Error>) {
    const index = this.steps.findIndex(step => step.name === stepName);
    this.steps.splice(index, 0, { name: `before-${stepName}`, handler });
    return this;
  }

  after(stepName: string, handler: (ctx: PipelineContext) => Promise<void | Error>) {
    const index = this.steps.findIndex(step => step.name === stepName);
    this.steps.splice(index + 1, 0, { name: `after-${stepName}`, handler });
    return this;
  }

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    for (const step of this.steps) {
      const result = await step.handler(ctx);
      if (result instanceof Error) {
        // Error returned (not thrown) - stop pipeline
        throw result;
      }
    }
    return ctx;
  }
}

// Default pipeline - just database execution
const basePipeline = new MutationPipeline();
basePipeline.steps = [
  {
    name: 'execute',
    handler: async (ctx) => {
      // Core database operation - UPDATE/INSERT/DELETE
      try {
        const { entity, id, field, value } = ctx;
        const result = await db.query(
          `UPDATE ${entity}s SET ${field} = $1 WHERE id = $2 RETURNING *`,
          [value, id]
        );
        ctx.result = result.rows[0];
      } catch (dbError) {
        ctx.dbError = dbError;
        throw dbError;
      }
    }
  }
];

// ============================================================================
// 4. ENTITY-LEVEL CALLBACKS
// ============================================================================

// Entity-specific middleware
User.before('db', async (ctx: PipelineContext) => {
  // Authorization - only edit your own profile
  if (ctx.id !== ctx.userId) {
    return new Error('Can only edit your own profile');
  }

  // Validation & transformation
  if (ctx.field === 'email') {
    ctx.value = ctx.value.toLowerCase().trim();

    // Check uniqueness
    const existing = await db.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [ctx.value, ctx.id]
    );
    if (existing.rows.length > 0) {
      return new Error('Email already taken');
    }
  }
});

User.after('db', async (ctx: PipelineContext) => {
  // Cache invalidation
  await cache.delete(`user:${ctx.id}`);

  // Side effects
  if (ctx.field === 'email') {
    await emailService.sendEmailChangeNotification(ctx.result);
  }

  // Audit logging
  await auditLog.record({
    action: 'user_updated',
    userId: ctx.userId,
    targetId: ctx.id,
    field: ctx.field,
    newValue: ctx.value
  });
});

// ============================================================================
// 5. GLOBAL APP-LEVEL MIDDLEWARE
// ============================================================================

// Global request middleware (HTTP level)
app.onReq = (ctx: PipelineContext) => {
  ctx.server.requestId = generateId();
  ctx.server.startTime = Date.now();
  ctx.server.userAgent = getUserAgent();
};

// Global data middleware (before entity processing)
app.onDataReq = (ctx: PipelineContext) => {
  // Cross-entity operations: rate limiting, global validation, etc.
  ctx.userId = getCurrentUserId();
  ctx.currentUser = getCurrentUser();

  // Rate limiting
  rateLimiter.check(ctx.userId);

  // Global audit
  ctx.server.auditId = auditLog.startTransaction({
    userId: ctx.userId,
    entity: ctx.entity,
    action: 'update'
  });
};

// Global data response middleware (after entity processing)
app.onDataRes = (ctx: PipelineContext) => {
  // Cross-entity cleanup, final audit logging
  auditLog.completeTransaction(ctx.server.auditId, {
    success: !ctx.dbError,
    result: ctx.result
  });
};

// Global response middleware (HTTP level)
app.onRes = (ctx: PipelineContext) => {
  // Timing logs
  const duration = Date.now() - ctx.server.startTime!;
  logger.info(`Request ${ctx.server.requestId} took ${duration}ms`);

  // Clean server data before sending to client
  delete ctx.server;
};

// ============================================================================
// 6. COLLECTION QUERIES & MANUAL OPTIMISTIC UPDATES
// ============================================================================

// Create reactive collections from queries
const activeUsers = query(User)
  .where(eq(User.isActive, true))
  .execute(); // Returns reactive collection, tracks dependency on 'User' entity

const teamTodos = query(Todo)
  .where(eq(Todo.teamId, 'team-a'))
  .execute();

// Manual optimistic updates for collections
const handleAddTodo = () => {
  // Create entity on server
  const newTodo = Todo.create({
    text: 'New task',
    teamId: 'team-a',
    userId: currentUser.id
  });

  // Manual optimistic update to local collection
  teamTodos.add(newTodo); // ← User sees todo immediately
  // If server fails, newTodo is removed from collection
};

const handleDeleteTodo = (todo: any) => {
  // Optimistic removal from UI
  teamTodos.delete(todo); // ← Todo disappears immediately

  // Actual server deletion
  Todo.delete(todo.id);   // ← If this fails, todo is restored to collection
};

// ============================================================================
// 7. AUTHENTICATION & AUTHORIZATION
// ============================================================================

// Authentication handled at route/file-system level
// File structure:
//   /src/pages/public/     - Always accessible (login, signup)
//   /src/pages/protected/  - Requires authentication (dashboard, profile)

// Or route config:
const routes = [
  { path: '/login', component: Login },
  { path: '/signup', component: Signup },
  {
    path: '/app',
    requiresAuth: true,
    children: [
      { path: '/dashboard', component: Dashboard },
      { path: '/profile', component: Profile }
    ]
  }
];

// Authorization happens in entity pipelines
User.before('db', (ctx: PipelineContext) => {
  // Field-level authorization
  const restrictedFields = ['role', 'isActive', 'credits'];
  if (restrictedFields.includes(ctx.field) && !ctx.currentUser?.isAdmin) {
    return new Error('Admin privileges required');
  }

  // Resource ownership
  if (ctx.id !== ctx.userId && !ctx.currentUser?.isAdmin) {
    return new Error('Can only modify your own data');
  }
});

// ============================================================================
// 8. ERROR HANDLING & BATCHING (Implementation Later)
// ============================================================================

// Error handling: Return (don't throw) Error objects to stop pipeline
User.before('db', (ctx: PipelineContext) => {
  if (!isValidEmail(ctx.value)) {
    return new ValidationError('Invalid email format'); // Stops pipeline
  }
  // Return nothing to continue
});

// Batching: Group multiple mutations in single transaction
const batch = createBatch();
batch.queue(() => user.name = 'Jane');
batch.queue(() => user.email = 'jane@example.com');
batch.queue(() => userProfile.bio = 'Updated bio');
await batch.execute(); // All succeed or all fail

// ============================================================================
// 9. EXECUTION ORDER SUMMARY
// ============================================================================

/*
When user.name = 'Jane' is executed:

1. app.onReq(ctx)              - HTTP request setup
2. app.onDataReq(ctx)          - Cross-entity data operations
3. User.before('db', ctx)      - Entity-specific pre-processing
4. Pipeline 'execute' step     - Actual database UPDATE
5. User.after('db', ctx)       - Entity-specific post-processing
6. app.onDataRes(ctx)          - Cross-entity data cleanup
7. app.onRes(ctx)              - HTTP response cleanup

Context flows through all steps, with server data cleaned before client response.
Any step can return Error to stop pipeline and trigger rollback.
*/

// ============================================================================
// 10. TYPE SAFETY & SCHEMA INTEGRATION
// ============================================================================

// TypeScript prevents invalid field access
// user.nonExistentField = 'value'; // ❌ Compile error

// Runtime validation via schema
// user.age = 'not a number';        // ❌ Runtime error (Zod/Drizzle validation)

// Database constraints as final safety net
// user.email = null;                // ❌ Database constraint violation

/*
KEY INSIGHTS:
- Database execution is the immutable core, everything else is extensible
- Clear separation: routes handle authentication, pipelines handle authorization
- Manual optimistic updates give precise control over UI behavior
- Express-style middleware but for data mutations instead of HTTP requests
- Schema provides TypeScript types + runtime validation + database constraints
- Error objects (not exceptions) allow graceful pipeline stopping
*/