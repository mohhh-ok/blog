---
title: "【GAS】eBayのOAuth2認証をする"
pubDate: 2025-03-14
categories: ["GAS"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## eBayのAPI

eBayのAPIは、セキュリティ強化のためOAuth2が必須となったようです。そのためいくつかのAPIが使用不可能になっており、OAuth2への切り替えが必要です。しかしeBayのOAuth2は癖が強いため、工夫が必要です。

## RedirectUriが癖つよい

eBayで指定するRedirectUriは、直接URLを指定しません。eBayの指定するRuNameと呼ばれる値を指定する必要があります。これはRedirectUriごとに設定されています。

[https://developer.ebay.com/api-docs/static/oauth-redirect-uri.html](https://developer.ebay.com/api-docs/static/oauth-redirect-uri.html)

## Headerが癖つよい

eBayでTokenを取得する際のHeaderには、下記を指定する必要があります。

```
Authorization – The word Basic followed by your Base64-encoded OAuth credentials (<client_id>:<client_secret>)
```

## apps-script-oauth2で実装する

すでにサンプルが提供されています。

[https://github.com/googleworkspace/apps-script-oauth2/blob/master/samples/eBay.gs](https://github.com/googleworkspace/apps-script-oauth2/blob/master/samples/eBay.gs)

```javascript
// 一部抜粋

function getService_() {
  return OAuth2.createService('eBay')
      // Set the endpoint URLs (sandbox environment).
      .setTokenUrl('https://api.sandbox.ebay.com/identity/v1/oauth2/token')
      .setAuthorizationBaseUrl('https://signin.sandbox.ebay.com/authorize')

      // Set the client ID and secret.
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)

      // Set the name of the callback function in the script referenced
      // above that should be invoked to complete the OAuth flow.
      .setCallbackFunction('authCallback')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties())

      // Set the redirect URI to the RuName (eBay Redirect URL name).
      .setRedirectUri(RU_NAME)

      // Set the require scopes.
      .setScope('https://api.ebay.com/oauth/api_scope/sell.inventory.readonly')

      // Add a Basic Authorization header to token requests.
      .setTokenHeaders({
        Authorization: 'Basic ' +
            Utilities.base64Encode(CLIENT_ID + ':' + CLIENT_SECRET)
      });
}
```

これで、GASでeBayのAPIトークンを取得できるようになります。
