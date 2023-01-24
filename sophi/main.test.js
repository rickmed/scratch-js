import {run} from './sophie.mjs';

// a testSet is
const testSet = await run(['./someModule.test.mjs']);




const filename = url.fileURLToPath(import.meta.url);
const dirname = url.fileURLToPath(new URL('.', import.meta.url));

console.log({filename, dirname});

