---
title: 【Dagger】PNPM Workspaceでのディレクトリ問題と対応
pubDate: 2025-11-15
categories: ['開発']
---

こんにちは、フリーランスエンジニアのmohです。

## 環境

- dagger: 0.19.6

## Dagger

DaggerはCI/CDに使えるツールです。

## PNPM Workspaceでの問題

PNPM Workspaceで、以下のような構成を試みました。

```
- project/
  - .dagger/
    - src/
    - package.json (name: @repo/dagger)
  - packages/
    - shared/
      - package.json (name: @repo/shared)
```

これで、daggerから@repo/sharedをインポートして使いたかったわけです。しかしできませんでした。

## source指定した場所しか使えない

dagger.jsonが以下のようになっていました。

```json
{
  "name": "xxx",
  "engineVersion": "v0.19.6",
  "sdk": {
    "source": "typescript"
  },
  "source": ".dagger"
}
```

.dagger以下にあるディレクトリしか使用できないようです。それならと以下のようにルートを含めました。

```
"source": "."
```

今度はsrcが見つからないと。どうやらsourceをルートにすると、そこにsrcを置かないといけないようです。しかしsrcを移動すると全体構成が見づらくなってしまいます。

## 暫定的な解決策

次善の策として、`.dagger`ディレクトリ内に`shared`を配置し、そこを他のパッケージから参照する形にしました。

```
- project/
  - .dagger/
    - src/
      - shared/
        - index.ts
    - package.json (name: @repo/dagger, exportsでshared/indexを出す)
  - packages/
    - shared/
      - package.json (name: @repo/shared)
```

```json
{
  "name": "@repo/dagger",
  "exports": {
    "./shared": "./src/shared/index.ts"
  }
}
```

この場合、`package.json`は以下のようになります。

```json
{
  "name": "@repo/dagger",
  "exports": {
    "./shared": "./src/shared/index.ts"
  }
}
```

他のパッケージからは通常通り`@repo/dagger/shared`としてインポートできます。

## まとめ

Daggerの`source`設定には制約があり、指定したディレクトリ外のコードを直接参照できません。PNPM Workspaceとの統合では工夫が必要です。

今回の対応策:
- `.dagger/src`内に共有コードを配置
- `package.json`の`exports`で公開
- 他パッケージから通常のワークスペースパッケージとして参照

より良い方法があればアップデートしたいと思います。
