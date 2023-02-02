import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const __filename = fileURLToPath(import.meta.url)

// console.log(__dirname)
console.log(import.meta.url)

console.log(path.dirname(fileURLToPath(import.meta.url)))