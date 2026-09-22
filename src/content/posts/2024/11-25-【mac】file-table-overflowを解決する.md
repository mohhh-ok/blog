---
title: "【Mac】file table overflowを解決する"
pubDate: 2024-11-25
categories: ["開発"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## file table overflow

Nestjsの開発中に、以下のエラーが発生しました。Mac再起動時にエラーメッセージを紛失してしまいましたので、エラーの一部のみです。

```
... file table overflow ...
```

原因はNodeではなく、Mac OSのもののようです。

## 確認

以下のコマンドで、現在のfile descriptorsの設定値を確認できます。

```
ulimit -a
```

私の場合、以下の結果でした。

```
masaaki@Mac-mini ~ % ulimit -a
-t: cpu time (seconds)              unlimited
-f: file size (blocks)              unlimited
-d: data seg size (kbytes)          unlimited
-s: stack size (kbytes)             8176
-c: core file size (blocks)         0
-v: address space (kbytes)          unlimited
-l: locked-in-memory size (kbytes)  unlimited
-u: processes                       4000
-n: file descriptors                256
```

この-nの部分、file descriptorsの値を上げればいいようです。

## 解決策

### /etc/sysctl.confをいじるといいらしい

ChatGPT大先生によれば、/etc/sysctl.confをいじるといいとのことでしたので、早速ファイルを探しに行きました。ですが私のMacOS Sonomaでは、該当ファイルを見つけることができませんでした。/etc/sysctl.dディレクトリも存在しません。

そもそもそうした重要なファイルをいじると、下手すればMacが起動しなくなってしまう恐れもあります。そのためできれば他の方法が望ましいです。

### .zshrcをいじった

.zshrcに以下の行を追加しました。

```
# avoid file table overflow
ulimit -n 512
```

再度確認してみます。

```
masaaki@Mac-mini ~ % ulimit -a
-t: cpu time (seconds)              unlimited
-f: file size (blocks)              unlimited
-d: data seg size (kbytes)          unlimited
-s: stack size (kbytes)             8176
-c: core file size (blocks)         0
-v: address space (kbytes)          unlimited
-l: locked-in-memory size (kbytes)  unlimited
-u: processes                       4000
-n: file descriptors                512
```

512に上がっているのを確認できました。
