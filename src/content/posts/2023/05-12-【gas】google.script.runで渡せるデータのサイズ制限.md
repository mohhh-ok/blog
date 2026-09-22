---
title: "【GAS】google.script.runで渡せるデータのサイズ制限"
pubDate: 2023-05-12
categories: ["GAS"]
tags: ["GAS"]
---

こんにちは。

フリーランスエンジニアのmohです。

今回は、GASでのgoogle.script.runにおけるデータ量の制限について書かせていただきます。

## google.script.runについて

google.script.runはGASダイアログなどで使用できるjavascript関数です。以下のように使用します。

```
const onSuccess=(data)=>{};
const onFailure=(e)=>{};
google.script.run.withSuccessHandler(onSuccess).withFailureHandler(onFailure).func(); // funcはGASに書いた関数
```

## 制限について

google.script.runはGASで作成した関数を呼び出すために使用するのですが、多くは引数を渡すことになります。その引数のデータサイズに制限があるようで、これは公式ドキュメントでは見つけられなかったため下記のようなコードでテストを行いました。

```javascript
/**
 * google.script.runで呼び出すテスト関数
 */
function test(str) {
    return 'Success';
}

/**
 * ダイアログを表示する
 */
function showDialog() {
    // ダイアログに表示するHTML
    const html = `
        <div id='log'></div>
        <script>
            // ログを出力する関数
            const log = str => document.querySelector('#log').innerHTML+=str+'<br/>';
            
            // 文字数指定
            const length = prompt('文字数を入力してください');
            
            // テスト文字列生成
            const testString='a'.repeat(length);
            
            // テスト文字列のサイズを取得
            const size=new Blob([testString]).size;
            log('size: '+(size/1000/1000)+'MB');

            // google.script.run
            google.script.run
                .withSuccessHandler(log)
                .withFailureHandler(log)
                .test(testString);
        </script>`;

    // ダイアログを表示
    SpreadsheetApp.getUi().showModalDialog(
        HtmlService.createHtmlOutput(html),
        'Dialog'
    );
}
```

上記コードを実行するとテスト用に生成する文字列の文字数を入力するプロンプトが出ます。50MBまでは大丈夫ですが、60MBの文字列では以下のエラーが表示されます。

```
NetworkError: 次の原因のために接続できませんでした: HTTP 413
```

413はPayloadの容量オーバーを表しています。60MB以上のデータは送信できないことが分かります。なお50MBでも52MBでも送信できましたので、上限設定は曖昧かもしれません。

## 対策

サイズ制限の対策として、以下が挙げられます。

### 不要なデータを削除

ユーザーから渡されたデータなどを使用する場合、不要な部分を削除できることがあります。その際はJavaScript側で一旦不要なデータを削除してから、GASに渡すとサイズ制限を突破する手助けとなります。

### 圧縮

データを圧縮アルゴリズムで圧縮してから、GASに渡します。JavaScript側とGAS側で同じアルゴリズムを使用する必要があります。

### 分割

データを指定サイズで分割し、少しずつGASに渡す方法です。あまりにデータが多すぎて上記の対策でも追いつかない場合の最終手段となります。
