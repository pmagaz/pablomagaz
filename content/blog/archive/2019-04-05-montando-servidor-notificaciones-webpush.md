---
title: "Montando un servidor de notificaciones Web Push"
date: "2019-04-05"
updated: "2020-03-02"
slug: "montando-servidor-notificaciones-webpush"
author: "Pablo Magaz"
excerpt: "Las notificaciones Web Push llegan con mayor frecuencia a los navegadores de nuestros dispositivos ya que su uso e implantación va en aumento gracias a la creciente popularidad de las Progressive Web Apps. En este post explicamos como montar tu propio servidor de notificaciones Web Push."
category: "technology"
keywords: ["PWA", "NodeJs"]
archived: true
---

## Las notificaciones Web Push llegan con mayor frecuencia a los navegadores de nuestros dispositivos ya que su uso e implantación va en aumento gracias a la creciente popularidad de las Progressive Web Apps. En este post explicamos como montar tu propio servidor de notificaciones Web Push.

Puede que hayas llegado a este post, precisamente, por la recepción de una notificación Web Push enviada al navegador de tu ordenador o de tu dispositivo móvil, pero tanto como si ya estabas subscrito como si no (si quieres estar actualizado de las novedades de este blog, te sugiero que te subscribas) a lo largo de este post vamos a explicar que son las notificaciones Web Push y como funcionan, pero sobre todo, vamos a aprender a montar un servidor de notificaciones Web Push que nos permita enviar notificaciones Web Push a los usuarios de nuestro web site.

### ¿Qué son las notificaciones Web Push?

