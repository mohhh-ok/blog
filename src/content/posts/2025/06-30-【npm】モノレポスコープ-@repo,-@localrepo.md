---
title: "【NPM】モノレポスコープ @repo, @localrepo"
pubDate: 2025-06-30
categories: ["Node.js"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## モノレポのスコープ問題

モノレポの場合、複数ディレクトリそれぞれにpackage.jsonをおいて名前をつけます。

名前の付け方は基本的には自由です。private前提なら好き勝手つければいいし、publish前提なら被らない好きな名前をつければいいです。一方で一部をprivate管理にしたい時があります。その際に、privateでありながらやっぱり名前にはこだわりたい。他の使用済みの名前と被るのは精神衛生上如何なものかといった方も多いのではないかと思います。

まとめると、以下のような話です。

*   package nameには@xxx/yyy のように、スコープを指定したい
*   スコープはNPMに存在しないものを指定したい
*   わざわざ新しくNPMで取得することはしたくない

大規模なプロジェクトならNPM上でスコープを取得してPrivate運営することもあるでしょうが、ほとんどはそこまではいきません。単純に、ローカルで使うだけのためのスコープが欲しいのです。とはいえ、NPMとは被りたくない。

## スコープ名の制限

スコープは下記の制限があります。

> *   package name length should be greater than zero
> *   all the characters in the package name must be lowercase i.e., no uppercase or mixed case names are allowed
> *   package name _can_ consist of hyphens
> *   package name must _not_ contain any non-url-safe characters (since name ends up being part of a URL)
> *   package name should not start with `.` or `_`
> *   package name should _not_ contain any spaces
> *   package name should _not_ contain any of the following characters: `~)('!*`
> *   package name _cannot_ be the same as a node.js/io.js core module nor a reserved/blacklisted name. For example, the following names are invalid:
>     *   http
>     *   stream
>     *   node\_modules
>     *   favicon.ico
> *   package name length cannot exceed 214
> 
> [https://github.com/npm/validate-npm-package-name#naming-rules](https://github.com/npm/validate-npm-package-name#naming-rules)

たとえば@abc/abcといった名前は使えますが、NPMとバッティングする可能性があります。かといって、@/などといったスコープは使用できません。

```
import validate from 'validate-npm-package-name';

console.log(validate('@abc/abc')) // OK
console.log(validate('@/abc')); // ERROR: name can only contain URL-friendly characters
console.log(validate('@_/abc')); // ERROR: name can only contain URL-friendly characters
```

## ローカルで安全に使えるスコープ

### @repo

@repoはunusedでunclaimableとされています。

> We use `@repo` in our docs and examples because it is an unused, unclaimable namespace on the npm registry. You can choose to keep it or use your own prefix.
> 
> [https://turborepo.com/docs/crafting-your-repository/structuring-a-repository](https://turborepo.com/docs/crafting-your-repository/structuring-a-repository)

実際に[https://www.npmjs.com/~repo](https://www.npmjs.com/~repo)にアクセスすると確かにNotFoundになりません。turborepoが主張するように、確かにローカルで安心して使えそうです。

### @localrepo

またこうした懸念点は世界共通なのか、@localrepoという名前スペースを取得された方がいます。

[https://www.npmjs.com/package/@localrepo/pledge](https://www.npmjs.com/package/@localrepo/pledge)

これはBenjieさんによって作成されています。Benjieさんはスポンサーページを見ると、2025年6月30日時点で現在:77, 過去:172名がスポンサーとなっています。すごい。Graphql関連のライブラリがFeatureされています。実績があるため、相応の信頼性も担保されているかと思います。
