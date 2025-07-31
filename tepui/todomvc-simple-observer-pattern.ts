/*
=> For component (diffing array values like solid/svelte) is a good default.
   - Let's see how this would work.
   - yield* on store changes (resource sub/unsub)
      - Then you can show a more efficient way in list by manual add/remove.
         using select.
   - IMPLEMENTATION:
      - store updates are broadcast channels (already in ribu).
      - => Event Handling:
         - OPTION 1: Components yield back events like turbine.
         - OPTION 2: pass event handling function to component.
            PRO: easier for ui() functions to ignore in SSR.
            CON: how to make them children of parents? ie, what happens it they throw?
               Also, how to make parents block?
*/

// => WHAT IS A COMPONENT?
   // I think it's a job-thingy.
   // It must have
      // .cancel() to remove resources (including removing from DOM).
      // yield* (to know when it finishes????).
         // Do all UI element finish?
         // Let's say static components like <div>Hi</div>
   // Abstract list into For component

// Do static components finish?


// Parents should .cancel() .removeFromDOM() children instead them doing it themselves.





function ui(componentOrTag, props, ...children) {
  const ctx = { currDomElem: null };

  if (typeof componentOrTag === 'function') {
    // Generate the element (e.g., `div`, `header`)
    const el = dom('div');  // Default to `div` or the component can define the tag type

    // Run the generator and get the job (component function)
    const job = go(componentOrTag({ ...props, ctx }));

    // Add the children (if any) to the element
    children.forEach(child => {
      const childEl = ui(child);
      el.appendChild(childEl.el);  // Append child's DOM element to parent `el`
    });

    // Return the job and the element
    return { job, el };
  }

  // For regular HTML elements like 'div', 'header', etc.
  const el = document.createElement(componentOrTag);
  children.forEach(child => {
    const childEl = ui(child);
    el.appendChild(childEl.el);  // Append the child's DOM element
  });

  return { job: null, el };  // Return the element with `job: null` for regular tags
}


type Scn = { job: Job | null; el: HTMLElement };

/* For() Usage

ui("div",
  ui("header"),
  For("ul", store, (todo, i) =>
    ui("li",
      ui("input", { type: "checkbox", checked: todo.completed }),
      ui("span", { style: { textDecoration: todo.completed ? "line-through" : "none" } }, todo.text),
      ui("button", "x")
    )
  ),
  ui("footer")
)
*/

function For<T>(
  tagName: string,
  store: Store<T[]>,
  mapper: (item: T, index: number) => Scn
): Scn {
  // 1) make the container via dom()
  const el = dom(tagName);

  // 2) spin up a Ribu job that watches the store, diffs, and updates:
  const job = go(function* () {
    let prev: T[] = [];
    while (true) {
      const next: T[] = yield* store.get();
      diffAndUpdateList(prev, next, el, mapper);
      prev = next;
    }
  }());

  // 3) return the shape ui() expects:
  return { job, el };
}




















/* Other Ideas:
   1) Components yield back events like turbine
      Q: How to add custom metadata the event?
         event naturally has ev.sourceDomElem
         Maybe some sort of elem.use()
   2) Can move forward ui 100% if each job is a State like calculators.
   3) ui() can use context like asynclocalStorage to get currectJob or implementation.
   4) Special "Slot" component that you can pass around to insert thing in there.
*/



function* DocumentOverview() {
  let scn = yield* ui("h1", "Loading documents...")

  const docs = yield* fetchJson('/json/documents.json')


  scn = scn.replace(
    isErr(docs) ?
      ui('div', 'Error loading documents: ' + docs.message) :
      docs.map(doc =>
         ui('li', { onclick: '', doc.name)
      )
   )

   const clickInfo = yield* scn.click
}
