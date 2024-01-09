import { tepui, Dom } from "tepui"
import { me, myJobs, onEnd, go, wait, Ch, broadcastCh, type Prc } from "ribu"
import { computed, effect } from "@preact/signals-core"


/***** ARCHITECTURE  *****
- ALL things ("Components") are genFn* prcS that run forever until cancelled.
	- Run forever bc they launch a child prc that runs forever (eg: waiting user input, a signal to update...)
	- ?? TODO: what about the static components? (don't have user/network/etc interaction)
- They are launched by ui(), which convert them to
	- ctor :: () -> scene
	- scene :: {prc, dom, remove(), ...}
	- "scn" = scene
*/



/***** COMPONENT INSTANTIATION ******/
// rm-todo: need to make parentDom available at tepui.parentDom to descendant comp

class Scn {
	constructor(public prc: Prc, public dom: HTMLElement) {}
	cancel() {
		if (this.dom !== undefined) {
			this.dom.remove()
		}
		return this.prc.cancel()
	}
}

function uiGo(genFn, ...args) {
	const prc = go(genFn, ...args)  // component sets ui.dom = dom
	const { dom } = tepui
	if (!dom) {  // not sure
		throw Error('component must set up a dom element')
	}
	tepui.dom = null
	return new Scn(prc, dom)
}

type ScnCtor = () => Scn

// ui :: () -> {prc, dom}
function ui(...args): ScnCtor {
	if (args[0] === 'genFn') {
		return () => uiGo(args[0], ...args)
	}
	if (args[1]) {}

	// const dom = document.createElement(tag)
	// // need to dissambiguate static vs signals parts.
	// const text = document.createTextNode(textSig.val)
	// dom.append(textSig)

	// // update
	// const unListen = textSig.listen(newText => text.textContent = newText)

	// const prc = go(function* () {
	// 	onEnd(unListen)
	// })
}

function getParentDom(): HTMLElement {
	return tepui.parentDom
}



/****** TodoApp ******/

goTry(function* TodoApp() {

	// init dataMem
	// if pass an array in adds as a single batch.
	const store = new Store()
	store.add(todosFromServerArr)

	const scnCtor = ui(`div`,
		ui('header', '.header',
			ui('h1', 'todos'),
			ui(TodoEntry, store),  // turns into () => { const prc = go(...); return scnObj }
		),
		ui(Todos, store),
		ui(Footer, store)
	)

	document.getElementById('root')?.append(scnCtor().dom)
}, err => {
	//...
})



function* TodoEntry(store) {

	ui('input', {
		class: 'new-todo',
		placeholder: "What needs to be done?",
		autoFocus: true,
		onKeyDown  // ui() needs a genFn* as event handler
	})

	const ENTER_KEY = 13
	function* onKeyDown(ev) {
		if (ev.keyCode !== ENTER_KEY) {
			return
		}
		store.add({ id: uuid(), title: ev.target.value.trim(), completed: false })
	}
}


// DONE: Data Fetching
// DONE: CollMngr may launch prcS inside, which will be childS of Todos, its awesome bc:
	// 1) nice to understand
	// 2) when Todos is cancelled, CollMngr will be as well.
function* Todos(todosStore) {

	go(function fetchTodos() {  // this is a child of *Todos
		const item = yield* fetchData()  // will block here and here and continue below
		// update signals, mutate domElem directly...
	})

	/* optionally, can return a dummy element (renders nothing) while data is being fetched:

		function emptyElem() {
			const emptyElem = document.createElement("div")
			emptyElem.style.display = "none"
			return emptyElem
		}
	*/

	let dom = ui('ul', `.todo-list`)().dom

	const collMngr = CollMngr(todosStore, dom)

	go(function* todoAdd() {
		for (;;) {
			const todo = yield* collMngr.onAdd()

			//  *Todo is child of *todoAdd -> ok, since *todoAdd is a child of *Todos
			const todoScn = uiGo(Todo, todo, todosStore)
			// do some animation with comp.dom
			yield* wait(300)
			collMngr.appendToDom(todoScn, todo)
		}
	})

	// rm-todo: lets say I don't want to do animations on removes(), ie,
	// how can have CollMngr apply a default behavior (just remove the item)?

	// blocks here forever since *todoAdd never finishes
}



/* Diff Store and ui Collections.
	- Store is just an event emiter that you can sub/unsub: store.onAdds(add => )
		- optionally, event emiters converted to channel api

User DON'T want to know about:
	- WeakMap:
		- creation, adding to it.
	- when a todoObj is removed, For looks for -> TodoComp to .cancel()

	- other thing is mount to parent
		- this could be abstracted too I think
*/


