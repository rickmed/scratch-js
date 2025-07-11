/*
=> For component (diffing array values like solid/svelte) is a good default.
   - => Let's see how this would work.
   - IDEA: yield* on changes (resource sub/unsub)
      - Then you can show a more efficient way in list by manual add/remove.
         using select.

IMPLEMENTATION:
   - store updates are broadcast channels (already in ribu).
   - Event Handling:
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

// => Do static components finish?





















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