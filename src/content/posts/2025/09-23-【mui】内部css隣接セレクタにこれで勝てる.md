---
title: "【MUI】内部CSS隣接セレクタにこれで勝てる"
pubDate: 2025-09-23
categories: ["MUI"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## CSSの仕様

CSSでは、隣接セレクタが強くなり、単体でのセレクタは負けてしまいます。そのためそういう場合は同じように隣接セレクタを使うか、!importantなどを使ったりして解決します。

## MUIの隣接セレクタ

MUIはたとえば以下のような隣接セレクタがあります。

```typescript
.MuiDialogTitle-root+.css-16wt3be-MuiDialogContent-root {
    padding-top: 0;
}
```

これはダイアログ内にあり、DialogContentの上部パディングです。このセレクタが強いため、通常の追加方法では勝てません。

試しにtheme内で下記のようにしてみます。

```typescript
export const theme = createTheme({
  ...
  components: {
    MuiDialogContent: {
      styleOverrides: {
        root: {
          paddingTop: '1.0rem',
        }
      }
    },
  }
});
```

これはDialogContentの上部パディングを上書きしていますが、反映されません。なぜなら前述の隣接セレクタが勝ってしまうためです。

## emotionの&&

この隣接セレクタに勝つために、下記のようにします。

```typescript
export const theme = createTheme({
  ...
  components: {
    MuiDialogContent: {
      styleOverrides: {
        root: {
          '&&': {paddingTop: '1.0rem'}
        }
      }
    },
  }
});
```

emotionの&は親セレクタを表します。つまり&&は親を２世代遡っているため、隣接セレクタ扱いとなります。

このようにすることで、隣接セレクタに勝つことができます。これで常勝街道まっしぐらですね。
