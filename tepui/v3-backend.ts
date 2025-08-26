/*
REACTIVE STORES WITH AUTOMATIC BACKEND MUTATIONS
===============================================

Core Concept:
- User mutates reactive stores (proxy objects) like normal JS objects
- Mutations automatically trigger backend persistence via extensible pipelines
- Zero configuration for basic CRUD, extensible for complex business logic

Architecture Overview:
1. Proxy POJOs - Simple field updates (user.name = 'Jane')
2. Collection Objects - Set-like arrays for typed entities (todos.add(newTodo))
3. Mutation Pipelines - Extensible before/after hooks around database calls
4. Default Postgres handlers with override capability

Benefits:
- Rails-like automatic persistence without Rails ceremony (no find+update)
- Express-like explicit pipelines but with extension points
- Frontend feels like local mutations, backend gets full control
*/

// ============================================================================
// 1. USER API - Simple mutations trigger automatic backend sync
// ============================================================================

// Proxy POJOs for simple field updates
const user = createEntity('user', {
  name: 'John',
  email: 'john@example.com',
  profile: { bio: 'Developer', settings: { theme: 'dark' } }
});

// Just mutate - everything else automatic
user.name = 'Jane';                          // → PATCH /api/user { name: 'Jane' }
user.profile.bio = 'Designer';               // → PATCH /api/user { profile: { bio: 'Designer' } }
user.profile.settings.theme = 'light';       // → Deep path updates

// Collection objects for typed entities
const todos = createCollection('todo', TodoSchema);
todos.add({ text: 'Buy milk', completed: false });  // → POST /api/todos
todos.delete(todoId);                                // → DELETE /api/todos/:id
todos[0].completed = true;                           // → PATCH /api/todos/1 { completed: true }

// ============================================================================
// 2. MUTATION PIPELINE SYSTEM - Extensible before/after hooks
// ============================================================================

class MutationPipeline {
  constructor(steps = []) {
    this.steps = [...steps];
  }

  before(stepName, newStep) {
    const index = this.findStep(stepName);
    this.steps.splice(index, 0, newStep);
    return this;
  }

  after(stepName, newStep) {
    const index = this.findStep(stepName);
    this.steps.splice(index + 1, 0, newStep);
    return this;
  }

  replace(stepName, newStep) {
    const index = this.findStep(stepName);
    this.steps[index] = newStep;
    return this;
  }

  remove(stepName) {
    this.steps = this.steps.filter(step => step.name !== stepName);
    return this;
  }

  async execute(context) {
    for (const step of this.steps) {
      await step(context);
    }
    return context;
  }

  findStep(name) {
    return this.steps.findIndex(step => step.name === name);
  }
}

// ============================================================================
// 3. DEFAULT PIPELINE - Base behavior for all entities
// ============================================================================

// Every entity gets this base pipeline
const basePipeline = new MutationPipeline([
  'authorize',        // Check permissions, rate limiting
  'validate',         // App-level business rules
  'updateDatabase',   // Core DB call with native DB validations/constraints
  'sideEffects'       // Cache invalidation, notifications, analytics
]);

// Default Postgres handlers
const defaultHandlers = {
  authorize: async (context) => {
    // Basic permission check
    if (!context.userId) throw new Error('Unauthorized');
  },

  validate: async (context) => {
    // Basic validation - entities can override
    if (!context.data) throw new Error('No data provided');
  },

  updateDatabase: async (context) => {
    // This is the immutable core - always runs with DB constraints
    try {
      const { table, id, data } = context;
      const columns = Object.keys(data).join(', ');
      const placeholders = Object.keys(data).map((_, i) => `$${i + 2}`).join(', ');
      const values = Object.values(data);

      const result = await db.query(
        `UPDATE ${table} SET (${columns}) = (${placeholders}) WHERE id = $1 RETURNING *`,
        [id, ...values]
      );

      context.result = result.rows[0];
    } catch (dbError) {
      // DB constraint violations, foreign key errors, etc.
      context.dbError = dbError;
      throw dbError;
    }
  },

  sideEffects: async (context) => {
    // Default: just log the change
    console.log(`Updated ${context.table}:${context.id}`);
  }
};

