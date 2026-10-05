---
title: "Empezando con WebAssembly"
date: "2019-05-12"
updated: "2020-01-05"
slug: "empezando-con-webassembly"
author: "Pablo Magaz"
excerpt: "WebAssembly es un standard abierto que nos permite la ejecución de código binario, compilado con lenguajes como C, C++ o Rust en la Web y ofreciendo un nivel de performance que se acerca al de estos lenguages por lo que tiene el potencial para cambiar el panorama Web en el futuro cercano."
category: "technology"
keywords: ["WebAssembly"]
archived: true
---

## WebAssembly es un standard abierto que nos permite la ejecución de código binario, compilado con lenguajes como C, C++ o Rust en la Web y ofreciendo un nivel de performance que se acerca al de estos lenguages por lo que tiene el potencial para cambiar el panorama Web en el futuro cercano.

Arrancamos una nueva serie de posts donde vamos a profundizar en las posibilidades que ofrece [WebAssembly](https://webassembly.org/). En este primer post veremos un poco de la teoría necesaria para explicar una tecnología que supone un cambio de paradigma bastante notable especialmente para los JavaScripters ya que WebAssembly no es un nuevo framework de Js, un nuevo sistema de building o un nuevo superset que extiende alguna funcionalidad de JavaScript, es algo bastante diferente y por supuesto ¡muy interesante!

### ¿Qué es Web Assembly?

La descripción corta es que WebAssembly (o abreviado Wasm) es un standard abierto que permite la ejecución de código binario en la Web, proporcionando un nivel de rendimiento superior al rendimiento ofrecido por un lenguaje interpretado como JavaScript.

Si la descripción corta ya es potente, la larga lo es aún más. WebAssembly es un formato de código binario cercano a [ensamblador](https://es.wikipedia.org/wiki/Lenguaje_ensamblador) e independiente del lenguaje y la plataforma, ya que WebAssembly puede ser compilado desde otros lenguajes de programación como C, C++, [Rust](https://www.rust-lang.org/) o desde su propio formato en texto y puede ser ejecutado en un navegador o una maquina virtual. WebAssembly es un standard abierto cuyo objetivo es ofrecer un rendimiento cercano al “nativo” en la web pero manteniendo en todo momento la total compatibilidad y coexistencia con el ecosistema y standards actuales, como ECMAScript.

### Algunos conceptos básicos de WebAssembly

Webassembly no es fácil de entender de primeras ya que opera a un nivel mucho más bajo que JavaScript y nos obliga a hablar, tratar y entender ciertos conceptos que nos pueden sonar raros. De hecho la palabra ensamblador ya da algo de cosa verdad? Tratar de cubrir todos los elementos de WebAssembly en esta introducción sería complicado así que vamos a comentar los más destacados:

#### Stack Machine

WebAssembly es realmente una [máquina de pila](https://es.wikipedia.org/wiki/M%C3%A1quina_de_pila) o stack machine que funciona bajo un [sistema de instrucciones](https://en.wikipedia.org/wiki/Instruction_set_architecture) o ISA por sus siglas en inglés. Estas [instrucciones](https://webassembly.github.io/spec/core/appendix/index-instructions.html) permiten control de flujo como los loops, los ifs, operaciones aritméticas como sumas, restas o acceso a la memoria.

#### Módulos

WebAssembly está organizado en [módulos](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Module) que son compilados en binario. Los módulos son la unidad de código básica en WebAssembly y podemos verlos de la misma forma que módulos de ECMAScript donde los módulos contienen funciones, variables y pueden importar y exportar otras funciones.

Los módulos han de ser instanciados para poder ser usados y cada instancia de un módulo llevan consigo todos los elementos necesarios para su ejecución, como variables, funciones, memoria, referencias etc.

#### Memoria linear

La memoria de WebAssembly es [linear](https://en.wikipedia.org/wiki/Flat_memory_model) por lo que dispone de un Array linear de bytes que pueden ser leídos y escritos ya que son mutables y cuyo tamaño puede incrementar de forma dinámica. La memoria linear se encuentra en su propio sandbox, por lo que no se superpone entre sí o con otras partes de una instancia de WebAssembly.

#### Tipos

WebAssembly es código de tipado seguro y solo dispone de [4 tipos](https://webassembly.github.io/spec/core/appendix/index-types.html). Enteros de 32/64 bits y números en coma flotante de 32/64 bit. Esto no quiere decir que no haya otros tipos como booleanos, pero éstos son representados mediante enteros.

#### Multiformato

WebAssembly dispone de 2 formatos: Uno, [binario](https://webassembly.github.io/spec/core/binary/index.html) compilado a un nivel cercano al de ensamblador y que puede ser generado desde otros lenguajes de programación y otro que es [WebAssembly Text Format](https://webassembly.github.io/spec/core/text/index.html) o WAT y que es la representación textual del código binario actuando como estado intermedio más amigable con los humanos. Y que aspecto tiene WAT? Pues un hello world tendría el siguiente aspecto

```rust
(module
  (func (result i32)
    (i32.const 42)
  )
  (export "helloWorld" (func 0)))
```

No mola mucho verdad…? Wat es una representación textual del binario de Wasm y es bi-direccional, esto quiere decir que podemos compilar Wasm desde Wat y que cuando debugeemos un. wasm en el navegador veremos su Wat. Wat hace uso intensivo de las [S expressions](hhttps://es.wikipedia.org/wiki/Expresi%C3%B3n_S) que es un sistema para representar instrucciones en estructuras en árbol por lo que es ideal para representar el conjunto de instrucciones de WebAssembly pero la realidad es que no es apenas usado como lenguaje base porque sencillamente Wasm ha sido diseñado para ser objetivo de compilación de otros lenguajes de programación como iremos viendo en próximos posts, pero por simplificación en este post usaremos solamente Wat.

### Ejemplo práctico

Bien, después de toda la teoría, vamos a la práctica y vamos a ponernos manos a la obra. De cara a facilitar al máximo posible todo, te recomiendo utilizar [WebAssembly Studio](https://webassembly.studio/) que es un editor online de WebAssembly y que nos permite crear proyectos WASM, con soporte para WAT, Rust o C y que te evitará tener que instalar nada para poder empezar con WebAssembly y compilar módulos wasm.

Para nuestro ejemplo práctico vamos a imaginar que tenemos una aplicación JavaScript que, entre otras cosas, realiza diferentes operaciones matemáticas como sumas, restas o multiplicaciones y queremos mejorar el rendimiento de estas operaciones delegándolas en WebAssembly. Lo primero que tendremos que hacer es escribir una de estas funciones, la de multiplicación por ejemplo, para que multiplique 2 enteros en WebAssembly usando Wat:

```rust
(module
  (func $multiply (param $x i32) (param $y i32) (result i32)
    get_local $x
    get_local $y
    i32.mul)
  (export "multiply" (func $multiply)))
```

Aquí tenemos un módulo en WAT con una función que se llama multiply y que recibe dos enteros de 32 bit ($x y $y) y devuelve el resultado de su multiplicación (i32.mul). Adicionalmente vemos como el módulo exporta la función multiply (export "multiply") que la hará visible para nuestro código JavaScript más adelante. Tanto si estas usando [WebAssembly Studio](https://webassembly.studio/) como si lo estás haciendo en local, hay que compilar el wat en su versión binaria .wasm para poder ser cargado desde nuestro código JavaScript.

#### Interface JavaScript de WebAssembly

WebAssembly ha sido diseñado para ser usado con JavaScript y dispone de una [API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly) que ayuda en la integración de los [módulos](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Module) de Wasm con JavaScript. Esta Api viene a cubrir distintos elementos de WebAssembly como acceso al módulo, a la memoria, las tablas etc y que permiten una interacción bidireccional entre JavaScript y los módulos de Wasm.

Para poder hacer uso de esa [API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly), lo primero que vamos a hacer es cargar nuestro fichero wasm como si fuera un recurso más. Para eso no necesitamos nada especial, tan solo el tradicional fetch:

```js
(async () => {
  const res = await fetch('main.wasm');
  ...
})();
```

Que nuestro fichero. wasm sea un binario no quiere decir que el navegador no tenga que [compilarlo](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/compile). De hecho, durante este proceso el código es validado para ver la integridad de dicho módulo. La Api de WebAssembly ha cambiado y evolucionado con el tiempo y existen muchos ejemplos en internet que hacen referencia al método [compile](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/compile) al que se le pasa la respuesta en arrayBuffer una vez que el .wasm se ha descargado del todo pero actualmente no es necesario ya que con el método [compileStreaming](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/compileStreaming) podemos comenzar la descarga y la compilación en paralelo, lo cual agilizará la carga del módulo.

```js
(async () => {
  const res = await fetch('main.wasm');
  const module = await WebAssembly.compileStreaming(res);
  ...
})();
```

De la compilación del módulo obtenemos la instancia del mismo, que es la que nos dará acceso a todos los elementos que haya exportado nuestro wasm. ¿Recuerdas que en los pasos previos habíamos creado un WAT con una función multiply que recibía dos enteros y devolvía el resultado de su multiplicación?

```js
(async () => {
  const res = await fetch("main.wasm");
  const module = await WebAssembly.compileStreaming(res);
  const instance = await WebAssembly.instantiate(module);
  const { multiply } = instance.exports;
  const result = multiply(5, 5);
  console.log(result); // 25
})();
```

Como vemos, desde el método exports de la propia [instancia](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/instantiate) del módulo ya tenemos acceso al método que exportamos en nuestro wasm y que era “multiply” y que podemos utilizar como una función normal y corriente de JavaScript aunque realmente no lo es, es una función en WebAssembly. No obstante, podemos mejorar un poquito este ejemplo:

```js
(async () => {
  const res = await fetch("main.wasm");
  const { instance } = await WebAssembly.instantiateStreaming(res);
  const { multiply } = instance.exports;
  const result = multiply(5, 5);
  console.log(result); // 25
})();
```

Ahora, en lugar de llamar al método compileStreaming, obtener el módulo y después su instancia podemos pasar directamente al método [instantiateStreaming](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/instantiateStreaming) la promesa del fetch. Este es el método más óptimo para compilar e instanciar cualquier módulo de Wasm.

#### Midiendo el resultado.

WebAssembly supone un fuerte impulso en términos de performance nuestras aplicaciones Js, por su carácter de código binario, pudiendo delegar en WebAssembly tareas críticas que requieren un alto performance y no lógicamente una simple multiplicación pero como siempre es positivo sacar conclusiones por uno mismo, vamos a medir el resultado de lo que hemos hecho y vamos a comparar la diferencia de rendimiento entre nuestra función de multiplicación en WebAssembly y su versión en JavaScript:

```js
const multiplyJs = (x, y) => x * y;
```

Para la comparativa, vamos a crear una función muy sencilla que nos permita medir de forma más o menos aproximada la diferencia de tiempo de ejecución entre multiply y multiplyJS (la versión en JavaScript) utilizando el método time y timeEnd de la consola:

```js
const perf = (fn, ...args) => {
  const [x, y] = args;
  console.time("perf");
  fn(x, y);
  console.timeEnd("perf");
};

perf(multiply, 5, 5); // perf 0.00390625ms
perf(multiplyJs, 5, 5); // perf 0.02880859375ms
```

A lo largo de distintas ejecuciones iremos obteniendo resultados que irán variando como es lógico, pero podremos observar como la versión Wasm es desde un **70% hasta un 87%** mas rápida que la versión puramente de JavaScript lo cual es una cifra muy importante como para ser obviada aunque esto no quiere decir que todo lo que hagamos en WebAssembly vaya a tener siempre estas diferencias de performance.

### Accediendo a la API del navegador desde Wasm

En el ejemplo previo hemos accedido a funciones de módulos. wasm desde JavaScript, pero a medida que queramos hacer cosas más complejas será necesario que desde nuestros módulos Wasm también podamos acceder a las APIS del navegador como el DOM, etc. WebAssembly permite esa comunicación bi-direccional. Vamos a suponer que queremos acceder a la consola desde un módulo Wasm. Para ello cuando hagamos la compilación/instanciación del módulo Wasm, podemos pasar un objeto con opciones de importación.

```js
(async () => {
  const importObject = {
    imports: { console: arg => console.log(arg) }
  };
  const res = await fetch('main.wasm');
  const { instance } = await WebAssembly.instantiateStreaming(res, importObject);
  ...
})();
```

En el nodo imports hemos definido una propiedad llamada ¨console¨ y cuyo valor es una llamada al console.log y sus argumentos. Desde un módulo Wat podemos importar esta propiedad y después exportar la llamada a la misma (console_call) cuyo valor retornado será 1200 pero teniendo en cuenta que la ejecución de ese console.log(1200) lo realiza WebAssembly, no JavaScript.

```rust
(module
  (func $i (import "imports" "console") (param i32))
  (func (export "console_call")
    i32.const 1200
    call $i))
```

Ahora lo único que nos quedaría seria importar la función que ejecuta la llamada al console.log y que hemos llamado console_call:

```js
(async () => {
  const importObject = {
    imports: { console: (arg) => console.log(arg) },
  };
  const res = await fetch("main.wasm");
  const { instance } = await WebAssembly.instantiateStreaming(
    res,
    importObject
  );
  const { console_call } = instance.exports;
  console_call(); // es lo mismo que console.log(1200)
})();
```

Como vemos WebAssembly permite una interacción y comunicación totalmente bi-direccional, donde desde JavaScript podemos llamar a módulos Wasm y beneficiarnos de su alto rendimiento y desde módulos Wasm podemos tener acceso a las APIS del navegador. Parece poco probable que nos vayamos a poner a escribir formularios y aplicaciones de gestión que consumen una API en WebAssembly, pero sí que tenemos que tener en cuenta que WebAssembly puede suponer un chute de performance muy importante en ciertas áreas del desarrollo con JavaScript como puede ser acceso a la Webcam, detección de elementos, audio, video, proceso de gráficos, etc.

En próximos posts veremos cómo comenzar con WebAssembly desde un punto de vista mucho más cercano al de un JavaScripter (Wat no lo es) y cómo podemos abordar tareas más complejas. Stay tunned.
