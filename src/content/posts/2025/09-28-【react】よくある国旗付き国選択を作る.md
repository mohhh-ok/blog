---
title: "【React】よくある国旗付き国選択を作る"
pubDate: 2025-09-28
categories: ["React"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## 国選択UI

国選択UIは、国名のみのものもありますが、国旗があると親切です。また国名のローカライゼーションもあるとベストです。

今回は下記の条件で作ります。

*   国旗はUnicode文字を使用
*   国名はローカライズする

## 使用ライブラリ

国旗には下記のライブラリを使用しました。

[https://www.npmjs.com/package/country-flag-icons](https://www.npmjs.com/package/country-flag-icons)

Unicodeの国旗が使用でき、シンプルなAPIで使用感も良さそうです。

また国名のローカライゼーションにはIntl.DisplayNamesを使用します。ネイティブコードのためこちらはライブラリ不要です。

## セレクタを作ってみる

### 国一覧

国一覧は下記のようにして取得できます。

```typescript
import { countries } from 'country-flag-icons';
console.log(countries); // 要素数254のstring[] AC, AD, AE, AF, AG, AI, AL, ...
```

### 国旗

国旗はUnicodeで取得できます。超軽量です。

```typescript
import getFlag from 'country-flag-icons/unicode'
console.log(getFlag('JP'));
```

### ローカライゼーション

国コードからローカライゼーションされた国名を取得するには、下記のようにします。

```typescript
const getCountryName = (params: { locale: string, country: string }) => {
  const regionNamesInEnglish = new Intl.DisplayNames([params.locale], { type: "region" });
  return regionNamesInEnglish.of(params.country);
}
```

### セレクタ

簡単にセレクタが作れました。

```typescript
import { countries } from 'country-flag-icons';
import getFlag from 'country-flag-icons/unicode';

export default function App() {
  const locale = 'ja';
  return <CountrySelect locale={locale} />
}

function CountrySelect({ locale }: { locale: string }) {
  return <select>
    {countries.map((country) => (
      <option key={country} value={country}>
        {getFlag(country)} {getCountryName({ locale, country })}</option>
    ))}
  </select>
}

const getCountryName = (params: { locale: string, country: string }) => {
  const regionNamesInEnglish = new Intl.DisplayNames([params.locale], { type: "region" });
  return regionNamesInEnglish.of(params.country);
}
```
