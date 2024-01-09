/*
	This program has two kind of "things":
		- Processor/Services (browser tabs) that process things
		- Items (websites to scrape info)

		Items will break into state machines (fails, retries, etc).
		I need to model Items as processes:
			1) Get company name out of db.
			2) Do a google search.
			3) Get first 5 result links.
			4) Do some scraping in each of them.
			5) Put the results in the db.

		Services that need to be reused bc are expensive:
			- Browser Tabs
			- (maybe) read/write to db.

		CON: can't save durably the state of the item.
*/


// - need a coordinator who has a cursor/buffer of the Items list to process
// - Since the bottleneck in this app is the N browser tabs,
// it needs to launch a getEmails()* whenever a browserTab is freed.

// But really all this is: map(companyInfo) -> {companyInfo, emails}
// all this is just managing machine capacity.
// Each browserTab is doing async stuff internally, so there could be
// some time where all tabs are waiting for network.
// so the managing of resources should be ideally be auto-done by the system.
// how? maybe the programmer should set a % of machine usage. Implementation:
	// the system sees a class of resources (set of processes) that are all
	// idle (waiting for io) and launches more of them.


// => next step: continue coding with a queue structure in main.
// think about how this is really a simple pipe
// inDBServiceBuffer -> browser -> writeDB

async function main() {
	const cursor = query("")
	const nTabs = 15  // ideally, should be managed by cpu usage.
	const queue = chBuff(nTabs)

	goLoop(cursor, queue, function* () {
		const dbObj = yield* cursor.nextItem()
		yield* queue.put(dbObj)
	})

	// the browserService needs to notify the inDbService (buffer) that a tab is available
	// so it needs to pull more items from disk.
	// Although, naturally, the browserService would just pull item from queue and process it

	const browser = startBrowser(nTabs, inQueue)
	const tab = await freeBrowserTab()
}

function startBrowser(nTabs, inQueue) {
	for (let n = 0; n < nTabs; n++) {
		go(Tab, inQueue)
	}
}

function* Tab(inQueue) {
	while (inQueue.open) {
		const dbObj = yield* inQueue.take()
		const extendedObj = processItem(dbObj)
	}
}

// thinking this is too much coordination (eg: managing channels, lots of while (true), ...)  ???









/*** Architect app by 1 Item <=> 1 Proc (ie, not pure pipeline)  ***

	The id of the object (and who instantiates the prc) must come from a
coordinator (ie, the prc itself can't instantiate itself or know "who am I"). Also,
the coordinator must instantiate them as resources in services become available.

PROs:
	- Locality of behavior (you how EACH item is processed)
CONs:
	- Code is bigger (need to make additional service interfaces)
	- Resources may not be used efficiently (the process must acquire/release them at timely fashion)

CONCLUSION: Not sure if too beneficial (would still need to save variables to obj disk manually)

*/

/**** What would the coordinator look like?
	- Goal: process all items with less memory.
		So launching 1 prc per item, at once, defeats the purpose.

	You could create new Tabs per item, but having n Tabs working at one time.
		This will be slower bc more creation/deletion-GC of prcS.
		This is why you need "stable" prcS (using while-true)

	Regardless, you need max_n Tabs working at once. So...
		But this is NOT very declarative.



*/


// can scrapeInfo() work like insertToDB() ?
	// not really, bc insertToDB() is a processor doing data oriented stuff
	// scrapeInfo() _could_ work the same way but it defeats the purpose of arquitecting the app this way.

async function coord() {
	const cursor = query("")
	const nTabs = 15
	const queue = chBuff(nTabs)

	goLoop(cursor, queue, function* () {
		const dbObj = yield* cursor.nextItem()
		yield* queue.put(dbObj)
	})

	// the browserService needs to notify the inDbService (buffer) that a tab is available
	// so it needs to pull more items from disk.
	// Although, naturally, the browserService would just pull item from queue and process it

	const browser = startBrowser(nTabs, inQueue)
	const tab = await freeBrowserTab()
}

async function processItem(dbObj, tab) {
	let retries = 0  // so it's saved on disk.
	const emails = await scrapeInfo(tab)
	const extendedObj = { emails, ...dbObj }
	await insertToDB(extendedObj)  // the dbService could batch request from different prcS and notify them when it's done.

	// helpers
	async function scrapeInfo(tab) {
		const url = "google/search " + dbObj.companyName
		tab.goto(url)
		// ... do things with tab
		// retry if necessary...
		const emails = tab.search("some regex")
		tab.release()  // this is kinda weird but ok.
		return emails
	}
}
















async function launchBrowser(doneC) {
	log(`launching browser`.underline.grey)
	const browser = await puppeteer.launch({
		executablePath: `C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe`,
		ignoreHTTPSErrors: true,
		headless: false
	})
	log(`browser launched`)
	await doneC.put(browser)
}

async function readXLSX(done, readC) {
	log(`reading file`)
	const wb = XLSX.readFile(FILE)
	const ws = wb.Sheets.omnia
	log(`file in memory`)
	await done.put([ws, wb])

	log(`pushing links to scrape`)


	let _row = 824     // pagina 212 from gmd


	let link_db = ws[DB_LINK + _row]

	while (link_db) {
		const comp_name = ws[COMP_NAME + _row].v
		const website = ws[WEBSITE + _row].v

		if (ws[EMAILS + _row]) {
			// log(`skipped row ` + _row + ` since it has emails already...`)
		}
		else {
			const datom = { row: _row, website, comp_name }
			await readC.put(datom)
		}
		_row++
		link_db = ws[DB_LINK + _row]
	}

	readC.close()
}


