---
title: "【npm】2025年8月26日以降のパッケージの危険性と対策【Shai-Hulud】"
pubDate: 2025-09-18
categories: ["TypeScript"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## 2025年9月18日現在、npmは危険性がある

現在web開発などで主流となっているJavaScriptによる開発は、npmが必須となっています。しかし2025年9月18日現在、npmが危険にさらされています。

[https://zenn.dev/o\_sup/articles/0580cf66b3f334](https://zenn.dev/o_sup/articles/0580cf66b3f334)

これによると、感染者のnpmパッケージからさらに拡大するといった現象が起こっているようです。そのため攻撃のあった2025年8月26日以降に更新されたnpmパッケージには、感染されている可能性があります。

## 対策

詳細は上記URLを参照いただいた方がいいかと思いますが、ひとまず対応できるのは下記かと思います。

### Aikido safe chainを利用する

これがもっとも楽で確実かもしれません。npm, pnpmなどをラップして警告してくれるツールがあります。

[https://github.com/AikidoSec/safe-chain](https://github.com/AikidoSec/safe-chain)

以下で解説されています。

[https://zenn.dev/nix/articles/0a2910ec65b4a3](https://zenn.dev/nix/articles/0a2910ec65b4a3)

### 2025年8月26日以降更新のパッケージを洗い出す

下記のコードで、サブディレクトリを辿って更新日の抽出が可能です。

```typescript
#!/usr/bin/env node
'use strict';

(async () => {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');

  const ROOT = process.cwd();
  const IGNORE_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'build', 'coverage', 'out', 'tmp']);

  async function findPackageJsons(dir) {
    const out = [];
    async function walk(d) {
      let entries;
      try {
        entries = await fs.readdir(d, { withFileTypes: true });
      } catch {
        return;
      }
      for (const ent of entries) {
        if (ent.isDirectory()) {
          if (IGNORE_DIRS.has(ent.name)) continue;
          await walk(path.join(d, ent.name));
        } else if (ent.isFile() && ent.name === 'package.json') {
          out.push(path.join(d, ent.name));
        }
      }
    }
    await walk(dir);
    return out;
  }

  async function collectDeps(pkgFile) {
    try {
      const raw = await fs.readFile(pkgFile, 'utf8');
      const j = JSON.parse(raw);
      const depObjs = [j.dependencies, j.devDependencies, j.optionalDependencies].filter(Boolean);
      const names = new Set();
      for (const obj of depObjs) for (const k of Object.keys(obj)) names.add(k);
      return [...names];
    } catch {
      return [];
    }
  }

  async function fetchLatestTime(pkg) {
    const url = 'https://registry.npmjs.org/' + encodeURIComponent(pkg);
    let res;
    try {
      res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    } catch {
      return null;
    }
    if (!res.ok) return null;
    let data;
    try {
      data = await res.json();
    } catch {
      return null;
    }
    const time = data && data.time;
    if (!time || typeof time !== 'object') return null;

    let latestIso = null;
    let latestTs = -Infinity;
    for (const [k, v] of Object.entries(time)) {
      if (k === 'created') continue;
      if (typeof v !== 'string') continue;
      const ts = Date.parse(v);
      if (Number.isFinite(ts) && ts > latestTs) {
        latestTs = ts;
        latestIso = v;
      }
    }
    return latestIso;
  }

  async function mapPool(items, limit, fn) {
    const results = new Array(items.length);
    let i = 0, running = 0;
    return await new Promise((resolve) => {
      const run = () => {
        while (running < limit && i < items.length) {
          const idx = i++;
          running++;
          Promise.resolve(fn(items[idx], idx))
            .then((r) => { results[idx] = r; })
            .catch(() => { results[idx] = null; })
            .finally(() => {
              running--;
              if (i >= items.length && running === 0) resolve(results);
              else run();
            });
        }
      };
      run();
    });
  }

  const pkgFiles = await findPackageJsons(ROOT);
  const depLists = await Promise.all(pkgFiles.map(collectDeps));
  const allDeps = new Set(depLists.flat());
  const deps = [...allDeps].sort();

  const dates = await mapPool(deps, 12, fetchLatestTime);
  const pairs = deps.map((pkg, idx) => ({ pkg, date: dates[idx] })).filter(x => Boolean(x.date));
  pairs.sort((a, b) => String(a.date).localeCompare(String(b.date))); // ISOは文字列ソートでOK
  for (const { pkg, date } of pairs) console.log(`${date} ${pkg}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

実行してみます。

```
% node check-npm.js
2022-06-13T02:21:09.392Z accept-language-parser
2022-06-18T00:22:51.890Z ffprobe
2022-06-18T00:22:53.893Z ffprobe-static
2022-06-22T05:28:01.927Z normalize-email
2023-07-12T19:06:34.291Z bytes
2023-08-08T23:46:05.829Z @paralleldrive/cuid2
2023-08-20T09:44:13.419Z js-cookie
2023-09-21T20:42:57.671Z handlebars
2023-12-12T05:09:10.608Z react-otp-input
2024-09-21T10:47:38.336Z @oslojs/crypto
2024-09-24T11:08:24.245Z @oslojs/encoding
2024-10-23T01:17:32.656Z @types/file-type
2024-12-09T08:43:28.232Z @emotion/react
2025-01-10T00:35:01.616Z jsonwebtoken
...
```

このように、すべてのパッケージの最終更新日が出るようになりました。これを使って、2025年8月26日以降更新のパッケージを洗い出せます。

### 危険なパッケージを確認する

下記ページで、今回の件で危険とされるパッケージが公開されています。

*   [https://www.mend.io/blog/npm-supply-chain-attack-packages-compromised-by-self-spreading-malware](https://www.mend.io/blog/npm-supply-chain-attack-packages-compromised-by-self-spreading-malware)
*   [https://www.ox.security/blog/npm-2-0-hack-40-npm-packages-hit-in-major-supply-chain-attack](https://www.ox.security/blog/npm-2-0-hack-40-npm-packages-hit-in-major-supply-chain-attack)
*   [https://thehackernews.com/2025/09/40-npm-packages-compromised-in-supply.html](https://thehackernews.com/2025/09/40-npm-packages-compromised-in-supply.html)

### バージョンを固定する

一旦パッケージのバージョンは固定しておいた方がいいかと思います。

pnpm workspaceの場合は、catalog機能を使うと一括で固定できるので便利です。
