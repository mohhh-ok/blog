---
title: "【MUI】AutoComplete + Fuse.jsで曖昧検索する"
pubDate: 2025-02-02
categories: ["MUI"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## AutoComplete

AutoCompleteは、MUIのコンポーネントで、あらかじめ渡されたリストから一致するものを表示します。ただ曖昧検索はできないため、カスタムする必要があります。

## AutoComplete + Fuse.js

以下のようにします。

```jsx
import { Autocomplete, TextField } from "@mui/material";
import Fuse from "fuse.js";
import { useCallback, useEffect, useState } from "react";

const maxResults = 10;

interface Person {
  name: string;
  address: string;
  age: number;
}

const data: Person[] = [
  { name: "John", address: "Tokyo", age: 30 },
  { name: "Jane", address: "Osaka", age: 25 },
  { name: "Bob", address: "Kyoto", age: 40 },
];

export function SearchBox() {
  const [text, setText] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Fuseインスタンスを作成（あいまい検索のための設定）
  const fuse = new Fuse<Person>(data, {
    keys: ['name', 'address'], // 名前と住所のフィールドで検索
  });

  // テキストが変更されるたびに検索を実行
  useEffect(() => {
    const results = text ? fuse.search(text) : [];
    setSearchResults(results);
  }, [text]);

  // 検索結果を返す
  const filterOptions = useCallback(
    () => searchResults.slice(0, maxResults),
    [searchResults]);

  return (
    <Autocomplete
      freeSolo  // ユーザーが任意のテキストを入力可能
      options={searchResults}
      filterOptions={filterOptions}
      value={text}
      getOptionLabel={(option) => {
        // optionが文字列の場合（手入力値）はそのまま返す
        if (typeof option === 'string') return option;
        // Fuse検索結果からitemを取得して名前と住所を表示形式で返す
        const { item } = option;
        return `${item.name} (${item.address})`;
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      )}
    />
  );
}

```
