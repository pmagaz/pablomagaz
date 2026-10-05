---
title: "Un vistazo a ECMAScript 2020"
date: "2020-02-03"
updated: "2020-02-13"
slug: "un-vistazo-a-ecmascript2020"
author: "Pablo Magaz"
excerpt: "Aunque la próxima especificación del standard ECMAScript aún no está completamente cerrada, ya podemos comenzar a probar muchas de las funcionalidades más interesantes que van a ser incluidas en la siguiente especificación de ECMAScript y que llevará por nombre ECMAScript 2020."
category: "technology"
keywords: ["JavaScript"]
archived: true
---

## Aunque la próxima especificación del standard ECMAScript aún no está completamente cerrada, ya podemos comenzar a probar muchas de las funcionalidades más interesantes que van a ser incluidas en la siguiente especificación de ECMAScript y que llevará por nombre ECMAScript 2020.

Como hemos comentado en algún [post](https://pablomagaz.com/blog/old/las-novedades-de-ecmascript2018) previo sobre las especificaciones de ECMASCript, el [TC39](https://ecma-international.org/memento/TC39.htm), es el comité que propone nuevas funcionalidades al stándar mediante un proceso que cuenta con 5 [stages](https://tc39.github.io/process-document/) por las que toda propuesta de nueva funcionalidad tiene que pasar hasta alcanzar el [stage 4](https://github.com/tc39/proposals/blob/master/finished-proposals.md), que es el stage final. Adicionalmente las funcionalidades seleccionadas pasan, en la mayoría de los casos, a formar parte de la especificación ECMAScript seguida del nombre del año, ya que la nomenclatura de ECMAScript 5, ECMAScript 6, etc y que hemos usado durante años previos ya no volverá a ser usada. Aunque aún no está totalmente cerrada la lista completa de funcionalidades que serán incluídas como parte del posible ECMAScript 2020 o ES2020, ya hay una lista bastante interesante de funcionalidades [finalistas](https://github.com/tc39/proposals/blob/master/finished-proposals.md) que merece la pena examinar.

¿Podemos probar ya estas nuevas funcionalidades? Sí, y para probar la gran mayoría de ellas no necesitamos nada más que un navegador Chrome actualizado, pues Chrome suele dar soporte a la mayoría de funcionalidades en cuanto llegan a stage 3, por lo que cuando llegan a stage 4 y son parte del estándar Chrome ya suele soportarlas, aunque existe algún caso en el que puede ser necesario un [plugin](https://babeljs.io/docs/en/babel-plugin-proposal-nullish-coalescing-operator) de Babel.

### Import

Sin lugar a dudas una de las funcionalidades más esperadas e interesantes. Los módulos que importamos habitualmente en nuestras aplicaciones son totalmente estáticos, es decir, no tenemos la capacidad de que el nombre de dicho módulo sea dinámico, no pudiendo realizar cargas condicionales. Con [import](https://github.com/tc39/proposal-dynamic-import) esto va a cambiar ya que finalmente, vamos a poder tener nombres de módulo totalmente dinámicos, pero no solo eso si no que además import nos devuelve una promesa:

```js
import(`./my-modules/${dynamicModuleName}.js`)
  .then((module) => {
    module.doStuff();
  })
  .catch((err) => console.log(err));
```

Como vemos con import podemos controlar el resultado de la importación de dicho módulo y además dado que retorna una promesa podemos utilizar [async/await](https://developer.mozilla.org/es/docs/Web/JavaScript/Referencia/Sentencias/funcion_asincrona) para la carga de los módulos.

```js
const getModule = (module) => `./my-modules/${module}.js`;

const asyncModuleLoad = async () => {
  const { fn1, fn2 } = await import(getModule("module1"));
  const module2 = await import(getModule("module2"));
  module2.doStuff();
};
```

### Optional chaining

Si siempre has encontrado sumamente tedioso la tarea de comprobar la existencia de una propiedad antes de poder acceder a sus subpropiedades para evitar el [TypeError](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Cant_access_property) "can't access x of undefined" estás de suerte. Con [optional chaining](https://github.com/tc39/proposal-optional-chaining) esto es historia ¡al fin!. Con el operador "?" podemos indicar que una propiedad puede existir o no sin tener que validar su existencia previamente y asi evitar el TypeError en caso de que no exista, dejando un codigo mucho más limpio:

```js
//Tedioso...
const departmentName = employee.department && employee.department.name;

//Optional chaining!
const departmentName = employee.department?.name;
```

### Array Flat & FlatMap

[Flat](https://developer.mozilla.org/es/docs/Web/JavaScript/Referencia/Objetos_globales/Array/flat) nos permite coger un Array multidimensional, es decir, un Array de Arrays y convertirlo (aplanarlo) en un Array unidemensional de forma rápida y sencilla, pudiendo además, elegir cuantos niveles de profundidad queremos aplanar:

```js
const nestedArray = [1, 2, [3, 4]];
const flattened = nestedArray.flat();
console.log(flattened);
// [1, 2, 3, 4]

const nestedArray2 = [1, 2, [3, 4, [6, 7]]];
const flattened2 = nestedArray2.flat(1); //Solo queremos aplanar un nivel de profundidad
console.log(flattened2);
// [1, 2, 3, 4, [6,7]] // [6,7] queda intacto
```

[Flatmap](https://developer.mozilla.org/es/docs/Web/JavaScript/Referencia/Objetos_globales/Array/flatmap) funciona de forma muy parecida a flat pero como su propio nombre indica, antes de aplanar el array aplica una función de mapeo a cada uno de los elementos del array y devuelve el resultado aplanado:

```js
const myArray = [1, 2, 3, 4];

myArray.map((x) => [x * 2]);
// [[2], [4], [6], [8]]

nestedArray.flatMap((x) => [x * 2]);
// [2, 4, 6, 8]
```

### Promise allSettled

El nombre de esta funcionalidad es bastante parecido a [Promise.all](https://developer.mozilla.org/es/docs/Web/JavaScript/Referencia/Objetos_globales/Promise/all) que nos devuelve una promesa cuando todas las promesas pasadas han sido ejecutadas con éxito, o al menos, una de ellas ha fallado:

```js
const p1 = new Promise((resolve) => resolve("Promise one"));
const p2 = new Promise((_, reject) => reject("Promise rejected!"));
const p3 = new Promise((resolve) => resolve("Promise two"));

Promise.all([p1, p2, p3])
  .then((res) => console.log(res))
  .catch((err) => console.log(err));

// Promise rejected!
```

Esto impone una limitación y es que en el momento que haya una sola promesa rejected el resto no se ejecutara y esto es precisamente lo que podemos evitar con [Promise.allSettled](https://github.com/tc39/proposal-promise-allSettled) que nos devolverá una promesa con el status final de todas y cada una de las promesas y su correspondiente valor de retorno aunque una o mas fallen:

```js
const p1 = new Promise((resolve) => resolve("Promise one"));
const p2 = new Promise((_, reject) => reject("Promise rejected!"));
const p3 = new Promise((resolve) => resolve("Promise two"));

Promise.allSettled([p1, p2, p3])
  .then((res) => console.log(res))
  .catch((err) => console.log(err));

/*
0: {status: "fulfilled", value: "Promise one"}
1: {status: "rejected", reason: "Promise rejected!"}
2: {status: "fulfilled", value: "Promise two"}
*/
```

### String matchAll

El método [match](https://developer.mozilla.org/es/docs/Web/JavaScript/Referencia/Objetos_globales/String/match) se utiliza para obtener todas las ocurrencias de una expresión regular en una cadena. [MatchAll](https://github.com/tc39/proposal-string-matchall) hace lo mismo pero en lugar de devolvernos un Array, nos devuelve un [Iterador](https://developer.mozilla.org/es/docs/Web/JavaScript/Guide/Iterators_and_Generators) cuyos valores podemos obtener mediante el método next que tienes todos los iteradores o iterarando el resultado mediante el bucle [for of](https://developer.mozilla.org/es/docs/Web/JavaScript/Referencia/Sentencias/for...of):

```js
const str = "hello-hello-hello!";
const regex = /hello/g;
const matches = str.matchAll(regex);

//Podemos llamar al método next del iterador
console.log(matches.next().value);
// ["hello", index: 0, input: "hello-hello-hello!", groups: undefined]

// O usar un bucle for of
for (const match of matches) {
  console.log(match);
}

// ["hello", index: 6, input: "hello-hello-hello!", groups: undefined]
// ["hello", index: 12, input: "hello-hello-hello!", groups: undefined
```

### Big Int

JavaScript tiene algunas limitaciones con respecto a los números, siendo 9007199254740991 (2 elevado a 53), el numero más grande posible que podíamos manejar en JavaScript con el tipo primitivo [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number). Esto supone algunos problemas que afectan incluso al manejo de ciertas APIS cuando los ids numéricos son [muy grandes](https://developer.twitter.com/en/docs/basics/twitter-ids) como ha sido el caso de los ids usados por [Twitter](https://developer.twitter.com/en/docs/basics/twitter-ids), y cuyo valor superaba el valor de Number.MAX_SAFE_INTEGER, obligando a tener que tratarlos como strings. Con BigInt esa limitación queda atrás y podemos crear números enteros más grandes añadiendo una "n" al final del entero o mediante la función [BigInt](https://developer.mozilla.org/en-US/docs/Glossary/BigInt):

```js
const bigint = BigInt(Number.MAX_SAFE_INTEGER) + 2n;
// 9007199254740996n
console.log(bigint > Number.MAX_SAFE_INTEGER);
// true
```

### Nullish coalescing operator

Este operador (??) es un operador lógico similar al operador [OR](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_Operators#Logical_OR_2) con la diferencia de que el operador "??" solo tiene en cuenta los valores undefined o nulos, pero no los false como sucede con el operador ||:

```js
console.log(undefined || "default!"); // default!
console.log(null || "default!"); // default!
console.log(0 || "default!"); // default!
console.log(false || "default!"); // default

console.log(undefined ?? "default!"); // default!
console.log(null ?? "default!"); // default!
console.log(0 ?? "default!"); // 0
console.log(false ?? "default!"); // false
```

Este operador resulta muy útil cuando es usado con el operador de optional chaining que hemos visto anteriormente:

```js
const departmentName = employee.department?.name ?? "no department!";
```

### Globalthis

El acceso al objeto global (this) en JavaScript siempre ha dependido del entorno, usando [window](https://developer.mozilla.org/es/docs/Web/API/Window) o [self](https://developer.mozilla.org/en-US/docs/Web/API/Window/self) en el browser, o [global](https://nodejs.org/api/globals.html#globals_global) en NodeJs pero no había una forma estandarizada de acceder al objeto global hasta la llegada de [globalthis](https://github.com/tc39/proposal-global):

```js
console.log(typeof globalThis);
// Object

console.log(globalThis);
// Window {parent: Window, opener: null, top: Window, length: 2, frames: Window, …}
```

### For in mechanics

Un problema, con el que todos hemos tenido que lidiar alguna vez es que cuando accedemos a las propiedades de un objeto usando [Object.keys](https://developer.mozilla.org/es/docs/Web/JavaScript/Referencia/Objetos_globales/Object/keys), el bucle [for in](https://developer.mozilla.org/es/docs/Web/JavaScript/Referencia/Sentencias/for...in) o [JSON.stringify](https://developer.mozilla.org/es/docs/Web/JavaScript/Referencia/Objetos_globales/JSON/stringify) el orden de las propiedades no está garantizado sencillamente porque los objetos son una collection **no ordenada** de propiedades.

```js
const myObject = {
  a: 1,
  b: 2,
  c: 3,
};

Object.keys(myObject); // ["a", "b", "c"] orden NO garantizado!

for (let k in myObject) {
  console.log(k);
} // a, b, c orden NO garantizado!
```

Con la inclusión de esta [for-in-order](https://github.com/tc39/proposal-for-in-order), podemos decir adiós a estos problemas cuando iteremos las propiedades de los objetos.

Pues estas son, todas las funcionalidades que en el momento de escribir este post, ya son propuesas finales e incluídas en el stándar ECMAScript 2020 pero es posible que se incluyan algunas más, que actualmente están en [stage 3](https://github.com/tc39/proposals#stage-3) antes de cerrar la específica final. Estaremos atentos :)
