---
title: "【AgGrid React】日付ピッカーが表示されない問題"
pubDate: 2025-11-09
categories: ["React"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。WordPressからNextra移行を真剣に考えてます。

## 環境

・ag-grid-community: ^34.2.0  
・ag-grid-react: ^34.2.0,

## AgGridでのtype:'date'

AgGridではcoldefにtypeを指定することで、起動するエディタを指定することができます。type='date'だと、編集時に日付ピッカーが起動します。これはAgGridにデフォルトで定義されているcolumn typeによるものです。ちなみにcolumn typeは独自で追加することも可能です。

## エディタが起動しないことがある

エディタが起動しないこともあります。すったもんだした挙句、すでに入っている値によることがわかりました。具体的には、値がnullなどの場合はなぜかエディタが起動しないようです。こんなことってあるんですね。

## エディタを指定すると解決する

なぜかエディタを具体的に指定すると解決するようです。

```
{ headerName: "日付", field: "my_date", type: "date", cellEditor: "agDateStringCellEditor", editable: true }
```

風の噂では、AgGridよりTanstack Tableの方がモダンとのことです。すでに他ライブラリでいろいろお世話になっているので、Tanstackも検討しようと思います。
