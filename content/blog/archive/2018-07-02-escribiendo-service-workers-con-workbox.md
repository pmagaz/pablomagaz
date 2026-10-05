---
title: "Escribiendo service workers con Workbox"
date: "2018-07-02"
updated: "2019-04-07"
slug: "escribiendo-service-workers-con-workbox"
author: "Pablo Magaz"
excerpt: "Los service workers son sin duda la piedra angular de las, cada vez más extendidas, Progressive Web Apps. Workbox es una colección de distintas librerías y herramientas creadas por Google y que nos ayudan en la creación y simplificación de service workers para nuestras Progressive Web Apps."
category: "technology"
keywords: ["Workbox", "PWA"]
archived: true
---

## Los service workers son sin duda la piedra angular de las, cada vez más extendidas, Progressive Web Apps. Workbox es una colección de distintas librerías y herramientas creadas por Google y que nos ayudan en la creación y simplificación de service workers para nuestras Progressive Web Apps.

Las [Progressive Web App](https://developers.google.com/web/progressive-web-apps/) o simplemente PWA han venido para quedarse, no hay duda, y lógicamente no hay PWA sin [service worker](https://developers.google.com/web/fundamentals/primers/service-workers/?hl=es). Los service workers son piezas de código JavaScript que haciendo uso de la [API](https://developer.mozilla.org/es/docs/Web/API/Service_Worker_API) creada a tal efecto, se instalan en nuestra máquina y permite hacer uso de funcionalidades extendidas como cacheo de recursos, sincronización en segundo plano, notificaciones [web-push](https://developers.google.com/web/fundamentals/push-notifications/) y un montón de cosas más y todo ello sin la necesidad de que el navegador esté abierto.

### workbox

[Workbox](https://developers.google.com/web/tools/workbox/) es una colección de librerías y herramientas creadas por Google para simplificar la escritura de service workers, reducir su boilerplate y también, porque no, hacerlos un poquito más bonitos ya que la API de los serviceWorkers funciona a través de eventos como 'install', 'activate', 'fetch', etc y que son escuchados mediante [addEventListener](https://developer.mozilla.org/es/docs/Web/API/EventTarget/addEventListener) por lo que le código se presta a ser no especialmente bonito y sobre todo a generar bastante boiler plate especialmente cuando el service worker comienza a coger determinado tamaño.

### Consideraciones Previas

Los service workers son registrados en nuestra máquina a través de un dominio y este dominio [solo puede ser HTTPS](https://developers.google.com/web/fundamentals/primers/service-workers/?hl=es#se_necesita_https) por obvios motivos de seguridad, pero ¿esto quiere decir que necesito un servidor HTTPS para desarrollar mi service worker? No. Los service workers pueden funcionar en 'modo desarrollo' en un servidor 'localhost', pero cuando queramos desplegar nuestro service worker en producción, su registro solo se producirá si el dominio en el que está alojado es HTTPS.

### Registrando nuestro serviceworker

Antes de comenzar a usar el service worker que vamos a escribir con Workbox, debemos registrarlo y lo haremos solo cuando la página ya ha sido [cargada](https://developer.mozilla.org/en-US/docs/Web/Events/load), por lo que en HTML principal de nuestra web incluimos lo siguiente:

```html
<script>
  // Nos aseguramos que el navegador implementa la api 'serviceWorker'
  if ("serviceWorker" in navigator) {
    // Esperamos al evento load para registrar nuestro service worker
    window.addEventListener("load", () => {
      // Registramos el service worker
      navigator.serviceWorker.register("/serviceWorker.js");
    });
  }
</script>
```

### Importando Workbox

Vamos a comenzar a escribir el service worker, que como hemos visto en el apartado previo de registro, lo vamos a llamar serviceWorker.js, así que, si vamos a usar Workbox, lo primero que haremos, lógicamente, es importar Workbox. Para importar Workbox no vamos a utilizar un módulo de ECMA6 ni un require de Nodejs. Vamos a hacer uso del método [importScripts](https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/importScripts) de la interface [WorkerGlobalScope](https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope) y que nos permite la descarga de uno o más scripts de forma sincrona. Es importante destacar que importScripts descarga y evalua el código siempre dentro del scope del service worker.

```js
importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/3.2.0/workbox-sw.js"
);

if (workbox) {
  //workbox solo existe en el scope del serviceWorker
  console.log("Workbox loaded!");
} else {
  console.log(`Can't load Workbox`);
}
```

### Congigurando Workbox

Lo primero que vamos a hacer es configurar la cache que vamos a utilizar con Workbox. Workbox puede utilizar dos tipos de cache; La cache estática o precache, y la cache dinámica o de runtime. La configuración de la cache es realmente sencilla, se indica un nombre para estas caches:

```js
importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/3.2.0/workbox-sw.js"
);

workbox.core.setCacheNameDetails({
  prefix: "my-app",
  suffix: "v1",
  precache: "precache-cache",
  runtime: "runtime-cache",
});
```

Como podemos apreciar, contamos con un prefijo, que es el nombre de nuestra aplicación y un sufijo. Este sufijo es realmente útil para evitar conflictos entre las versiones de nuestro service worker y los propios recursos en la cache de tal forma que cuando nuestro service worker sea modificado de forma sustancial, podemos generar una nueva versión de nuestra cache, simplemente cambiando el sufijo.

### Registrando Rutas

Probablemente uno de los métodos más útiles de Workbox es el método [registerRoute](https://developers.google.com/web/tools/workbox/modules/workbox-routing#how_to_register_a_regular_expression_route) del módulo [routing](https://developers.google.com/web/tools/workbox/modules/workbox-routing) que nos permite registrar rutas y actuar en consecuencia cuando se realice algún tipo de petición a dicha ruta. Estas rutas no tienen por qué ser strings fijos, si no que pueden ser expresiones regulares que nos permitan definir un amplio rango de posibilidades. Vamos a imaginar que queremos añadir a la cache estática que hemos definido al principio, todos los archivos js y css de nuestra PWA.

```js
workbox.routing.registerRoute(
  /\.(?:js|css)$/, // Todos los archivos con extensión js o css
  workbox.strategies.cacheFirst({
    cacheName: workbox.core.cacheNames.precache, // nombre de la cache donde queremos guardar el recurso
  })
);
```

Como vemos en el ejemplo previo, usamos una expresión regular para indicar que queremos registrar todos los archivos que acaben en .js o .css y después est cacheFirst del módulo strategies, algo que es fudamental en workbox si realmente queremos exprimir toda su potencia y que nos da una clara pisto de por dónde van los tiros ¿verdad?

### Estrategias de cacheo

Una de las grandezas de Workbox es precisamente la extrema facilidad de implementar distintas [estrategias de cacheo](https://developers.google.com/web/tools/workbox/modules/workbox-strategies) para las rutas que registremos y que pueden llevar a importantes mejoras en el performance de nuestro site, ya que podremos aplicar distintas políticas de cacheo, según nuestras propias prioridades a cada una de las rutas que registremos. Vamos a ver las distintas estrategias que podemos aplicar.

#### Cache First

Cuando registremos una url (en este caso todos los recursos del directorio content), usando la estrategia cacheFirst, lo que haremos será asegurarnos, que, si ese recurso ya existe en la cache, por que el usuario ya visito nuestra PWA y el recurso se encuentra ya en la cache, este será servido desde la propia cache antes de realizar una petición al recurso, lo cual es notablemente más lento por los tiempos de red.

```js
workbox.routing.registerRoute(
  /content/, // Todo el contenido del directorio ´content´ sea del tipo que sea
  workbox.strategies.cacheFirst()
);
```

#### STALEWHILEREVALIDATE

Otra de las estrategias más utilizas. Funciona de forma similar a cacheFirst pero con la diferencia, de que, stateWhileRevalidate sirve el contenido de la cache, si este se encuentra en la cache, pero adicionalmente, revalida la propia cache con una petición al recurso para obtener la versión más actual del mismo y que volverá a ser servida desde la cache en la siguiente conexion:

```js
workbox.routing.registerRoute(
  /content/,
  workbox.strategies.staleWhileRevalidate()
);
```

#### NETWORKONLY & CACHEONLY

Son las estrategias, por norma, menos utilizas por motivos obvios. Networkonly obliga a que el recurso sea servido si o si, desde la red y nunca desde la cache y cacheOnly sirve el contenido solo si este se encuentra cacheado, lo que nos obligaría a establecer estrategias de precacheo previo como vamos a ver a continuación.

```js
workbox.routing.registerRoute(
  /\.(?:png|jpg)$/, // Todas las imagenes png o jpg
  workbox.strategies.cacheOnly()
);
```

### PRECACHEANDO

El [precaching](https://developers.google.com/web/tools/workbox/modules/workbox-precaching). es una de funcionalidades principales de Worbox y está totalmente orientada al cacheo estático. La ventaja del precaching es que permite el cacheo de determinados recursos antes incluso de que el service worker haya sido instalado (no confundir con registrado). Para ello, necesitamos saber desde un primer momento, que archivos son los que queremos cachear y su mejor ejemplo de uso es precisamente, el soporte Offline, donde vamos a precachear todos aquellos recursos de los que queremos disponer sin conexion. Imaginemos que tenemos, por ejemplo, un archivo llamado offline.html que muestra un mensaje de que el usuario se ha quedado sin conexión. Podemos utilizar el método precacheAndRoute para pre-cachear determinados recursos, como por ejemplo el fichero offline.html

```js
workbox.precaching.precacheAndRoute([
  "/offline.html", // Archivo html que muestra mensaje de falta de conexión
]);
```

Este ejemplo es muy sencillo, pero en la mayoría de los casos lo ideal es precachear todos los js y css de nuestro site, es decir contenido estático:

```js
workbox.precaching.precacheAndRoute([
  "/styles/css.61c6a605d0a7d1b509fd.css",
  "/scripts/app.61c6a605d0a7d1b509fd.js",
]);
```

Worbox, dispone de un potente [CLI](https://developers.google.com/web/tools/workbox/guides/precache-files/cli) que nos ayudara a generar la lista de archivos a precachear, en tiempo de construcción. También dispone de plugins de [Webpack](https://developers.google.com/web/tools/workbox/guides/precache-files/webpack) o [Gulp](https://developers.google.com/web/tools/workbox/guides/precache-files/workbox-build) para ayudarnos en esta tarea.

### USANDO PLUGINS

Otra de las grandes ventajas de Workbox es la posibilidad de emplear plugins que extiendan la funcionalidad, pudiendo controlar el tiempo de expiración de los recursos o incluso cuantos recursos queremos cachear, algo que por ejemplo en sites muy grandes donde en un mismo directorio se sirven una cantidad grande de recursos puede requerir:

```js
workbox.routing.registerRoute(
  new RegExp("/content/(.*)"),
  workbox.strategies.staleWhileRevalidate({
    cacheName: workbox.core.cacheNames.runtime,
    plugins: [
      new workbox.expiration.Plugin({
        maxEntries: 60, // Limitamos a 60 el  número de recursos de ese directorio que queremos cachear.
        maxAgeSeconds: 30 * 24 * 60 * 60, // Tiempo de vida de la cache
      }),
    ],
  })
);
```

En el ejemplo previo estamos utilizando el expiration plugin, uno de los diversos plugins que vienen con Workbox y que nos permite definir un número máximo de elementos para la ruta ´content´con lo cual solo cachearía los 60 primeros y un maxAge de 30 días.

### ACTUALIZACION EN BACKGROUND

Otra de las grandes funcionalidades que podemos abordar con Workbox es la sincronización en segundo plano mediante el uso de [SyncManager](https://developer.mozilla.org/en-US/docs/Web/API/SyncManager) que nos permite registrar eventos ´[sync](https://developer.mozilla.org/en-US/docs/Web/API/SyncEvent)´. Estos eventos son útiles, cuando por ejemplo, queremos tener la plena certeza de enviar una determinada petición al servidor, al margen de que haya conexión o no, ya que lo que esperamos es que si la conexión se pierde, en el momento que esta vuelva se realicen las operaciones que hemos registrado previamente. Para ello contaremos con una cola a la que indicaremos el tiempo durante el cual se realizan los reintentos de sincronización:

```js
const syncHandler = new workbox.backgroundSync.Plugin("syncQueue", {
  maxRetentionTime: 12 * 60, // Duracción máxima de la sincronización
});

workbox.routing.registerRoute(
  /api/,
  workbox.strategies.networkOnly({
    plugins: [syncHandler], // Añadimos el plugin
  }),
  "POST"
);
```

### CLI

Workbox dispone de un potente [CLI](https://developers.google.com/web/tools/workbox/modules/workbox-cli) que nos permite generar de forma automatica un service worker, a partir de un archivo de configuración que bien podemos generar nosotros a mano o que puede ser generado mediante el [wizard](https://developers.google.com/web/tools/workbox/guides/generate-complete-sw) que incluye Worbox:

```js
module.exports = {
  globDirectory: "build/",
  globPatterns: ["**/*.{html,json,js,css}"],
  swDest: "build/sw.js",
  runtimeCaching: [
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg)$/,
      handler: "cacheFirst",
      options: {
        cacheName: "images",
        expiration: {
          maxEntries: 10,
        },
      },
    },
  ],
};
```

Con este archivo de configuración y haciendo uso del parámetro [generateSW](https://developers.google.com/web/tools/workbox/guides/generate-complete-sw) del CLI de Workbox podemos generar de forma automática nuestro serviceworker:

```shell
$ yarn global add workbox-cli
$ workbox generateSW path/to/config.js // generado manual o mediante wizard
```

El empleo del CLI nos puede ayudar a automatizar la creacción del service worker, sin embargo es importante tener en cuenta que Workbox no cubre, por ahora, la totalidad de la funcionalidad de los service worker como por ejemplo notificaciones [web-push](https://developers.google.com/web/fundamentals/codelabs/push-notifications/?hl=es), por lo que si tu service worker hace uso de alguna funcionalidad no soportada por Workbox, el empleo del CLI quedaría descartado ya que el CLI autogenera un nuevo service worker a partir del archivo de configuración especificado.

Como vemos Workbox simplifica enormemente la escritura de serviceWorkers con un código realmente simple y minimalista. A pesar de que Workbox no cubre la totalidad de la operativa de un serviceWorker, sus distintas estrategias de cacheo y la posibilidad de utilizar y crear nuestros propios plugins dotan a Workbox de una gran versatilidad.
