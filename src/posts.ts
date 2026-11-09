import { type CollectionEntry, getCollection } from "astro:content";
import { type Category, filterPostsByCategory } from "./categories";

/** 記事一覧の 1 ページの件数（docs/posts.md） */
export const POSTS_PER_PAGE = 30;

/**
 * 公開日の新しい順に並べた記事。同じ日は id で並べ、ページをまたいで重なったり抜けたりしないようにする。
 * 下書きは dev でだけ出す。
 */
export const getSortedPosts = async (): Promise<CollectionEntry<"blog">[]> => {
  const posts = await getCollection(
    "blog",
    ({ data }) => import.meta.env.DEV || !data.draft,
  );
  return posts.sort(
    (a, b) =>
      b.data.pubDate.valueOf() - a.data.pubDate.valueOf() ||
      a.id.localeCompare(b.id),
  );
};

/** 並べた記事の n ページ目（1 始まり）と、全体のページ数 */
export const pagePosts = (posts: CollectionEntry<"blog">[], page: number) => {
  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  const start = (page - 1) * POSTS_PER_PAGE;
  return { posts: posts.slice(start, start + POSTS_PER_PAGE), totalPages };
};

/** 記事一覧の n ページ目（1 始まり）の記事と、全体のページ数 */
export const getPostsPage = async (page: number) =>
  pagePosts(await getSortedPosts(), page);

/** カテゴリ別の記事一覧の n ページ目（1 始まり）の記事と、全体のページ数。子カテゴリの記事も含む */
export const getCategoryPostsPage = async (category: Category, page: number) =>
  pagePosts(filterPostsByCategory(await getSortedPosts(), category), page);
