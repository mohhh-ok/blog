---
title: 【MUI】Floating Labelが初期表示と重なる問題
pubDate: 2025-12-23
categories: ["MUI"]
---

こんにちは、フリーランスエンジニアのmohです。

## Floating Label

通常、入力コントロールにはラベルを付与します。そのうちFloating Labelは、コントロールが未入力の場合にプレイスホルダーとして表示され、フォーカスが当たると通常のラベルの位置に移動します。おしゃれな機能です。

## MUIのFloating Labelが重なる問題

MUIもFloating Labelを採用しています。簡単に実装できて便利ですが、場合によっては予期せぬ表示になったりします。

例えばTextFieldでtype="date"の場合、初期状態で「年/月/日」が表示されますが、そこにFloating Labelが重なってしまいます。date以外にもこうしたパターンは存在します。

![Floating Labelが重なる問題](./12-23-mui-img.png)

これではまともな利用ができません。MUIはこの問題にデフォルトでは対応しておらず、使用する側でオプションを指定する必要があります。

## 解決

### 基本的な解決

MUI TextFieldでFloating Labelが初期表示と重なる問題を解決するには、shrink:trueを指定します。下記はFloating Labelが重なる問題を解決した例です。

```tsx
<TextField
  label="日付"
  type="date"
  slotProps={{ inputLabel: { shrink: true } }}
/>

<TextField
  label="日時"
  type="datetime-local"
  slotProps={{ inputLabel: { shrink: true } }}
/>

<TextField
  label="時刻"
  type="time"
  slotProps={{ inputLabel: { shrink: true } }}
/>

<TextField
  label="月"
  type="month"
  slotProps={{ inputLabel: { shrink: true } }}
/>

<TextField
  label="週"
  type="week"
  slotProps={{ inputLabel: { shrink: true } }}
/>

<TextField
  label="ファイル"
  type="file"
  slotProps={{ inputLabel: { shrink: true } }}
/>
```

### Themeで一括設定

プロジェクト全体で`shrink: true`を適用する場合は、Themeで設定すると便利です。

```tsx
import { createTheme, ThemeProvider } from '@mui/material';

const theme = createTheme({
  components: {
    MuiTextField: {
      defaultProps: {
        slotProps: { inputLabel: { shrink: true } }
      }
    }
  }
});

// アプリ全体をThemeProviderでラップ
<ThemeProvider theme={theme}>
  {/* 全てのTextFieldにshrink: trueが適用される */}
</ThemeProvider>
```

### InputLabelPropsとの違い

MUIの古いバージョンやドキュメントでは、以下のような書き方を見かけることがあります。

```tsx
// 古い書き方（MUI v5以前）
<TextField
  label="日付"
  type="date"
  InputLabelProps={{ shrink: true }}
/>
```

MUI v5以降では`slotProps`を使った書き方が推奨されています。将来的には非推奨となる可能性があるため、新規プロジェクトでは`slotProps`を使用することが推奨されます。
