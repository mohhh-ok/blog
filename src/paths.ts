const BASE = import.meta.env.BASE_URL;
export const PATHS = {
  home: `${BASE}`,
  posts: {
    index: `${BASE}posts/`,
    post: (id: string) => `${BASE}posts/${id}/`,
    /** 記事一覧の n ページ目（1 ページ目は /posts/） */
    page: (n: number) => (n <= 1 ? `${BASE}posts/` : `${BASE}posts/page/${n}/`),
  },
  categories: {
    index: `${BASE}categories/`,
    category: (id: string) => `${BASE}categories/${id}/`,
    /** カテゴリ別の記事一覧の n ページ目（1 ページ目は /categories/<id>/） */
    page: (id: string, n: number) =>
      n <= 1 ? `${BASE}categories/${id}/` : `${BASE}categories/${id}/page/${n}/`,
  },
  works: {
    index: `${BASE}works/`,
    work: (id: string) => `${BASE}works/${id}/`,
  },
} as const;
