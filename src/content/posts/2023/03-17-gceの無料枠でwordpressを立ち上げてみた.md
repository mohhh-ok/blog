---
title: "GCEの無料枠でWordPressを立ち上げてみた"
pubDate: 2023-03-17
categories: ["Google Cloud"]
---

![](http://35.221.87.155/wp-content/uploads/2023/03/server-2546330_640.jpg)

こんにちは。フリーランスmohです。

今回GCPの無料枠内でWordPressを立ち上げましたので、備忘録も兼ねてメモを残させて頂きます。

\[rtoc\_mokuji\]

## **GCE**の無料枠について

GCE(Google Cloud Engine)は、Googleの提供するGCP(Google Cloud Platform)の一部です。一定の範囲内は無料で使えます。

Compute Engineの無料枠の条件については以下のように書かれています。（2023/03/10時点）

*   非プリエンプティブル（Google側の負荷などの都合で急に停止されたりしない）である「e2-micro VM」 インスタンスを使用。このインスタンスは以下のリージョンで利用可能。
    *   オレゴン: us-west1
    *   アイオワ: us-central1
    *   サウスカロライナ: us-east1
*   30 GB-月の標準永続ディスク（デフォルトはバランス永続ディスクとなっているので注意）
*   5 GB 月のスナップショット ストレージ。次のリージョンで利用可能。
    *   オレゴン: us-west1
    *   アイオワ: us-central1
    *   サウスカロライナ: us-east1
    *   台湾: asia-east1
    *   ベルギー: europe-west1
*   1 GB の北米から全リージョン宛ての下りネットワーク（1 か月あたり、中国とオーストラリアを除く）

https://cloud.google.com/free/docs/free-cloud-features?hl=ja#compute

## **ドメインについて**

サイトを公開するにはドメインが必要です。ドメインがないとIPアドレス直書きとなってしまいますし、またhttpsも使えません。ですので泣く泣く以下のサイトでドメインを取得しました。一年で千円代とまぁリーズナブルです。

https://www.onamae.com

## **WordPress**構築手順

### **GCP**のCompute EngineでVMインスタンス生成

GCPサイトで、e2-micro VMインスタンスを立ち上げます。内容は冒頭にお伝えした通り、無料枠の範囲で設定します。

### **Docker**をいじる

今回はDockerを使用しました。以下の構成となっています。

*   MySQL
*   WordPress(Apache, PHP含む)
*   PHPMyAdmin
*   Nginx(https-portlに内蔵)

これらが独立したコンテナとして仮想構築され、それぞれで通信を行います。これがDockerです。一方MAMPなどを使用するとファイルがあちこちに分散して干渉し合わないかヒヤヒヤするのですが、そういった心配をしなくていいのも魅力的です。ただしその分容量は増えるため、昔のPCを使っている私のような場合はローカルテストはなかなか辛い面もあります。それでも、コンテナを消したり復活させたりするだけで環境がリセットされるのは、だいぶ嬉しいですね。

### インストール

VMには以下の説明に従ってインストールします。なおローカルテストを行うMACには、代わりにDocker Desktopをインストールします。

https://docs.docker.com/engine/install/ubuntu/

### ファイル構成

ファイル構成は以下のようにしています。

```yaml
- .env
- .env.prod
- docker-compose.yml
- mysql
  |- data
- https-portal
  |- data
- phpmy
  |- sessions
- wordpress
  |- data
    |- plubins
    |- themes
    |- puloads
```

### docker-compose.yml

docker-compose.ymlは色々参考にさせていただいて、以下のように設定しました。後々の拡張を考えるとhttps-portalは別ファイルにした方が良かったかもしれませんが、まぁその時は別でNginxを用意して分散させればいいかなと、そもそもそんなに拡張するのかと言うのもありまして、全部まとめて書きました。なお別途 .env ファイルにパスワードなどの情報を書き込んでいます。

```yaml
version: '3.4'

services:

  ###
  ## mysql
  #
  db:
    image: mysql:5.7
    volumes:
      - ./mysql/data:/var/lib/mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_PASS}
      MYSQL_DATABASE: wordpress
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASS}

  ###
  ## phpmyadmin
  #
  phpmyadmin:
    image: phpmyadmin/phpmyadmin
    depends_on:
      - db
    environment:
      - PMA_HOST=db
    volumes:
      - ./phpmy/sessions:/sessions
  
  ###
  ## wordpress
  #
  wordpress:
    image: wordpress:latest
    depends_on:
      - db
    restart: always
    volumes:
      - ./wordpress/data/themes:/var/www/html/wp_dev_blog/wp-content/themes
      - ./wordpress/data/plugins:/var/www/html/wp_dev_blog/wp-content/plugins
      - ./wordpress/data/uploads:/var/www/html/wp_dev_blog/wp-content/uploads
    environment:
      WORDPRESS_DB_HOST: db:3306
      WORDPRESS_DB_USER: ${MYSQL_USER}
      WORDPRESS_DB_PASSWORD: ${MYSQL_PASS}

  ###
  ## https
  #
  https-portal:
    image: steveltn/https-portal:1
    depends_on:
      - wordpress
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./https-portal/data:/var/lib/https-portal
    environment:
      STAGE: ${HTTPS_PORTAL_STAGE}
      DOMAINS: '${HOST} -> http://wordpress, ${PHPMY_HOST} -> http://phpmyadmin'
    restart: always
    # FORCE_RENEW: 'true' #Let's Encryptを最生成。数制限に注意。


```

### **WordPress**の設定

WordPressの設定はWordPressのAdmin画面で行います。これはほぼ問題ありません。

## **まとめ**

以上、GCPの無料範囲内でWordPressを立ち上げた話でした。必要経費は以下のようになります。

*   ドメイン名：年間千円とちょっと
*   他費用：なし
*   サイト速度：小規模なら悪くない

というわけで、非常にコスパが良くいいですね。あとはDockerや色々勉強して、さらに拡張して行けたらと思います。

最後までお読み頂き、ありがとうございました。
