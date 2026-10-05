---
title: "Empaquetando aplicaciones con Parcel"
date: "2018-05-09"
updated: "2020-03-02"
slug: "empaquetando-aplicaciones-con-parcel"
author: "Pablo Magaz"
excerpt: "Parcel es un nuevo module bundler que promete unos tiempos de building ultrarápidos y zero config, por lo que se postula como un claro rival para la herramienta más usada actualmente, Webpack. En este post vamos a poner a prueba a ParcelJs empaquetando una app Vue. ¿Será mejor que Webpack?"
category: "technology"
keywords: ["Parcel", "Vue"]
archived: true
---

## Parcel es un nuevo module bundler que promete unos tiempos de building ultrarápidos y zero config, por lo que se postula como un claro rival para la herramienta más usada actualmente: Webpack. En este post vamos a poner a prueba a ParcelJs empaquetando una app Vue. ¿Será mejor que Webpack?

Atrás quedan los tiempos de Grunt o Gulp. El mundo de los bundlers actualmente se encuentra indiscutiblemente dominado por Webpack, que muy recientemente ha alcanzado su versión 4 con notables mejoras en el rendimiento y reducción de su extensa configuración. La irrupción de Parcel puede hacer que esta hegemonía, pueda estar tocando a su fin.

El slogan de Parcel es "Empaquetador de aplicaciones web ultra-rápido, sin configuración", así que a lo largo de este post vamos a comprobar si realmente esto es así probando a empaquetar un proyecto Vue con Parcel y haciendo uso de los elementos habituales de cualquier proyecto: Servidor de desarrollo, build de producción, code splitting etc. Todo el [código](https://github.com/pmagaz/parcel-vue-example) está disponible en [github](https://github.com/pmagaz/parcel-vue-example). Arrancamos.

### Instalando.

Lo primero es lo primero, instalar Parcel. El único paquete realmente imprescindible es parcel-bundler pero vamos a instalar también el plugin para ESLINT para lintar todo nuestro código y ya que vamos a empaquetar aplicaciones Vue, también el plugin para Vue proporcionado por parcel, parcel-plugin-vue:

```shell
    $ yarn add -D parcel-bundler parcel-plugin-eslint parcel-plugin-vue
```

### Servidor de desarrollo

Parcel viene con un servidor de desarrollo muy similar al webpack-dev-server de Webpack. Este servidor de desarrollo viene ya con HMR (Hot module replacement) y no se requiere ningún tipo de configuración adicional para ser usado. Vamos a crear un punto de entrada para arrancar el servidor, siendo en este caso un archivo .html, a diferencia de lo que solemos usar en Webpack donde el punto de entrada suele ser un .js:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Packaging Vue apps with Parcel</title>
  </head>
  <body>
    <div id="app"></div>
    <script src="./src/main.js"></script>
  </body>
</html>
```

El archivo src/main.js es el punto de entrada a nuestra aplicación Vue y en el definimos mediante el parámetro 'el' el div de montaje de nuestra app (indicado también en fichero html).

#### src/main.js

```js
import Vue from "vue";
import router from "./routes";
import App from "./App.vue";

new Vue({
  el: "#app",
  router,
  render: (h) => h(App),
});
```

En el fichero App.vue, tenemos un componente de menú para movernos entre rutas y lógicamente el router-view.

#### src/App.vue

```jsx
<template>
  <div id="app">
    <menu-component />
    <router-view></router-view>
  </div>
</template>
<style>

</style>
<script>
import MenuComponent from './components/MenuComponent.vue';
import './styles/styles.css';
export default {
  name: 'app',
  components: {
    'menu-component': MenuComponent,
  },
}
</script>
```

### Añadiendo scripts

Vamos a añadir el comando 'parcel ./index.html' que es el comando necesario para levantar el servidor de desarrollo, como script en nuestro package.json para iniciar el servidor de desarrollo usando el comando 'yarn start' o 'npm start':

```json
{
  "name": "parcel-vue-example",
  "version": "1.0.0",
  "main": "src/main.js",
  "repository": "https://github.com/pmagaz/parcel-vue-example.git",
  "scripts": {
    "start": "parcel ./index.html"
  }
}
```

### Ejecutando

```shell
$ yarn start
$ parcel ./index.html
  Server running at http://localhost:1234
  ✨ Built in 2.42s.
```

Bien pues ya tenemos nuestro server de desarrollo arriba, sin embargo, vemos algunos errores en la consola, pero no tiene nada que ver con ParcelJs. Esto se debe a que tenemos que configurar babel, así que vamos a instalar las dependencias necesarias, entre ellas el plugin para eslint y el plugin para babel-plugin-syntax-dynamic-import o babel-plugin-dynamic-import-node que nos permitiran realizar lazy loading/code spliting:

### Instalando babel

```shell
$ yarn add -D babel-preset-env babel-plugin-transform-runtime babel-plugin-dynamic-import-node babel-eslint
```

### Configurando babel

Para configurar babel tenemos que añadir el archivo. babelrc en la carpeta raíz y de nuestro proyecto y añadir la configuración básica que nos permita empaquetar nuestra aplicación (en este caso Vue). La configuración es muy sencilla, aunque lógicamente aquí podemos añadir todos los presets y plugins que vayamos a necesitar, pero por el momento solo necesitamos babel-preset-env que nos habilita a la compilación de ES2015 con sus respectivos polyfills y los plugins necesarios:

```json
{
  "presets": ["env"],
  "plugins": ["transform-runtime", "dynamic-import-node"]
}
```

Bien pues una vez que tenemos babel configurado ya podemos levantar el servidor de desarrollo perfectamente y sin errores. ¿Qué tal se comporta? Muy bien la verdad, realiza rápidos rebuilds cuando realizamos modificaciones en el código js o en el propio template por lo que, no se puede pedir más teniendo en cuenta que no hemos añadido ni una sola línea de configuración. Less is more :)

### Routing / Lazy Loading

No podemos evaluar un bundler de hoy en día sin evaluar estas características, fundamentales en cualquier proyecto de hoy en día. Parcel nos permite, haciendo uso de la propuesta del [TC39 dynamic-imports](https://github.com/tc39/proposal-dynamic-import) la carga asíncrona y bajo demanda de ciertos módulos, de tal forma que no tenemos que cargar la totalidad del código Js de nuestra app si no accedemos a una determinada ruta, sección o container (contenedor de otros componentes). Para ello haremos uso del paquete babel-plugin-dynamic-import-node que instalamos al inicio y añadimos al fichero. babelrc:

#### routes.js

```js
import Vue from "vue";
import Router from "vue-router";

Vue.use(Router);

const HomeContainer = () => import("./containers/home/home.vue");
const ContactContainer = () => import("./containers/contact/contact.vue");

export default new Router({
  routes: [
    { path: "/", name: "home", component: HomeContainer },
    { path: "/contact", name: "contact", component: ContactContainer },
  ],
});
```

Una vez que tenemos las rutas definidas, solo nos hace falta un componente menú, por ejemplo, en el que mediante router-link se accedan a esas rutas:

#### components/MenuComponent.vue

```jsx
<template>
  <div>
      <router-link to="/">
          Home
      </router-link>
        <router-link to="/contact">
          Contact
      </router-link>
  </div>
</template>
<script>
  export default {
    name: 'menu-component'
  };
</script>
```

Este sistema, si bien se apoya en una propuesta del TC39 puede hacer que no funcione del todo bien con todos los routers existentes. En el caso que nos lleva, con [vue-router](https://router.vuejs.org/en/) no debería de haber ningún problema ya que de hecho este sistema funciona a la perfección con Webpack. Con Parcel el build se genera correctamente, sin errores, pero todo el código está siendo incluido en un único chunk (main.hash.js) por lo que Parcel no está haciendo el code spliting, separando el código según cada una de las rutas y sirviendolo al entrar en la correspondiente ruta. En el momento de escribir este post existen [diversos issues](https://github.com/parcel-bundler/parcel/issues/905) abiertos en el github de Parcel sobre fallos en el code spliting.

### POSTCSS

Vamos con las hojas de estilo. PostCss es hoy día ampliamente utilizado por lo que el correcto funcionamiento de PostCss es fundamental a la hora de evaluar una herramienta de bundeling. Vamos a empezar por algo sencillo, utilizando únicamente el plugin [css-next](http://cssnext.io/) que nos da mucha funcionalidad por si solo:

```shell
$ yarn add -D postcss-cssnext
```

Necesitamos generar el archivo de configuración de PostCss donde vamos a indicar el pipe de plugins PostCss y sus respectivas configuraciones si así fuera necesario:

#### POSTCSSCRC.JS

```js
module.exports = {
  plugins: [require("postcss-cssnext")],
};
```

Una vez configurado PostCss vamos a crear nuestras hojas de estilo. Css-next es un plugin de PostCss que nos ofrece, entre otras cosas, la posibilidad de crear variables que luego utilicemos en nuestras hojas de estilo, así que vamos a comenzar por nuestro fichero de variables css:

#### STYLES/VARIABLES.CSS

```css
:root {
  --main-color: #ddd;
}
```

#### STYLES/STYLES.CSS

```css
@import "./variables.css";

#app {
  background-color: var(--main-color);
}
```

Con las hojas de estilos de variables y la hoja principal ya creadas, en nuestro fichero de Vue solo tenemos que importar la hoja de estilo principal como si de un módulo de Js se tratará:

#### APP.VUE

```jsx
...
<script>
import MenuComponent from './components/MenuComponent.vue';
import './styles/styles.css'; // Importación de la hoja de estilo
export default {
  name: 'app',
  components: {
    'menu-component': MenuComponent,
  },
}
</script>
```

Con esto ya podemos usar toda la funcionalidad de css-next pero la integración de Parcel con el amplio ecosistema PostCss está algo verde aún y de hecho es prácticamente imposible correr un pipe de plugins PostCss habituales en muchos proyectos con una docena de plugins (y no solo css-next). En este ejemplo he intentado incorporar 2 plugins muy utilizados como son [precss](https://github.com/jonathantneal/precss) y [postcss-nested](https://github.com/postcss/postcss-nested) sin mucho éxito. En una rápida búsqueda se pueden encontrar [issues abiertos](https://github.com/parcel-bundler/parcel/issues/329) a este respecto que hacen muy difícil utilizar Parcel en un proyecto que utilice de forma amplia PostCss. En Sass / Less parece que la integración a día de hoy es algo mejor.

### Build de producción

Mientras en Webpack, al menos hasta la reciente versión 4 y su nuevo mode = production, en versiones previas requería una extensa configuración específica para producción. En Parcel, es notablemente más sencillo, pues no requiere de configuración adicional, solo el paso del parametro build. Parcel ya lleva incluidos [uglify-es](https://www.npmjs.com/package/uglify-es), para Js [cssnano](http://cssnano.co/) para Css y [htmlnano](https://github.com/posthtml/htmlnano) para Html, por lo que no necesitaremos ningún plugin o herramienta adicionales para generar un build optimizado para producción:

```json
{
  "name": "parcel-vue-example",
  "version": "1.0.0",
  "main": "src/main.js",
  "repository": "https://github.com/pmagaz/parcel-vue-example.git",
  "scripts": {
    "start": "parcel ./index.html",
    "build": "parcel build ./index.html -d dist --no-cache"
  }
}
```

Nuestro build se generará en el directorio dist con los archivos minificados y el correspondiente hash de compilación en todos ellos, además de generarnos también el html que incluye dichos archivos sin necesidad de ningún plugin como el archiconocido [HtmlWebpackPlugin](https://github.com/jantimon/html-webpack-plugin).

```shell
$ yarn build
  yarn run v1.6.0
