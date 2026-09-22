---
title: "【electron-vite】モノレポ環境で気をつけること【Module Type】"
pubDate: 2025-08-06
categories: ["TypeScript"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Electronでモノレポ

今回、２つのElectronアプリで共通の機能を使いたいがために、yarnのモノレポ構成で開発していました。electron-viteです。鼻歌混じりにpackages/common-electronを作成しました。あとはこれを、本体から読み込むようにすれば２つのアプリで機能を共通化できます。ですがビルドできないという事態に。

## electron-viteの仕様とモノレポでの問題

electron-viteは、下記のようにビルドします。

```
- main: CommonJS
- renderer: ESModule
```

これはより効率化を求めた結果のようです。通常の使用方法なら、これで問題なく、適切に変換してくれるようです。

しかしモノレポの場合は話が違います。私が試したところ、下記のようなモノでした。

```
モノレポpackages/xxxでのmodule type

- CommonJS: mainでは読み込めるがrendererではエラーになる
- ESModule: 確かmainでエラーになった
```

そうなんです。モノレポだとviteは何も変換せず読み込んでしまうようで、これはvite特有のアルゴリズムに由来するそうです。そのためモノレポの場合は、パッケージはあらかじめ変換しておく必要があります。なおこれは2025年8月7日時点での話で、今後アップデートで改善される可能性もあります。

## 解決策

以下のようにして解決しました。

### とりあえず共通依存はpeerDependencies

これは今回の問題解決に寄与したかどうかはっきりわかっていませんが、ひとまず共通依存はpeerDependenciesにしました。

### mainとrendererで分ける

mainとrendererで、それぞれCommonJSとESModuleにビルド(tsc)します。下記のようにtsconfigを分けることで実現します。

```json
// tsconfig.main.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "node",
    "lib": [
      "ES2020"
    ],
    "outDir": "./dist/main",
    "rootDir": "./src/main",
    "strict": true,
    "skipLibCheck": true,
    "declaration": true,
  },
  "include": [
    "src/main/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
```

```json
// tsconfig.renderer.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": [
      "ES2020"
    ],
    "outDir": "./dist/renderer",
    "rootDir": "./src/renderer",
    "strict": true,
    "skipLibCheck": true,
    "declaration": true,
  },
  "include": [
    "src/renderer/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
```

```json
// package.json
{
  "exports": {
    "./main": {
      "require": "./dist/main/index.js",
      "types": "./dist/main/index.d.ts"
    },
    "./renderer": {
      "import": "./dist/renderer/index.js",
      "types": "./dist/renderer/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.main.json && tsc -p tsconfig.renderer.json",
    "dev": "concurrently \"tsc -p tsconfig.main.json --watch\" \"tsc -p tsconfig.renderer.json --watch\""
  },
}
```

### 両方で使う機能はそれぞれから再エクスポートする

mainとrendererの両方で使う機能は、それぞれでビルドする必要があります。そのため下記のようにします。

```json
- common-electron
  - common
    - index.ts
  - main
    - index.ts: ここで../commonをエクスポート
  - renderer
    - index.ts: ここで../commonをエクスポート
```

またtsconfigのrootDirとincludeを変更します。簡略化のため(main|renderer)と記載していますが、それぞれのファイルの意味として書いています。

```json
// tsconfig.(main|renderer).json
{
  "compilerOptions": {
    rootDir: "src"
  },
  "include": {
    "src/(main|renderer)/**/*",
    "src/common/**/*"
  }
}
```

rootDirを変更したので、dist構造も変わります。package.jsonも変更します。

```json
// package.json
{
  "exports": {
    "./main": {
      "require": "./dist/main/main/index.js",
      "types": "./dist/main/main/index.d.ts"
    },
    "./renderer": {
      "import": "./dist/renderer/renderer/index.js",
      "types": "./dist/renderer/renderer/index.d.ts"
    }
  }
}
```

importするときは、それぞれmain, rendererのどちらか適切な方からするようにします。これで共通部分も大丈夫です。

かなりすったもんだしましたが、これでelectron-viteのモノレポ環境が作れました。お役に立てますと幸いです。
