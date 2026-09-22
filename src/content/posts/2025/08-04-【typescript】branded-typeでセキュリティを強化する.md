---
title: "【TypeScript】Branded typeでセキュリティを強化する"
pubDate: 2025-08-04
categories: ["TypeScript"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

以前にzodでのbrandについての記事を書きました。

https://www.masaakiota.net/2025/06/12/%e3%80%90typescript%e3%80%91zod%e3%81%aebrand%e3%81%a7%e3%83%91%e3%82%b9%e3%83%af%e3%83%bc%e3%83%89%e6%bc%8f%e6%b4%a9%e3%82%92%e9%98%b2%e3%81%84%e3%81%a0%e3%82%8a%e8%89%b2%e3%80%85%e3%81%99%e3%82%8b/

しかしDrizzleなどを使用していると、直接zodに変換できなかったりするため、TypeScriptプレーンでbrandを行う方法です。

## Branded type

Branded typeは、通常の型の中でさらに区別をつけるためのものです。たとえば

```typescript
// 普通
type Name = string;

// Branded
type CatName = string & {__catname: true}
```

こうすることで、CatNameはただのstringではなく、特別なstringということになります。

## symbolを使う

上記方法でもいいのですが、unique symbolを使うと一意性が保たれてより良いです。

```typescript
type CatName = string & {readonly __brand: unique symbol};
```

さらに変換関数もつけると、便利になります。

```typescript
export function brandCatName(name: string){
  return name as CatName
}
```

ただ、単にasで変換しているだけなので、あまり意味は見出せません。

## セキュリティ強化に使用する

ユーザーのパスワードの漏洩を防止する目的で考えてみます。

```typescript
type User = {
  name: string;
  password: string;
}
```

今時は、生でパスワードを保存することはありません。適切なアルゴリズムのライブラリを用いてハッシュ化したものが保存されます。そのため漏れてもすぐに危険ということはないのですが、ローカル保存されると高速でアタックされて破られる可能性も出てくるため、ハッシュといえど漏れないようにするのが基本です。また気づかずにクライアントに送信している場合もあるため、サニタイズは必ずサーバー側で行う必要があります。

ここでパスワードなしの型を作ってみます。

```typescript
type UserSanitized = Omit<User, 'password'>
```

これを使って、下記のような処理を入れます。

```typescript
function showUser(user: UserSanitized){
  alert(JSON.stringify(user));
}
```

さてここで、UserSanitizedを受け取っているため、一見安全に見えます。しかし実際にはパスワードが入ってきていても、型エラーにはなりません。

```typescript
showUser({name: 'Taro', password: 'abc'}) // 型エラーにならない
```

これは問題です。

そのため、UserSanitizedをbrand typeにし、変換関数でサニタイズします。これはサーバー側で行う必要があります。

```typescript
export type UserSanitized = Omit<User, 'password'> & {readonly __brand: unique symbol}

export function sanitizeUser(user: User){
  const {password, ...omitted} = user;
  return omitted as UserSanitized;
}
```

なおサーバー側であることを明確にするため、下記のような関数を使用するのも有効です。

```typescript
function ensureServer() {
  if (typeof window !== 'undefined') {
    throw new Error('This function should be called on the server');
  }
}
```

sanitizeUserを使用することで、下記のようになります。簡略化して書いています。

```typescript
const user: User = {name: 'Taro', password: 'abc'};

function showUser(user: UserSanitized){
  alert(JSON.stringify(user));
}

function main(){
  showUser(user); // 型エラーになる

  // 実際はサーバー側で行う
  const sanitized = sanitizeUser(user);
  showUser(sanitized); // 通るようになる
}
```

これで、sanitize関数を必ず通す必要が出るため、セキュリティの向上が計れます。可能なら、User type自体をexportせずに、SanitizedUserだけexportできるとなお堅牢です。

## 注意

brand typeはasをすると突破されてしまいます。

```typescript
showUser(user as UserSanitized); // 通ってしまう
```

ここは注意ですね。
