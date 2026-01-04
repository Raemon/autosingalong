import BlogPage from "./BlogPage";

export default function Blog() {
  // Let the client component handle fetching to avoid build-time timeouts
  return <BlogPage />;
}