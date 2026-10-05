---
title: "Combinando Observables en RxJs"
date: "2018-02-06"
updated: "2018-06-13"
slug: "combinando-observables-en-rxjs"
author: "Pablo Magaz"
excerpt: "La combinación de varios Observables es una tarea habitual en RxJs ya que todo es un Observable, y por tanto va a ser necesario trabajar con diversos Observables al mismo tiempo. RxJs dispone de operadores pensados para mezclar, transformar y combinar varios Observables en uno solo."
category: "technology"
keywords: ["RxJs"]
archived: true
---

## La combinación de varios Observables es una tarea habitual en RxJs ya que todo es un Observable, y por tanto va a ser necesario trabajar con diversos Observables al mismo tiempo. RxJs dispone de operadores pensados para mezclar, transformar y combinar varios Observables en uno solo.

Trabajar con varios Observables al mismo tiempo, es una de las tareas más truculentas en RxJs como veremos a lo largo del post, pero vamos por partes. RxJs posee distintos operadores de combinación, que nos permiten coger los valores emitidos por distintos Observables y combinarlos, dando como resultado un único Observable, mucho más fácil de manejar. Vamos al lío.

### Diagramas de canicas

Antes de meternos de lleno en los operadores de combinación, vale la pena explicar un poquito algo muy útil y necesario cuando comenzamos a utilizar este tipo de operadores: Los [diagramas de canicas](rxmarbles.com). En un primer vistazo parecen poco o nada clarificadores ¿verdad?, pero son más sencillos de lo que parecen y sobre todo, nos van a ayudar a entender los operadores de combinación. En estos diagramas, el tiempo está representado con una línea horizontal que comienza de izquierda a derecha y los valores emitidos por el Observable a lo largo de esa línea temporal se encuentran representadas por las canicas (de ahí su nombre)

