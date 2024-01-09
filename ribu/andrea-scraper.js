const XLSX = require('xlsx')
const puppeteer = require('puppeteer-core')
const { TimeoutError } = require('puppeteer-core/Errors');
const { Channel } = require('async-csp')
const R = require('ramda')
const { sleep, mutateCell, removeDuplicates, _try } = require(`./utils`)
const colors = require('colors')
const { log } = console

const FILE = `omnia_gmd_duck.xlsx`
const COMP_NAME = `C`
const CITY = `D`
const COUNTRY = `E`
const EMAILS = `G`
const WEBSITE = `H`
const SECTOR = `I`
const PRODUCTS = `J`
const DB_LINK = `K`
const ADDRESS = `L`
const NO_TIENE = `no tiene`
const NOT_FOUND = `no se consiguio`

const TIMEOUT = 100 * 1000
const RESTART_TIME = 15 * 60 * 1000

// let SEARCH_ENGINE_Q = `https://www.google.com/search?q=`
const SEARCH_ENGINE_Q = `https://duckduckgo.com/?q=`
const SEARCH_LINKS_CSS =
	SEARCH_ENGINE_Q.includes(`duck`) ? `#links a.result__a` :
		SEARCH_ENGINE_Q.includes(`google`) ? `#rso h3 a` :
			`#links a.result__a`    // bing
const EMAIL_Q = `(contact | info | inquiry | sales | export | distributors) `
// const EMAIL_Q = `contact `
const EMAIL_REGEX = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi

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


async function getEmails(website, comp_name, row) {
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

	return emails
}



// this is one of the workers. Notice how it puts directly to the saveData chan
async function scraperTabs(browser, readC, writeC) {
	const webPage = await browser.newPage()
	webPage.setDefaultNavigationTimeout(TIMEOUT)

	while (readC !== Channel.DONE) {
		const { row, website, comp_name } = await readC.take()

		const emails = getEmails(website, comp_name, webPage, row)

		const datom = { row, emails }

		await writeC.put(datom)
	}
}


// this guy is doing nothing, really:
// instantiating the 15 tabs and (??) notifying someone all tabs are done.
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
		for(;;) {
			const done1C = new Channel()
			const done2C = new Channel()
			const readC = new Channel(15)   // n browsers tabs
			const writeC = new Channel()

			launchBrowser(done1C)

			// read file initially and start pushing data to process
			readXLSX(done2C, readC)

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