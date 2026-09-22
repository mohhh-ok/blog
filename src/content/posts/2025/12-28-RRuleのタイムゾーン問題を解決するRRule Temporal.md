---
title: RRuleのタイムゾーン問題を解決するRRule Temporal
pubDate: 2025-12-28
categories: ["TypeScript"]
---

こんにちは、フリーランスエンジニアのmohです。

## 繰返しスケジュール

繰返しスケジュールを実装する場合、iCalendarの仕様に従うのが無理がありません。

https://datatracker.ietf.org/doc/html/rfc5545

iCalendarは予定表データの交換形式として広く使われており、GoogleカレンダーやOutlookなどの主要なカレンダーアプリケーションで採用されています。

## RRule

RRuleはiCalendarの仕様に従うためのライブラリです。

https://github.com/jkbrzt/rrule

基本的にはUTCで実装する必要があります。

> Important: Use UTC dates
> Dates in JavaScript are tricky. RRule tries to support as much flexibility as possible without adding any large required 3rd party dependencies, but that means we also have some special rules.

### RRuleの問題点

しかし実際にシステムに組み込む場合、日本時間とどうしても混在してしまいます。これは混乱の元となり、バグの温床になりかねません。

例えば、「毎週月曜日の午前10時」という繰り返しスケジュールを実装する場合を考えてみましょう。

```typescript
import { RRule } from 'rrule';

// UTCで2025年1月6日 01:00 (JST 10:00) を指定
const rule = new RRule({
  freq: RRule.WEEKLY,
  byweekday: [RRule.MO],
  dtstart: new Date(Date.UTC(2025, 0, 6, 1, 0, 0)),
  count: 3
});

console.log(rule.all());
// 出力される日時はUTCなので、JSTに変換する必要がある
```

このコードには以下の問題があります:

1. **タイムゾーンの変換が煩雑**: UTC時刻と日本時間を常に意識して変換する必要がある
2. **サマータイムの考慮が困難**: グローバルなアプリケーションでは各地域のサマータイムを手動で処理する必要がある
3. **コードの可読性が低い**: `Date.UTC(2025, 0, 6, 1, 0, 0)` が日本時間の何時を表しているのか直感的に分からない

またPythonから移植されたこともあり、TypeScriptの恩恵を最大限に活かせていない印象もあります。具体的にはTypeScriptなら文字列ユニオンで実装するのが自然なところ、enumで書かれていたりします。

```typescript
// RRuleではenumを使用
RRule.WEEKLY  // これはTypeScript的には不自然

// TypeScriptなら文字列ユニオンの方が自然
type Frequency = 'YEARLY' | 'MONTHLY' | 'WEEKLY' | 'DAILY';
```

## RRule Temporal

TemporalはJavaScriptのDateを置き換える新しい仕組みです。2025年12月28日時点ではまだ実験段階ですが、将来的にJavaScript標準になると考えられます。

https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Temporal

RRule Temporalは、このTemporalをRRuleで使えるようにしたものです。これにより、自然にRRuleを使うことができます。

https://github.com/ggaabe/rrule-temporal

### RRule Temporalの利点

RRule Temporalを使用すると、先ほどの例は以下のように書けます:

```typescript
import { Temporal } from "@js-temporal/polyfill";
import { RRuleTemporal } from "rrule-temporal";

// 日本時間で直接指定できる
const rule = new RRuleTemporal({
  freq: "WEEKLY",
  byDay: ["MO"],
  dtstart: Temporal.ZonedDateTime.from({
    year: 2025,
    month: 1,
    day: 6,
    hour: 10,
    minute: 0,
    timeZone: "Asia/Tokyo",
  }),
  count: 3,
});

const occurrences = rule.all();
console.log(occurrences.map(o => o.toLocaleString("ja-JP")));
// 日本時間で表示される
```

この実装には以下のメリットがあります:

1. **タイムゾーンを明示的に指定**: `timeZone: 'Asia/Tokyo'` と書くだけで日本時間として扱える
2. **型安全性の向上**: `freq: 'WEEKLY'` のように文字列ユニオンで型チェックが効く
3. **可読性の大幅な向上**: コードを見ただけで「日本時間の10時」だと分かる
4. **サマータイムの自動処理**: Temporalがタイムゾーンルールを考慮して自動的に処理してくれる

### 導入方法

現時点ではTemporalはPolyfillを使用する必要があります。

```bash
npm install rrule-temporal @js-temporal/polyfill
```


## まとめ

RRule Temporalを使用することで、以下の恩恵を受けられます:

- タイムゾーンを意識した直感的なコード
- TypeScriptの型システムを活用した安全な実装
- 将来的なJavaScript標準への対応

Temporalはまだ実験段階ですが、将来的には広く使われることが予想されます。今のうちから慣れておくことで、スムーズな移行が可能になるでしょう。
