---
title: "【Laravel】React + TypeScript環境を手軽に構築する"
pubDate: 2025-01-08
categories: ["Laravel"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## 環境構築

環境構築は、とても面倒なものです。どこをどう設定してと、いろいろなサイトを参考にしながら入力していったりします。しかし便利なツールもあったりするもので、今回はサクッと構築する方法のご紹介です。

## Laravel + React + TypeScript構築

以下のように行います。

```
composer create-project laravel/laravel example-app
cd example-app

# Breezeのインストール
composer require laravel/breeze --dev
php artisan breeze:install
```

すると、以下の選択肢が出てくるので、React with Inertiaを選択します。

```

 ┌ Which Breeze stack would you like to install? ───────────────┐
 │ › ● Blade with Alpine                                        │
 │   ○ Livewire (Volt Class API) with Alpine                    │
 │   ○ Livewire (Volt Functional API) with Alpine               │
 │   ○ React with Inertia                                       │
 │   ○ Vue with Inertia                                         │
 │   ○ API only                                                 │
 └──────────────────────────────────────────────────────────────┘
```

続いてTypeScriptを選択。他も好みに応じて選択してください。

```

 ┌ Would you like any optional features? ───────────────────────┐
 │ › ◻ Dark mode                                                │
 │   ◻ Inertia SSR                                              │
 │   ◻ TypeScript                                               │
 │   ◻ ESLint with Prettier                                     │
 └──────────────────────────────────────────────────────────────┘
```

以下はお好みで。Pestの方がモダンのようです。

```
 ┌ Which testing framework do you prefer? ──────────────────────┐
 │ › ● Pest                                                     │
 │   ○ PHPUnit                                                  │
 └──────────────────────────────────────────────────────────────┘
```
