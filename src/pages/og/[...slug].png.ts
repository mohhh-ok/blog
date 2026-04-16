import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const FONT_URL =
  "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-jp@latest/japanese-700-normal.ttf";

const CACHE_DIR = join(process.cwd(), ".cache", "og");

function ensureCacheDir() {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

async function loadFont(): Promise<ArrayBuffer> {
  ensureCacheDir();
  const fontPath = join(CACHE_DIR, "NotoSansJP-Bold.ttf");
  if (existsSync(fontPath)) {
    const buf = readFileSync(fontPath);
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  }
  const res = await fetch(FONT_URL);
  const data = await res.arrayBuffer();
  writeFileSync(fontPath, Buffer.from(data));
  return data;
}

function cacheKey(title: string, categories?: string[]): string {
  const input = JSON.stringify({ title, categories: categories ?? [] });
  return createHash("sha256").update(input).digest("hex");
}

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection("blog", ({ data }) =>
    import.meta.env.DEV ? true : !data.draft
  );
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { title: post.data.title, categories: post.data.categories },
  }));
};

export const GET: APIRoute = async ({ props, params }) => {
  const { title, categories } = props as {
    title: string;
    categories?: string[];
  };

  ensureCacheDir();
  const hash = cacheKey(title, categories);
  const slug = params.slug as string;
  const cachePath = join(CACHE_DIR, `${slug.replaceAll("/", "__")}__${hash}.png`);

  if (existsSync(cachePath)) {
    const cached = readFileSync(cachePath);
    return new Response(cached, {
      headers: { "Content-Type": "image/png" },
    });
  }

  const font = await loadFont();

  const svg = await satori(
    {
      type: "div",
      props: {
        style: {
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          padding: "60px",
          fontFamily: "Noto Sans CJK JP",
          color: "#ffffff",
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                fontSize: "48px",
                fontWeight: 700,
                lineHeight: 1.4,
                wordBreak: "break-word",
                flexGrow: 1,
                alignItems: "center",
              },
              children: title,
            },
          },
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "20px",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      gap: "12px",
                    },
                    children: (categories ?? []).map((cat) => ({
                      type: "div",
                      props: {
                        style: {
                          fontSize: "20px",
                          padding: "4px 16px",
                          borderRadius: "9999px",
                          background: "rgba(255,255,255,0.15)",
                          color: "#e0e0e0",
                        },
                        children: cat,
                      },
                    })),
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: "24px",
                      color: "#a0a0a0",
                    },
                    children: "太田雅昭",
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Noto Sans CJK JP",
          data: font,
          style: "normal",
          weight: 700,
        },
      ],
    }
  );

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
  });
  const png = resvg.render().asPng();

  writeFileSync(cachePath, png);

  return new Response(png as Buffer<ArrayBufferLike> & BlobPart, {
    headers: { "Content-Type": "image/png" },
  });
};