Las notificaciones [Web Push](https://developers.google.com/web/fundamentals/push-notifications/) son un tipo de notificaciones, muy similares a las notificaciones push tradicionales de los dispositivos móviles pero con la salvedad de que las notificaciones son enviadas a un navegador, sea del dispositivo que sea. Las notificaciones Web Push llevan información asociada como un título, un cuerpo o incluso un icono.

### ¿Cómo funcionan las notificaciones Web Push?

El funcionamiento de las notificaciones puede ser un poco confuso, sobre todo al principio, ya que requieren de ciertos conocimientos sobre [Progressive Web Apps](https://developers.google.com/web/fundamentals/codelabs/your-first-pwapp), [Service Workers](https://developers.google.com/web/fundamentals/primers/service-workers) y algunas de sus APIS como [PushManager](https://developer.mozilla.org/en-US/docs/Web/API/PushManager/), por lo que si no estás familiarizado con estos conceptos, puede ser de ayuda echarles un vistazo antes.

Para poder enviar notificaciones Web Push a tus usuarios, necesitas que tu site sea una Progressive Web App y la base de una PWA son los Service Worker, por tanto, es fundamental registrar un Service Worker en nuestro site y solicitar permiso al usuario para recibir notificaciones (esa ventatina que probablmente ya hayas visto en más de una ocasión y que te pregunta si deseas recibir notificacions del sitio X). Con el permiso del usuario, se generará una ¨subscripción¨ (más adelante veremos qué es y qué formato tiene) que guardaremos en nuestra base de datos y que mediante llaves públicas/privadas, permitirá identificar el navegador de tus usuarios y enviarles notificaciones.

### Instalación

De cara a facilitar el seguimiento del post os aconsejo hacer un fork o clonar el repositorio que contiene todo el código del ejemplo, [webpush-notification-server](https://github.com/pmagaz/webpush-notification-server.git) y que es una versión simplificada del server que utilizo en el blog. Nuestro servidor utilizará cómo es lógico, NodeJs, [Express](https://www.npmjs.com/package/express), [NeDb](https://www.npmjs.com/package/nedb), una base de datos documental en memoria donde guardaremos las subscripciones y la librería [web-push](https://www.npmjs.com/package/web-push) que será la encargada del envío de las notificaciones. También usaremos [esm](https://www.npmjs.com/package/esm) para poder utilizar módulos de ECMAScript en NodeJS y [dotenv](https://www.npmjs.com/package/dotenv) para la gestión de la confifguración.

```shell
$ git clone https://github.com/pmagaz/webpush-notification-server.git
$ yarn install
```

### Estructura del proyecto

Nuestro código va a dividirse en 2 partes. Por una parte el código del [cliente](https://github.com/pmagaz/webpush-notification-server/tree/master/src/public), donde registraremos el Service Worker y generaremos la subscripción y por otra, lógicamente el propio [servidor](https://github.com/pmagaz/webpush-notification-server/tree/master/src/server).

#### src/client

**\* register.js** Fichero que realiza el registro del Service Worker, genera la subscripción y la envía al servidor.
**\* serviceWorker.js** El Service Worker que recibirá las notificaciones Web Push.
**\* index.html** Fichero index de nuestra aplicación que importa register.js.

#### src/server

**\* index.js** Root file que importa ESM para usar módulos ECMAScript en NodeJs.
**\* server.js** Servidor Express.
**\* /statics** Rutas estáticas para servir el código de cliente.
**\* /routing** Rutas de Express y sus handlers para guardar las subscripciones (/register) y enviar las notificaciones (/send).
**\* /db** NeDb handlers para insertar, borrar y obtener las subscripciones guardadas.

### Configuración

Las notificaciones Web Push utilizan un sistema de llaves públicas/privadas llamadas [VAPID](https://blog.mozilla.org/services/2016/04/04/using-vapid-with-webpush/) donde el cliente tendrá la llave pública y el servidor tanto la pública como la privada por evidentes cuestiones de seguridad así que lo primero que tenemos que hacer es generar dichas claves utilizando la librería web-push.

```shell
$ yarn generate-keys // -> node_modules/web-push/src/cli.js generate-vapid-keys
```

Esto nos dará como resultado algo muy parecido a esto:

```
Public Key:
BCM53UTKD0nS25mP-acJ5uLOU062ULE4sIKDbNWQxyFYOhAyHuIG6UWaFazsxHfUuHr6I9X1bZEk5kZRi_DzZv9

Private Key:
AkHoWx6QCoqEXFONg8xMpH1EKCLLpkBngEmUX9qzcn1
```

Estas claves serán necesarias para poder generar una subscripción y para el posterior envío de las notificaciones y tienen que ser incluidas en el cliente y en el servidor como veremos a lo largo del post. Vamos a comenzar con el cliente.

### Cliente

Del lado del [cliente](https://github.com/pmagaz/webpush-notification-server/tree/master/src/public) tenemos que realizar varias tareas: Registrar un Service Worker, generar una subscripción y enviar la subscripción generada al servidor.

#### Registrando el Service Worker

Antes de registrar un Service Worker tenemos que asegurarnos de que el navegador lo soporta. En el código podemos usar async/await sin problema ya que si el navegador tiene soporte para Service Workers, también lo tendrá para async/await:

```js
const serviceWorkerUrl = "http://localhost:8000/serviceWorker.js"; //Url de nuestro serviceWorker.

const registerServiceWorker = async () => {
  // Registramos el Service Worker
  return await navigator.serviceWorker.register(serviceWorkerUrl);
};

const register = async () => {
  // Comprobamos si el navegador tiene soporte para serviceworker
  if ("serviceWorker" in navigator) {
    // Obtenemos el registro en swRegistration
    const swRegistration = await registerServiceWorker();
  } else throw new Error("ServiceWorkers are not supported by your browser!");
};

register();
```

[/src/public/register.js](https://github.com/pmagaz/webpush-notification-server/blob/master/src/public/register.js)

#### Generando una subscripción

Cuando registramos un Service Worker recibiremos un objeto [ServiceWorkerRegistration](https://developer.mozilla.org/es/docs/Web/API/ServiceWorkerRegistration) (swRegistration) que nos dará acceso al [PushManager](https://developer.mozilla.org/en-US/docs/Web/API/PushManager/) que es la API para notificaciones Push y mediante la cual podemos generar la subscripción por medio del método [subscribe](https://developer.mozilla.org/en-US/docs/Web/API/PushManager/subscribe) que recibe la clave pública que hemos generado pero convertida a [Uint8Array](https://developer.mozilla.org/es/docs/Web/JavaScript/Referencia/Objetos_globales/Uint8Array). Es importante destacar que antes de nada tenemos que solicitar permiso al usuario mediante el método [requestPermission](https://developer.mozilla.org/es/docs/Web/API/notification/requestPermission):

```js
const serviceWorkerUrl = "http://localhost:8000/serviceWorker.js";
const publicVapidKey = "YOUR_PUBLIC_KEY";

// Genera la subscription usando Service Worker Registration
const generateSubscription = async (swRegistration) => {
  // Solicitamos permiso al usuario
  await window.Notification.requestPermission();
  // Generamos la subscripción
  const subscription = await swRegistration.pushManager.subscribe({
    userVisibleOnly: true,
    // applicationServerKey en Unit8Array
    applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
  });
};

const registerServiceWorker = async () => {
  // Registro del Service Worker
  return await navigator.serviceWorker.register(serviceWorkerUrl);
};

const register = async () => {
  if ("serviceWorker" in navigator) {
    const swRegistration = await registerServiceWorker();
    // Pasamos el ServiceWorkerRegistration
    await generateSubscription(swRegistration);
  } else throw new Error("ServiceWorkers are not supported by your browser!");
};

// Función que convierte nuestra clave pública a Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

register();
```

[/src/public/register.js](https://github.com/pmagaz/webpush-notification-server/blob/master/src/public/register.js)

Con esto hemos generado la subscripción y seguramente a estas alturas te habrás preguntado varias veces, ¿Que es una subscripción? Pues realmente es un simple objeto que tiene un aspecto como este.

```json
{
  "endpoint": "https://random-push-service.com/some-kind-of-unique-id-1234/v2/",
  "keys": {
    "p256dh": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM=",
    "auth": "tBHItJI5svbpez7KI4CCXg=="
  }
}
```

Este objeto contiene el endpoint de envío que varía según el navegador, así como la clave que hemos generado. Con todo esto nuestro navegador podrá ser identificado de forma única. Ahora, tenemos que guardar dicha subscripción y para ello la vamos a enviar a nuestro servidor. Adicionalmente podemos ampliar el ejemplo previo y comprobar si ya existía una subscripción generada.

```js
...
const registerUrl = "http://localhost:8000/register";
const saveSubscription = async (subscription) => {
  // POST a nuestro servidor con la subscrición
  const res = await fetch(registerUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(subscription),
  });
  return res.status === 200 ? res.json() : false;
};

const generateSubscription = async (swRegistration) => {
  await window.Notification.requestPermission();
  // Comprobamos si ya existía una subscripción previa y guardada
  const pushSubscription = await swRegistration.pushManager.getSubscription();
  if (!pushSubscription) {
    const subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
    });
    // Envíamos la subscripción al servidor
    const saved = await saveSubscription(subscription);
    if (saved) return saved;
    throw Error("Subscription not saved!");
  } else return pushSubscription;
};
...
```

[/src/public/register.js](https://github.com/pmagaz/webpush-notification-server/blob/master/src/public/register.js)

Bien, por ahora en el lado del cliente hemos registrado un Service Worker, hemos solicitado permiso al usuario para enviarle notificaciones, hemos generado una subscripción y la hemos envíado al servidor, así que vamos con el servidor.

### Servidor

Antes de nada, lo primero que vamos a hacer es configurar los parametros necesarios en nuestro servidor y al igual que hicimos con el cliente tenemos que añadir la clave pública pero también la privada. Abrimos el archivo .env del directorio raíz:

```js
EXPRESS_PORT = 8000; // Puerto donde levantaremos el servidor
DB_PATH = ".database/subscriptions.db"; // Path a la base de datos
MAILTO = "mailto:me@mysite.com"; // Tu email
PUBLIC_KEY = "YOUR_PUBLIC_KEY"; // Clave pública generada
PRIVATE_KEY = "YOUR_PRIVATE_KEY"; // Clave privada generada
NOTIFICATION_ICON = "https://pablomagaz.com/assets/images/icons/logo512.png"; // Url del icono de la notificación
```

Con las claves añadidas a la configuración vamos a echar un vistazo a nuestro servidor de Express, que como podemos ver es muy sencillito:

```js
import express from "express";
import bodyParser from "body-parser";

import setRouting from "./routing";
import setStatics from "./statics";

const app = express();

app.use(bodyParser.json()); // Bodyparser para manejo de Json
app.use(bodyParser.urlencoded({ extended: true }));

setRouting(app); // Establecemos las rutas
setStatics(app); // Establecemos las rutas estáticas

app.listen(process.env.EXPRESS_PORT, () => {
  console.log(`Webpush notification server up in ${process.env.EXPRESS_PORT}`);
});
```

[/src/server/server.js](https://github.com/pmagaz/webpush-notification-server/blob/master/src/server/server.js)

La función setRouting ´setea´ las rutas de express pasando la referencia de la app y recorriendo el Array de rutas que veremos a continuación y que tienen tres propiedades: Method, Url y Handler:

```js
import routes from "./routes";

const setRouting = (app) => {
  for (const route of routes) {
    app[route.method](route.url, route.handler);
  }
};

export default setRouting;
```

[/src/server/routing/index.js](https://github.com/pmagaz/webpush-notification-server/blob/master/src/server/routing/index.js)

#### Recibiendo subscripción

Del lado del cliente hemos generado una subscripción y la hemos envíado a la ruta '[http://localhost:8000/register](http://localhost:8000/register)' cuyo handler se encarga de responder a esa ruta POST, recibir la subscripción envíada por medio de la request de expres (req) y guardarla en la base de datos mediante el método saveSubscription:

```js
import { saveSubscription } from "../db";

const routes = [
  {
    method: "post",
    url: "/register",
    handler: async (req, res) => {
      // La subscripción nos llega en el body
      const subscription = req.body;
      // la guardamos en la base de datos
      const saved = await saveSubscription(subscription);
      if (saved) res.status(200).json({ msg: "Subscription saved!" });
      else res.status(500).json({ err: "Could not save subscription!" });
    },
  },
];
export default routes;
```

[/src/server/routing/routes.js](https://github.com/pmagaz/webpush-notification-server/blob/master/src/server/routing/routes.js)

El método saveSubscription se encargará de comprobar que la subscripción no existiera previamente, buscando en la base de datos por el parámetro endpoint que realmente es un identificador único y en caso de que no exista, la guardará en la base de datos:

```js
import Nedb from "nedb";
// Instancia de NeDB
export const db = new Nedb({ filename: process.env.DB_PATH, autoload: true });

export const saveSubscription = async (subscription) =>
  await new Promise((resolve, reject) => {
    // Comprobamos que la subscripción no existiera previamente
    db.find({ endpoint: subscription.endpoint }, (findErr, docs) => {
      if (docs.length === 0) {
        // No existe, la guardamos
        db.insert(subscription, (insertErr) => {
          if (insertErr) reject(insertErr);
          resolve(true);
        });
      } else resolve(true);
    });
  });
```

[/src/server/db/index.js](https://github.com/pmagaz/webpush-notification-server/blob/master/src/server/db/index.js)

Bien pues ya tenemos la subscripción guardada en la base de datos. Ahora, ¿qué hacemos con ella? ¡Enviar notificación!

### Enviando notificaciones Web Push.

De la misma forma que disponemos de una ruta POST para recibir las notificaciones push, vamos a definir una ruta POST para enviar notificaciones Web Push, a todas las subscripiciones que tenemos en la base de datos. Podemos enviar dichas notificaciones mediante Postman, Curl o similares (aunque en el ejemplo podrás encontrar un pequeño formulario para facilitar las cosas) utilizando el siguiente payload en el body del POST:

```json
{
  "title": "Notification title",
  "body": "Notification body...",
  "url": "https://mysite.com"
}
```

Con este payload podemos envíar cualquier notificación con un título, un cuerpo y una url que se abrirá cuando el usuario haga click en la notificación. Lo primero lógicamente será recuperar la lista de notificaciones que tenemos en la base de datos y mediante la librería web-push enviar la notificación con el payload que acabamos de ver.

Cuando envíamos una notificación push recibiremos un [status code](https://developers.google.com/web/fundamentals/push-notifications/common-issues-and-reporting-bugs) que nos indicará el resultado del envío, siendo 201 un resultado positivo y adicionalmente ciertos status code que indican posibles errores, de los cuales, cabe destacar el 410 que indica que la subscripción ya no es válida y por tanto debemos eliminarla de nuestra base de datos.

```js
import webpush from "web-push";
import { saveSubscription, getSubscriptions, removeSubscription } from "../db";

// Configuramos web-push pasando los datos del .env
webpush.setVapidDetails(
  process.env.MAILTO,
  process.env.PUBLIC_KEY,
  process.env.PRIVATE_KEY
);

const routes = [
  {
    method: "post",
    url: "/send",
    handler: async (req, res) => {
      // El payload que hemos enviado
      const { title, url, body } = req.body;
      // Obtenemos la lista de las subscripciones
      const subscriptions = await getSubscriptions();
      const data = JSON.stringify({
        title,
        payload: { title, body, url, icon: process.env.NOTIFICATION_ICON },
        body: true,
      });

      const sentSubscriptions = subscriptions.map((subscription) =>
        webpush
          .sendNotification(subscription, data) // Enviamos la notificación
          .then()
          .catch((err) => {
            // Subscripción no válida, la borramos de la db
            if (err.statusCode === 410) removeSubscription(subscription);
          })
      );

      // Una vez finalizada todos los envíos, mandamos una respuesta
      await Promise.all(sentSubscriptions).then(() => {
        res.status(200).json({ msg: "Notifications sent!" });
      });
    },
  },
];
```

[/src/server/routing/routes.js](https://github.com/pmagaz/webpush-notification-server/blob/master/src/server/routing/routes.js)

A nivel de base de datos, disponemos de una función que nos devuelve la lista de subscripciones (getSubscriptions) y otra que borra una subscripción (removeSubscription) utilizando el parámetro .\_id que es el id interno de NedDb para el documento.

```js
...
// Devuelve todas las subscripciones
export const getSubscriptions = async () =>
  await new Promise((resolve, reject) => {
    db.find({}, (err, docs) => {
      if (err) reject(err);
      resolve(docs);
    });
  });

// Borra una subscripción
export const removeSubscription = async (subscription) =>
  await new Promise((resolve, reject) => {
    db.remove({ _id: subscription._id }, {}, (err, numRemoved) => {
      if (err) reject(err);
      resolve(numRemoved);
    });
  });
...
```

[/src/server/db/index.js](https://github.com/pmagaz/webpush-notification-server/blob/master/src/server/db/index.js)

Bien, las notificaciones han sido enviadas. Ahora toca recibirlas en el navegador y para ello necesitamos que nuestro Service Worker esté a la escucha de dicho evento y para ello disponemos del listener ´[push](https://developers.google.com/web/fundamentals/push-notifications/handling-messages)´ que es el que se activa cuando la notificación llega al navegador y del método [showNotification](https://developer.mozilla.org/es/docs/Web/API/ServiceWorkerRegistration/showNotification) para mostrar la propia notificación. Adicionalmente existe otro evento llamado [notificationclick](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/notificationclick_event) que nos permite capturar el evento del click que realice el usuario en la ventana de notificación y abrir la url que hemos enviado en el payload:

```js
/*
    Definimos un delay ya que en algunos dispositivos la resolución del promise chain
    puede demorar y hacer que la notificación no se muestre
    */
const notificationDelay = 500;

const showNotification = (title, options) =>
  new Promise((resolve) => {
    setTimeout(() => {
      // Mostramos la notificación
      self.registration.showNotification(title, options).then(() => resolve());
    }, notificationDelay);
  });

// Listener del evento push
self.addEventListener("push", async (event) => {
  const res = JSON.parse(event.data.text());
  // Recogemos el payload
  const { title, body, url, icon } = res.payload;
  // Objeto con la información de la notificación
  const options = {
    body,
    icon,
    vibrate: [100],
    data: { url }, // Pasamos la url para recogerla en notificationclick
  };
  // Finzalizado el evento llamamos a nuestra función de mostrar notificación
  event.waitUntil(showNotification(title, options));
});

// Escuchamos el click en la ventana de notificación
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  // recuperamos la url que pasamos en el options
  const { url } = event.notification.data;
  if (url) event.waitUntil(clients.openWindow(url));
});
```

[/src/public/serviceWorker.js](https://github.com/pmagaz/webpush-notification-server/blob/master/src/public/serviceWorker.js)

Ya lo tenemos todo listo, por lo que podemos levantar el servidor y enviar una notificación:

```shell
$ yarn start
$ curl --header "Content-Type: application/json" \
  --request POST \
  --data '{ "title": "Notification title", "body": "Notification body...", "url":"https://mysite.com" }' \
  http://localhost:8000/send
```

Pues esto ha sido todo. Puedes encontrar el código de todo el proyecto en [github](https://github.com/pmagaz/webpush-notification-server.git). Adicionalmente, podrás encontrar un pequeño formulario en [index.html](https://github.com/pmagaz/webpush-notification-server/blob/master/src/public/index.html) que permite enviar la propia notificación sin curl o postman para facilitar el ejemplo. ¡A enviar notificaciones Web Push!