$ parcel build ./index.html -d dist
  ✨ Built in 1.75s.
  dist/main.db8f8225.js    116.06 KB    1.04s
  dist/main.db8f8225.css    12.06 KB    200ms
  dist/index.html             202 B       5ms
  dist/main.1f131ab6.map        0 B     1.16s
  ✨ Done in 3.20s.
```

Todo perfecto salvo que si echamos un vistazo al archivo generado vemos que las primeras 50-60 primeras líneas se encuentran sin minificar y con comentarios. Un fallo lo tiene cualquiera.

### CONCLUSIONES

La promesa de Zero Config de Parcel es real. Si lo comparamos con la [cantidad de configuración](https://github.com/atSistemas/react-base/tree/master/webpack) necesaria de Webpack, al menos hasta la versión 4 donde esto ha comenzado a cambiar en Parcel es instalar y empaquetar, nada más permitiendo que el montaje de este ejemplo haya requerido muchísimo menos tiempo empleado que en su versión Webpack.

Parcel ofrece unos tiempos de building muy rápidos, más que los de Webpack pero en honor a la verdad creo que los datos ofrecidos en la propia web de Parcel pueden estar basados en versiones algo antiguas de Webpack ya que la diferencia entre uno y otro que yo he apreciado no es tan abismal como la web de Parcel indica...

En los "peros", lo esperable en una herramienta bastante reciente: Como hemos visto, en algunas áreas hemos encontrado algún problema que puede hacer complicado el cambio total de Webpack a Parcel "ya de ya" en determinados proyectos, pero bueno cabe esperar que el tema vaya madurando y estemos ante una herramienta de building muy potente y, sobre todo, muy muy productiva por no requerir configuración.

Less is more.

[Código](https://github.com/pmagaz/parcel-vue-example).
