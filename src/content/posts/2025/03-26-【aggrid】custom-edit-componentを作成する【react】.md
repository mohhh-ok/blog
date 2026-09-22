---
title: "【AgGrid】Custom Edit Componentを作成する【React】"
pubDate: 2025-03-26
categories: ["React"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## AgGridのCustom Edit Component

AgGridでは、カスタムの編集コンポーネントを作成できます。ただもともと情報が少ない上に、バージョンアップで古い方法が使えなかったりするので、今回簡単にまとめてみます。

使用バージョンは、Ag Grid 33です。

なお以下の方法は、バージョンアップに伴って使えなくなっているようです。多分。

*   useImperativeHandleによるgetValue

あとはクラスによる実装が紹介されていたりしますが、今時のReactのスタイルと離れているためこれも却下かと思います。

## 案外簡単に作れる

公式で紹介されているコードを、TypeScriptで書き換えてみました

```jsx
function MyEdit ({ value, onValueChange }: CustomCellEditorProps) {
  return (
    <input
      type="text"
      value={value || ''}
      onChange={({ target: { value }}) => onValueChange(value === '' ? null : value)}
    />
  );
}
```

ChatGPTとどれだけ格闘したと思ってるんだ。。。シンプルですね。

## 実用的なサンプル

以下は実用的なサンプルです。といいつつシンプルです。

```jsx
const columns: ColDef[] = [{
  editable: true,
  cellEditor: TestSelector,
  cellEditorParams: {
    values: ["orange", "apple", "banana"]
  },
}];


function MyEditor(props: CustomCellEditorProps & { values: string[] }) {
  const { value, values, onValueChange, stopEditing } = props;

  return <Select
    open={true} // 自動で開く
    onClose={() => stopEditing()} // 自動で閉じる
    value={value}
    onChange={(e) => {
      onValueChange(e.target.value);
      stopEditing();
    }}>
    {values.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
  </Select>
}
```

ここまでいければ、あとはどうにでもなりそうですね。
