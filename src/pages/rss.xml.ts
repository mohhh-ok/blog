import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE_DESCRIPTION, SITE_TITLE } from "../consts";

export async function GET(context: { site?: URL }) {
  const posts = await getCollection(
    "blog",
    ({ data }) => import.meta.env.DEV || !data.draft,
  );
  posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site ?? "https://mohhh-ok.github.io",
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `${import.meta.env.BASE_URL.replace(/\/$/, "")}/posts/${post.id}/`,
      categories: post.data.categories,
    })),
  });
}
