---
title: "【GAS】指定アカウントのGmail OAuth2トークンを取得する"
pubDate: 2025-01-06
categories: ["GAS"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## GASのOAuth2

GASでOAuth2を使用するには、以下のライブラリを使用します。

https://github.com/googleworkspace/apps-script-oauth2

## 指定アカウントのGmail OAuth2トークンを取得する

createServiceの引数でemail自体を指定することで、キーが分離されます。それにより、複数アカウントの情報がuserPropertyに保存されるようになります。

下記のようにして実現できます。

```javascript
function main() {
  const email = 'xxx@example.com'; // 任意のGmailアカウント
  const token = getMailToken(email);
  if (token) {
    SpreadsheetApp.getUi().alert(`認証済みです。token: ${token}`);
  }
}

function getMailToken(email) {
  const service = getMailService_(email);
  if (!service.hasAccess()) {
    const authorizationUrl = service.getAuthorizationUrl();
    showAuthDialog(authorizationUrl);
    return undefined;
  }
  return service.getAccessToken();
}

function showAuthDialog(authorizationUrl) {
  const template = HtmlService.createTemplate(`
      <button onclick="window.open('${authorizationUrl}');google.script.host.close()">
        認証
      </button>
      をクリックして、処理を完了してください。
    `);
  template.authorizationUrl = authorizationUrl;
  const page = template.evaluate();
  SpreadsheetApp.getUi().showModalDialog(page, '認証');
}

function getMailService_(email) {
  return OAuth2.createService(email) // emailを指定することで、個別にデータが保存される
    .setAuthorizationBaseUrl('https://accounts.google.com/o/oauth2/auth')
    .setTokenUrl('https://accounts.google.com/o/oauth2/token')
    .setClientId(PropertiesService.getScriptProperties().getProperty('CLIENT_ID'))
    .setClientSecret(PropertiesService.getScriptProperties().getProperty('CLIENT_SECRET'))
    .setCallbackFunction('authCallback')
    .setPropertyStore(PropertiesService.getUserProperties())
    .setScope('https://www.googleapis.com/auth/gmail.readonly')
    .setParam('login_hint', email)
    .setParam('access_type', 'offline')
    .setParam('prompt', 'consent');
}

function authCallback(request) {
  const email = request.parameter.serviceName;
  const service = getMailService_(email);
  const isAuthorized = service.handleCallback(request);
  if (isAuthorized) {
    return HtmlService.createHtmlOutput('Success! You can close this tab.');
  } else {
    return HtmlService.createHtmlOutput('Denied. You can close this tab');
  }
}

```
