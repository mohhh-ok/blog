---
title: "【React】lazy導入で画面遷移しなくなった話"
pubDate: 2024-08-15
categories: ["React"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## lazyローディング

Reactで開発すると、通常はすべてのページがバンドルされ、ファイルサイズが膨大になります。それを防ぐため、逐一必要な部分だけロードするのがlazyです。

```jsx
const MyComponent = React.lazy(() => import('./MyComponent.tsx'));
```

このようにすることで、必要な時だけロードされるようになります。

## Routerで画面遷移しなくなった

以下のようにすると、画面遷移しなくなりました。再読み込みしないと画面が表示されないといった状態です。

```jsx
const SuperAdminIndex = React.lazy(() => import('./pages/superadmin'));
const TenantAdminIndex = React.lazy(() => import('./pages/admin'));
const AuthIndex = React.lazy(() => import('./pages/auth'));
const TicketsIndex = React.lazy(() => import('./pages/tickets'));

const container = document.getElementById('app');
const root = createRoot(container!);

root.render(
<BrowserRouter>
    <Routes>
        <Route path="/" Component={TopPage} />
        <Route path="/auth/*" Component={AuthIndex} />
        <Route path="/super_admin" Component={SuperAdminIndex} />
        <Route path="/admin/:tenantId/*" Component={TenantAdminIndex} />
        <Route path="/tickets/:ticketCode/*" Component={TicketsIndex} />
    </Routes>
</BrowserRouter>
```

## Suspenseを入れると解決

原因はよくわかってないのですが、とりあえずChatGPT先生に聞いたところ、Suspense入れたら？とのことでしたので以下のようにSuspenseを入れました。

```jsx
const SuperAdminIndex = React.lazy(() => import('./pages/superadmin'));
const TenantAdminIndex = React.lazy(() => import('./pages/admin'));
const AuthIndex = React.lazy(() => import('./pages/auth'));
const TicketsIndex = React.lazy(() => import('./pages/tickets'));

const container = document.getElementById('app');
const root = createRoot(container!);

root.render(
<BrowserRouter>
    <Suspense fallback={<div>Loading...</div>}>
        <Routes>
            <Route path="/" Component={TopPage} />
            <Route path="/auth/*" Component={AuthIndex} />
            <Route path="/super_admin" Component={SuperAdminIndex} />
            <Route path="/admin/:tenantId/*" Component={TenantAdminIndex} />
            <Route path="/tickets/:ticketCode/*" Component={TicketsIndex} />
        </ROutes>
    </Suspense>
</BrowserRouter>
```

とりあえずこれで、画面遷移するようになりました。ChatGPT先生もたまには役に立ちますね。いやかなりお世話になってます。

## 余談

ChatGPTは、見当違いの回答をしてきたりすることもあり結構しんどいこともあるのですが、基本的にはかなり助かってます。GPT5が早く出ないかなと待ち望んでます。そうするとエンジニアの仕事はかなり減ってしまいそうですが。。。