// rm-todo: default behavior is diff plain arrays.
// rm-todo: add batching functionality.
// rm-todo: maintain sort capabilities
// provide api which doesn't append to dom so that api client sorts itself
// and another api to mantain sort a let client just do collmngr.insertToDom(comp, item)
function CollMngr(collStore, parentElem) {

	// a cache is needed so when a "todo was removed" arrives, we need to know
	// which todoView to remove/cancel

	const todo_todoScn = new WeakMap()
	let storeSubscriptions = []

	function onAdd() {
		// +1 listeners?
		const addsCh = Ch()
		const cb = item => { addsCh.put(item) }
		storeSubscriptions.push(['add', cb])
		collStore.on('add', cb)
		return addsCh
	}

	function appendToDom(comp, item) {
		todo_todoScn.set(item, comp)
		parentElem.appendChild(comp.dom)
	}

	go(function* cancelSubs() {
		onEnd(() => {
			for (const [event, cb] of storeSubscriptions) {
				collStore.removeListener(event, cb)
			}
		})
	})

	return { onAdd, appendToDom }


	// function* removes() {
	// 	for (; ;) {
	// 		const todoObj = yield* collStore.removesCh()
	// 		const {dom, prc} = todo_todoComp.get(todoObj)
	// 		yield* prc.cancel()  // each TodoView unSubs from todoSig
	// 		dom.remove()  // dom api
	// 	}
	// }

	// // alternative to each TodoView subscribing itself to the todoObj
	// go(function* updates() {
	// 	for (; ;) {
	// 		const todoObj = yield* todosStore.updates()
	// 		// forward somehow to todoComp ??
	// 	}
	// })
}


/****** For() ******
rm-todo: could do a diff of arrays here by default!!!
	but we need to know at least _when_ array changed (not how)
	so, would still need to wrap the original array in a signal it notifies
*/

// Usage:
ui('ul',
	For(store, todo => ui(Todo, todo, store))
)

// Definition:
function For(store, fn: ScnCtor) {
	// implement using CollMngr

	// problem, I have one prc without a dom
	const prc = go(function* For() {

	})

	let compArr = []
	for (const item of store) {
		compArr.push(fn(item))
	}

	return () => {
		go()
		return { prc, dom }
	}

	/* For could be implemented to be used like:
		ul('.someClass',zx
			For(store, item => Todo(item, store))
		)
		,ie, ui constructur
	*/
}


// rm-todo: change event handlers as prcS
function* Todo(todo: Signal<TodoObj>, todos: Signal) {

	const scnCtor = ui('li',
		ui('div', { class: "view" },
			ui('checkbox', { class: `toggle`, checked: todo.completed, onchange: completeTodo }),
			ui.title(todo.title),
			deleteBttn(`.destroy`, onclick: deleteTodo)
		),
		// this element here is dumb here per todomvc, but you know, css.
		editingInput(`.edit`, { value: todo.title, onblur: exitEdit, onkeydown: exitEdit })
	)

	// Event handlers
	const { li, title, editingInput, deleteBttn } = scnCtor().dom

	function completeTodo() {
		todo.completed.value = !todo.completed
		// change checkbox's class directly on dom with a smart-ish api like (also, see ondblclick below)
		li.classList.toggle(`completed`)
	}

	title.ondblclick = () => {   // onXYQ is a proxy getter translated to dom.addEventListener(...)
		editingInput.focus()
		li.classList.add(`editing`)
	}

	const ESCAPE_KEY = 27;
	const ENTER_KEY = 13;
	// see how using exitEdit above {onblur, onkeydown} is usefull to abstract behavior
	function exitEdit(ev) {
		if (ev.which && !(ev.which === ESCAPE_KEY || ev.which === ENTER_KEY)) {
			return
		}
		const editVal = editingInput.value.trim()
		if (editVal === '') {
			deleteTodo()
		}
		else {
			todo.title = editVal
		}
	}

	function deleteTodo() {
		todos.remove(todo)  // differential signal store api.
	}


	// // ?? differential updates from parent
	// go(function* updates() {
	// 	for (; ;) {
	// 		const todoObj = yield* todosCache.updates()
	// 	}
	// })
}

function Footer(store) {

	return If(() => store.count === 0, Footer_, () => ui('text', 'No Todos'))

	function Footer_() {
		// returns a comp
	}
}



