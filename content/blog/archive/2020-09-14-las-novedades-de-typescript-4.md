---
title: "Las novedades de TypeScript 4"
date: "2020-09-14"
updated: "2020-09-15"
slug: "las-novedades-de-typescript-4"
author: "Pablo Magaz"
excerpt: "TypeScript es el superset para tipado estático de Microsoft cuya adopción va en meteórico aumento. La versión 4, que acaba de ser publicada, viene cargada de importantes novedades que van desde el soporte a algunas de las últimas features del lenguaje hasta una mejor integración con editores."
category: "technology"
keywords: ["TypeScript"]
archived: true
---

## TypeScript es el superset para tipado estático de Microsoft cuya adopción va en meteórico aumento. La versión 4, que acaba de ser publicada, viene cargada de importantes novedades que van desde el soporte a algunas de las últimas features del lenguaje hasta una mejor integración con editores.

Que TypeScript se ha convertido en un standard de facto en el mundo JavaScript no es ningún secreto. Aunque ya existía varios años antes, tuvo su gran boom con Angular 2 y no fuimos pocos los que, aún viendo sus bondades, en un principio "recelamos" de TypeScript. Sin embargo a día de hoy ya no es solo un super set asociado a un framework en concreto, si no más bien, todo lo contrario. Son muchos los proyectos React (buena suerte Flow), Vue o cualquier framework que se nos ocurra que ya lo soportan y lo usan y el número de librerias que ya tiene su definición de tipos es ya casi total.

