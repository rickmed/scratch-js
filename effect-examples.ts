import { Effect, Console, pipe, Either, Option } from "effect";

/**
 * Effect.js Error Handling Examples
 * Based on documentation from https://effect.website/docs/
 */

// ==========================================
// Example 1: Basic Error Handling
// ==========================================

// Define a custom error type
class DatabaseError extends Error {
   constructor(message: string) {
      super(message);
      this.name = "DatabaseError";
   }
}

// Function that might fail with a specific error type
const getUserById = (id: number): Effect.Effect<string, DatabaseError> => {
   if (id <= 0) {
      return Effect.fail(new DatabaseError(`Invalid user ID: ${id}`));
   }

   return Effect.succeed(`User ${id}`);
};

// Using the function with proper error handling
const handleUserLookup = (): Effect.Effect<string, never> => {
   return pipe(
      getUserById(-1),
      // Handle the specific error and recover with a default value
      Effect.catchAll(error => {
         return Effect.succeed(`Error occurred: ${error.message}`);
      }),
      // Log the result
      Effect.tap(result => Console.log(`Result: ${result}`))
   );
};

// Run the effect
// Effect.runSync(handleUserLookup());

// ==========================================
// Example 2: Error Matching
// ==========================================

// Define multiple error types
class NotFoundError extends Error {
   constructor(message: string) {
      super(message);
      this.name = "NotFoundError";
   }
}

class ValidationError extends Error {
   constructor(message: string) {
      super(message);
      this.name = "ValidationError";
   }
}

class NetworkError extends Error {
   constructor(message: string) {
      super(message);
      this.name = "NetworkError";
   }
}

// Function that might fail with different error types
const fetchData = (id: string): Effect.Effect<string, NotFoundError | ValidationError | NetworkError> => {
   if (id === "") {
      return Effect.fail(new ValidationError("ID cannot be empty"));
   }

   if (id === "404") {
      return Effect.fail(new NotFoundError("Resource not found"));
   }

   if (id === "network") {
      return Effect.fail(new NetworkError("Network connection failed"));
   }

   return Effect.succeed(`Data for ID: ${id}`);
};

// Using error matching to handle different error types differently
const handleFetchWithMatching = (id: string): Effect.Effect<string, never> => {
   return pipe(
      fetchData(id),
      Effect.catchTags({
         NotFoundError: (error) => Effect.succeed(`Not found: ${error.message}`),
         ValidationError: (error) => Effect.succeed(`Invalid input: ${error.message}`),
         NetworkError: (error) => Effect.succeed(`Network issue: ${error.message}`)
      })
   );
};

// ==========================================
// Example 3: Retrying on Failure
// ==========================================

// Simulate an unreliable API call
const unreliableApiCall = (): Effect.Effect<string, Error> => {
   // Randomly fail 70% of the time
   const shouldFail = Math.random() < 0.7;

   if (shouldFail) {
      return Effect.fail(new Error("API call failed"));
   }

   return Effect.succeed("API call succeeded");
};

// Retry the API call with exponential backoff
const retryApiCall = (): Effect.Effect<string, Error> => {
   return pipe(
      unreliableApiCall(),
      // Retry up to 5 times with exponential backoff
      Effect.retry({
         times: 5,
         schedule: Effect.Schedule.exponential("100 millis")
      })
   );
};

// ==========================================
// Example 4: Timeout Handling
// ==========================================

// Simulate a slow operation
const slowOperation = (): Effect.Effect<string, never> => {
   return pipe(
      Effect.promise(() => new Promise<string>(resolve => {
         setTimeout(() => resolve("Operation completed"), 5000);
      }))
   );
};

// Add a timeout to the slow operation
const timeoutOperation = (): Effect.Effect<string, Error> => {
   return pipe(
      slowOperation(),
      Effect.timeout("2 seconds"),
      Effect.catchTag("TimeoutException", () => Effect.succeed("Operation timed out"))
   );
};

