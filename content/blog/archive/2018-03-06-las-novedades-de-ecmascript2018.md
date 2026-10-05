---
title: "Las novedades de ECMAScript 2018"
date: "2018-03-06"
updated: "2019-01-14"
slug: "las-novedades-de-ecmascript2018"
author: "Pablo Magaz"
excerpt: "La especificación final del lenguaje ECMAScript 2018 o simplemente ES2018 ya está aquí. En la última reunión del TC39 se seleccionó la lista de funcionalidades que pasan a stage 4 y que serán incluidas en el standard ES2018 con nuevas e interesantes funcionalidades para nuestro lenguaje favorito."
category: "technology"
keywords: ["JavaScript"]
archived: true
---

## La especificación final del lenguaje ECMAScript 2018 o simplemente ES2018 ya está aquí. En la última reunión del TC39 se seleccionó la lista de funcionalidades que pasan a stage 4 y que serán incluidas en el standard ES2018 con nuevas e interesantes funcionalidades para nuestro lenguaje favorito.

Actualización: En Youtube puedes encontrar el [video](https://www.youtube.com/watch?v=ax83aGg5Vu4) de mi charla "[ECMAScript 2018 y más allá](https://www.youtube.com/watch?v=ax83aGg5Vu4)" en [Codemotion Madrid](https://madrid2018.codemotionworld.com/speaker/4635/) y que trata mucha de la tematica de este post. Slides [aquí](https://pablomagaz.com/static/slides/Pablo_Magaz_ECMAScript2018YMasAlla_Codemotion2018.pdf).

El [TC39](https://ecma-international.org/memento/TC39.htm), que por cierto estrena [logo](https://github.com/tc39/logo/blob/master/TC39.png), es un comité que propone nuevas funcionalidades al standard ECMAScript. En su última reunión del pasado 25 de Enero se finalizó la lista de funcionalidades que serán incluidas en el próximo standard ECMAScript 2018.  El proceso de selección de nuevas funcionalidades para el standard, es un proceso que cuenta con 5 [stages](https://tc39.github.io/process-document/) por las que una propuesta de nueva funcionalidad, debe de pasar hasta ser formalmente aceptado como parte del standard ECMAScript, siendo la fase final el [stage 4](https://github.com/tc39/proposals/blob/master/finished-proposals.md).

No obstante, el empleo de babel y sus distintos [presets](https://babeljs.io/docs/plugins/preset-latest/) así como diferentes plugins, nos permiten ir probando estas funcionalidades incluso antes de que sean parte oficial del standard. En la última reunión de este comité, varias funcionalidades han llegado a [stage 4](https://github.com/tc39/proposals/blob/master/finished-proposals.md) y por tanto son incluidas como parte del futuro ES2018.

### Asynchronous iterators

Empezamos por lo más importante que es sin lugar a duda, la [iteración asíncrona](https://github.com/tc39/proposal-async-iteration), una funcionalidad que sin duda va a traer una potencia enorme. Los iteradores asíncronos son iteradores normales y corrientes ( si no estás familiarizado con los iterables e iteradores echa un vistazo [aquí](https://developer.mozilla.org/es/docs/Web/JavaScript/Guide/Iterators_and_Generators) ) que nos permiten obtener los valores del iterable mediante el método [next](https://developer.mozilla.org/es/docs/Web/JavaScript/Referencia/Iteration_protocols) y además utilizar el bucle [for of](https://developer.mozilla.org/es/docs/Web/JavaScript/Referencia/Sentencias/for...of). Un poco de repaso:

```js
const iterable = ["Hi", "there"];
const iterator = iterable[Symbol.iterator]();

console.log(iterator.next()); // >> { value: 'Hi', done: false }
console.log(iterator.next()); // >> { value: 'there', done: false }
console.log(iterator.next()); // >> { value: undefined, done: true }

for (let value of iterable) {
  console.log(value); // >> 'Hi' // >> 'there'
}
```

Los iteradores asíncronos funcionan de la misma forma que los iteradores normales, pero están pensados para iterar estructuras de datos asíncronas, por lo que el valor devuelto por la llamada al método next es una promesa. En este ejemplo, tenemos un itereable asíncrono ya que los valores devueltos son promesas con llamadas a servicios -por ejemplo-, por lo que con cada llamada al método next recibimos el valor de la siguiente promesa:

```js
const service1 = new Promise((resolve) => resolve("Hi"));
const service2 = new Promise((resolve) => resolve("there"));

// Un generador que devuelve un iterable con dos promesas
async function* asyncIterable() {
  yield await service1;
  yield await service2;
}

const asyncIterator = asyncIterable();
asyncIterator
  .next() // Al ejecutar next, recibimos la promesa
  .then((next1) => {
    console.log(next1); // >> { value: 'Hi', done: false }
    return asyncIterator.next();
  })
  .then((next2) => {
    console.log(next2); // >> { value: 'there', done: false }
    return asyncIterator.next();
  });
```

De igual forma podemos iterar el iterable asíncrono con un for of pero con la particularidad de que vamos a utilizar [await](https://developer.mozilla.org/es/docs/Web/JavaScript/Referencia/Operadores/await) por lo que tenemos una iteración totalmente asíncrona:

```js
const service1 = new Promise((resolve) => resolve("Hi"));
const service2 = new Promise((resolve) => resolve("there"));

async function* asyncIterable(syncIterable) {
  yield await service1;
  yield await service2;
}

async function getAsyncData() {
  for await (const x of asyncIterable()) {
    // for await of :)
    console.log(x);
  }
}

getAsyncData();
// >> Hi
// >> there
```

Lógicamente también podemos hacer nuestros propios [generadores](https://developer.mozilla.org/es/docs/Web/JavaScript/Guide/Iterators_and_Generators) que no son otras cosas que, funciones que devuelven iteradores, en este caso, asíncronos. Vamos a hacer un generador que nos devuelva una cita aleatoria de un servicio de citas:

```js
async function* quoteGenerator() {
  // Nuestro generador
  const url = "http://quotes.stormconsultancy.co.uk/random.json"; // Servicio de citas aleatorias
  while (true) {
    const response = await fetch(url);
    const text = await response.json();
    yield text.quote;
  }
}

async function getQuotes() {
  for await (const quote of quoteGenerator()) {
    console.log(quote);
  }
}

getQuotes();
// >> Quote1
// >> Quote2
// >> ...
```

### Object Rest/Spread Properties

Las propiedades Rest cogen las propiedades de un objeto que no hayan sido cogidas previamente mediante [destructuración](https://developer.mozilla.org/es/docs/Web/JavaScript/Referencia/Operadores/Destructuring_assignment), lo que nos permite lidiar muy fácilmente con el resto (de ahí lo de rest) de propiedades de un objeto.

```js
let { a, b, ...c } = { a: "Hi", b: "there", x: true, y: false };
console.log(a); // >> Hi
console.log(b); // >> there
console.log(c); // >> { x: true, y: false }
```

### Promise finally

Creo que es muy descriptivo el nombre ¿verdad?. Finally es un callback sin valor que se ejecutará cuando se haya devuelto el resultado de la promesa, al margen de que, este, sea positivo (then) o no (catch). Muy útil cuando, por ejemplo, queremos ocultar un spinner de carga mientras se está ejecutando la petición y realmente queremos ocultarlo cuando le petición termine, al margen de que tengamos un then o un catch.

```js
fetch("https://pablomagaz.com/api/posts")
  .then((res) => {
    processResponse(res);
  })
  .catch((err) => {
    handleErrors(err);
  })
  .finally(() => {
    hideLoading();
  });
```

### Template Literal Revision

Las [tag functions](http://exploringjs.com/es6/ch_template-literals.html#sec_implementing-tag-functions) son funciones a las que podemos pasar template literals como argumentos de forma un poco diferente a la habitual, sin usar paréntesis. El problema surgía cuando en el template literal se incluían barras invertidas para escapar, por ejemplo, caracteres unicode con "\u" o hexadecimal con "\x". Ahora esta restricción ha sido eliminada y el valor del template ya procesado (processed) devolverá undefined cuando haya alguno de estos caracteres.

```js
const tagFunc = (tpl) => ({
  processed: tpl,
  raw: tpl.raw,
});

console.log(tagFunc`\unicode & \u{55}`);
// >> { processed: undefined , raw: [ 'Hi { name } ' ]
```

### RegExp Named Capture Groups

Pasamos a expresiones regulares. Los [grupos de captura](https://javascript.info/regexp-groups) con nombre es una funcionalidad, que lenguajes como [Python](https://es.wikipedia.org/wiki/Python) ya tenian y nos van a permitir acceder a los distintos grupos de captura de la expresión regular por medio de un nombre, en lugar de por el tradicional número del índice del Array devuelto:

```js
const myDate = /([0-9]{2})-([0-9]{2})-([0-9]{4})/;
const match = myDate.exec("01-03-2018");
const day = match[1]; // >> 01
const month = match[2]; // >> 03
const year = match[3]; // >> 2018
```

Esto está bien pero cuando tenemos una expresión regular muy amplia, tanto índice puede dificultar enormemente la lectura del código. Named capture groups al rescate:

```js
const myDate = /(?<day>[0-9]{2})-(?<month>[0-9]{2})-(?<year>[0-9]{4})/; //  <nombres> de los grupos de captura, <day>, <moth>, <year>
const match = myDate.exec("01-03-2018");
const day = match.groups.day; // >> 01
const month = match.groups.month; // >> 03
const year = match.groups.year; // >> 2018
```

Mucho mejor ¿verdad? Adicionalmente el empleo de los named captured groups, no quiere decir que no podamos seguir accediendo por el índice numérico. Podemos acceder tanto por nombre del grupo de captura como por el índice.

### RegExp lookbehind assertions

Seguimos con expresiones regulares y otra funcionalidad  [existente](https://www.regular-expressions.info/lookaround.html) en otros lenguajes pero que se echaba de menos en JavaScript, aunque era posible hacer una implementación [manual](http://speakingjs.com/es5/ch19.html#regexp-look-behind). Lookbehind assertions nos permiten comprobar el match de un patrón cuando va precedido de otro patrón y utilizar los caracteres `?<=…` y `?<!…` para match positivo y negativo respectivamente. Lo explicamos mejor con un ejemplo. Queremos sacar el precio de un valor cuando este va únicamente en euros (match positivo):

```js
const euroPrice = /(?<=\u20AC)(?<price>\d+(?:\.\d+)?)$/u; // \u20AC es el unicode para €

console.log(euroPrice.exec("€100").groups.price); // >> 100
console.log(euroPrice.exec("$100")); // >> nul
```

### RegExp Dotall flag

Y terminamos con más expresiones regulares. DotAll es el nombre del flag que permite que el carácter punto "." de una expresión regular haga match incluso con los caracteres de fin de línea mediante el flag "/s", algo que hasta ahora no era posible:

```js
const result = /foo.bar/.test("foo\nbar");
console.log(result); // >> false

const result2 = /foo.bar/s.test("foo\nbar");
console.log(result2); // >> true
```

Pues, nada, esto ha sido todo, aquí os dejo el [video](https://www.youtube.com/watch?v=ax83aGg5Vu4) de mi charla en Codemotion Madrid 2018 precisamente hablando sobre todas las novedades de ECMAScript2018. Aquí podeís encontrar los [slides](https://pablomagaz.com/static/slides/Pablo_Magaz_ECMAScript2018YMasAlla_Codemotion2018.pdf)
