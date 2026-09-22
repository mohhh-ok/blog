---
title: 【Web開発】実機テストを楽にするngrok
pubDate: 2026-01-11
categories: ["開発"]
---

こんにちは、フリーランスエンジニアのmohです。

## Web開発での実機テスト

通常のWeb開発では、PCを対象としたテストは簡単です。開発環境を立ち上げて、そのままChromeや各種ブラウザーでテストすればいいだけです。ですがスマホなどだとひと工夫が必要です。例えばiPhoneやandroidなどの各種端末のシミュレータを使用してテストする方法もありますが、これはマウスでスマホやタブレットを操作したり、いつもと違うキーボード配列で文字を打ったりとなかなか大変です。

そこで実機テストとなります。実機テストは手持ちの実機でしかテストできないというデメリットもありますが、メリットもあります。

- シミュレータでは再現できない部分でも確実なテストができる
- 操作性が良い
- パフォーマンスが良い

ということでWeb開発における実機テストの方法として、ngrokを使用してみます。

## ngrok

ngrokを使用すると、開発サーバーをそのまま楽に公開できます。

https://ngrok.com/

アカウント登録した後、指示に従ってインストールします。

```sh
brew update
brew install ngrok
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

実行します。

```sh
ngrok http 80
```

以下の表示になりました。

```sh
ngrok                                                                                                                     (Ctrl+C to quit)
                                                                                                                                          
🚪 One gateway for every AI model. Available in early access *now*: https://ngrok.com/r/ai                                                
                                                                                                                                          
Session Status                online                                                                                                      
Account                       YOUR_ACCOUNT (Plan: Free)                                                                          
Version                       3.34.1                                                                                                      
Region                        Japan (jp)                                                                                                  
Latency                       22ms                                                                                                        
Web Interface                 http://127.0.0.1:4040                                                                                       
Forwarding                    https://xxx-yyy-zzz.ngrok-free.dev -> http://localhost:80                             
                                                                                                                                          
Connections                   ttl     opn     rt1     rt5     p50     p90                                                                 
                              0       0       0.00    0.00    0.00    0.00                                                 
```

アカウントごとに割り当てられたURLが、ローカルのポート80番につながっています。

## 実際の開発サーバーでの使用例

実際の開発では、各フレームワークやツールが使用するポートを指定してngrokを起動します。

### Next.jsの場合

```sh
# Next.jsのデフォルトポート3000を公開
ngrok http 3000
```

### Viteの場合

```sh
# Viteのデフォルトポート5173を公開
ngrok http 5173
```

### Reactの場合（Create React App）

```sh
# Create React Appのデフォルトポート3000を公開
ngrok http 3000
```

## 実機テストの手順

1. ローカルで開発サーバーを起動
2. 別のターミナルでngrokを起動
3. 表示されたForwarding URLをスマホのブラウザで開きます
4. 実機でテストを行います

## Web Interface

ngrokを起動すると、`http://127.0.0.1:4040`でWeb Interfaceが利用できます。ここでは以下の情報が確認できます。

- リクエストとレスポンスの詳細
- ステータスコード
- リクエストヘッダー
- レスポンスボディ

デバッグ時に役立ちますね。

## セキュリティ上の注意点

### 公開範囲

無料プランの場合、URLは毎回固定のようです。生成されたURLを知っている人は誰でもアクセスできる上、URLは意味のある文字列で構成されているため、辞書攻撃で特定される懸念もあります。そのため基本的には何かしらでブロックする必要があります。

無料で使える認証は2026年1月12日現在以下とされています。

- OAuth
- Webhook Verification
- JWT Validation
- IP Restrictions
- OpenID Connect
- その他

#### Basic認証の追加

公式のダッシュボードでは紹介されていませんが、下記のBasic認証も使えます。これが一番手軽ではないかと思います。yamlで指定する方法もあるため、詳細は公式サイトをご確認ください。

```sh
ngrok http 3000 --basic-auth="username:password"
```

## まとめ

ngrokを使用することで、ローカル開発環境を簡単に外部公開でき、実機テストが格段に効率化されます。特にスマホアプリ開発やレスポンシブデザインの確認において、実機での動作確認は必須です。

無料プランでも十分に実用的ですが、頻繁に使用する場合は有料プランも検討する価値があるでしょう。開発効率を上げるためにも、ぜひngrokを活用してみてください。