// ==========================================
// Example 5: Fallback Values
// ==========================================

// Function that might fail
const riskyOperation = (input: number): Effect.Effect<string, Error> => {
   if (input > 10) {
      return Effect.fail(new Error("Input too large"));
   }

   return Effect.succeed(`Processed input: ${input}`);
};

// Using fallback (orElse) to provide a default value
const withFallback = (input: number): Effect.Effect<string, never> => {
   return pipe(
      riskyOperation(input),
      Effect.orElse(() => Effect.succeed("Using default value"))
   );
};

// ==========================================
// Example 6: Error Accumulation
// ==========================================

// Validate a user object with multiple potential errors
interface UserData {
   name: string;
   email: string;
   age: number;
}

const validateName = (name: string): Effect.Effect<string, Error> => {
   return name.length > 0
      ? Effect.succeed(name)
      : Effect.fail(new Error("Name cannot be empty"));
};

const validateEmail = (email: string): Effect.Effect<string, Error> => {
   return email.includes("@")
      ? Effect.succeed(email)
      : Effect.fail(new Error("Invalid email format"));
};

const validateAge = (age: number): Effect.Effect<number, Error> => {
   return age >= 18
      ? Effect.succeed(age)
      : Effect.fail(new Error("Must be at least 18 years old"));
};

// Validate all fields and accumulate errors
const validateUser = (user: UserData): Effect.Effect<UserData, Error[]> => {
   return Effect.all([
      validateName(user.name),
      validateEmail(user.email),
      validateAge(user.age)
   ], { concurrency: "unbounded", mode: "validate" })
      .pipe(Effect.map(([name, email, age]) => ({ name, email, age })));
};

// ==========================================
// Example 7: Try/Catch Wrapper
// ==========================================

// Wrap a function that might throw an exception
const parseJSON = (input: string): Effect.Effect<any, Error> => {
   return Effect.try({
      try: () => JSON.parse(input),
      catch: (error) => new Error(`Failed to parse JSON: ${String(error)}`)
   });
};

// ==========================================
// Example 8: Async Error Handling
// ==========================================

// Wrap a Promise-based API that might reject
const fetchUserData = (userId: string): Effect.Effect<any, Error> => {
   return Effect.tryPromise({
      try: () => fetch(`https://api.example.com/users/${userId}`)
         .then(response => {
            if (!response.ok) {
               throw new Error(`HTTP error: ${response.status}`);
            }
            return response.json();
         }),
      catch: (error) => new Error(`API request failed: ${String(error)}`)
   });
};

// ==========================================
// Example 9: Running Effects and Handling Errors
// ==========================================

// Example of running an effect and handling the result
const runExample = () => {
   // Run the effect and get an Either result
   const result = Effect.runSync(Effect.either(getUserById(-1)));

   // Handle the Either result
   if (Either.isLeft(result)) {
      console.error("Error:", result.left.message);
   } else {
      console.log("Success:", result.right);
   }

   // Alternative using pattern matching
   Either.match(result, {
      onLeft: (error) => console.error("Error:", error.message),
      onRight: (value) => console.log("Success:", value)
   });
};

// ==========================================
// Example 10: Optional Values with Option
// ==========================================

// Function that returns an Option
const findUser = (id: number): Effect.Effect<Option.Option<string>, never> => {
   if (id <= 0) {
      return Effect.succeed(Option.none());
   }

   return Effect.succeed(Option.some(`User ${id}`));
};

// Handle the Option result
const handleOptionalUser = (id: number): Effect.Effect<string, never> => {
   return pipe(
      findUser(id),
      Effect.map(optionUser =>
         Option.getOrElse(optionUser, () => "User not found")
      )
   );
};

// Export examples for demonstration
export {
   handleUserLookup,
   handleFetchWithMatching,
   retryApiCall,
   timeoutOperation,
   withFallback,
   validateUser,
   parseJSON,
   fetchUserData,
   runExample,
   handleOptionalUser
};