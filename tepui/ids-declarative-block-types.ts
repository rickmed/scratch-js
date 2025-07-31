
// Type utilities to extract id attributes from HTML strings (your original)
type ExtractIds<T extends string> =
   T extends `${infer Before}id="${infer Id}"${infer After}`
   ? Id | ExtractIds<After>
   : never;

// Convert union of strings to object type with HTMLElement properties (your original)
type IdsToObject<T extends string> = {
   [K in T]: HTMLElement;
} & {
   el: HTMLElement;
   update: (fn: () => void) => void;
};

// Simpler duplicate detection: split the string and check if any ID appears twice
type SplitOnId<S extends string> = S extends `${infer Before}id="${infer Id}"${infer After}`
   ? [Id, ...SplitOnId<After>]
   : [];

// Check if a tuple has any duplicate values
type HasDuplicatesInTuple<T extends readonly string[], Seen extends string = never> =
   T extends readonly [infer First extends string, ...infer Rest extends readonly string[]]
   ? First extends Seen
   ? true
   : HasDuplicatesInTuple<Rest, Seen | First>
   : false;

// Check for duplicate IDs by converting to tuple and checking for duplicates
type HasDuplicateIds<S extends string> = HasDuplicatesInTuple<SplitOnId<S>>;

// Create a helpful error type that shows which IDs are duplicated
type FindDuplicates<T extends readonly string[], Seen extends string = never, Duplicates extends string = never> =
   T extends readonly [infer First extends string, ...infer Rest extends readonly string[]]
   ? First extends Seen
   ? FindDuplicates<Rest, Seen, Duplicates | First>
   : FindDuplicates<Rest, Seen | First, Duplicates>
   : Duplicates;

// Create a helpful error message that shows in the type error
type DuplicateIdError<S extends string, Duplicates extends string = FindDuplicates<SplitOnId<S>>> =
   `❌ DUPLICATE IDs FOUND: [${Duplicates}] - All id attributes must be unique in HTML string`;

// Parameter constraint that shows helpful error for invalid HTML
type ValidHtml<T extends string> = HasDuplicateIds<T> extends true
   ? DuplicateIdError<T>
   : T;

// Render function with helpful error messages in parameter
function render<T extends string>(
   html: ValidHtml<T>
): HasDuplicateIds<T> extends true
   ? never
   : IdsToObject<ExtractIds<T>> {

   // Create DOM element
   const wrapper = document.createElement("div");
   wrapper.innerHTML = html;
   const el = wrapper.firstElementChild as HTMLElement;

   // Extract all elements with IDs
   const idElements: Record<string, HTMLElement> = {};
   const elementsWithIds = el.querySelectorAll("[id]");
   elementsWithIds.forEach((element) => {
      const id = element.getAttribute("id");
      if (id) {
         idElements[id] = element as HTMLElement;
      }
   });

   // Effect system for reactive updates
   const effects: (() => void)[] = [];
   const effect = (fn: () => void) => {
      effects.push(fn);
      fn(); // Run immediately
   };

   // Return object with type-safe ID access
   return {
      ...idElements,
      el,
      update: effect,
   } as any;
}

// Test cases
interface Todo {
   id: number;
   text: string;
   completed: boolean;
}

// ✅ This works - unique IDs
const validHtml = `
	<div>
		<span id="count">0</span>
		<button id="increment">+</button>
		<button id="decrement">-</button>
	</div>
` as const;

const validResult = render(validHtml);
validResult.count, validResult.increment, validResult.decrement

// ❌ This fails at compile time - duplicate IDs
const invalidHtml = `
	<div>
		<span id="count">0</span>
		<button id="count">+</button>
		<button id="decrement">-</button>
	</div>
` as const;

// Uncommenting this will cause a TypeScript error:
const invalidResult = render(invalidHtml)

function Footer(todos: Todo[]) {
   const part = render(`
      <footer class="footer">
         <span class="todo-count">
            <strong id="activeCount"></strong> item<span id="suffix"></span> left
         </span>
         <ul id="filters">
            ${filterLink("Active")}
            ${filterLink("Completed")}
            ${filterLink("All")}
         </ul>
         <button class="clear-completed" id="clearBtn">Clear completed</button>
      </footer>
   `)

   part.update(() => {
      const count = todos.filter((t) => !t.completed).length.toString()
      part.activeCount.textContent = count
      part.suffix.textContent = count === "1" ? "" : "s"
   })
}

function filterLink(filter: string) {
   return `<li><a href="#/${filter.toLowerCase()}">${filter}</a></li>`;
}
