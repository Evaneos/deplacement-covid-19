# Générateur de voucher

### Installer le projet

```console
$ git clone https://github.com/evaneos/voucher-generator.git
$ cd voucher-generator
$ npm i
$ npm start
```

### Générer le code de production

```console
$ npm run build
```

Le code à déployer sera dans le dossier `dist`

### Api

Préciser les paramètres en query string (ex: ?full-name=tata&currency=EUR)

|Field                      | Value                                                     |
|:--------------------------|:----------------------------------------------------------|
|honorific-prefix           | text                                                      |
|full-name                  | text                                                      |
|country-origin             | select [fr, it, es, de, be, nl, ch, at, us, uk, ca, other]|
|agency-name                | text                                                      |
|agency-address-address1    | text                                                      |
|agency-address-address2    | text                                                      |
|agency-address-city        | text                                                      |
|agency-address-zip         | text                                                      |
|agency-address-country     | text                                                      |
|dossier-id                 | number                                                    |
|destination                | text                                                      |
|departure-date             | date (yyyy-mm-dd)                                         |
|departure-date             | date (yyyy-mm-dd)                                         |
|amount                     | number                                                    |
|currency                   | select [EUR, GBP, USD, CAD, CHF, SEK, DKK]                |
|validity-date              | date (yyyy-mm-dd)                                         |


### Crédits

Ce projet a été réalisé à partir d'un fork du dépôt [deplacement-covid-19](https://github.com/LAB-MI/deplacement-covid-19) de l'[Incubateur du ministère de l'intérieur](https://github.com/LAB-MI).

Les projets open source suivants ont été utilisés pour le développement de ce 
service :

- [PDF-LIB](https://pdf-lib.js.org/)
- [qrcode](https://github.com/soldair/node-qrcode)
- [Bootstrap](https://getbootstrap.com/)
- [Font Awesome](https://fontawesome.com/license)
