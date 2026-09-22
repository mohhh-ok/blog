---
title: "【C2PA】c2patool sampleを試してから色々調査してみた"
pubDate: 2025-10-14
categories: ["C2PA"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## c2pa

c2paはAI時代になくてはならない、ファイルのあらゆる情報を証明するための規格です。

## c2paのサンプル

公式サンプルを試してみました。まずc2paをインストールします。

```bash
brew install c2pa
```

```bash
c2patool --version

# c2patool 0.23.4
```

サンプルを入れます。

```bash
git clone https://github.com/contentauth/c2patool-service-example.git
cd <path_where_you_cloned_repo>/c2patool-service-example
npm install
```

サンプルのバージョンは下記のようになっています。

```json
{
  "name": "c2pa_serve",
  "version": "0.1.0",
  ...
}
```

サンプルは実行ファイルのパスがexeからの相対パスになっているため、brewのc2patoolに修正します。

```bash
server.jsにある、./c2patool を c2patool　に置換
```

実行します。

```bash
npm start
```

サーバーが立ち上がるので、http://localhost:8000にアクセスして画像をアップロードします。c2paが付与されます。

## サンプルの中身

サンプルはc2paを生成するようになっています。

```javascript
let command = `c2patool "${filePath}" -m manifest.json -o "${filePath}" -f`;
```

## チェーンのテスト

c2paは署名をチェーンする特徴があります。つまり、編集履歴を残すことでルートを辿れるようにしています。それを確認してみます。

まずmanifestをサンプルを参考に２つ用意します。publishedとeditedの用途です。

```json
// manifest.json
{
    "ta_url": "http://timestamp.digicert.com",
    "claim_generator": "CAI_Demo/0.1",
    
    "assertions": [
      {
          "label": "c2pa.actions",
          "data": {
              "actions": [
                  {
                      "action": "c2pa.published"
                  }
              ]
          }
      }
  ]
}
```

```json
// manifest2.json
{
  "ta_url": "http://timestamp.digicert.com",
  "claim_generator": "CAI_Demo/0.1",
  "assertions": [
    {
      "label": "c2pa.actions",
      "data": {
        "actions": [
          {
            "action": "c2pa.edited"
          }
        ]
      }
    }
  ]

```

サンプルと同じ生成コマンドで、manifest.json => manifest2.jsonの順にapplyします。

```typescript
import { exec as execCallback } from 'child_process';
import util from 'util';
const exec = util.promisify(execCallback);

const imageFolder = './images';

async function main() {
  try {
    const origin = `${imageFolder}/test.jpg`;
    const img1 = `${imageFolder}/test-v1.jpg`;
    const img2 = `${imageFolder}/test-v2.jpg`;
    const manifest1 = './manifest.json';
    const manifest2 = './manifest2.json';

    const doExec = async (cmd: string) => {
      let result = await exec(cmd, { maxBuffer: 10 * 1024 * 1024 });
      if (result.stderr) {
        console.log(`[c2patool stderr] ${result.stderr}`);
      }
      return result;
    }

    const applyManifest = async (src: string, dest: string, manifest: string) => {
      await doExec(`c2patool "${src}" -m ${manifest} -o "${dest}" -f`);
    }

    const outputInfo = async (img: string) => {
      await doExec(`c2patool "${img}" > ${img}.json`);
    }

    await applyManifest(origin, img1, manifest1);
    await applyManifest(img1, img2, manifest2);
    await outputInfo(img1);
    await outputInfo(img2);
  } catch (err) {
    console.log(err);
  }
}

main();
```

結果、以下のようになりました。v1にはpublishedが入っており、v2にはpublished,editedの両方が入っています。チェーンが効いていることがわかります。

```json
// test-v1.jpg.json
{
  "active_manifest": "urn:c2pa:b6dfedd9-f3cc-48ee-ac28-55bc7fb3d660",
  "manifests": {
    "urn:c2pa:b6dfedd9-f3cc-48ee-ac28-55bc7fb3d660": {
      "claim_generator_info": [
        {
          "name": "c2pa-rs",
          "version": "0.67.1",
          "org.contentauth.c2pa_rs": "0.67.1"
        }
      ],
      "title": "test-v1.jpg",
      "instance_id": "xmp:iid:bb71805c-592e-494e-b5d9-f43826d02c23",
      "thumbnail": {
        "format": "image/jpeg",
        "identifier": "self#jumbf=/c2pa/urn:c2pa:b6dfedd9-f3cc-48ee-ac28-55bc7fb3d660/c2pa.assertions/c2pa.thumbnail.claim"
      },
      "ingredients": [],
      "assertions": [
        {
          "label": "c2pa.actions.v2",
          "data": {
            "actions": [
              {
                "action": "c2pa.created",
                "digitalSourceType": "http://c2pa.org/digitalsourcetype/empty"
              },
              {
                "action": "c2pa.published"
              }
            ]
          }
        }
      ],
      "signature_info": {
        "alg": "Es256",
        "issuer": "C2PA Test Signing Cert",
        "common_name": "C2PA Signer",
        "cert_serial_number": "640229841392226413189608867977836244731148734950",
        "time": "2025-10-14T08:08:09+00:00"
      },
      "label": "urn:c2pa:b6dfedd9-f3cc-48ee-ac28-55bc7fb3d660"
    }
  },
  "validation_results": {
    "activeManifest": {
      "success": [
        {
          "code": "timeStamp.validated",
          "url": "self#jumbf=/c2pa/urn:c2pa:b6dfedd9-f3cc-48ee-ac28-55bc7fb3d660/c2pa.signature",
          "explanation": "timestamp message digest matched: DigiCert SHA256 RSA4096 Timestamp Responder 2025 1"
        },
        {
          "code": "claimSignature.insideValidity",
          "url": "self#jumbf=/c2pa/urn:c2pa:b6dfedd9-f3cc-48ee-ac28-55bc7fb3d660/c2pa.signature",
          "explanation": "claim signature valid"
        },
        {
          "code": "claimSignature.validated",
          "url": "self#jumbf=/c2pa/urn:c2pa:b6dfedd9-f3cc-48ee-ac28-55bc7fb3d660/c2pa.signature",
          "explanation": "claim signature valid"
        },
        {
          "code": "assertion.hashedURI.match",
          "url": "self#jumbf=/c2pa/urn:c2pa:b6dfedd9-f3cc-48ee-ac28-55bc7fb3d660/c2pa.assertions/c2pa.thumbnail.claim",
          "explanation": "hashed uri matched: self#jumbf=c2pa.assertions/c2pa.thumbnail.claim"
        },
        {
          "code": "assertion.hashedURI.match",
          "url": "self#jumbf=/c2pa/urn:c2pa:b6dfedd9-f3cc-48ee-ac28-55bc7fb3d660/c2pa.assertions/c2pa.actions.v2",
          "explanation": "hashed uri matched: self#jumbf=c2pa.assertions/c2pa.actions.v2"
        },
        {
          "code": "assertion.hashedURI.match",
          "url": "self#jumbf=/c2pa/urn:c2pa:b6dfedd9-f3cc-48ee-ac28-55bc7fb3d660/c2pa.assertions/c2pa.hash.data",
          "explanation": "hashed uri matched: self#jumbf=c2pa.assertions/c2pa.hash.data"
        },
        {
          "code": "assertion.dataHash.match",
          "url": "self#jumbf=/c2pa/urn:c2pa:b6dfedd9-f3cc-48ee-ac28-55bc7fb3d660/c2pa.assertions/c2pa.hash.data",
          "explanation": "data hash valid"
        }
      ],
      "informational": [
        {
          "code": "timeStamp.untrusted",
          "url": "self#jumbf=/c2pa/urn:c2pa:b6dfedd9-f3cc-48ee-ac28-55bc7fb3d660/c2pa.signature",
          "explanation": "timestamp cert untrusted: DigiCert SHA256 RSA4096 Timestamp Responder 2025 1"
        }
      ],
      "failure": []
    }
  },
  "validation_state": "Valid"
}
```

```json
// test-v2.jpg.json
{
  "active_manifest": "urn:c2pa:b6efdb44-ffad-4bf8-b9c5-897d1e397654",
  "manifests": {
    "urn:c2pa:b6efdb44-ffad-4bf8-b9c5-897d1e397654": {
      "claim_generator_info": [
        {
          "name": "c2pa-rs",
          "version": "0.67.1",
          "org.contentauth.c2pa_rs": "0.67.1"
        }
      ],
      "title": "test-v2.jpg",
      "instance_id": "xmp:iid:37f5b3c9-8078-4882-bb58-1ad8b9e4cdaa",
      "thumbnail": {
        "format": "image/jpeg",
        "identifier": "self#jumbf=/c2pa/urn:c2pa:b6efdb44-ffad-4bf8-b9c5-897d1e397654/c2pa.assertions/c2pa.thumbnail.claim"
      },
      "ingredients": [
        {
          "title": "test-v1.jpg",
          "format": "image/jpeg",
          "instance_id": "xmp:iid:67dd2edc-2b98-4655-8cdd-74f847b139f8",
          "thumbnail": {
            "format": "image/jpeg",
            "identifier": "self#jumbf=/c2pa/urn:c2pa:b6dfedd9-f3cc-48ee-ac28-55bc7fb3d660/c2pa.assertions/c2pa.thumbnail.claim"
          },
          "relationship": "parentOf",
          "active_manifest": "urn:c2pa:b6dfedd9-f3cc-48ee-ac28-55bc7fb3d660",
          "validation_results": {
            "activeManifest": {
              "success": [
                {
                  "code": "timeStamp.validated",
                  "url": "self#jumbf=/c2pa/urn:c2pa:b6dfedd9-f3cc-48ee-ac28-55bc7fb3d660/c2pa.signature",
                  "explanation": "timestamp message digest matched: DigiCert SHA256 RSA4096 Timestamp Responder 2025 1"
                },
                {
                  "code": "claimSignature.insideValidity",
                  "url": "self#jumbf=/c2pa/urn:c2pa:b6dfedd9-f3cc-48ee-ac28-55bc7fb3d660/c2pa.signature",
                  "explanation": "claim signature valid"
                },
                {
                  "code": "claimSignature.validated",
                  "url": "self#jumbf=/c2pa/urn:c2pa:b6dfedd9-f3cc-48ee-ac28-55bc7fb3d660/c2pa.signature",
                  "explanation": "claim signature valid"
                },
                {
                  "code": "assertion.hashedURI.match",
                  "url": "self#jumbf=/c2pa/urn:c2pa:b6dfedd9-f3cc-48ee-ac28-55bc7fb3d660/c2pa.assertions/c2pa.thumbnail.claim",
                  "explanation": "hashed uri matched: self#jumbf=c2pa.assertions/c2pa.thumbnail.claim"
                },
                {
                  "code": "assertion.hashedURI.match",
                  "url": "self#jumbf=/c2pa/urn:c2pa:b6dfedd9-f3cc-48ee-ac28-55bc7fb3d660/c2pa.assertions/c2pa.actions.v2",
                  "explanation": "hashed uri matched: self#jumbf=c2pa.assertions/c2pa.actions.v2"
                },
                {
                  "code": "assertion.hashedURI.match",
                  "url": "self#jumbf=/c2pa/urn:c2pa:b6dfedd9-f3cc-48ee-ac28-55bc7fb3d660/c2pa.assertions/c2pa.hash.data",
                  "explanation": "hashed uri matched: self#jumbf=c2pa.assertions/c2pa.hash.data"
                },
                {
                  "code": "assertion.dataHash.match",
                  "url": "self#jumbf=/c2pa/urn:c2pa:b6dfedd9-f3cc-48ee-ac28-55bc7fb3d660/c2pa.assertions/c2pa.hash.data",
                  "explanation": "data hash valid"
                }
              ],
              "informational": [
                {
                  "code": "timeStamp.untrusted",
                  "url": "self#jumbf=/c2pa/urn:c2pa:b6dfedd9-f3cc-48ee-ac28-55bc7fb3d660/c2pa.signature",
                  "explanation": "timestamp cert untrusted: DigiCert SHA256 RSA4096 Timestamp Responder 2025 1"
                }
              ],
              "failure": []
            }
          },
          "label": "c2pa.ingredient.v3"
        }
      ],
      "assertions": [
        {
          "label": "c2pa.actions.v2",
          "data": {
            "actions": [
              {
                "action": "c2pa.opened",
                "parameters": {
                  "ingredients": [
                    {
                      "url": "self#jumbf=c2pa.assertions/c2pa.ingredient.v3",
                      "hash": "5rI2JbVrFd0VCBAI03j8Vy7pg5TTbhKlBeefSt2Vs1w="
                    }
                  ]
                }
              },
              {
                "action": "c2pa.edited"
              }
            ]
          }
        }
      ],
      "signature_info": {
        "alg": "Es256",
        "issuer": "C2PA Test Signing Cert",
        "common_name": "C2PA Signer",
        "cert_serial_number": "640229841392226413189608867977836244731148734950",
        "time": "2025-10-14T08:08:09+00:00"
      },
      "label": "urn:c2pa:b6efdb44-ffad-4bf8-b9c5-897d1e397654"
    },
    "urn:c2pa:b6dfedd9-f3cc-48ee-ac28-55bc7fb3d660": {
      "claim_generator_info": [
        {
          "name": "c2pa-rs",
          "version": "0.67.1",
          "org.contentauth.c2pa_rs": "0.67.1"
        }
      ],
      "title": "test-v1.jpg",
      "instance_id": "xmp:iid:bb71805c-592e-494e-b5d9-f43826d02c23",
      "thumbnail": {
        "format": "image/jpeg",
        "identifier": "self#jumbf=/c2pa/urn:c2pa:b6dfedd9-f3cc-48ee-ac28-55bc7fb3d660/c2pa.assertions/c2pa.thumbnail.claim"
      },
      "ingredients": [],
      "assertions": [
        {
          "label": "c2pa.actions.v2",
          "data": {
            "actions": [
              {
                "action": "c2pa.created",
                "digitalSourceType": "http://c2pa.org/digitalsourcetype/empty"
              },
              {
                "action": "c2pa.published"
              }
            ]
          }
        }
      ],
      "signature_info": {
        "alg": "Es256",
        "issuer": "C2PA Test Signing Cert",
        "common_name": "C2PA Signer",
        "cert_serial_number": "640229841392226413189608867977836244731148734950",
        "time": "2025-10-14T08:08:09+00:00"
      },
      "label": "urn:c2pa:b6dfedd9-f3cc-48ee-ac28-55bc7fb3d660"
    }
  },
  "validation_results": {
    "activeManifest": {
      "success": [
        {
          "code": "timeStamp.validated",
          "url": "self#jumbf=/c2pa/urn:c2pa:b6efdb44-ffad-4bf8-b9c5-897d1e397654/c2pa.signature",
          "explanation": "timestamp message digest matched: DigiCert SHA256 RSA4096 Timestamp Responder 2025 1"
        },
        {
          "code": "claimSignature.insideValidity",
          "url": "self#jumbf=/c2pa/urn:c2pa:b6efdb44-ffad-4bf8-b9c5-897d1e397654/c2pa.signature",
          "explanation": "claim signature valid"
        },
        {
          "code": "claimSignature.validated",
          "url": "self#jumbf=/c2pa/urn:c2pa:b6efdb44-ffad-4bf8-b9c5-897d1e397654/c2pa.signature",
          "explanation": "claim signature valid"
        },
        {
          "code": "assertion.hashedURI.match",
          "url": "self#jumbf=/c2pa/urn:c2pa:b6efdb44-ffad-4bf8-b9c5-897d1e397654/c2pa.assertions/c2pa.thumbnail.claim",
          "explanation": "hashed uri matched: self#jumbf=c2pa.assertions/c2pa.thumbnail.claim"
        },
        {
          "code": "assertion.hashedURI.match",
          "url": "self#jumbf=/c2pa/urn:c2pa:b6efdb44-ffad-4bf8-b9c5-897d1e397654/c2pa.assertions/c2pa.ingredient.v3",
          "explanation": "hashed uri matched: self#jumbf=c2pa.assertions/c2pa.ingredient.v3"
        },
        {
          "code": "assertion.hashedURI.match",
          "url": "self#jumbf=/c2pa/urn:c2pa:b6efdb44-ffad-4bf8-b9c5-897d1e397654/c2pa.assertions/c2pa.actions.v2",
          "explanation": "hashed uri matched: self#jumbf=c2pa.assertions/c2pa.actions.v2"
        },
        {
          "code": "assertion.hashedURI.match",
          "url": "self#jumbf=/c2pa/urn:c2pa:b6efdb44-ffad-4bf8-b9c5-897d1e397654/c2pa.assertions/c2pa.hash.data",
          "explanation": "hashed uri matched: self#jumbf=c2pa.assertions/c2pa.hash.data"
        },
        {
          "code": "assertion.dataHash.match",
          "url": "self#jumbf=/c2pa/urn:c2pa:b6efdb44-ffad-4bf8-b9c5-897d1e397654/c2pa.assertions/c2pa.hash.data",
          "explanation": "data hash valid"
        }
      ],
      "informational": [
        {
          "code": "timeStamp.untrusted",
          "url": "self#jumbf=/c2pa/urn:c2pa:b6efdb44-ffad-4bf8-b9c5-897d1e397654/c2pa.signature",
          "explanation": "timestamp cert untrusted: DigiCert SHA256 RSA4096 Timestamp Responder 2025 1"
        }
      ],
      "failure": []
    },
    "ingredientDeltas": [
      {
        "ingredientAssertionURI": "self#jumbf=/c2pa/urn:c2pa:b6efdb44-ffad-4bf8-b9c5-897d1e397654/c2pa.assertions/c2pa.ingredient.v3",
        "validationDeltas": {
          "success": [
            {
              "code": "ingredient.manifest.validated",
              "url": "self#jumbf=/c2pa/urn:c2pa:b6dfedd9-f3cc-48ee-ac28-55bc7fb3d660",
              "explanation": "ingredient hash matched"
            }
          ],
          "informational": [],
          "failure": []
        }
      }
    ]
  },
  "validation_state": "Valid"
}
```

## タイムスタンプ

c2paでは以下のように言及されています。

> The C2PA specification strongly recommends that a manifest signature contains a trusted time-stamp proving that the signature actually existed at a certain date. Specifically, it recommends using a Time-Stamp Authority (TSA) that complies with [Internet X.509 Public Key Infrastructure Time-Stamp Protocol (RFC 3161)](https://datatracker.ietf.org/doc/html/rfc3161) standard.
> 
> [https://opensource.contentauthenticity.org/docs/manifest/understanding-manifest](https://opensource.contentauthenticity.org/docs/manifest/understanding-manifest)

> The time-stamp is typically defined as part of the signing information. You can set this by using C2PA Tool in the `ta_url` field or by using the SDK. The time-stamp then appears in the `SignatureInfo` JSON object when reading the manifest store.
> 
> [https://opensource.contentauthenticity.org/docs/manifest/understanding-manifest](https://opensource.contentauthenticity.org/docs/manifest/understanding-manifest)

信頼できるタイムスタンプを含めるようにとのことです。それにはta\_urlと一緒にc2patoolを使えと。

manifestにはta\_urlが含まれています。

```
"ta_url": "http://timestamp.digicert.com",
```

これにより、c2patoolを使用した時点で自動で生成されるようです。

試しに先ほどのコードをapplyManifestだけにして、Charlesで確認してみました。

```bash
HTTP_PROXY=http://127.0.0.1:8888 \
http_proxy=http://127.0.0.1:8888 \
HTTPS_PROXY=http://127.0.0.1:8888 \
https_proxy=http://127.0.0.1:8888 \
ALL_PROXY=http://127.0.0.1:8888 \
all_proxy=http://127.0.0.1:8888 \
NO_PROXY=localhost,127.0.0.1 \
no_proxy=localhost,127.0.0.1 \
tsx test.ts
```

Charlesで、timestamp.digicert.com:80へのアクセスが確認できました。c2patoolsによる署名実行時に、タイムスタンプサーバーへのアクセスも発生していることから、確かな署名プロセスが走っているようです。

## 署名

使える署名は下記のタイプです

> The C2PA specification requires that an "end entity" signing certificate must be either:
> 
> *   An S/MIME email certificate (`id-kp-emailProtection` EKU). This is usually the simplest and least expensive option.
> *   A document signing certificate (`id-kp-documentSigning` EKU). Obtaining these kinds of certificates typically have more stringent requirements (like proving your identity) and costs more.
> 
> For more details, see [Certificate requirements](https://opensource.contentauthenticity.org/docs/signing/get-cert#certificate-requirements) below.

2025年の間はどのCAで取得してもC2PAに申請すれば良いようです。しかし2026年以降は、C2PAが指定したCAで取得する必要があるとのこと。今現在は下記のCAが参考として挙げられていますが、これが2026年以降のトラストリストになる確証はありません。

> You must purchase a signing certificate from a certificate authority (CA). The following table provides some links to popular CAs for convenience. This information is for reference only; inclusion does not imply endorsement by CAI or Adobe, Inc.
> 
> CA
> 
> S/MIME email signing
> 
> Document signing
> 
> Digicert
> 
> [S/MIME email signing](https://www.digicert.com/tls-ssl/secure-email-smime-certificates)
> 
> [Document signing](https://www.digicert.com/signing/document-signing-certificates)
> 
> GlobalSign
> 
> [S/MIME email signing](https://shop.globalsign.com/en/secure-email)
> 
> [Document signing](https://shop.globalsign.com/en/document-signing)
> 
> IdenTrust
> 
> [S/MIME email signing](https://www.identrust.com/digital-certificates/secure-email-smime)
> 
> [Document signing](https://www.identrust.com/digital-certificates/document-signing)
> 
> Sectigo
> 
> [S/MIME email signing](https://ssl.comodoca.com/s-mime)
> 
> [Document signing](https://ssl.comodoca.com/document-signing-certificates)
> 
> SSL.com
> 
> [S/MIME email signing](https://www.ssl.com/certificates/s-mime-certificates/)
> 
> [Document signing](https://www.ssl.com/certificates/document-signing-certificates/)
