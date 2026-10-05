---
title: "Creando operadores propios en RxJs"
date: "2020-12-14"
updated: "2020-12-14"
slug: "creando-operadores-propios-rxjs"
author: "Pablo Magaz"
excerpt: "Los operadores de RxJs son una de las piezas clave de esta gran librería, ya que el amplio catalogo existente nos permite cubrir casi cualquier tarea imaginable. Sin embargo, en ciertas ocasiones es necesario poder implementar nuestros propios operadores. En este post aprenderemos como hacerlo."
category: "technology"
keywords: ["RxJs"]
archived: true
---

## Los operadores de RxJs son una de las piezas clave de esta gran librería, ya que el amplio catalogo existente nos permite cubrir casi cualquier tarea imaginable. Sin embargo, en ciertas ocasiones es necesario poder implementar nuestros propios operadores. En este post aprenderemos como hacerlo.

La [serie](https://pablomagaz.com/tag/rxjs) de RxJs de este blog es, probablemente, uno de los recursos mas amplios y variados sobre RxJs en español y alguno de los posts se encuentra siempre entre los posts más [vistados](https://pablomagaz.com/blog/old/rxjs-subjects-que-son-como-funcionan) de todo el blog, algo que es soprendente ya que alguno se escribió hace ya casi 2 años (¡cómo pasa el tiempo!). Con esta serie sobre RxJs hemos cubierto un montón de áreas de RxJs, desde conceptos [básicos](https://pablomagaz.com/blog/old/programacion-reactiva-con-rxjs) sobre programación reactiva a temas más avanzados como los [subject](https://pablomagaz.com/blog/old/rxjs-subjects-que-son-como-funcionan), pero existe un tema en concreto del que no habíamos hablado y por el que en los últimos tiempos varios lectores me han pedido un post, así que por petición popular allí vamos. En este post vamos a hablar de cómo crear nuestros propios operadores de RxJs, algo que a pesar del amplio catálogo de [operadores](https://www.learnrxjs.io/learn-rxjs/operators) puede ser necesario cuando queremos reutilizar lógica.

Antes de ponernos manos a la obra, es muy importante entender la propia naturaleza de los operadores de RxJs si queremos poder escribir los nuestros, por lo que recomiendo que te pases por este [post](https://pablomagaz.com/blog/old/como-funcionan-operadores-rxjs) donde explicamos precisamente cómo funcionan los operadores de RxJs, pero haremos un breve resumen.

Si bien solemos ver los operadores de RxJs como funciones de orden superior (como [map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map), [filter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter), etc), estos funcionan de forma diferente. Los operadores no crean estructuras de datos intermedios, como si hacen las funciones de orden superior (map devuelve un nuevo array), pero seguramente el punto que más confusión suele generar es que tendemos a pensar que lo que "pasa" de un operador a otro en la cadena, son los propios valores del stream pero la realidad es diferente ya que los operadores de Rxjs **siempre reciben y devuelven un observable**, por lo que realmente los operadores actuan como observers o subscriptores de ese observable.

Para entender esto mejor echemos un vistazo al ejemplo mas básico de operador de RxJs que podemos escribir y que es un operador que simplemente hace un "passthrough" de los valores del observable, sin introducir ninguna alteración o modificación de los valores del observable:

```ts
import { interval, Observable } from "rxjs";

const basicOperator = <T>(source: Observable<T>): Observable<T> => source;

interval(500)
  .pipe(basicOperator)
  .subscribe((value) => console.log(value));
// 0,1,2,3,4,5,6
```

Como vemos en el ejemplo nuestro basicOperator es una simple función genérica que recibe un observable (source) y devuelve ese mismo observable al siguiente operador en la cadena. Lógicamente es un ejemplo con poca utilidad ya que muy probablemente queramos "hacer algo" con los valores del stream (por eso escribimos nuestro operador).

### Creando operadores sobre operadores existentes

Probablemente la forma más rápida y sencilla de acercarnos al objetivo de implementar un operador un operador "custom" sea la utilización de [operadores](https://www.learnrxjs.io/learn-rxjs/operators) ya existentes, ya que recordemos, el catálogo de operadores de RxJs es realmente amplio. Supongamos que queremos implementar un operador que nos calcule el doble de los valores (númericos) del observable. En un primer intento podríamos utilizar map sobre el observable que recibe el operador, usando pipe de la siguiente manera:

```ts
import { interval, Observable } from "rxjs";

const doubleOperator = (source: Observable<number>): Observable<number> =>
  source.pipe(map((x) => x * 2));

interval(500)
  .pipe(doubleOperator)
  .subscribe((value) => console.log(value));
// 0,2,3,4,5,6,7,8
```

Con esto no estaríamos creando un nuevo operador realmente, ya que estamos utilizando un operador ya existente que es map con lo que realmente estamos creando un wrapper alrededor de otro operador, map en este caso pero dependendiendo de la casuística puede ser suficiente. Sin embargo, en otros casos si puede ser necesario implementar totalmente nuestro propio operador y no reutilizar operadores existentes.

### Creando nuestro propio operador (de verdad)

Antes de ponernos manos a la obra a crear nuestros propios operadores cabe recordar una cosa importante: Cuando establecemos una suscripción a un observable obtenemos un objeto observer o subscriber que tiene 3 métodos: next, que emite un valor al stream, error que es el método encargado de capturar errores y complete, que se utiliza para finalizar el stream. Por tanto si queremos implementar nuestros propios operadores y no operadores sobre los ya existentes, es requisito indispensable establecer una suscripción al observable que recibe nuestro operador, implementar al menos el método next ya que error y complete son opcionales y devolver un nuevo observable:

```ts
const doubleOperator = (source: Observable<number>): Observable<number> => (
  new Observable(subscriber => {
    source.subscribe({
      next(value) { ... },
      error(value) { ... }, //Optional
      complete(value) { ... },// Optional
    })
  }));
```

Como vemos, estamos estableciendo una suscripción al observable que recibe el operador (source) e implementando los métodos del objeto observer (subscriber) aunque como comentamos, solo next sería obligatorio aunque implementar la gestión de errores es algo más que recomendable. Ya solo nos quedaría implementar la lógica de nuestro método next y calcular el doble del valor recibido en dicho método. Para emitir el valor calculado al siguiente operador del observable utilizaramos el método next del observer devuelto en nuestro operador (no confundir con el observable recibido):

```ts
import { interval, Observable } from "rxjs";

const doubleOperator = (source: Observable<number>): Observable<number> =>
  new Observable((subscriber) => {
    source.subscribe({
      next(value) {
        subscriber.next(value * 2);
      },
      error(error) {
        subscriber.error(error);
      },
      complete() {
        subscriber.complete();
      },
    });
  });

interval(500)
  .pipe(doubleOperator)
  .subscribe((value) => console.log(value));
// 0,2,3,4,5,6,7,8
```

### Mejorando nuestro operador

Nuestro operador está bastante bien, sin embargo, tiene un pequeño problema. No es reusable ya que es un operador que simplemente calcula el doble de un número sin dar la posibilidad de modificar este comportamiento. No tendría mucho sentido implementar operadores adicionales para calcular el triple o el cuádruple ¿verdad? Podemos hacerlo un poquito mejor, dando la posibilidad de pasar argumentos a nuestro operador, algo que los propios operadores de RxJs tambien hacen. Para ello sólo necesitamos envolver nuestro operador en una función que reciba dichos argumentos y que serán pasados a nuestro operador:

```ts
import { interval, Observable } from "rxjs";

function multiplyOperator(multiplier: number) {
  return (source: Observable<number>): Observable<number> =>
    new Observable((subscriber) => {
      source.subscribe({
        next(value) {
          subscriber.next(value * multiplier);
        },
        error(error) {
          subscriber.error(error);
        },
        complete() {
          subscriber.complete();
        },
      });
    });
}

interval(500)
  .pipe(multiplyOperator(3))
  .subscribe((value) => console.log(value));
// 0, 3, 6, 9, 12, 15
```

Mejor ¿verdad? Sin embargo, podemos ir un poquito más lejos e implementar una suerte de "custom map" donde podemos pasar por argumentos la operación que queremos realizar (el predicado), asi nuestro operador puede realizar cualquier tipo de operación y no solo multiplicaciones:

```ts
import { interval, Observable } from "rxjs";

function customMapOperator(predicate: (x: number) => number) {
  return (source: Observable<number>): Observable<number> =>
    new Observable((subscriber) => {
      source.subscribe({
        next(value) {
          subscriber.next(predicate(value));
        },
        error(error) {
          subscriber.error(error);
        },
        complete() {
          subscriber.complete();
        },
      });
    });
}

interval(500)
  .pipe(customMapOperator((x) => x * 5 * 2 + 1))
  .subscribe((value) => console.log(value));
// 0,11,21,31,41,51
```

Pues esto ha sido todo. Como hemos podido ver, crear operadores de RxJs es una tarea relativamente sencilla, pero es importante entender no sólo como funcionan los propios operadores de RxJs si no también la lógica del Observable y los métodos a implementar en el objeto observer devuelto por la suscripción.
