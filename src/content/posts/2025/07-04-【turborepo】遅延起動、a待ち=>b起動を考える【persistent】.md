---
title: "【Turborepo】遅延起動、A待ち=>B起動を考える【persistent】"
pubDate: 2025-07-04
categories: ["Node.js"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Turborepoでの遅延起動

Turborepoでは、dependsOnを指定することで、起動待ちを実装することが可能です。ただし、これはpersistent=falseに限られています。

例えばtsc --watchや、next devといったpersistent=trueのタスクは、実行待ちをすることができません。これを待とうとすると、永遠に待つことになってしまうためです。また秒数による待機も実装されていないようです。これは困りました。

## 他ライブラリを組み合わせる

他ライブラリを組み合わせることで、実現可能です。

### wait-on

wait-onは、http通信が確立するのを待つことができます。

```bash
wait-on http://localhost:4000 && echo "HTTP connected!"
```

### concurrently

concurrentlyは、並列起動に用います。

```bash
concurrently "xxx" "yyy" 
```

### 組み合わせる

組み合わせると以下のようになります。

```json
{
  "scripts": {
    "dev": "concurrently \"xxx\" \"wait-on http://localhost:4000 && yyy\""
  }
}
```

例えばfirebase emulator起動を待ってから、next devする場合は以下のようになります。

```json
{
  "scripts": {
    "dev": "concurrently \"firebase emulators:start\" \"wait-on http://localhost:4000 && next dev\""
  }
}
```

turboと組み合わせて、emulatorとそれ以外とで組み合わせると以下のようになります。@localrepo/emulatorという名前で動かす場合です。

```json
{
  "scripts": {
    "dev": "concurrently \"turbo run dev --filter=@localrepo/emulator\" \"wait-on http://localhost:4000 && turbo run dev --filter=!@localrepo/emulator\""
  }
}
```
