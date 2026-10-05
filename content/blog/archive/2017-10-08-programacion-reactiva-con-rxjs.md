---
title: "Programación Reactiva con RxJs"
date: "2017-10-08"
updated: "2018-05-09"
slug: "programacion-reactiva-con-rxjs"
author: "Pablo Magaz"
excerpt: "La programación reactiva es un concepto que va ganando muchos adeptos en los últimos tiempos. RxJs es el port de la librería Reactive Extensions que ha sido portada a numerosos lenguajes y que toma lo mejor de la programación funcional, el patrón Observer y el patrón iterador."
category: "technology"
keywords: ["RxJs"]
archived: true
---

## La programación reactiva es un concepto que va ganando muchos adeptos en los últimos tiempos. RxJs es el port de la librería Reactive Extensions que ha sido portada a numerosos lenguajes y que toma lo mejor de la programación funcional, el patrón Observer y el patrón iterador.

[Ben Lesh](https://twitter.com/benlesh?lang=es) a menudo define RxJs como "[Lodash](https://lodash.com/) for asynchronous data" y ciertamente es así pero cuando comenzamos a profundizar un poquito, rápidamente comenzamos a ver que hay algo más. RxJs es una librería que toma lo mejor de patrones como el [patrón observer](<https://es.wikipedia.org/wiki/Observer_(patr%C3%B3n_de_dise%C3%B1o)>), el [ patrón iterador ](<https://es.wikipedia.org/wiki/Iterador_(patr%C3%B3n_de_dise%C3%B1o)>) y paradigmas como la [programación funcional](https://es.wikipedia.org/wiki/Programaci%C3%B3n_funcional) como reza el eslogan oficial. Esta diversidad de elementos hace que, en ocasiones, sea una librería con una curva de aprendizaje un poco intimidatoria por el cambio que supone frente a otros paradigmas o patrones más utilizados y con los que seguramente nos sentimos más familiarizados. A lo largo de este post vamos a ver los distintos ingredientes que forman la receta de RxJs.

### ¿Qué es la programación Reactiva?

La programación Reactiva es programación orientada al manejo de streams de datos asíncronos y la propagación del cambio. Está es un poco la frase standard, pero nos deja un poco fríos al leerla, así que vamos a tratar de explicarlo con un poquito más de detalle.

### STREAM

Un stream es un flujo de datos y tradicionalmente los streams han estado ligados a operaciones I/O como lectura/escritura de ficheros o querys a base de datos. En RxJs, no es muy diferente ya que sea cual sea el origen de la información, será tratada como un stream.Aqui podemos ver stream muy simple que emite los valores contenidos en un Array:

```js
const arrayStream$ = Rx.Observable.from([10, 20, 30]);
// >> 10, 20, 30
```

Una de las máximas en la programación reactiva es que "todo es un stream" por lo que con RxJs, cualquier flujo de información será tratada como un stream. Eventos del ratón, Arrays, rangos de números, promesas, etc. Todo será un stream.

```js
//Una letra es un stream
const letterStream$ = Rx.Observable.of("A");
// Un rango de números es un stream
const rangeStream$ = Rx.Observable.range(1, 8);
// Los valores de un Array son un stream
const arrayStream$ = Rx.Observable.from([1, 2, 3, 4]);
// Valores emitidos cada 100 ms son un stream
const intervalStream$ = Rx.Observable.interval(100);
// Cualquier tipo de evento del ratón es un stream
const clicksStream$ = Rx.Observable.fromEvent(document, "click");
// La respuesta a un servicio basada en una promesa es un stream
const promiseStream$ = Rx.Observable.fromPromise(fetch("/products"));
```

En RxJs los streams están representados por "secuencias observables" o simplemente Observables, por lo que en RxJs todo, absolutamente todo es un Observable, lo que logicamente nos lleva al patrón Observer.

### Un poco de patrón Observer

El [patrón Observer](<https://es.wikipedia.org/wiki/Observer_(patr%C3%B3n_de_dise%C3%B1o)>) juega un papel fundamental y explica a la perfección, el concepto de reactivo. El patrón Observer define un productor de información, nuestro stream y que en RxJs está representado por una secuencia Observable o simplemente Observable y un consumidor de la misma, que sería el Observer. Como hemos visto, en RxJs el Observable es nuestro stream y que nos sirve para prácticamente todo: eventos del ratón, rangos de números, promesas, etc, pero ¿como es el Observer?

```js
//Observable
const myObservable$ = Rx.Observable.from([1, 2, 3]);

//Observer
const myObserver = {
  next: (x) => console.log(`Observer next value: ${x}`),
  error: (err) => console.error(`Observer error value: ${err}`),
  complete: () => console.log(`Observer complete notification`),
};

myObservable$.subscribe(myObserver);
```

Como vemos el Observer es un objeto que dispone de 3 métodos para recibir información acerca del Observable. Cada uno de estos métodos cumple una función y a través de cada uno de ellos recibiremos distintos tipos de notificaciones del Observable.

El Observer en sí mismo no devolverá ningún valor hasta que se active la comunicación entre ambas partes. Este mecanismo es la subscripción y nada se ejecutará hasta que establezcamos una subscripción. El método subscribe activa el Observable y habilita al Observer a recibir notificaciones del stream. No obstante, es posible establecer una subscripción pasando directamente funciones como argumentos, ya que internamente RxJs asignará cada uno de estos callbacks a los respectivos métodos del Observer, siguiendo el orden en el que son pasados, siendo el primero de ellos next, el segundo error y el tercero complete.

```js
const arrayStream$ = Rx.Observable.from([1, 2, 3]);

arrayStream$.subscribe(
  (next) => console.log(next),
  (err) => console.log(err),
  () => console.log("completed!")
);
```

El resultado en ambos casos es el mismo, no hay ninguna diferencia, pero esta forma suele ser algo más habitual ya que además no es necesario establecerlos todos.

#### Next

Es el primer y más importante callback, que recibiremos en la subscripción, ya que el resto son opcionales y notifica un valor del stream emitido por el Observable.

```js
Rx.Observable.from([1, 2, 3]).subscribe((next) => console.log(next)); // -> 1, 2, 3
```

#### Error

Se ejecuta cuando se ha producido un error o excepción.

```js
Rx.Observable.from([1, 2, 3]).subscribe(
  (next) => console.log(next),
  (err) => console.log(err) // Se ha producido un error
);
```

#### Complete

Complete es una notificación sin valor y se emite solo cuando el stream de datos ha finalizado:

```js
Rx.Observable.from([1, 2, 3]).subscribe(
  (next) => console.log(next),
  (err) => console.log(err),
  () => console.log("completed!") // Se ejecuta cuando finaliza el stream, después del (3)
);
```

Es importante destacar que existen streams finitos y streams inifinitos, que nunca llegan a emitir un complete. Un stream sobre un evento, click de ratón, movimiento del ratón o similares, nunca llegaran a emitir un complete.

Estos 3 métodos han sido modificados en la versión 5 de RxJs para alinearlos con los métodos de la propuesta de Observable para [ECMAScript](https://github.com/tc39/proposal-observable) ya que en versiones anteriores estos métodos eran: onNext() onComplete() y onError() y mucha de la documentación existente hace referencia a ellos pero pertenecen a versiones anteriores de RxJs.

#### Pull vs Push

Dentro del patrón Observer existen diversas implementaciones donde la iniciativa sobre quien comunica a quien puede variar. En un sistema basado en pull, será el consumidor de la información (Observer) el que tome la iniciativa y le preguntará al productor de la información (Observable) si existe nueva información del stream (Oye, ¿tienes nueva información?). En un sistema basado en push será el productor (Observable) el que informe al consumidor (Observer) (¡hey yo!, tengo nueva información), de tal forma que este se limita a "reaccionar" a las notificaciones del Observable.

### Un poco de patrón Iterador

Otro de los patrones en los que se inspira RxJs, es el [ patrón iterador ](<https://es.wikipedia.org/wiki/Iterador_(patr%C3%B3n_de_dise%C3%B1o)>), que nos permite iterar contenedores de información como, por ejemplo, un Array, sin exponer su representación interna. Para ello se define un iterador -next-, que será el encargado de recorrer el contenedor de información, manteniendo el cursor o índice con la posición del último valor dado:

```js
const simpleIterator = (data) => {
  let cursor = 0;
  return {
    next: () => (cursor < data.length ? data[cursor++] : false),
  };
};

var consumer = simpleIterator(["simple", "data", "iterator"]);
console.log(consumer.next()); // 'simple'
console.log(consumer.next()); // 'data'
console.log(consumer.next()); // 'iterator'
console.log(consumer.next()); // false
```

Si examinamos un Observable por dentro vemos claramente la influencia de estos dos patrones. Aquí hay un ejemplo muy sencillo de un Observable que simplemente itera los valores de un Array y emite los valores correspondientes utilizando el next. Una vez emitidos todos, finaliza el stream con complete.

```js
const myCustomObservable = (data) =>
  Rx.Observable.create((observer) => {
    for (let i = 0; i < data.length; i++) {
      observer.next(data[i]);
    }
    observer.complete();
  });

const myStream$ = myCustomObservable([1, 2, 3]);

myStream$.subscribe((x) => console.log(`next ${x}`));
```

### Un poco de programación Funcional

La [programación funcional](https://es.wikipedia.org/wiki/Programaci%C3%B3n_funcional), es el otro gran pilar sobre el que sea asienta RxJs y su influencia es realmente grande. La programación funcional está de moda y eso que no es especialmente nueva. Lenguajes como [Haskell](<https://en.wikipedia.org/wiki/Haskell_(programming_language)>) peina canas ya, pero como los pantalones de pitillo, todo vuelve. Para hablar en extensión de la programación funcional harían falta varios posts y esto queda lejos del objetivo de éste, pero si es importante destacar al menos las características que más afectan a su uso en Rxjs:

#### Las funciones son ciudadanos de primera clase.

Las funciones son las reinas del baile y permiten entre otras cosas el paso de funciones como argumentos de otras funciones. En la programación funcional todo está orientado al empleo de funciones.

#### Funciones puras

Son funciones que con los mismos argumentos siempre devolverán el mismo resultado. Esto puede parecer una obviedad, pero si en una función dependemos de algún elemento fuera de su ámbito o scope local, como variables globales o cosas así, la función deja de ser pura ya que existen elementos externos que pueden variar su resultado. Otra característica es que no tienen efectos colaterales (side effects) ya que no mutan datos, ni tienen acceso a ningún elemento externo. Una llamada a un console.log en una función, técnicamente lo convierte en un efecto colateral y por tanto dejaría de ser una función pura.

#### Funciones de orden superior

Las funciones de orden superior suelen ser muy utilizadas en la programación funcional. Son funciones puras, que reciben otras funciones como argumentos para la realización de cálculos. JavaScript está considerado un lenguaje funcional impuro ya que, si bien es un lenguaje imperativo, si tiene algunos elementos de la programación funcional descritos más arriba. Las funciones de orden superior como [map](https://developer.mozilla.org/es/docs/Web/JavaScript/Referencia/Objetos_globales/Array/map), [reduce](https://developer.mozilla.org/es/docs/Web/JavaScript/Referencia/Objetos_globales/Array/reduce) o [filter](https://developer.mozilla.org/es/docs/Web/JavaScript/Referencia/Objetos_globales/Array/filter) son un buen ejemplo de ello.

Vamos a ver un ejemplo de empleo de este tipo de funciones con un Array de números de los cuales queremos obtener la suma de todos los que sean pares:

```js
const source = [0, 1, 2, 3, 4, 5];

const result = source
  .filter((x) => x % 2 === 0) // -> [0, 2, 4]
  .reduce((acc, cur) => acc + cur); // -> 0 + 2 + 4

console.log(result); // OUTPUT >> 6
```

En el ejemplo anterior vemos estas características en funcionamiento. Tanto filter como reduce son funciones de orden superior que reciben otras funciones (x % 2 === 0) y que además devuelven un nuevo Array manteniendo inalterado el original. Dado que source es una constante si alguna de estas funciones mutara su valor, tendríamos un error.

RxJs tiene un fuerte componente de programación funcional y si bien no es necesario ser un total experto en programación funcional, si es importante tener claro al menos estos elementos. En RxJs vamos a trabajar de forma muy similar con un pipeline de funciones que recibirán (y devolverán) un Observable y que nunca mutarán el stream original. A estas funciones se las conoce como operadores y puedes conocer qué son y cómo funcionan en el [siguiente](https://pablomagaz.com/blog/old/como-funcionan-operadores-rxjs) capítulo, [como funcionan los operadores de RxJs](https://pablomagaz.com/blog/old/como-funcionan-operadores-rxjs).
