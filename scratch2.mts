// https://stackoverflow.com/questions/51650979/type-inference-with-overloaded-functions?rq=3

import {readFile} from "fs"

readFile("foo.txt", {signal: new AbortController().signal}, (e, r) => {

})

export type GetOverloadArgs<T> =
    T extends { (...o: infer U) : void, (...o: infer U2) : void, (...o: infer U3) : void } ? U | U2 | U3:
    T extends { (...o: infer U) : void, (...o: infer U2) : void } ? U | U2 :
    T extends { (...o: infer U) : void } ? U : never


type OverLoadsArgsRF = GetOverloadArgs<typeof readFile>

type PromisifyRF = PromisifyOne<OverLoadsArgsRF>


export type Callback<R = any> = (err: Error | null, result: R) => void;

export type PromisifyOne<T extends any[]> =
    T extends [Callback<infer R>?] ? () => Promise<R> :
    T extends [infer T1, Callback<infer R>?] ? (arg1: T1) => Promise<R> :
    T extends [infer T1, infer T2, Callback<infer R>?] ? (arg1: T1, arg2: T2) => Promise<R> :
    T extends [infer T1, infer T2, infer T3, Callback<infer R>?]? (arg1: T1, arg2: T2, arg3: T3) => Promise<R> :
    T extends [infer T1, infer T2, infer T3, infer T4, Callback<infer R>?] ? (arg1: T1, arg2: T2, arg3: T3, arg4: T4) => Promise<R> :
    T;



type UnionToIntersection<U> = (U extends any ? (k: U)=>void : never) extends ((k: infer I)=>void) ? I : never

export type Promisify<T> = UnionToIntersection<PromisifyOne<GetOverloadArgs<T>>>

// Sample
declare const readFileProm: Promisify<typeof readFile>

let y = readFileProm("foo.txt")
