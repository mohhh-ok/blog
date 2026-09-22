---
title: "【React】数字フィールドでIME日本語入力を攻略する"
pubDate: 2025-05-22
categories: ["React"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## 数字フィールドでのIME

通常、数字入力には下記を使用します。

```
<input type="number"...
```

しかしIMEがオンになってると意図しない挙動になったりします。

## onChangeのみでのカーソル問題

type="text"にしてonChangeで強制的に変換するのもいいのですが、今度はカーソル問題が出てきます。入力するたびにカーソルが後ろに行ってしまいます。こういうことが何度かあり、その度に挑戦しては諦めて代替案を採用していました。

しかし今回、克服できたので共有させていただきます。

## selectionStartとrequestAnimationFrameを使用する

selectionStartでカーソル位置を取得できます。ここから計算して、編集後にカーソルを移動させます。ただし普通に行った場合はReactの更新プロセスが後に来てしまい、意味がありません。

そこでrequestAnimationFrameを使用します。requestAnimationFrameは、次のフレーム更新直前に関数を実行してくれるため、Reactの後に割り込むことが可能となります。なおこうした使用方法はトリッキーです。ChatGPTが出した回答に入っていたのですが、通常の使用方法ではありません。裏技的な手法となります。

下記のコードでは、IMEオンの時でも常に半角数字が入力されます。react-number-formatライブラリよりも良いです。

```jsx
import { useCallback } from 'react';

export interface NumberTextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  onChange?: (value: string) => void
}

export const NumberTextField = (props: NumberTextFieldProps) => {
  const { onChange, ...restProps } = props;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    const originalValue = e.target.value

    // 半角数字のみに変換
    const numbersOnly = toNumbersOnly(originalValue)

    // カーソル位置計算
    const beforeCursorLength = (() => {
      const cursorPosition = input.selectionStart || 0

      // カーソル位置より前の文字列
      const beforeCursor = originalValue.slice(0, cursorPosition)

      // カーソル位置より前の部分を変換した場合の長さを計算
      const convertedBeforeCursor = toNumbersOnly(beforeCursor);
      return convertedBeforeCursor.length
    })();

    // 親コンポーネントへの通知
    onChange?.(numbersOnly)

    // カーソル位置を補正して復元。
    // requestAnimationFrameで、Reactのレンダリング後にタイミングをずらす
    requestAnimationFrame(() => {
      const newPosition = Math.min(
        beforeCursorLength,
        numbersOnly.length
      )
      input.setSelectionRange(newPosition, newPosition)
    })
  }, [onChange])

  return (
    <input
      {...restProps}
      type="text"
      onChange={handleChange}
    />
  )
}

// 半角数字のみに変換
function toNumbersOnly(value: string | undefined) {
  const converted = value?.replace(/[０-９]/g, (s) => {
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0)
  })
  return converted?.replace(/[^0-9]/g, '') ?? ''
}
```

下記のように使用します。

```jsx
import { Box } from '@mui/material'
import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { NumberTextField } from './components/NumberTextField'

const App = () => {
  const [value, setValue] = useState('')
  return (
    <Box>
      <NumberTextField
        value={value}
        onChange={(value) => setValue(value)}
      />
    </Box>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```
