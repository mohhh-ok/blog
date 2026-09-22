---
title: "ストリーミング時のhttps-portal設定"
pubDate: 2023-08-22
categories: ["開発"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

OpenAIなどのChat系のAPIを使う場合、逐次結果を表示するのがセオリーです。今回は、Dockerイメージの１つであるhttps-portalを使用する際の、逐次表示の設定についてです。

## https-portal

https-portalは、Dockerイメージの一つで、サイトを簡単にhttps化することができます。内部でnginxが動いてますので、設定はこのnginxをいじることとなります。

### CUSTOM\_NGINX\_SERVER\_CONFIG\_BLOCK

docker-compose.ymlで、CUSTOM\_NGINX\_SERVER\_CONFIG\_BLOCKを設定します。具体的には、以下のようになります。JavaScriptのEventSourceで、xxx/stream/xxxといったURLからストリーミングするのを想定しています。

```
 CUSTOM_NGINX_SERVER_CONFIG_BLOCK: |
        location ~ /stream/ {
            proxy_pass http://web:8000;
            proxy_http_version 1.1;
            proxy_set_header Host $$host;
            proxy_set_header X-Real-IP $$remote_addr;
            proxy_set_header X-Forwarded-For $$proxy_add_x_forwarded_for;
            proxy_buffering off;
            add_header 'Cache-Control' 'no-cache';
        }
```

ここに入れた文字列が、nginx設定のserver{}内に入ることとなります。注意点としましては、$を入れると展開されてしまうので、$$とする部分です。

全体だと、以下のようになります。

```
version: '3'

services:
  web:
    image: python:latest
    
    command: gunicorn main.wsgi:application --bind 0.0.0.0:8000
    ports:
      - "8000:8000"
    volumes:
      - docker-vol:/vol

  https-portal:
    image: steveltn/https-portal:1
    ports:
      - '80:80'
      - '443:443'
    links:
      - web
    restart: always
    environment:
      DOMAINS: 'xxx.com -> http://web:8000'
      STAGE: 'local' # Don't use production until staging works
      CUSTOM_NGINX_SERVER_CONFIG_BLOCK: |
        location /static/ {
            alias /vol/static/;
        }
        location ~ /stream/ {
            proxy_pass http://web:8000;
            proxy_http_version 1.1;
            proxy_set_header Host $$host;
            proxy_set_header X-Real-IP $$remote_addr;
            proxy_set_header X-Forwarded-For $$proxy_add_x_forwarded_for;
            proxy_buffering off;
            add_header 'Cache-Control' 'no-cache';
        }
    volumes:
      - docker-https:/var/lib/https-portal
      - docker-vol:/vol

volumes:
  docker-vol:
  docker-https:
```

以上、簡単ですが、https-portalでストリーミングを設定する方法でした。
