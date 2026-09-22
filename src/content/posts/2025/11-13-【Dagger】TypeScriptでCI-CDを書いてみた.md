---
title: 【Dagger】TypeScriptでCI/CDを書いてみた
pubDate: 2025-11-13
categories: ['開発']
---

こんにちは、フリーランスエンジニアのmohです。

## CI/CDという地獄の蓋

CI/CDはプログラムを各種環境で実行するために欠かせないものです。Github Actionsなどを使います。通常はyamlファイルでゴリゴリ書いていったりするのですが、これが大変です。実行結果はすぐに取れないし、検証に時間かかるし、何が起こってるかわからないし。

## CI/CDの理想と現実

CI/CDは書き方が制限されているため、なかなか理想通りにいきません。理想としては下記のようなものがあるでしょう。

- TypeScriptで書きたい
- TypeScriptで設定とか共通化したい
- プログラムと設定とか共通化したいそれも型安全に

こうした理想がありながら、実際は難しいです。設定ファイルは良くてyamlファイル。それを検証するためだけのツラツラとしたコード。そうじゃない。もっとシンデレラしたいわけです。

## Daggerとかいう救世主

DaggerはCI/CDパイプラインをプログラマブルに記述できるツールです。コンテナベースで駆動しますが、TypeScript（他にもPython、Goなど）で書けます。これをCI/CDにぶち込めばかなり理想郷に近づきそうです。

## やってみた

上記のような理由により、Daggerを試してみました。このブログはもともとGithub ActionsでGitHub Pagesにデプロイしていましたので、そこにDaggerを組み込みました。

まずは公式に従ってDagger + TypeScript環境を作ります。

https://docs.dagger.io

コードを書きます。`@object()`でクラスをDaggerモジュールとして公開し、`@func()`でメソッドを外部から呼び出せる関数として定義します。`@argument({ defaultPath: "/" })`でソースディレクトリをカレントディレクトリから受け取るように設定しています。

```ts
import { argument, dag, Directory, func, object } from "@dagger.io/dagger";

@object()
export class Blog {
  /**
   * Build Astro site and return dist directory
   */
  @func()
  async build(
    @argument({ defaultPath: "/" }) source: Directory,
  ): Promise<Directory> {
    // pnpmのキャッシュボリュームを作成（ビルド間で永続化され高速化）
    const pnpmCache = dag.cacheVolume("pnpm");

    return dag
      .container()
      .from("node:21-slim")
      .withExec(["corepack", "enable"])
      .withExec(["corepack", "prepare", "pnpm@latest", "--activate"])
      .withDirectory("/app", source)
      .withMountedCache("/root/.local/share/pnpm/store", pnpmCache)
      .withWorkdir("/app")
      .withEnvVariable("CI", "true")
      .withExec(["pnpm", "install"])
      .withExec(["pnpm", "run", "build"])
      .directory("/app/dist");
  }
}
```

Daggerコンテナ内でビルドして、結果の`dist`ディレクトリを返すだけのものです。このディレクトリをGithub Actionsで取り出してGitHub Pagesにデプロイします。

Github Actionsでは`dagger/dagger-for-github`アクションを使い、`build`関数を呼び出して結果を`./dist`にエクスポートします。


```yaml
name: Deploy to GitHub Pages with Dagger

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Build and export with Dagger
        uses: dagger/dagger-for-github@v8.2.0
        with:
          verb: call
          args: build --source=. export --path=./dist

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

これでデプロイできました。

## まとめ

Daggerはコンテナ内で動く以上、どうしてもGithub Actionsコンテナ内でまたコンテナが作られるという形になります。しかしGithub Actionsのライブラリを使うことが現実的な解となることから、避けられません。もっともこれは、別環境でも簡単に乗り換えられるというメリットにもなります。

何にせよ、型安全に書ける上に、Daggerだけローカルで動かしてテストしたりもできるため、かなり便利かと思います。
