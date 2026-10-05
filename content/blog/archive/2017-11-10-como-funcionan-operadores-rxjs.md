---
title: "Como funcionan los operadores de RxJs"
date: "2017-11-10"
updated: "2018-05-09"
slug: "como-funcionan-operadores-rxjs"
author: "Pablo Magaz"
excerpt: "Los operadores son el corazón de RxJs y se encuentran fuertemente influenciados por algunas características de la programación funcional. RxJs posee cientos de operadores y que nos permitirán realizar casi cualquier cosa. Filtrado de datos, transformaciones e incluso uniones entre varios streams."
category: "technology"
keywords: ["RxJs"]
archived: true
---

## Los operadores son el corazón de RxJs y se encuentran fuertemente influenciados por algunas características de la programación funcional. RxJs posee cientos de operadores y que nos permitirán realizar casi cualquier cosa. Filtrado de datos, transformaciones e incluso uniones entre varios streams.

En el [capítulo anterior](http://) vimos la influencia que el [patrón observer](<https://es.wikipedia.org/wiki/Observer_(patr%C3%B3n_de_dise%C3%B1o)>), el [patrón iterador](<https://es.wikipedia.org/wiki/Iterador_(patr%C3%B3n_de_dise%C3%B1o)>) y algunas características de la [programación funcional](https://es.wikipedia.org/wiki/Programaci%C3%B3n_funcional) tienen en RxJs. Cuando tratamos con operadores, estas características de la programación funcional, como las funciones de orden superior, las funciones puras, la ausencia de efectos secundarios, etc cobran aún más importancia. Vamos al lío.

### ¿Que son los operadores?

Los operadores de RxJs son funciones que pueden ser encadenadas en lo que llamamos la cadena o pipeline de operadores y que se sitúan entre medias del Observable (productor de la información) y el Observer (consumidor de la misma) con el objetivo de filtrar, transformar o combinar los valores del Observable/Observables.

```js
const myObservable$ = Rx.Observable.of("Hello"); // Observable

myObservable$
  // Operadores...
  .subscribe((next) => console.log(next)); // Subscripción / Observer
```

Si bien es buena idea ver los operadores de RxJs como algo parecido a las funciones de orden superior los operadores de RxJs trabajan de forma un poco diferente. La principal diferencia es que los Observables no generan estructuras de datos intermedias como si hacen las funciones de orden superior como [map](https://developer.mozilla.org/es/docs/Web/JavaScript/Referencia/Objetos_globales/Array/map) o [filter](https://developer.mozilla.org/es/docs/Web/JavaScript/Referencia/Objetos_globales/Array/filter):

```js
const data = [0, 1, 2, 3];

const result = data
  .filter((x) => {
    console.log(`filter: ${x}`);
    return x % 2 === 0;
  })
  .map((x) => {
    console.log(`map: ${x}`);
    return x * x;
  }); // OUTPUT >> filter: 0, filter: 1, filter: 2, filter: 3, map: 0, map: 2
```

Cada una de estas funciones siempre devuelve un nuevo Array, sin realizar mutaciones en el Array original y como vemos en la salida hasta que filter no devuelve un nuevo Array, éste, no pasa a la siguiente función que es map. En estructuras largas de datos, esto, tendrá un coste elevado por la duplicidad temporal de los datos. La misma operación en RxJs tiene un aspecto casi idéntico, pero funciona de forma diferente:

```js
const data = [0, 1, 2, 3];
const source$ = Rx.Observable.from(data);

source$
  .filter((x) => {
    console.log(`filter: ${x}`);
    return x % 2 === 0;
  })
  .map((x) => {
    console.log(`map: ${x}`);
    return x * x;
  })
  .subscribe(); // OUTPUT >> filter: 0, map: 0, filter: 1, filter: 2, map: 2, filter: 3
```

Técnicamente, un operador, o al menos la gran mayoría de ellos, siempre devuelven un Observable, de tal forma que realmente cada operador actúa como subscriptor del Observable, usando para ello la API next, complete y error del Observer, como podemos ver [al final de éste post](#operadoresPorDentro). En la salida podemos ver como cada uno de los valores emitidos va pasando por los distintos operadores sin formar estructuras de datos intermedias, lo que es mucho más rápido y eficiente.

RxJs posee cientos de [operadores](http://reactivex.io/rxjs/manual/overview.html#operators), tantos que puede resultar complicado abarcarlos todos. Existen diversas [categorías](http://reactivex.io/rxjs/manual/overview.html#categories-of-operators) de operadores según su utilidad (creación, filtrado, transformación, agregación, etc) y aunque aquí no voy a explicar la lista completa porque sería el post más largo de la historia, si voy a tratar de explicar los más sencillos y habituales en sus respectivas categorías.

### Operadores de filtrado

Como su propio nombre indica son operadores para el filtrado de los valores emitidos por el Observable. Son uno de los tipos de operadores más sencillos y fáciles de utilizar ya que simplimente toman o rechazan ciertos valores según los criterios de filtrado que cada operador aplica. Vamos a ver un pipeline únicamente con operadores de filtrado, aunque vaya por delante que lógicamente los operadores pueden ser mezclados al margen de su categoría.

```js
const source$ = Rx.Observable.from([1, 2, 2, 2, 3, 4, 5, 6, 7, 8]);

source$
  // distinct filtra los valores emitidos que duplicados
  .distinct() // 1, 2, 3, 4, 5
  // takeWhile filtra los elementos según un criterio, en caso de no cumplirlo emite un complete()
  .takeWhile((x) => x < 10)
  // filter aplica una función de filtrado, en éste caso los valores pares
  .filter((x) => x % 2 === 0) // 2, 4, 6, 8
  // toma 3 valores
  .take(3) // 2, 4, 6
  // Skip omite el primer valor emitido por el observable devuelto por anterior operador
  .skip(1) // 4, 6
  // First solo toma el primer valor.
  .first() // 4
  // Podemos filtrar a lo largo del tiempo. ThrottleTime emite el último valor después de 100 ms
  .throttleTime(100) // 4
  .subscribe(console.log); // OUTPUT >> 4
```

### Operadores matemáticos

Son operadores para operaciones matemáticas. [Count](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#instance-method-count), [max](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#instance-method-max) y [min](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#instance-method-min) son los operadores más habituales. Imaginemos que queremos contabilizar los números pares en un rango de concreto:

```js
const source$ = Rx.Observable.range(1, 8);

source$.count((i) => i % 2 === 0).subscribe(console.log); // OUTPUT >> 4
```

Max y min nos permitirán obtener el máximo y mínimo valor emitido de ese mismo rango:

```js
const source$ = Rx.Observable.range(1, 8);

source$.max().subscribe(console.log); // OUTPUT >> 8
```

### Operadores de utilidad

Son operadores que aportan utilidades concretas como la conversión del Observable a una [promesa](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#instance-method-toPromise) o que nos ayudarán en tareas de debug como [do](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#instance-method-do), que nos permite visualizar cada valor emitido:

```js
const source$ = Rx.Observable.from([1, 2, 3]);

source$
  // Introuce un delay de 500 ms a cada valor emitido por el Observable
  .delay(500)
  // do es muy util para debuggear ya que nos permite ver los valores emitidos por el Observable sin alterarlo.
  .do((x) => console.log(`value emmited ${x}`))
  // convierte el Observable en una promesa que devolverá el último valor emitido por el Observable
  .toPromise()
  // es una promesa...
  .then(console.log); // OUTPUT >> "value emmited 1", "value emmited 2", "value emmited 3", 3
```

### Operadores de transformación

Los operadores de transformación como su propio nombre indica se utilizan para realizar transformaciones en los valores emitidos por el Observable. [Map](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#instance-method-map) es probablemente el más habitual y funciona de la misma manera que el map nativo de Js, es decir, aplica una función a cada valor emitido. [mapTo](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#instance-method-mapTo) permite sustituir cada valor emitido por un valor concreto, como una letra o un objeto. [pluck](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#instance-method-pluck) permite extraer propiedades de un objeto:

```js
const source$ = Rx.Observable.interval(100);

source$
  // mapTo mapea cada valor emitido por el observable a un objeto
  .mapTo({ msg: "HELLO" })
  // pluck extrae una propiedad de un objeto
  .pluck("msg")
  // map aplica una función a cada valor
  .map((x) => x.toUpperCase())
  .subscribe(console.log); // OUTPUT >> "HELLO", "HELLO", "HELLO"...
```

### Operadores de combinación

Trabajar con varios Observables al mismo tiempo es algo que tendremos que realizar en multitud de ocasiones. RxJs posee operadores que nos permiten combinar varios Observables en uno solo. [Merge](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#instance-method-merge) es un operador que combina los valores emitidos por 2 o más Observables, respetando el orden temporal en el que estos fueron emitidos. Vamos a mezclar 2 Observables, uno que emite valores (A) cada 100ms y otro que emite valores (B) cada 200 ms y vamos a combinarlos usando merge:

```js
const interval$ = Rx.Observable.interval(100).mapTo("A").take(3);
const interval2$ = Rx.Observable.interval(200).mapTo("B").take(3);

interval$.merge(interval2$).subscribe((next) => console.log(next));
// OUTPUT >> A, A, B, A, B, B
```

Como vemos en el ejemplo se emiten primero todos los valores del primer Observable y una vez que éste lanza su complete, se comienzan a emitir los valores del segundo.

Si en lugar de merge, empleamos el operador [concat](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#instance-method-concat), el resultado que obtendremos será diferente ya que concat esperará a que el primer Observable (interval$) emita su complete, antes de comenzar a recolectar los valores del segundo Observable (interval2$).

```js
const interval$ = Rx.Observable.interval(100).mapTo("A").take(3);
const interval2$ = Rx.Observable.interval(200).mapTo("B").take(3);

interval$.concat(interval2$).subscribe((next) => console.log(next));
// OUTPUT >> A, A, A, B, B, B
```

Como vemos en la salida, se emitirán todos los valores del primer Observable, y una vez que éste emita su complete, se comenzarán a recolectar los valores del segundo.

Dependiendo de que resultados esperamos recibir, el empleo de un operador u otro de combinación nos proporcionará resultados totalmente diferentes. Para entender estos criterios es muy aconsejable entender los diagramas de canicas. [RxMarbles](http://rxmarbles.com/) es un site donde vamos a poder ver cada uno de los distintos operadores con su respectivo diagrama. En la documentación [oficial](http://reactivex.io/rxjs/manual/index.html) de Rx, cada operador tiene su correspondiente diagrama. Esto nos ayudará a entender como con cada operador obtendremos resultados diferentes.

### Operadores por dentro.

Entender el funcionamiento y flujo de los valores del Observable a lo largo de los operadores, a veces, no es sencillo, así que vamos a ver cómo es un operador por dentro y aunque podríamos hacer la misma operación con filter, vamos a crearnos un operador que filtre aquellos valores que son mayores de un determinado número.

```js
function isBiggerThan(predicate) {
  let source = this;
  return Rx.Observable.create((observer) =>
    source.subscribe(
      (value) => {
        // Un operador siempre devuelve un Observable
        try {
          // Prevención de errores con try/catch
          if (value > predicate) observer.next(value); // Si se cumple la condición, devolvemos el valor con next
        } catch (e) {
          observer.error(e);
        }
      },
      (err) => observer.error(err),
      () => observer.complete() // Fin del stream
    )
  );
}

Rx.Observable.prototype.isBiggerThan = isBiggerThan; // Añadimos al prototipo

const source$ = Rx.Observable.from([0, 1, 2, 3, 4]);

source$.isBiggerThan(2).subscribe(
  (x) => console.log(x),
  (err) => console.log("err", err),
  () => console.log("completed")
);
// OUTPUT >> 3, 4, 'completed'
```

Como vemos en el ejemplo, los operadores siempre devuelven un Observable de tal forma que realmente el operador actúa como subscriptor el Observable y los valores emitidos por el mismo, serán recibidos mediante la API next, error, complete del objeto Observer, por lo que técnicamente, los operadores actúan como Observadores.

### Controlando Observables

Una de las grandes potencias que tienen los operadores de RxJs es que vamos a poder ejercer un control total sobre los valores del Observable y los propios Observables, ya que manejar diversos Observables al mismo tiempo será algo habitual. Para ilustrarlo vamos a suponer que queremos, lanzar una determinada ación de duración ilimitada (un Observable) con el click de un usuario (otro Observable) y queremos poder cancelar esa acción de duración ilimitada con un doble click (otro Observable más). Para tratar ese doble click vamos a utilizar operadores como [buffer](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#instance-method-buffer) y [debounceTime](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#instance-method-debounceTime) y para la cancelación del Observable interval$ vamos a echar mano de [takeUntil](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#instance-method-takeUntil) que nos permite tener un control total sobre los Observables, emitiendo un complete según los valores de otro Observable, en este caso dobleclick$.

```js
const source$ = Rx.Observable.interval(1000);
const click$ = Rx.Observable.fromEvent(document, "click");

// Capturamos un evento double click con un nuevo Observable teniendo en cuenta el tiempo de delay entre el primer click y el segundo
const doubleClick$ = click$
  .buffer(click$.debounceTime(250)) // buffer recolecta los valores hasta que  debounceTime, después de 250 ms emite el valor
  .pluck("length")
  .filter((x) => x === 2); // Filtra cuando el parámetro length es igual a 2 (double click)

click$
  .mergeMap((x) => source$) // Se lanza el intervalo con el Observable click$
  .takeUntil(doubleClick$) // Se cancela con el stream doubleclick$
  .subscribe(
    (x) => console.log(x),
    (err) => console.log(err),
    () => console.log("double click!")
  );
```

En algunos de los ejemplos de este post hemos utilizado operadores como [mergeMap](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#instance-method-mergeMap) que son operadores algo especiales ya que además de combinar varios observables, realizan un "aplanado" de los mismos. Puedes ver el detalle en el [siguiente](https://pablomagaz.com/blog/old/combinando-observables-en-rxjs) capítulo, [combinando Observables en RxJs](https://pablomagaz.com/blog/old/combinando-observables-en-rxjs).
