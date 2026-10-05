---
title: "Como crear middleware para Redux"
date: "2017-10-22"
updated: "2020-01-25"
slug: "como-crear-middleware-para-redux"
author: "Pablo Magaz"
excerpt: "Redux se ha convertido en el paradigma de los paradigmas. Ampliamente utilizado en entornos React y cada vez más en entornos Angular o Vue, posee algunas características muy potentes, pero menos conocidas como su middleware. Su empleo puede llevar nuestra arquitectura a otro nivel."
category: "technology"
keywords: ["Redux", "React"]
archived: true
---

## Redux se ha convertido en el paradigma de los paradigmas. Ampliamente utilizado en entornos React y cada vez más en entornos Angular o Vue, posee algunas características muy potentes, pero menos conocidas como su middleware. Su empleo puede llevar nuestra arquitectura a otro nivel.

Lo reconozco, soy un fanboy de [Redux](http://redux.js.org/). Redux es el perfecto ejemplo de la mítica frase de Ludwig Mies van der Rohe, [Less is more](https://en.wikipedia.org/wiki/Minimalism#Less_is_more_.28architecture.29). Su extrema simplicidad hace que sea fácil de implementar y adaptarse a su funcionamiento, pero hay algunos elementos propios de Redux que a veces pasan un poco desapercibidos, quizás por ser una característica un poco más avanzada. Uno de estos elementos es el middleware de su store.

### ¿Qué es un middleware?

Un [middleware](https://es.wikipedia.org/wiki/Middleware) es una pieza de software que puede actuar entre medias de aplicaciones o de paquetes de la misma aplicación. El middleware del store de Redux, será por tanto una pieza de código (realmente una función) que actuará cuando se disparen nuevas acciones.

Como sabemos, en Redux, tenemos [actions](http://redux.js.org/docs/basics/Actions.html) que son simples, que mediante el parámetro type definen que algo ha sucedido en nuestra aplicación. El store dispara estos actions y serán nuestros [reducers](http://redux.js.org/docs/basics/Reducers.html) los que capturarán la acción disparada y su payload y al state previo de nuestra aplicación, devolviendo así el siguiente con los cambios que queramos hacer.

Un middleware de Redux no es más que una función, o mejor dicho 3 funciones anidadas y su estructura más básica es la siguiente:

```js
const myMiddleware = (store) => (next) => (action) => {
  console.log("my first middleware");
};
```

#### Store

El store de nuestra aplicación es donde se guarda el state de la misma. El store dispone de varios métodos para acceder al state, como [getState()](http://es.redux.js.org/docs/api/Store.html#getState) que nos devolverá el state completo de nuestra aplicación. El método [dispatch](http://es.redux.js.org/docs/api/Store.html#dispatch) es el encargado de disparar acciones.

#### Next

Next nos permite devolver la acción al siguiente middleware en la cadena ya que el middleware funciona en cadena y una misma acción debe de pasar por todos los middlewares. Funciona de forma muy similar al next de [Express](http://expressjs.com/es/guide/using-middleware.html)

#### Action

La acción que ha sido disparada, con su payload (si lo llevará) por lo cual podremos interactuar y modificar las acciones disparadas.

Bien, pues ya tenemos todos los elementos necesarios para crear nuestro middleware así que vamos a plantear un ejemplo sencillo. Imaginemos que queremos hacer un middleware que saque por consola información del action que sido disparada.

```js
export const myMiddleware = (store) => (next) => (action) => {
  // Mostramos en la consola el type de la accción y el timestamp
  console.log(`Action dispatched: ${action.type}, Time: ${+new Date()}`);
  // Devolvemos la acción para que continue el flujo habitual
  return next(action);
};
```

Ahora como es lógico, necesitamos añadir nuestro middleware al store y el lugar para hacerlo es en el createStore de Redux, cuyo tercer parámetro son los middleware que queremos que actúen en nuestro store.

```js
// configureStore.js...
import { createStore, applyMiddleware } from "redux";
import { myMiddleware } from "./myMiddlewarePath";

const middleware = applyMiddleware(myMiddleware);
const store = createStore(rootReducer, initialState, middleware);
```

Pues ya tenemos creado nuestro middleware y añadido al store de Redux. A partir de este momento, cada vez que cualquier acción sea disparada podremos ver la salida en la consola algo parecido a esto:

"Action dispatched: USER_FILTER, Time: 1524016323280"

Este es un ejemplo muy sencillo, pero que nos da ya pistas de lo fácil que es realizar middleware para el store de Redux (Less is more) pero vamos a llevar este ejemplo un poquito más allá y vamos a tratar de hacerlo realmente útil.

En cualquier aplicación es necesario el consumo de servicios REST y sabemos que estos pasan mayormente por 3 posibles estados.

Cuando lanzamos la request, cuando llega la respuesta o cuando llega el error. Tener que manejar y disparar a mano las acciones que correspondan es un proceso tedioso y en puntos como este es donde un middleware nos viene al dedo. Existen [muchos](https://www.npmjs.com/search?q=redux%20middleware&page=1&ranking=optimal) middleware para Redux que realizan tareas muy similares, pero vamos a hacernos uno propio, por ejemplo para que nuestras acciones puedan llevar un parámetro con una promesa asociada y delegar en nuestro middleware la ejecución de dicha promesa que será una llamada a un servicio:

```js
export const getDataAction = (params) => ({
  // Una acción que nos indica que estamos ante una llamada a un servicio
  type: "DATA_REQUEST",
  // llamada a servicio
  request: fetchData(params),
});
```

El objetivo ahora es conseguir que cuando se dispare esta acción nuestro middleware sea capaz, primero de ejecutar la promesa asociada a ese servicio y segundo de devolvernos una nueva acción de tipo 'SUCCESS' con la respuesta del servicio o una nueva acción de tipo 'ERROR' si se ha producido un error, lo que nos ahorrará una enorme cantidad de trabajo:

```js
const myMiddleware = (store) => (next) => (action) => {
  const { request, type } = action;
  // Devolvemos la acción que ha sido disparada
  next({ type: type });
  //Ejecutamos la promesa del parámetro request de nuestro action
  return request.then(
    // Devolvemos una nueva acción de tipo sucess con la response
    (res) => next({ res, type: "DATA_SUCCESS" }),
    // Si ha habido un error devolvemos una nueva acción de tipo Error
    (err) => next({ err, type: "DATA_ERROR" })
  );
};
```

Bien, pues ya tenemos nuestro middleware, sin embargo, este tiene algunos defectos que necesitamos mejorar ya que si lo usamos tal cual es probable que nos carguemos el flujo de la aplicación. Lo primero que necesitamos es, filtrar las acciones sobre las que queremos que actúe este middleware ya que solo queremos que actúe sobre acciones que lleven el parámetro request en el action y además devolver el success con el prefijo del action, es decir, si nuestra acción es "DATA_REQUEST" tenemos que poder devolver "DATA_SUCCESS".

```js
const myMiddleware = (store) => (next) => (action) => {
  // Recuperamos el resto de propiedades del action
  const { request, type } = action;
  // Si el action no lleva parámetro request, devolvemos el next
  if (!request) return next(action);
  // Lleva request, por lo que ejecutamos next del action en curso
  next({ type: type });
  // Devolvemos la nueva acción de tipo *_SUCCESS o *_ERROR
  return request.then(
    (res) => next({ res, type: type.replace("_REQUEST", "_SUCCESS") }),
    (err) => next({ err, type: type.replace("_REQUEST", "_ERROR") })
  );
};
```

Con esto tenemos ya listo nuestro middleware. Es un ejemplo básico y algo rudimentario en algunos puntos, pero aun así nos puede ahorrar grandes cantidades de código ya que estamos delegando en apenas 10-15 líneas de código la ejecución de promesas asociadas a acciones y la devolución de nuevas acciones con el resultado de la llamada al servicio.

Lógicamente podemos complicarlo todo lo que queramos y si queréis ver un ejemplo de un middleware con algo de más de funcionalidad, que permite tipos de acción customizadas, chaining de acciones y alguna cosa más echarle un vistazo a [redux-req-middleware](https://www.npmjs.com/package/redux-req-middleware) que es el middleware usado en este [blog](https://github.com/pmagaz/pablomagaz.com).