![merge marble diagram](http://reactivex.io/rxjs/img/from.png)

En el ejemplo previo vemos como tenemos un Observable usando [from](http://reactivex.io/documentation/operators/from.html), que contiene los valores de un Array, y estos valores son emitidos a lo largo del tiempo. Cuando el Observable ha terminado de emitir valores, es decir, cuando emite su [complete](https://pablomagaz.com/blog/old/programacion-reactiva-con-rxjs) esto se representa con la línea vertical. Con los operadores de combinación de combinación, en lugar de ver una única línea horizontal, veremos 3 ya que estamos combinando 2 Observables, cada uno con su línea horizontal. La caja blanca representa el operador de combinación en cuestión y la última línea horizontal es el Observable resultante de la combinación.

### Operadores de combinación.

Esta es una de las partes que, en ocasiones, más cuesta entender sobre RxJs ya que existen una amplia diversidad de operadores de combinación, donde, además, cada uno de ellos aplica unos criterios diferentes y, por tanto, el Observable resultante y sus valores, pueden variar de forma drástica de un operador a otro.

#### Merge

[Merge](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#instance-method-merge) es un operador de combinación que combina dos o más Observables en uno solo y no introduce ningún tipo de modificación o alteración en el orden temporal en que los valores de cada uno de los Observables fueron emitidos. Un diagrama de canicas nos ayudará a entenderlo:

![merge marble diagram](http://reactivex.io/rxjs/img/merge.png)

Como vemos, en la última línea horizontal, que representa el Observable resultante, los valores de éste, son emitidos en el mismo orden temporal que el de los Observables de origen. Vamos a ilustrarlo mejor con un ejemplo. Tenemos dos Observables que emiten valores, uno de ellos, interval$ emite valores mapeados a "A" con mapTo cada 100 ms y interval2$ emite valores mapeados a "B" cada 200 ms. En ambos casos solo tomamos los 3 primeros valores con take.

```js
const interval$ = Rx.Observable.interval(100).mapTo("A").take(3);
const interval2$ = Rx.Observable.interval(200).mapTo("B").take(3);

interval$.merge(interval2$).subscribe((next) => console.log(next)); // OUPUT >> A, A, B, A, B, B
```

Como vemos en la salida los valores del Observable resultante son emitidos, en el mismo orden temporal en el que fueron emitidos en sus respectivos Observables de origen.

#### Concat

[Concat](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#instance-method-concat) es otro operador de combinación, pero a diferencia de merge, que combina los valores en el mismo orden que fueron emitidos, concat espera a que el primer Observable emita su complete (representado por la línea vertical), para suscribir al otro y comenzar a recolectar sus valores:

![merge marble diagram](http://reactivex.io/rxjs/img/concat.png)

```js
const interval$ = Rx.Observable.interval(100).mapTo("A").take(3);
const interval2$ = Rx.Observable.interval(200).mapTo("B").take(3);

interval$.concat(interval2$).subscribe((next) => console.log(next)); // OUPUT >> A, A, A, B, B, B
```

Como vemos en la salida, interval$ emite todos sus valores (A). Una vez ha emitido su complete, concat se suscribe al segundo observable interval2$ por lo que el resultado obtenido es diferente al que nos daría merge.

#### CombineLatest

[CombineLatest](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#instance-method-combineLatest) es otro operador de combinación y que combina los valores emitidos por los distintos Observables, suscribiéndose a los distintos observables al mismo tiempo y devolviendo todos sus valores agrupados por el último valor de cada uno de los Observables en un Array:

![CombineLatest marble diagram](http://reactivex.io/rxjs/img/combineLatest.png)

```js
const interval$ = Rx.Observable.interval(100).mapTo("A").take(3);
const interval2$ = Rx.Observable.interval(200).mapTo("B").take(3);

interval$.combineLatest(interval2$).subscribe((next) => console.log(next)); // OUPUT >> ["A", "B"],["A", "B"],["A", "B"]
```

Como vemos, los distintos operadores de combinación existentes aplican distintos criterios a la hora de combinar los valores de cada uno de los Observables. El resultado que obtendremos será, como hemos visto, totalmente diferente. Dependiendo del resultado que queramos obtener podremos coger uno u otro.

### Higher order Observables.

A lo largo de los ejemplos que hemos ido viendo en los capítulos de la serie, hemos trabajado con Observables cuyos valores siempre eran enteros o cadenas de texto, pero es importante tener en cuenta que en RxJs un Observable, puede emitir otros Observables... Vamos a ilustrarlo con un ejemplo: Tenemos que llamar a un servicio que, por ejemplo, nos devuelve los posts que un autor ha escrito en un blog y tenemos que llamar a ese servicio (que también es un Observable) con un click:

```js
const data = {
  author: "Jhon",
  articles: [
    { id: 11, category: "music" },
    { id: 22, category: "movies" },
    { id: 33, category: "music" },
  ],
};

const service = () =>
  new Promise((resolve) => {
    // Promesa que devuelve los datos
    setTimeout(() => {
      resolve(data);
    }, 500); // Simulamos el delay de un servicio
  });

const data$ = Rx.Observable.fromPromise(service()); // Observable de la promesa del servicio
const click$ = Rx.Observable.fromEvent(document, "click"); // Observable el evento click

click$
  .map((x) => data$) // Map no devuelve una cadena o un número, ¡devuelve un Observable!
  .subscribe((next) => console.log(next));

/*
     OUTPUT >>
    [object Object] {
      _isScalar: false,
      _subscribe: function (subscriber) {
        var _this = this;
        var promise = this.promise;
        var scheduler = this.scheduler;
        if (scheduler == null) {
          if (this._isScalar) {
            if (!subscriber.isUnsubscribed) {
            "
            ...
*/
```

No es la salida que esperábamos.... ¿Hemos roto algo? No. Lo que sucede es que el valor devuelto por map, ya no es un entero o una cadena de texto si no que es otro Observable, por lo que realmente tenemos es un ¡Observable de Observables!, que es lo que realmente son los Higher order Observables, y en estos casos, necesitamos "aplanarlo".

### Aplanando Observables.

Para explicar un poco mejor lo que es el aplanado o flatten de Observables, vamos a pensar en Arrays en lugar de Observables. Imaginemos que tenemos un Array de Arrays, es decir, un Array multidimensional y lo que queremos recibir son los valores "en plano". Si aplicamos un criterio de devolver los valores de cada subarray exactamente en el orden en el que llegan, todos los elementos del primer subarray, luego los del segundo y así sucesivamente recibiremos un resultado (FLATTENED OUTPUT 1). Sin embargo, si cogemos el primer valor de cada subarray, luego el segundo y así sucesivamente el resultado que obtendremos será diferente (FLATTENED OUTPUT 2).

```js
const arrayOfArrays = [
  [1, 2],
  [3, 4],
  [5, 6],
];

// FLATTENED OUTPUT  1 >> 1, 2, 3, 4, 5, 6

// FLATTENED OUTPUT  2 >> 1, 3, 5, 2, 4, 6
```

El aplanado de Observables funciona de igual forma, dependiendo del criterio (operador) que utilicemos, obtendremos unos resultados u otros ya que estos manejan de forma diferente los valores emitidos por el Observable y la subscripción o cancelación de la misma. Vamos a volver al ejemplo previo:

#### MergeAll

[MergeAll](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#instance-method-mergeall) es un operador que permite aplanar Observables de Observables, utilizando el mismo criterio que [merge](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#instance-method-merge), es decir, sin alterar el orden temporal en el que los valores fueron emitidos:

![mergeAll marble diagram](http://reactivex.io/rxjs/img/mergeAll.png)

Volviendo al ejemplo previo, después del map que realiza la llamada al servicio, utilizamos el operador mergeAll() para aplanar el resultado:

```js
    const data = { author: 'Jhon', articles: [  { id: 11, category: 'music' }, { id: 22, category: 'movies' }, { id: 33, category: 'music' } ]; }

    const service = () => new Promise(resolve => { // Promesa que devuelve los datos
       setTimeout(() => { resolve(data) }, 500); // Simulamos el delay de un servicio
    });

    const click$ = Rx.Observable.fromEvent(document, 'click');
    const data$ = Rx.Observable.fromPromise(service());

    click$
      .map(x => data$)
      .mergeAll() // MergeAll junta y aplana el Observable de Observables.
      .subscribe(next => console.log(next));
      // OUTPUT >> { category: "music", id: 11 }, { category: "movies", id: 22 },  { category: "music", id: 33 }
```

Sin embargo, podemos simplificar esto un poquito y utilizar [mergeMap](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#instance-method-mergeMap), que no es otra cosa que un [map](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#instance-method-map) seguido de un [mergeAll](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#instance-method-mergeAll)

```js
click$
  .mergeMap((x) => data$) // = map() + mergeAll()
  .subscribe((next) => console.log(next));
// ...
```

#### SwitchMap

De la misma forma que mergeMap es la combinación de map + mergeAll, [SwitchMap](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#instance-method-switchMap) es la combinación de un [map](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#instance-method-map) + [switch](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#instance-method-switch). La particularidad que tiene [Switch](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#instance-method-switch) es que cancelará la subscripción del primer Observable cuando detecta que el segundo Observable comienza a emitir valores por lo que es un operador muy útil cuando nos queremos asegurar de no hacer "pooling":

```js
const data = {
  author: "Jhon",
  articles: [
    { id: 11, category: "music" },
    { id: 22, category: "movies" },
    { id: 33, category: "music" },
  ],
};

const service = () =>
  new Promise((resolve) => {
    // Promesa que devuelve los datos
    setTimeout(() => {
      resolve(data);
    }, 500); // Simulamos el delay de un servicio
  });
const click$ = Rx.Observable.fromEvent(document, "click");

click$
  .switchMap((x) => service()) // = map() + switch()
  .subscribe((next) => console.log(next));
// OUTPUT >> { category: "music", id: 11 }, { category: "movies", id: 22 },  { category: "music", id: 33 }
```

### Recuperando valores de distintos Observables

El tener que recuperar y aplanar valores de distintos Observables, que pueden producirse en momentos temporales diferentes, desde un único punto es una tarea a la que más tarde o más temprano vamos a tener que enfrentarnos. [ForkJoin](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#static-method-forkJoin) es un operador muy útil para esto ya que nos permite recibir el último valor de distintos Observables:

```js
const click$ = Rx.Observable.fromEvent(document, "click");
const source$ = Rx.Observable.of("A");
const source2$ = Rx.Observable.of("B").delay(200);
const source3$ = Rx.Observable.interval(100).mapTo("Interval").take(3);

click$
  .mergeMap(
    (
      x // Aplanamos porque forkJoin devuelve un Observable de Observables
    ) => Rx.Observable.forkJoin(source$, source2$, source3$)
  )
  .subscribe((next) => console.log(next)); // OUTPUT >> ["A", "B", "Interval"]
```

### Mundo Real

Después de varios capítulos de la serie donde hemos visto los [operadores básicos](https://pablomagaz.com/blog/old/como-funcionan-operadores-rxjs) de Rxjs creo que es buen momento para juntar todos estos operadores y lo que hemos aprendido en este post sobre combinar Observables, en un ejemplo de mundo real, que además, es muy ilustrativo de la enorme potencia que reside en RxJs: Un typAhead sobre la API de Wikipedia que nos vaya sugiriendo resultados a medida que escribimos, pero no solo eso, queremos, además que, sea "inteligente" y no queremos por ejemplo que envíe la petición a la API con cada pulsación de tecla ya que esto no sería eficiente, tampoco enviar el termino de búsqueda a no ser que tenga al menos 3 caracteres, ni tampoco enviar el termino de búsqueda si este no ha cambiado.

```js
const input = document.getElementById("searchText"); // Campo de búsqueda
const results = document.getElementById("results"); //Div para mostrar resultados
const keyUp$ = Rx.Observable.fromEvent(input, "keyup"); // Capturamos el evento keyup

// Usamos Observable.ajax para lanzar la petición a la API de Wikipedia
const search$ = (searchText) =>
  Rx.Observable.ajax({
    crossDomain: true,
    url: `https://en.wikipedia.org/w/api.php?&search=${searchText}&action=opensearch&origin=*`,
  });

keyUp$ // Observable sobre el evento KeyUp
  .map((e) => e.target.value) // Recuperamos el valor del campo en el evento
  .filter((text) => text.length > 2) // Filtramos los valores que no tengan más de 2 caracteres
  .debounceTime(250) // Espera 250 ms para no enviar la petición con cada nuevo caracter
  .distinctUntilChanged() // Comprueba que el valor haya cambiado.
  .switchMap((x) => search$(x)) // Llamamos al servicio y aplanamos
  .pluck("response") // Extraemos la propiedad response
  .subscribe((result) => drawResults(result));
```
