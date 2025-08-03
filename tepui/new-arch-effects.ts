function ShowWindowSize() {
	html`
		<div>
			${$.innerWidth} x ${$.innerHeight}
		</div>
	`
	// in SSR is a noop
	.on(window, "resize", (ev, part) => {
		part.innerWidth = ev.currentTarget.innerWidth
		part.innerHeight = ev.currentTarget.innerHeight
	})

	.onClient(part => {
		// .on is a wrapper of:
		const resize = () => {
			part.innerWidth = window.innerWidth
			part.innerHeight = window.innerHeight
		}
		window.addEventListener('resize', resize)
		// when part.cancel() is called, part can call a rsc release like dispose()
		part.rsc(() => window.removeEventListener('resize', resize))
	})
}

/* Timer */
function Timer() {
	html`
		<div>
			${$.count}
		</div>
	`
	// in SSR is a noop
	.go(function* timer(part) {
		for (;;) {
			part.count++
			yield* sleep(100)
			part.count++
			yield* sleep(500)
		}
	})
}

/* Focus on render */
function FocusInput() {
	html`<input id="input" type="text">`
	.onClient(part => {
		part.elems.input.focus()
	})
}
