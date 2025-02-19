// app/routes/api.posts.tsx
import { json } from "@remix-run/node";
import type { Post } from "~/types";

export const loader = async () => {
  const posts = await fetchPostsFromDatabase();
  return json({ posts });
};

// app/routes/_index.tsx
import { useEffect, useState } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import type { Post } from "~/types";

function PostList() {
  const fetcher = useFetcher<typeof loader>();
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    // Fetch posts when component mounts
    if (fetcher.state === "idle" && !fetcher.data) {
      fetcher.load("/api/posts");
    }

    if (fetcher.data?.posts) {
      setPosts(fetcher.data.posts);
    }
  }, [fetcher]);

  if (fetcher.state === "loading") {
    return <div>Loading posts...</div>;
  }

  return (
    <div className="space-y-4">
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

export default function Index() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">Blog Posts</h1>
      <PostList />
    </main>
  );
}