---
title: "【Docker】PHP FastCGI環境を構築する"
pubDate: 2024-07-09
categories: ["開発"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## PHP FastCGI

PHPは割と昔からある言語で、私は大学時代にお世話になっていました。Perlから移行したこともあり、その使いやすさに嬉しかったのを覚えています。そんなPHPも、今やだいぶレガシーな言語となりました。

そんなPHPでは、FastCGIというものがあります。通常はサーバーリクエストがあった時に逐一コード解釈から走るのですが、FastCGIだとそうではなく、もにょもにょして早さを実現している、と言うものだったと思います（うろ覚え）

## Dockerで構築する

以下は、PHP + FastCGI + Apache構成です。

```docker
version: '3.8'

services:
  web:
    image: php:8.1-fpm
    volumes:
      - ../public_html:/var/www/html/wp_dev_blog
    networks:
      - xs_network

  apache:
    image: httpd:2.4
    ports:
      - "80:80"
    volumes:
      - ../public_html:/var/www/html/wp_dev_blog
      - ./apache-config.conf:/usr/local/apache2/conf/httpd.conf
    networks:
      - xs_network

networks:
  xs_network:
    driver: bridge
```

ポイントは、phpとapacheとでpublic\_htmlディレクトリのフルパスを合わせると言うところですね。ここを合わせないと、phpにアクセスした時にFile not foundになってしまいます。これはphp-fpmに処理を渡したものの、フルパスが違うためにphp-fpmがFilen not foundを返してしまうためです。

以下はapache-config.confの中身です。

```apacheconf
ServerRoot "/usr/local/apache2"
Listen 80
LoadModule mpm_event_module modules/mod_mpm_event.so
LoadModule authn_core_module modules/mod_authn_core.so
LoadModule authz_core_module modules/mod_authz_core.so
LoadModule unixd_module modules/mod_unixd.so
LoadModule dir_module modules/mod_dir.so
LoadModule mime_module modules/mod_mime.so
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_fcgi_module modules/mod_proxy_fcgi.so

ServerName localhost

DocumentRoot "/var/www/html/wp_dev_blog"
<Directory "/var/www/html/wp_dev_blog">
    AllowOverride None
    Require all granted
</Directory>

<FilesMatch \.php$>
    SetHandler "proxy:fcgi://xserver_php_fpm:9000"
</FilesMatch>

DirectoryIndex index.php index.html
```

## 余談

最近、なか卯のカレーにハマってます。カツも何も入れずに、ただただ大盛りで頼んでます。
