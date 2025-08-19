// Schema
const CommentParams = z.object({
   commentId: z.string().optional(),
   postId: z.string().optional(),
   category: z.string().optional()
 });

 // Component
 function Comment() {
   const { commentId, postId, category } = params(CommentParams);

   if (!commentId && !postId) {
     return h.div({}, `Category: ${category}`);
   }

   if (!commentId) {
     return h.div({}, `Post: ${postId} in ${category}`);
   }

   return h.div({}, `Comment ${commentId} on post ${postId}`);
 }

 // Registration
 // throws on startup if duplicate strings.
 route(Comment, CommentParams);

 // Usage in other components
 Link(Comment, { commentId: "123", postId: "my-post" }, "View Comment")