// ============================================================================
// 4. ENTITY-SPECIFIC CUSTOMIZATION - Extend default behavior
// ============================================================================

// User-specific pipeline with business logic
const userPipeline = basePipeline
  .before('validate', async (context) => {
    // Normalize email before validation
    if (context.data.email) {
      context.data.email = context.data.email.toLowerCase().trim();
    }
  })
  .before('validate', async (context) => {
    // Check email uniqueness at app level
    if (context.data.email) {
      const existing = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2',
        [context.data.email, context.id]);
      if (existing.rows.length > 0) {
        throw new Error('Email already taken');
      }
    }
  })
  .after('updateDatabase', async (context) => {
    // Invalidate user cache
    await cache.delete(`user:${context.id}`);
  })
  .after('updateDatabase', async (context) => {
    // Send email change notification
    if (context.data.email && context.result.email !== context.originalUser.email) {
      await emailService.sendEmailChangeNotification(context.result);
    }
  });

// Post-specific pipeline
const postPipeline = basePipeline
  .before('validate', async (context) => {
    // Sanitize content
    if (context.data.content) {
      context.data.content = sanitizeHTML(context.data.content);
    }
  })
  .after('updateDatabase', async (context) => {
    // Update search index
    await searchService.indexPost(context.result);
  })
  .replace('sideEffects', async (context) => {
    // Custom side effects for posts
    await notifyFollowers(context.result.authorId);
    await updateUserPostCount(context.result.authorId);
    await analytics.track('post_updated', context.result.id);
  });

// ============================================================================
// 5. SYSTEM INTEGRATION - Wire everything together
// ============================================================================

const pipelines = {
  user: userPipeline,
  post: postPipeline,
  // Default to base pipeline for other entities
  default: basePipeline
};

// Main mutation handler called by proxy interceptor
async function handleMutation(entityType, id, field, value) {
  const pipeline = pipelines[entityType] || pipelines.default;

  const context = {
    entityType,
    table: entityType + 's', // Simple pluralization
    id,
    field,
    value,
    data: { [field]: value },
    userId: getCurrentUserId(), // From auth context
    timestamp: new Date()
  };

  try {
    await pipeline.execute(context);
    return context.result;
  } catch (error) {
    // Handle rollback, error formatting, etc.
    throw new UserFriendlyError(formatError(error));
  }
}

// ============================================================================
// 6. PROXY IMPLEMENTATION - Transparent mutations
// ============================================================================

function createEntity(entityType, initialData) {
  const store = reactive(initialData); // Your reactive store

  return new Proxy(store, {
    set(target, property, value) {
      // Optimistic local update
      target[property] = value;

      // Trigger backend mutation pipeline
      handleMutation(entityType, target.id, property, value)
        .catch(error => {
          // Rollback on failure
          delete target[property]; // or revert to previous value
          throw error;
        });

      return true;
    }
  });
}

// ============================================================================
// 7. ADVANCED FEATURES - Filtered views, batch operations, etc.
// ============================================================================

// Filtered reactive views
const activeTodos = createCollection('todo', TodoSchema, {
  filter: { completed: false },

  // Custom pipeline for filtered views
  pipeline: basePipeline
    .after('updateDatabase', async (context) => {
      // Handle item disappearing from filtered view
      if (context.field === 'completed' && context.value === true) {
        showNotification('Todo completed!');
        // Item automatically removed from activeTodos due to filter
      }
    })
});

// Batch operations
const batchMutation = createBatch();
batchMutation.queue(() => user.name = 'Jane');
batchMutation.queue(() => user.email = 'jane@example.com');
batchMutation.queue(() => todos.add(newTodo));
await batchMutation.execute(); // Single transaction

/*
KEY INSIGHTS FROM CONVERSATION:
- Eliminates Rails find+update ceremony while keeping Rails-like callbacks
- More explicit than Rails but more automatic than Express
- Database constraints are immutable core, everything else is extensible
- Filtered views and optimistic updates handle complex UI scenarios
- Pipeline pattern allows surgical customization without losing base functionality
*/