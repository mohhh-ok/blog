---
title: "【MUI】Fade + Slide を機能させる"
pubDate: 2025-02-03
categories: ["MUI"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Fade, Slide

Fade, Slideは、MUIで使えるコンポーネントです。それぞれ、フェードとスライドのアニメーションを、簡単に実装できます。

## 同時に使うとうまくいかなかったりする

例えば、以下のようにするとうまくいきません。

```jsx
<Fade in={isIn} timeout={2000}>
  <Slide direction={props.direction} in={isIn} timeout={1000}>
    <Box>
      {props.children}
    </Box>
  </Slide >
</Fade>
```

Slideはしますが、フェードが効かなくなります。

## divで囲む

下記のようにdiv(Box)で囲むとうまくいきます。

```jsx
<Fade in={isIn} timeout={2000}>
  <Box>
    <Slide direction={props.direction} in={isIn} timeout={1000}>
      <Box>
        {props.children}
      </Box>
    </Slide >
  </Box>
</Fade>
```
