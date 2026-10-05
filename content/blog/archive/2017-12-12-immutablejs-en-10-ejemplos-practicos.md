---
title: "ImmutableJs en 10 ejemplos prácticos"
date: "2017-12-12"
updated: "2018-05-09"
slug: "immutablejs-en-10-ejemplos-practicos"
author: "Pablo Magaz"
excerpt: "ImmutableJs es una librería para la gestión de datos inmutables, muy útil y ampliamente utilizada en entornos Redux, donde la inmutabilidad del state es importante. ImmutableJs provee una extensa API para la gestión de dicha inmutabilidad y soluciona problemas de rendimiento."
category: "technology"
keywords: ["ImmutableJs"]
archived: true
---

## ImmutableJs es una librería para la gestión de datos inmutables, muy útil y ampliamente utilizada en entornos Redux, donde la inmutabilidad del state es importante. ImmutableJs provee una extensa API para la gestión de dicha inmutabilidad y soluciona problemas de rendimiento.

Si tienes una aplicación [Redux](http://reduxjs.org/) de cierto tamaño, probablemente, sea una buena idea el uso de ImmutableJs. El empleo de [Object Spread / Object Assign](https://redux.js.org/docs/recipes/UsingObjectSpreadOperator.html) como mecanismos para gestionar la [inmutabilidad](https://redux.js.org/docs/recipes/reducers/PrerequisiteConcepts.html#immutable-data-management) del state de Redux, es válido para estructuras de datos muy simples, pero en estructuras de datos más complejas y de MundoReal©, como las que nos encontramos en proyectos reales y que suelen incluir sub-objetos, arrays de objetos etc, hacen que los reducers sean terriblemente feos e ilegibles. De la mutabilidad de los datos, se derivan además, problemas de performance que pueden forzar [renderizados no deseados](https://reactjs.org/docs/optimizing-performance.html) en React, por lo que el empleo de [estructuras immutables](https://reactjs.org/docs/optimizing-performance.html#using-immutable-data-structures) como ImmutableJs suelen ser una buena opción para evitar estos problemas, y mejorar el rendimiento de nuestra aplicación.

ImmutableJs posee muchas estructuras de datos y dispone, además, de una API muy extensa que nos permite incluso una orientación funcional. A lo largo de 10 ejemplos simples y prácticos, vamos a ver los ejemplos de uso más habituales de [Record](https://facebook.github.io/immutable-js/docs/#/Record/Record) y [List](https://facebook.github.io/immutable-js/docs/#/List), 2 de las estructuras de datos más utilizadas de ImmutableJs y con las que podremos afrontar gran parte de los casos de uso habituales en cualquier proyecto.

### Record

Podemos considerar [Record](https://facebook.github.io/immutable-js/docs/#/Record) como el modelo básico de datos en ImmutableJs. A efectos es un Objeto normal y corriente pero que dispone de métodos y funcionalidades ampliadas. Para usar el record de ImmutableJs debemos crear una nueva instancia, utilizando new:

```js
import { Record } from "immutable";

const Post = Record({
  id: 0,
  title: "Old Title",
});
const post = new Post({ title: "New Title" });

console.log(post.toJS());
//OUTPUT >> { id: 0, title: 'New Title' }
```

#### Recuperando propiedades

[Get](https://facebook.github.io/immutable-js/docs/#/Record/get) es el método por el cual vamos a poder recuperar una propiedad, pero también podemos acceder a ella como una propiedad normal y corriente de un Objeto:

```js
import { Record } from "immutable";

const Post = Record({
  id: 0,
  title: "Old Title",
});

const post = new Post();
const title = post.get("title");
console.log(title); // OUTPUT >> 'Old Title'
console.log(post.title); // OUTPUT >> 'Old Title'
```

#### Escribiendo propiedades

Si con get obtenemos una propiedad, con [Set](https://facebook.github.io/immutable-js/docs/#/Record/set) la sobrescribimos, pero ojo, son datos inmutables y por tanto no podemos hacer el set sobre una instancia y esperar que los valores de dicha instancia hayan cambiado, así que para ello la tenemos que asignar a otra variable:

```js
import { Record } from "immutable";

const Post = Record({
  id: 0,
  title: "Old Title",
});

const post = new Post();
post.set("title", "New Title");
console.log(post.get("title")); /* OUTPUT >> 'Old title'
    Es una estructura immutable, por tanto, no la podemos mutar, tenemos que devolver una nueva con los valores cambiados */

const title = post.set("title", "New Title").get("title");
console.log(title); // OUTPUT >> 'New title'

//Podemos cambiar varias propiedades al mismo tiempo, haciendo chaining
const post2 = new Post().set("id", 234).set("title", "Other Title");

console.log(post2.toJS());
//OUTPUT >> { id: 234, title: 'Other Title' }
```

#### Escribiendo varias propiedades (2) / Mezclando propiedades

Set es útil cuando tenemos que cambiar pocas propiedades, pero cuando necesitamos actualizar un número elevado de propiedades se hace un poco tedioso. En lugar de eso podemos utilizar [merge](https://facebook.github.io/immutable-js/docs/#/Record/merge), que combina las propiedades de dos objetos, sobrescribiendo las existentes con nuevos valores. Como apunte, set es [más rápido](https://jsperf.com/immutable-set-vs-merge-vs-mergedeep) que merge así que si tenemos pocas propiedades (2-3), mejor set que merge.

```js
import { Record } from "immutable";

const Post = Record({
  id: 0,
  title: "Old Title",
});

const post = new Post().merge({
  id: 123,
  title: "New Title",
});

console.log(post.toJS());
//OUTPUT >> { id: 123, title: 'New Title' }
```

#### Anidando Records

ImmutableJs permite, como es lógico, estructuras anidadas con objetos de objetos, donde la propiedad de un Record, puede ser, otro Record y para leer o escribir esas propiedades del Record, podemos usar [getIn](https://facebook.github.io/immutable-js/docs/#/getIn) y [setIn](https://facebook.github.io/immutable-js/docs/#/setIn):

```js
import { Record } from "immutable";

const Author = Record({
  name: "Paul",
  age: 33,
});

const Post = Record({
  id: 0,
  title: "Old Title",
  author: new Author(),
});

const post = new Post({ title: "New Title" });
console.log(post.getIn(["author", "age"]));
// OTPUT >> '33'
console.log(post.setIn(["author", "age"], 44));
// OTPUT >> { "id": 0, "title": "New Title", "author": Record { "name": "Paul", "age": 44 } }
```

#### Actualizando Nodos

Update es un método muy útil para realizar actualizaciones en nodos completos, especialmente cuando estos, además, son estructuras de ImmutableJs. Además, nos permite aplicar funciones que nos van a ayudar en el control de la lógica de actualización. Vamos a suponer que queremos actualizar el nombre del author del blog -que es un Record- solo en los casos en los que, este, sea mayor de 30.

```js
import { Record } from "immutable";

const Author = Record({
  name: "Paul",
  age: 33,
});

const Post = Record({
  id: 0,
  title: "Old Title",
  author: new Author(),
});

const post = new Post().update("author", (author) =>
  author.get("age") > 30 ? author.set("name", "Peter") : author
);

console.log(post.getIn(["author", "name"])); // OTPUT >> 'Peter'
```

### List

Las lists son como los Arrays y ellos podemos guardar cualquier cosa. En ocasiones se suele emplear también [Map](https://facebook.github.io/immutable-js/docs/#/Map) como contenedor, pero hay que tener en cuenta que Map es una colección no ordenada de clave/valor por lo que si el orden es importante, es mejor emplear lists.

#### Insertando en la lista

Insertando en una lista es igual de fácil que hacerlo en un Array normal y corriente:

```js
import { List } from "immutable";

const Post = Record({
  id: 0,
  title: "Post Title",
});

const newList = List().push(new Post());

console.log(list.toJS());
// OUTPUT >> [ { id: 0, title: 'Post title' }]
```

#### Vaciando una lista

Con [clear](https://facebook.github.io/immutable-js/docs/#/List/clear), podemos vaciar una lista:

```js
import { List } from "immutable";

const clearList = List([1, 2, 3]).clear();

console.log(clearList.toJS());
// OUTPUT >> []
```

#### Borrando de la lista según criterios

En muchas ocasiones vaciar una lista no será suficiente y tendremos que eliminar elementos de dicha lista, según ciertos criterios. ¿Cómo hacerlo?

```js
import { Record, List } from "immutable";

const data = [
  { id: 11, title: "One post" },
  { id: 22, title: "Another Post" },
];

const Post = Record({
  id: 0,
  title: "",
});

const updatedList = List(data.map((item) => new Post(item))).filter(
  (post) => post.get("id") !== 11
);

console.log(updatedList.toJS());
// OUTPUT >> [ { id: 22, title: 'Another Post' } ]
```

#### De Array a Lista de Records/Maps

Algo habitual manejando ImmutableJs es que tengamos que poblar un List con Records o Maps con los datos de un servicio, por ejemplo, de tal forma que tendremos una lista de Records o Maps:

```js
import { Record, List } from "immutable";

const data = [
  { id: 11, title: "One post" },
  { id: 22, title: "Another Post" },
];

const Post = Record({
  id: 0,
  title: "",
});

const newList = List(data.map((item) => new Post(item)));
console.log(newList.toJS());
// OUTPUT >> [ { id: 11, title: 'One post' }, { id: 22, title: 'Another Post' } ]
```

Pues esto es todo. 10 ejemplos prácticos con Record y List que nos permiten cubrir gran parte de las operaciones del "día a día" con ImmutableJs, una librería que entornos React / Redux se hace indispensable, especialmente cuando el proyecto alcanza cierto tamaño.
