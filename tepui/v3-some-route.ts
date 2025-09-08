import { z } from "zod"

// Your component (not important for typing, just here to show it exists)
export default function Post() {
   const {id, tab} = Route(Params)
}

// The ONLY thing we need for types: export the Zod schema object
export const Params = z.object({
   id: z.string(),
   tab: z.string().optional(),
})