/****** If() ******
rm-todo: reimplement more generally like ramda's "when"
	also, support only if (no else branch)
rm-todo:
 */

/* Usage
	ui('parentDiv',
		ui('div'),
		If(() => store.count === 0, ui(Footer_, store), ui('No Todos'))
		)
	)
*/

const If = ui(function* If_(predFn: () => boolean, scnCtor1: ScnCtor, scnCtor2: ScnCtor) {

	const computed_ = computed(predFn)
	const computedVals = Ch()
	const disposeComputed = effect(() => {
		computedVals.put(computed_.value)
	})

	// rm-todo: make theses resources autoclean when *If_ ends.
	onEnd(() => {
		disposeComputed()
	})

	let activeScn = computed_.peek() === true ? scnCtor1() : scnCtor2()  // launches jobS as side effect
	const parentDom = getParentDom()
	parentDom.append(activeScn.dom)

	for (;;) {
		const newComputedVal = yield* computedVals.rec  // computed should only fire if return val changes
		// rm-todo: I think activeSnc.prc.cancel() should not stop scnCtor().
			// bc, what if activeScn takes a lot of time cleaning its resources?
			// but for now it's ok.
		yield* activeScn.cancel()
		const newScn = (newComputedVal === true ? scnCtor1() : scnCtor2())
		parentDom.replaceChild(newScn.dom, activeScn.dom)
		activeScn = newScn
	}
})




/******* ERROR HANDLING DESIGN **************/

// Usage:
function* App() {
	// kinda weird that Error_Boundary FallbackComp isn’t wrapped in ui() but OK
	const scnCtor = Catch(FallbackComp,	[
		ui(Greeting, store),
		ui(Farewell, store)
	])
	// ...
}

// Definition:
function* Catch(FallbackComp = DefaultFallbackComp, scnCtors: Array<() => {prc, dom}>) {

	var parentDom = getParentDom()
	const jobs = myJobs()

	for(;;) {
		for (const ctor of scnCtors) {
			const {dom} = ctor()  // all scenes are children of *sup (which is a child of *Error_Boundary)
			parentDom.append(dom)
		}

		yield* jobs.rec  // reports when a jobs ends
		// But since tepui jobs are meant to be ran forever until cancelled/fails...
			// It means that a job did not complete. Either way...
		yield* jobs.cancel().$
		parentDom.replaceChildren()  // clears children
		const restoreCh = Ch()
		const fallbackScn = uiGo(FallbackComp, prc.val, restoreCh)
		parentDom.append(fallbackScn.dom)

		// if user puts on this ch, then need to relaunch og comps (and remove this obviously)
		// if user never puts to Ch, *Error_Boundary will be blocked forever until cancelled
			// rm-todo: maybe Error_Boundary can be implemented in terms of If()
		yield* restoreCh.rec
		// if I'm here, means user wants to restore

		yield* fallbackScn.cancel()
	}
}


// error:: {niceInfoProvidedByRibu}
// put() to restoreCh to relaunch og ui.
function* FallbackComp(err, restoreCh) {
	// can log error for example
	ui('div', 'Ooops: an Error Ocurred',
		ui('button', onClick)
	)

	function* onClick(ev) {
		yield* restoreCh.put()
	}
}

// rm-todo: implement
function* DefaultFallbackComp(err, restoreCh) {
}



/**** NOTES ****/
/* Error Handling
	- Component should not fail on network errors, it should retry.
		- If network is really failing, errors should be handled elsewhere.
		- eg, show a toaster msg to user and get back to component's previous state
*/



/**** PENDING QUESTIONS ****/
/* UI and prc trees too coupled?
	- Problem in web is that positioning is mainly as rows of divs, so,
	it's generally hard for components in diffent rows to be supervised/communicate.
 */


/************************* OTHER STUFF *************************************/

/***** Mobx *****
	- adds listeners to every accessed object (and calls the listener when object changed)
		- but it doesn't tells WHAT changed (it is not dataflow)
	what solves:
		1) effectFns are ran once, when:
			- effectFns depend on +1 observables.
			- diamond graph.
		2) Transactions: when +1 observables need to change at once, effectFns run only once.
	internals:
		mobxArray.filter() just marks the array as being used when filter() is called.
	CONS:
		1) automatic computed lifting is way harder to implemented (+codebase and -performance)
*/























/*** TODO ***
	- Need a way to "extend" prcS functionality, ie, have built-in methods.
	- An api to access the whole prcS tree (including a .state value)
*/
