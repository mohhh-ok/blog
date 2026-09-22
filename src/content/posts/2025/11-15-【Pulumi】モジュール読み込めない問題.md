---
title: 【Pulumi】モジュール読み込めない問題
pubDate: 2025-11-15
categories: ['開発']
---

こんにちは、フリーランスエンジニアのmohです。

PulumiでTypeScriptモジュールをインポートする際に遭遇したエラーと、その解決方法について記録します。

## 環境

- @pulumi/pulumi: 3.207.0
- Node.js: ESM環境

## 発生した問題

Pulumiプロジェクトで自作のTypeScriptモジュールをインポートしようとしたところ、以下のエラーが発生しました。

```
Module '"xxx"' has no exported member yyy
```

モジュール自体は正しくエクスポートしているのに、なぜかPulumiから認識されないという状況です。

## 原因

Pulumiが生成する`tsconfig.json`には以下の設定が含まれています。

```json
{
  "compilerOptions": {
    "module": "nodenext",
    "moduleResolution": "nodenext"
  }
}
```

この設定は[公式ドキュメント](https://www.pulumi.com/docs/iac/languages-sdks/javascript/)で指定されており、変更することができません。

`module: "nodenext"`の場合、**ESMではimport文に拡張子が必須**となります。

つまり、読み込まれる側のモジュールで以下のように拡張子を省略していると：

```ts
export * from "./utils";      // ❌ 拡張子省略 → Pulumiから読めない
export const foo = "bar";     // ✅ 直接エクスポート → 読める
```

再エクスポート（`export * from ...`）の部分だけがPulumiから認識されず、エラーになります。

## 解決方法

### 1. 拡張子を明示的に指定

モジュール側で拡張子を含めてエクスポートします。

```ts
export * from "./utils.ts";   // ✅ 読める！
export const foo = "bar";     // ✅ 読める
```

### 2. tsconfig.jsonの調整

`.ts`拡張子を付けるとTypeScriptがエラーを出す場合があります。その際は以下の設定を追加します。

```json
{
  "compilerOptions": {
    "noEmit": true,
    "allowImportingTsExtensions": true
  }
}
```

- `noEmit`: コンパイル結果を出力しない（型チェックのみ）
- `allowImportingTsExtensions`: `.ts`拡張子付きimportを許可

## まとめ

Pulumiは`nodenext`モジュール解決を使用するため、ESMの厳密なルールに従う必要があります。再エクスポートを使う場合は拡張子を明示的に指定します。
