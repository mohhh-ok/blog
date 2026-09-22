---
title: "【Security】Argon2がNodeで標準装備"
pubDate: 2025-10-09
categories: ["Node.js"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## ハッシュ化

ハッシュ化は、かつてはMD5などが用いられていました。しかしこれは脆弱であるため、2025年現在はArgon2, Scrypt, Bcryptなどが推奨されています。Argon2とScryptはメモリハードでより突破されにくく、そのうち最も堅牢とされているのがArgon2です。

## Node.jsネイティブのArgon2

Argon2はNode.js v24.7から標準搭載されています。しかしかなり複雑な実装となります。

```typescript
// https://nodejs.org/api/crypto.html#cryptoargon2syncalgorithm-parameters
import { argon2Sync, randomBytes, timingSafeEqual } from 'node:crypto';

const CONFIG = {
  parallelism: 4,
  tagLength: 64,
  memory: 65536,
  passes: 3,
  algorithm: 'argon2id',
} as const;

export function hashPassword(password) {
  const nonce = randomBytes(16);
  const tag = argon2Sync(
    CONFIG.algorithm,
    {
      message: password,
      nonce,
      parallelism: CONFIG.parallelism,
      tagLength: CONFIG.tagLength,
      memory: CONFIG.memory,
      passes: CONFIG.passes,
    });
  return {
    algorithm: CONFIG.algorithm,
    parallelism: CONFIG.parallelism,
    tagLength: CONFIG.tagLength,
    memory: CONFIG.memory,
    passes: CONFIG.passes,
    nonceHex: nonce.toString('hex'),
    tagHex: tag.toString('hex'),
  };
}

export function verifyPassword(stored, password) {
  const nonce = Buffer.from(stored.nonceHex, 'hex');
  const expected = Buffer.from(stored.tagHex, 'hex');
  const actual = argon2Sync(stored.algorithm, {
    message: password,
    nonce,
    parallelism: stored.parallelism,
    tagLength: stored.tagLength,
    memory: stored.memory,
    passes: stored.passes,
  });
  return timingSafeEqual(expected, actual);
}

const stored = hashPassword('password');
console.log(verifyPassword(stored, 'password'));  // true
console.log(verifyPassword(stored, 'wrong'));     // false
```

## ライブラリのArgon2

ライブラリを使えばかなり楽に描けます。PHCフォーマットもされるため、DB保存もバッチリです。syncがないのが惜しいですが、メンテナンスコストは爆下がりです。

```typescript
import argon2 from 'argon2';

async function main() {
  const password = 'password';
  const hash = await argon2.hash(password);
  const isVerified = await argon2.verify(hash, password);
  console.log({ hash, isVerified });
}

main();
```

### Next.jsでは工夫が必要

Argon2ライブラリはバイナリを含むため、Next.jsでライブラリのArgon2を使う場合は工夫が必要です。以下のようにnext.config.tsで設定します。

```typescript
const config: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        argon2: 'commonjs argon2',
      });
    }

    return config;
  },
};

```
