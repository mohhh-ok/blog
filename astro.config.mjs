// @ts-check

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import pagefind from "astro-pagefind";
import { defineConfig } from "astro/config";
import rehypeExternalLinks from "rehype-external-links";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://mohhh-ok.github.io",
  base: "/blog",
  trailingSlash: "always",
  integrations: [mdx(), sitemap(), pagefind()],

  markdown: {
    shikiConfig: {
      theme: "gruvbox-dark-medium", // "github-dark", // または 'dracula', 'nord', 'monokai' など
    },
    rehypePlugins: [
      [
        rehypeExternalLinks,
        {
          target: "_blank",
          rel: ["noopener", "noreferrer"],
        },
      ],
    ],
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