Ese nivel de adopción se ve reflejado en que TypeScript se mueve en una media de unos 50 millones de descargas mensuales en [Npm](https://www.npmjs.com/) y es el lenguaje por defecto en [Deno](http://deno.land), nuevo rival de NodeJs y del que ya hablamos en este [post](https://pablomagaz.com/blog/old/deno-el-remplazo-de-nodejs). Hace escasas semanas se [liberó](https://devblogs.microsoft.com/typescript/announcing-typescript-4-0/#variadic-tuple-types) TypeScript 4, que viene con novedades bastante interesantes que vamos a repasar en este post. Puedes probar las novedades de TypScript 4 en el [Playground](https://www.typescriptlang.org/play) de TypeScript, aunque en este caso dado que algunas de las novedades tienen que ver con el soporte a editores, quizás sea más interesante instalarlo a nivel local. Arrancamos.

### Variadic Tuple Types

Sin lugar a dudas la novedad más destacable de esta versión 4 de TypeScript son las Variadic Tuple Types. Aunque suena a un nombre un poco rimbombante y complicado es algo un poco más sencillo. Para los que no lo sepan, en la mayoría de los lenguajes de programación las tuplas son 2 valores agrupados y que muchas veces se representa como (A,B), sin embargo en TypeScript una "tupla" a es un Array cuyo tamaño, es conocidos en "compile time" y cuyos tipos pueden ser diferentes, es decir, podríamos tener una Tupla que realmente sería un Array que puede alojar strings y números con un tamaño fijo.

Durante tiempo cosas como concatenar Array/Tuplas, especialmente cuando estos son de tipos [genéricos](https://www.typescriptlang.org/docs/handbook/generics.html) ha sido cuando menos complicado ya que, además, el spread de genéricos no estaba soportado. Vamos a ilustrarlo mejor con un ejemplo y una simple función de concatenación de dos Arrays genéricos:

```ts
function concat(arr1: T, arr2: U) {
  return [...arr1, ...arr2];
}

const names = ["Peter", "David", "John"];
const ageds = [38, 65];

// Concatened is any[] type
const concatenatd = concat(names, ageds);
```

En el ejemplo previo concatenated es del tipo any[] ya que la función concat no puede inferir el tipo usando T/U por lo que tendríamos que hacer un cast manual sobre concatenated usando "as" ya que además en versiones anteriores a TS4 si intentaramos hacer un spread de dos tipos genéricos (Tupla) tendríamos un error

```ts
//TypeScript 3.9
type numbers = number[];
type strings = string[];
type spread = [...numbers, ...strings];
//Error
```

Esta limitación,que en según qué escenarios podía ser costosa por la cantidad de overloads que habría que escribir para contemplar todas las casuísticas, se soluciona con algo tan sencillo como el spread del genérico, lo que facilita enormmente las cosas, especialmente a la hora de controlar la longitud de la tupla, ya que recordemos que una tupla es un Array de longitud fija:

```ts
function concat(arr1: T, arr2: U): [...T, ...U] {
  return [...arr1, ...arr2];
}

const names = ["Peter", "David", "John"];
const ageds = [38, 65];

// Concatenated is now (string | number)[] type
const concatenatd = concat(names, ageds);
```

Ahora sí, concatened es del tipo (string | number)[] ya que en el tipo que devuelve concat estamos haciendo uso del spread de los genéricos T y U.

### Labeled Tuple Elements

Otra novedad interesante en TypeScript 4 los las labeled tuple elements, que nos permite asignar un label o tag a la posición de cada uno de los elementos en la tupla. Esto sirve mayormente para aumentar la legilibilidad del código y tiene la particularidad de que no podemos asginar un label a un único elemento, tenemos que asignarselos a todos:

```ts
// Error Tuple members must all have names or all not have names
type Bar = [first: string, number];
//Ok
type Baz = [one: string, two: number, ...rest: any[]];
```

### Class Property Inference From Constructors

En veriones anteriores a TypeScript 4 y con noImplicitAny activo en el .tsconfig, algo poco o nada recomendable, las propiedades de una clase debían de contar con la especificación de su tipo correspondiente ya que TS no era capaz de inferir el tipo:

```ts
class Person {
  name;

  construtor() {
    this.name = "Peter";
  }

  // returns any
  getCompleteName() {
    return `${this.name} Smith`;
  }
}
```

Esto ha sido solucionado y TypeScript 4 ya es capaz de inferir el tipo de la propiedad de la clase.

```ts
//TypeScript 3.9
class Person {
  name;

  construtor() {
    this.name = "Peter";
  }

  // returns string
  getCompleteName() {
    return `${this.name} Smith`;
  }
}
```

### Short-Circuiting Assignment Operators

Los operadores de [asignación](https://developer.mozilla.org/es/docs/Web/JavaScript/Referencia/Operadores/Assignment_Operators) son aquellos que nos permiten incrementar, restar, multiplicar o dividir dos valores, asignando el resultado de aplicar el operador al primer de los valores mediante el uso del operador seguido de =. Es una operación que realizamos todos con mucha frecuencia, ¿verdad?

```ts
// a = a + b
a += b;

// a = a - b
a -= b;

// a = a * b
a *= b;

// a = a / b
a /= b;
```

La novedad aquí reside en que hasta TypeScript 3.9 había 3 operadores lógicos que no soportaban asignación como && (and) y || (or) y el nullish coalescending operator del que ya hablamos el post sobre [ECMAScript 2020](https://pablomagaz.com/blog/old/un-vistazo-a-ecmascript2020/) por lo que ya podremos realizar operaciones como las siguentes:

```ts
let name: string;

// TypeScript 3.9
(name ?? (name = "")).toUpperCase();

// TypeScript 4
(name ??= "").toUpperCase();
```

### Unknown on catch Clause Bindings

Una de las limitaciones existentes en Typescrip 3.9 o inferiores era que el error capturado dentro de un bloque catch siempre era del tipo any y si intentábabamos forzar cualquier otro tipo sencillamente recibíamos un error. A partir de TypeScript 4 el tipo de error pasa a ser del tipo unknown:

```ts
//TypeScript 3.9
try {
  // ...
} catch (err) {
  // x was always any type
  console.log(err);
}

//TypeScript 4
try {
  // ...
} catch (err: unknown) {
  // Now, we can define err as unknown
  console.log(err);
}
```

### Custom JSX Factories

Otra de las novedades de TypeScript 4 es el soporte para factorías de [Fragments](https://reactjs.org/docs/fragments.html) de Jsx que como breve explicación, nos permiten devolver múltiples elementos agrupados en hijos, sin la necesidad de añadir nodos extras en el DOM. Para ello añadiremos la siguiente configuración a nuestro tsconfig.json que nos permite susituir las llamadas a React.createElement por el nombre de la factoría que nosotros definamos en jsxFactory:

```json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "commonjs",
    "jsx": "react",
    "jsxFactory": "f", // transforms jsx using "f"
    "jsxFragmentFactory": "Fragment" // transforms jsx using Fragment
  }
}
```

Cuando apliquemos esta configuración de elementos como por ejemplo <article /> sean procesados con "f" que es el nombre que le hemos dado a nuestra factoría en lugar de React.createElement. También le indica a React que debe de usar Fragment en lugar de React.Fragment.

### Mejores tiempos de transpilación

Otra importante mejora que podemos encontrar en TypeScript 4 es el incremento de la velocidad de construcción en el modo incremental. En anteriores versiones en caso de una transpilación fallida esta no se cacheaba en el archivo .tsbuildinfo cuando el flag noEmitErrors estaba activado, lo que ralentizaba de forma notable la siguiente transpilación. En la versión 4 esto ya no sucede y la transpilación incremental es notablemente más rápida en estos escenarios.

### Mejoras para editores

La integración de TypeScript con los editores es actualmente bastante buena pero aún así hay algunos elemetos que no estaban soportados o algunos que digamos, nunca han funcionado del todo bien (como los autoimports). TypScript 4 añade las siguientes mejoras de soporte para editores:

#### Optional Chaining

Optional Chaining es una feature muy interesante de ECMAScript 2020 que ya comentamos en este [post](https://pablomagaz.com/blog/old/un-vistazo-a-ecmascript2020) y que nos evitaba los molestos && para comprobar si una propiedad existe antes de hacer referencia a una subpropiedad mediante el caracter ?. TypeScript 3.8 ya soportaba optional chaining pero con TypeScript 4 editores como VsCode ya nos sugerirán la conversion/refactor a optional chaining.

```ts
function optionalChaining(a: any) {
  a && a.b && a.b.c;
  //convert to
  a?.b?.c;
}
```

#### Deprecated

Una integración que se echaba de menos y que desde ahora ya nos avisará de que un método, una clase o cualquier elemento ha sido marcado como deprecated mediante comentario JSDoc:

```ts
let myObj = {
  /** @deprecated */
  deprecatedFunction() {},
};

myObj.deprecatedFunction(); // Error deprecatedFunction: void is deprecated!
```

#### Auto imports

Esta es una de esas features, que nunca ha acabado de estar fina ya que ignoraba los imports de las dependencias y había casos que incluso las propias tampoco funcionaban del todo. Con TypeScript 4 se mejora el sistema de auto-imports al fin ya que entre otras cosas tendrá en cuenta las dependencias de nuestro package.json.

### Conclusiones

Con esta nueva versión, TypeScript continua avanzando por el excelente camino que emprendió hace ya tiempo, aumentando la integración con editores, mejorando su velocidad de transpilación y aumentando el soporte con las funcionalidades más actuales del lenguaje.