async function getEmails(website, comp_name, webPage, row, doneC) {
	let site_query = R.pipe(
		x => x.includes(`://`) ? x.split(`://`)[1] : x,
		x => x.includes(`www.`) ? x.split(`www.`)[1] : x
	)(website)

	const queryStr = website === NO_TIENE ? comp_name : `site:` + site_query
	const url = SEARCH_ENGINE_Q + EMAIL_Q + queryStr
	log(`${row.toString().cyan} ${`Launching`.magenta} "${url}"`)
	const [err] = await _try(webPage.goto(url))

	if (err instanceof TimeoutError) {
		log(err)
		log(`catched timeout opening search engine. Reloading`)
		await webPage.reload()
	}

	const links = await webPage.$$eval(SEARCH_LINKS_CSS,
		nodes => nodes.map(node => node.href))

	let emails = []
	let linkIdx = 1

	for (const link of R.take(5, links)) {
		// log(`visiting link #${linkIdx.toString().grey} for row ${row.toString().cyan}: `, link)

		const [err] = await _try(webPage.goto(link))

		if (err instanceof TimeoutError) {
			// log(err)
			log(`${row.toString().cyan} ${`Timed-out`.grey} ${link} ${`from`.grey} "${comp_name}" ${`skipping...`.grey}`)
			continue
		}

		const [_, bodyHTML] = await _try(webPage.$eval(`body`,
			node => node.innerHTML));

		const email = bodyHTML ? bodyHTML.match(EMAIL_REGEX) : []
		{
			const logMsg = email === null || email.length === 0 ?
				`${row.toString().cyan} ${(`#` + linkIdx).red} ${JSON.stringify([])} ${`at`.grey} ${link}` :
				`${row.toString().cyan} ${(`#` + linkIdx).red} ${JSON.stringify(email).green} ${`at`.grey} ${link}`
			log(logMsg)
		}
		emails.push(email)
		linkIdx++
	}

	emails = R.flatten(emails)
		.filter(x => x !== null)
		.filter(x => R.takeLast(4, x) === `.png` ? false : true)
		.filter(x => R.takeLast(4, x) === `.jpg` ? false : true)
		.filter(x => R.takeLast(4, x) === `.gif` ? false : true)

	emails = R.take(5,    // cap it at 5
		removeDuplicates(emails)
	).join(`, `)

	emails = emails === `` ? NOT_FOUND : emails

	if (links.length === 0) {
		log(`${row.toString().cyan}  No results from ` + url.grey)
	}
	else {
		// log(`found these emails: ${emails}\r\n...from: ${url}`)
	}

	await doneC.put(emails)
}


async function scraperTabs(browser, readC, writeC, done) {
	const webPage = await browser.newPage()
	webPage.setDefaultNavigationTimeout(TIMEOUT)

	while (readC !== Channel.DONE) {
		const { row, website, comp_name } = await readC.take()

		const done_emailsC = new Channel()
		getEmails(website, comp_name, webPage, row, done_emailsC)
		const emails = await done_emailsC.take()

		const datom = { row, emails }

		await writeC.put(datom)
	}

	await done.put()
}

async function scrapeSites(browser, readC, writeC, doneC) {
	const done = new Channel()
	for (let i = 0; i < readC.buf._size; i++) {
		scraperTabs(browser, readC, writeC, done)
	}
	for (let i = 0; i < readC.buf._size; i++) {
		await done.take()
		log(`Tab closed`.magenta)
	}
	await doneC.put()
}

async function saveData(wb, ws, writeC) {
	while (true) {
		const datom = await writeC.take()
		const { row } = datom
		// log(`Received data and saving row: ${row}`)

		for (const p in datom) {
			if (p === `city`) mutateCell(ws, CITY + row, datom[p])
			if (p === `country`) mutateCell(ws, COUNTRY + row, datom[p])
			if (p === `address`) mutateCell(ws, ADDRESS + row, datom[p])
			if (p === `website`) mutateCell(ws, WEBSITE + row, datom[p])
			if (p === `sect`) mutateCell(ws, SECTOR + row, datom[p])
			if (p === `prods`) mutateCell(ws, PRODUCTS + row, datom[p])
			if (p === `emails`) mutateCell(ws, EMAILS + row, datom[p])
		}

		XLSX.writeFile(wb, FILE)
		log(`${row.toString().cyan}  ` + `file written with:\r\n`, datom.emails.green)
	}
}


async function main() {

	let browser

	async function start() {
		while (true) {
			const done1C = new Channel()
			const done2C = new Channel()
			const readC = new Channel(15)   // n browsers tabs
			const writeC = new Channel()

			launchBrowser(done1C)
			readXLSX(done2C, readC)    // read file initially and start pushing data

			let ws, wb

			[browser, [ws, wb]] = [await done1C.take(), await done2C.take()]

			const doneProcessing = new Channel()
			const closeDown = new Channel()

			scrapeSites(browser, readC, writeC, doneProcessing)
			saveData(wb, ws, writeC, doneProcessing)


			await sleep(RESTART_TIME)
			log(`restarting to refresh tabs`)
			// await browser.close()
			const [err, _] = await _try(browser.close())

			if (err) {
				log(err)
				log(`Caught error while closing browser. Ignoring...`)
			}
		}

		// log(`Done processing file. Tearing things down`)
		// log(`closing browser`)
		// await browser.close()
		// log(`All Done. Bye!`)
	}

	try {
		await start()
	}
	catch (e) {
		if (e instanceof TypeError) {
			log(`Nothing to do. Halting...`)
			log(e)
		}
		else {
			log(e)
			log(`Closing browser and trying to restart`)
			await browser.close()
			start()
		}
	}

}

// main()