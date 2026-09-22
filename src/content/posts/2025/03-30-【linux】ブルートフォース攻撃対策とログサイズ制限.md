---
title: "【Linux】ブルートフォース攻撃対策とログサイズ制限"
pubDate: 2025-03-30
categories: ["開発"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## 今回の背景

このブログは、現在GCEで動かしています。容量をできるだけギリギリにしているのですが、なぜか容量が増える増える。ログにしても増えすぎだろうと。何回か調査はしていたのですが、今回根本的に解決できたかもしれないので、残しておきます。

## どこで容量を食っているか確認する

下記のコマンドで確認できます。ChatGPT様様です

```
sudo du -h --max-depth=1 / | sort -rh | head -10
```

/varや/snapが肥大化していました。/varで確認すると、/var/logが肥大化していました。

```
$ sudo du -h --max-depth=1 /var/log
1.1G	/var/log/journal
116K	/var/log/apt
4.0K	/var/log/private
4.0K	/var/log/landscape
4.0K	/var/log/dist-upgrade
6.3M	/var/log/sysstat
3.8M	/var/log/nginx
4.0K	/var/log/chrony
100K	/var/log/unattended-upgrades
120K	/var/log/letsencrypt
1.2G	/var/log
```

journalは、systemdのjournalログだそうです。これが原因の可能性が高いです。

内容を見てみます。

```
journalctl -n 50
```

下記のようなログが目立ちました。

```
Mar 30 15:35:58 sshd[2283]: Received disconnect from 218.92.0.196 port 18920:11:  [preauth]
Mar 30 15:36:03 sshd[2345]: Received disconnect from 222.186.57.226 port 60376:11: Bye Bye [preauth]
Mar 30 15:37:07 sshd[2547]: Received disconnect from 218.92.0.196 port 15459:11:  [preauth]
```

sshに対するブルートフォース攻撃のようです。これが、かなりの量を占めているようです。

## ブルートフォース攻撃対策

不正アクセスをブロックするために、Fail2Banを入れます。

```
sudo apt update && sudo apt install fail2ban -y
sudo systemctl enable --now fail2ban
sudo systemctl restart ssh
```

しばらくしてから、状況を確認してみます。

```
$ sudo fail2ban-client status sshd
Status for the jail: sshd
|- Filter
|  |- Currently failed:	6
|  |- Total failed:	21
|  `- Journal matches:	_SYSTEMD_UNIT=sshd.service + _COMM=sshd
`- Actions
   |- Currently banned:	1
   |- Total banned:	2
   `- Banned IP list:	31.133.205.10
```

正常にBanできているようです。

## ログサイズを制限

まずは設定ファイルを開きます。

```
sudo nano /etc/systemd/journald.conf
```

下記を書き換えます。今回、500Mに制限しました。

```
SystemMaxUse=500M
```

変更を反映します。

```
sudo systemctl restart systemd-journald
```

これで、ひとまず処置が完了しました。またしばらく、様子を見たいと思います。
