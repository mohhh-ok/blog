---
title: "【Laravel】SQLiteのW00をCarbonでパースする"
pubDate: 2024-12-26
categories: ["Laravel"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## SQLiteのWeek

SQLiteでは、週番号を取得するのに以下のようにします。

```
%Y-W%W
```

例えば2024年の第一週だと、2024-W01となります。

これが、ISOの規格と挙動が違うようで、ISOではW01からなのですが、SQLiteではW00から生成してしまいます。W00は、前年の最終週となるようです。

## Carbonでの問題と解決

Carbonでは、W01はパースできるのですが、W00はパースできません。

そこで、以下のようにします。一度インクリメントして、1week引いています。

```php
static function parseWeekFormat(string $period): Carbon
{
    if (str_contains($period, 'W00')) {
        $period = str_replace('W00', 'W01', $period);
        return Carbon::parse($period)->subWeek();
    }
    return Carbon::parse($period);
}
```
