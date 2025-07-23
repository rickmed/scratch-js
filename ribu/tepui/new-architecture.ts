
/****  Pure signals  ****/
// CON: Sometimes unperformant.
// CON: Complex implementation.

import { count } from "effect/Console";

class CounterStore {
  count = 0;

  constructor() {
    makeAutoObservable(this);
  }

  increment() {
    this.count += 1;
  }
}

const counterStore = new CounterStore();

const CounterButton = observer(() => {
  return (
    <button onClick={() => counterStore.increment()}>
      Count: {counterStore.count}
    </button>
  );
});

const Doubler = observer(() => {
  return (
    <div>
      The count times 2 is: {counterStore.count * 2}
    </div>
  );
});



/****  Pure oop imperative  ****/
// CON: button needs to be changed for all new clients (poor encapsulation).

button.onClick() {
  let newCount = me.count = count++
  this.Doubler.double(newCount)
}



/****  New architecture  ****/

function* TodoList(store: Store<TodoObj[]>) {
   const todosStore = Store<TodoObj[]>([])
   const parent = dom("ul")
   while (true) {
      // compute subscribe to all obj accesses in getFilteredTodos, unblocks when any of those changes.
      const todosToShow = yield* compute(todosStore, visibleTodos) // can optionally pass explicit dependencies so you can test function outside of a component

      diffAndUpdateList(prev, todosToShow, parent, (todo, i) =>
        ui("li",
          ui("input", { type: "checkbox", checked: todo.completed }),
          ui("span", { style: { textDecoration: todo.completed ? "line-through" : "none" } }, todo.text),
          ui("button", "x")
        )
      ))
   }
}





// If component (needs rework)
function If(condSignal, renderFn) {
  const parent = CURRENT_PARENT;

  const insertionPoint = parent.lastChild?.nextSibling || null;

  const placeholder = document.createComment('if');

  parent.insertBefore(placeholder, insertionPoint);

  // 4) Now use *that* placeholder for mounting/unmounting
  let mounted = null;
  condSignal.subscribe(show => {
    if (show && !mounted) {
      // Insert *before* the comment
      const real = renderFn();
      const node = real.dom ?? real;
      parent.insertBefore(node, placeholder);
      mounted = node;
    }
    else if (!show && mounted) {
      // Remove the real node, leave the placeholder in place
      parent.removeChild(mounted);
      mounted = null;
    }
  });
}



// Counter
function* Counter() {
  const store = Store({count: 10})

  // auto cleans sleep internal timer bc go is child of Counter.
  go(function* () {
    while (store.count >= 0) {
      yield sleep(1000)
      store.count--
    }
  })

  button(() => `Count: ${store.count}`, { onClick: () => store.count++ }) // maybe yield? what would mean? or return?
}



function _Footer(store: Store) {
  span({ class: "todo-count" }, () => {
    strong(() => numActive())
    // ui (text()) component runs lambda in signal context so it can be tracked.
    text(() => numActive() === 1 ? 'item' : 'items')
    text('left')
  })

  function numActive() {
    return store.todos.filter(t => !t.completed).length;
  }
}

type Subscription = {
  cancel: () => void;
};

type Signal<T> = {
  get: () => T;
  effect: (callback: (value: T) => void) => Subscription;
};

function text<T extends string>(signal: Signal<T>) {
  const el = document.createTextNode('');
  // append el to parent somehow

  // effectNow track accesses (runs immediately)
  const subscription = signal.effect((value: T) => {
    el.textContent = value as string
  });

  // subscription has .cancel() method
  return subscription
}

function strong<T extends string>(signal: Signal<T>) {
  const el = document.createElement('strong');
  // append el to parent somehow

  // effectNow track accesses (runs immediately)
  const subscription = signal.effect((value: T) => {
    el.textContent = value as string
  });

  // subscription has .cancel() method
  return subscription
}


const comp1Store = {
  get
}


function Comp1(store: Store, uiStore: UiStore) {

  const numActive = store.todos.filter(t => !t.completed).length
  const color = uiStore.color ? 'dark' : 'light'
  const var2 = color === "dark" ? store.name : store.age
}

// Subscriptions:
  // .todos array (.length mutation, .push, .pop, .splice, etc.)
  // each todo.completed mutation
  // uiStore.color mutation
  // store.name mutation  (if color is "dark")
  // store.age mutation  (if color is "light")

// Problem is numActive is recalculated if other unrelated signals change.
  // it should only be recalculated if it dependencies change,
  // ie, array mutation or any todo.completed

// => Let's explore valtio + mobx cached getter.

// is numActive a signal?

// if a todo.completed changes, this cache needs to be invalidated.
  // this should be pushed based.
//
function numActive(todos: Todo[]) {
  return todos.filter(t => !t.completed).length
}












function visibleTodos({ options, todos }) {
  return
    options === 'active' ? todos.filter(t => !t.completed) :
    options === 'completed' ? todos.filter(t => t.completed) :
    todos
}

// if options changed from "active" to "completed",
// filteredTodos needs to be recalculated.
//



function Comp1(store: Store, uiStore: UiStore) {

  const numActive = compute(() => store.todos.filter(t => !t.completed).length)
  const color = uiStore.color ? 'dark' : 'light'
  const var2 = color === "dark" ? store.name : store.age

  ui("div",
    text(numActive),
    text(var2),
  )
}

/*
on first run, it detects numActive is a signal,


*/

const myName = "Rick"
const inputValue = "Type here..."
const disabled = false;
const on_click = () => alert("Button clicked!");

const isDiv = 1
const dynamicClass = "class1"

function _div(_class: string, children: ReturnType<typeof ui>) {
  return ui`
    ${isDiv}, .${_class}, [
      h1 {
        text: ${myName}
      }
    ]
    }
  `
}



function ui(strings: TemplateStringsArray, ...values: unknown[]) {
  return { strings, values }
}



// string[0] = "Div { h1 { text: "
// string[1] = " } input { value: "
// string[2] = " disabled: "
// string[3] = " } button { class: "
// string[4] = " onClick: "
// string[5] = " text: "
// string[6] = " } }"



`
    input {
      value: ${inputValue}
      disabled: ${disabled}
    }
    button {
      class: "primary"
      onClick: ${on_click}
      text: "Send"
    }`



function div(opts: string) {
  `<div $`
}

div(``)