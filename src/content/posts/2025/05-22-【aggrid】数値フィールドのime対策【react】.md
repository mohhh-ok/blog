---
title: "【AgGrid】数値フィールドのIME日本語入力対策【React】"
pubDate: 2025-05-22
updatedDate: 2025-12-20
categories: ["React"]
---

こんにちは、フリーランスエンジニアのmohです。

## 背景

AgGridでの編集機能で、IME日本語入力時に半角に変換したい。

## AgGridのフィールド

AgGridでは、テーブルを直接編集する機能があります。ただしIMEとの相性はあまり良くありません。具体的には、NumberタイプのフィールドではIMEで入力された値が無視されてnullになります。

これを解決するには、文字列型にする必要があります。

## valueSetterとonCellValueChanged

編集を検知するには、valueSetterやonCellValueChangedなどがあります。以下のような特徴があります。

- valueSetter: セルに反映させる。同期処理限定
- onCellValueChanged: 編集後イベント

AgGridは内部で編集内容を保持しますが、onCellValueChangedでは編集内容を直接変えることはできません。直接値を変えるには、valueSetterで同期的に行う必要があります。

## 数値型の場合は日本語入力が破棄される

データ型が数値型の場合、IME日本語入力された値は破棄されてしまいます。そのため、そもそもプログラム側で検知することができません。

```tsx
// 数値型の場合
valueSetter: (params) => {
  // IMEオンでnewValeuがnullになるので使えない
  console.log("numColumn", params.newValue);
  return false;
},
```

そのため文字列型で扱う必要があります。文字列型ならnullにならず、プログラム側で制御できるようになります。

```tsx
valueSetter: (params) => {
  const field = params.colDef.field;
  if (!field) return false;
  // 値を変更する
  params.data[field] = doSomething(params.newValue);
  // 編集を確定する
  return true;
},
````

## サンプルコード

最終的に、今回のお話は下記のようなコードとなります。

```tsx
import {
  AllCommunityModule,
  type CellValueChangedEvent,
  ModuleRegistry,
  type ValueSetterFunc,
  type ValueSetterParams,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

export default function App() {
  // セル更新関数
  const valueSetter = ({ colDef, data, newValue }: ValueSetterParams) => {
    console.log("valueSetter", newValue);
    const field = colDef.field;
    if (!field) return false;
    data[field] = toHalfWidthNumber(newValue);
    return true;
  };

  // API用関数
  const onCellValueChanged = ({ newValue }: ValueSetterParams) => {
    console.log("onCellValueChanged", newValue);
    const hanValue = toHalfWidthNumber(newValue);
    // API処理をここに書く
    console.log("API処理", hanValue);
  };

  return (
    <div style={{ height: 400, width: 600 }}>
      <AgGridReact
        // numberタイプと文字列タイプの２列データ
        rowData={[
          { numColumn: 100, strColumn: "100" },
        ]}
        // 列定義
        columnDefs={[
          // numberタイプ
          // IMEオンの場合newValeuがnullになるので使えない
          {
            field: "numColumn",
            editable: true,
            valueSetter,
            onCellValueChanged,
          },
          // 文字列タイプ
          // IMEオンorオフに従ってnewValueがstring or numberになる
          {
            field: "strColumn",
            editable: true,
            valueSetter,
            onCellValueChanged,
          },
        ] as const}
      />
    </div>
  );
}

/**
 * 全角数字と半角数字のマッピング
 */
const FULL_WIDTH_TO_HALF_WIDTH_NUMBER: Record<string, string> = {
  "０": "0",
  "１": "1",
  "２": "2",
  "３": "3",
  "４": "4",
  "５": "5",
  "６": "6",
  "７": "7",
  "８": "8",
  "９": "9",
};

/**
 * 全角数字を半角数字に変換
 */
function toHalfWidthNumber(str: string | number): string {
  return str.toString().replace(/[０-９]/g, (char) => {
    return FULL_WIDTH_TO_HALF_WIDTH_NUMBER[char] ?? char;
  });
}
````
