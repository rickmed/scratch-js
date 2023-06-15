import { CSP_api } from "./core.mjs"


const csp = new CSP()
export const wait = csp.wait_API.bind(csp)
export const Ch = csp.wait_API.bind(csp)
export const wait = csp.wait_API.bind(csp)


export testCSP  // const { go, Ch, wait, clock } = new testCSP()







// Proc and Chan classes need access to this.currentProc