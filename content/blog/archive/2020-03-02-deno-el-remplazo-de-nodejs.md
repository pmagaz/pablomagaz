---
title: "Deno. ¿El remplazo de NodeJs?"
date: "2020-03-02"
updated: "2020-05-18"
slug: "deno-el-remplazo-de-nodejs"
author: "Pablo Magaz"
excerpt: "NodeJs ha sido una tecnología fundamental en los últimos años y su aporte a JavaScript es incalculable. Sin embargo, su reinado puede estar llegando a su fin. Deno es un nuevo runtime basado en la V8 de Chrome, desarrollado en Rust y basado en TypeScript que llega para competir directamente con NodeJs."
category: "technology"
keywords: ["Deno", "NodeJs"]
archived: true
---

## NodeJs ha sido una tecnología fundamental en los últimos años y su aporte a JavaScript es incalculable. Sin embargo, su reinado puede estar llegando a su fin. Deno es un nuevo runtime basado en la V8 de Chrome, desarrollado en Rust y basado en TypeScript que llega para competir directamente con NodeJs.

Una década ha pasado ya desde que por allá por 2009 [Ryan Dahl](https://en.wikipedia.org/wiki/Ryan_Dahl) lanzó NodeJs, siendo probablemente una de las tecnologías más revolucionarias de la decada por la "locura" que ello significaba: JavaScript en el servidor. NodeJs no solo diginificó un lenguaje denostado por aquellos años y además lo hizo ofreciendo unos rendimientos ya no iguales, si no incluso superiores a lenguajes como Pyton, Ruby o Java. Que me perdonen los Javeros pero en el caso de Java tampoco era tan díficil ;)

NodeJs trajo consigo un cambio de mentalidad y de paradigma. El [event driven](https://es.wikipedia.org/wiki/Programaci%C3%B3n_dirigida_por_eventos) y la [asincronía](https://en.wikipedia.org/wiki/Asynchronous_I/O) no fueron inventadas por NodeJs, pero es innegable que Node ha sido un abandarado de la programación asíncrona tan extendida hoy día. El aporte de NodeJs al propio lenguaje fue enorme y necesario. Hoy, una década después, vamos a hablar de Deno, también creado por [Ryan Dahl](https://en.wikipedia.org/wiki/Ryan_Dahl).

### ¿Que es Deno?

Deno, al igual que NodeJs, es un runtime multiplataforma basado en el motor [V8](https://v8.dev/) de Chrome, con la diferencia de que Deno, utiliza [Typescript](https://www.typescriptlang.org/) como lenguaje por defecto. Aunque Deno sigue la misma arquitectura que NodeJs, es decir, event driven, asincronía, etc, es un proyecto totalmente nuevo. NodeJs fue escrito en C++, pero Deno está escrito en [Rust](https://www.rust-lang.org/) y hace uso de librerías como [Tokio](https://github.com/tokio-rs/tokio), utilizada para el [Event Loop](https://nodejs.org/uk/docs/guides/event-loop-timers-and-nexttick/) de Deno. Esto ya nos da algunas pistas de que podemos esperar de Deno por las propias características de Rust, que es un lenguaje ultra seguro y con un performance execepcional. Puedes encontrar mas información sobre Rust en este mismo [blog](https://pablomagaz.com/blog/old/rust-para-javascripters) y en alguna de mis [charlas](https://pablomagaz.com/#about).

#### ¿Por qué Deno?

NodeJs ha llegado a la madurez y como cualquier tecnología tiene cosas muy buenas, buenas y mejorables, que sobre todo se van acentuando con el paso del tiempo de las que cabe destacar:

#### Dificultad de adaptación a los cambios del lenguaje

NodeJs popularizó el famoso [callback hell](http://callbackhell.com/) y digamos que por su propia arquitectura dificulta su adaptación a algunos cambios del lenguaje. Los [módulos](https://developer.mozilla.org/es/docs/Web/JavaScript/Referencia/Sentencias/import) de ECMAScript o las [promesas](https://developer.mozilla.org/es/docs/Web/JavaScript/Referencia/Objetos_globales/Promise) son un buen ejemplo ya que su soporte ha sido bastante tortuoso y de hecho hoy día muchas librerías aún siguen usando callbacks.

#### Gestión de las dependencias

NPM es un repositorio centralizado y propiedad de una empresa [privada](http://joyent.com) y aunque se han introducido muchas mejoras con los años, la carpeta node_modules sigue siendo un agujero negro... Mención especial a episodios como el famoso paquete de 11 líneas de código que fue [eliminado](https://www.theregister.co.uk/2016/03/23/npm_left_pad_chaos/) del registro causando la rotura de las builds de medio mundo, incluyendo Node, Babel, React, etc.

#### Módulos

El sistema de módulos de NodeJs basado en [require](https://nodejs.org/en/knowledge/getting-started/what-is-require/) fue una solución muy útil porque sencillamente no existía otra alternativa y pudimos usarlo incluso en el browser con [browserify](http://browserify.org/) pero es una solución que hoy día, con los módulos de ECMASCript ya no tiene mucho sentido. Se ha impuesto el standard.

#### Isomorfismo

NodeJs es un runtime multiplataforma, pero la realidad es que nunca ha llegado a serlo del todo ya que en NodeJs no existen los objetos globales como Window y su propia API no es soportada por los navegadores.

### La propuesta de Deno

El objetivo de Deno es proveer de soluciones y alternativas a esas areas de mejora de NodeJs y aunque Deno no ha nacido para ser un remplazo de NodeJs per se, es imposible no preguntarse si no lo va a ser, como vamos a ver a lo largo del post en el que vamos a tratar de explicar la propuesta y las mejoras que puede aportar Deno mediante ejemplos prácticos y cuyo código puedes encontrar en [github](https://github.com/pmagaz/deno-examples). Vamos a comenzar lógicamente por la instalación.

### Instalación

Podemos instalar Deno de forma muy sencilla mediante [scoop](https://scoop.sh/), [homebrew](https://formulae.brew.sh/formula/deno) o [cargo](https://doc.rust-lang.org/cargo/), el sistema de paquetería de Rust, ya que de hecho Deno se encuentra alojado en [crates.io](https://crates.io/crates/deno) (el npm de Rust) pero en máquinas Linux/Unix/osX curl es suficiente:

```shell
$ curl -fsSL https://deno.land/x/install/install.sh | sudo DENO_INSTALL=/usr/local sh
```

Una vez finalizada las instalación y como nos indicará el propio script, es importante añadir el binario de Deno a nuestro PATH (en nuestro .bash_profile) para poder usarlo.

### TypeScript nativo

Deno usa TypeScript como lenguaje por defecto por lo que no es necesario ningún tipo de configuración adicional. Esto viene a confirmar, una vez más que TypeScript se ha convertido en un standard de facto en el mundo Js. Un simple hola mundo en TypeScript es suficiente para comenzar a probar Deno:

```js
const sayHelloTo = (name: String): String => {
  return "Hello ${name} !";
};

console.log(sayHelloTo("Peter"));
```

Ya podemos ejecutar nuestro hello world en Deno y para ello simplemente necesitamos ejecutar el comando 'deno run scriptName' que es el equivalente al comando 'node scriptName':

```shell
$ deno run examples/helloWorld.ts
    Hello Peter !
```

### Módulos

Deno no utiliza un sistema "propietario" como require, si no que abraza el sistema de módulos de ECMAScript, ya que uno de los objetivos de Deno es ser totalmente compatible con Navegadores por lo que los paquetes se importan directamente con import y la url **remota** del paquete ya que en Deno no existe un fichero del tipo package.json ya que este sistema no funcionaría en un navegador, no al menos de forma eficiente:

```js
import { parseDate } from "https://deno.land/std/datetime/mod.ts"; // Url REMOTA!

const myDate = parseDate("02-03-2020", "dd-mm-yyyy");

console.log(myDate); // 2020-03-01T23:00:00.000Z
```

#### Dependencias

Como hemos visto en el apartado anterior, las dependencias se instalan directamente mediante su importación del repositorio descentralizado (a diferencia de NPM que es centralizado) que usa Deno. Cuando ejecutamos nuestra aplicación, Deno descargará todas esas depenencias, y las almacenará en su **cache global** por lo que estas solo son descargadas una única vez, ahorrando mucho tiempo en la instalación.

Quizás alguno eche de menos tener todas las dependencias en un único archivo. Deno nos ofrece también la posibilidad de tener un "import map" que vendría a ser más similar a soluciones como Webpack alias o TypeScript path alias que al propio package.json:

```json
{
  "imports": {
    "path/": "https://deno.land/std/path/"
  }
}
```

Esto nos permite, pasando como parámetro --importmap=import_map.json al ejecutar el script, importar directamente "path" como alias de "[https://deno.land/std/path/](https://deno.land/std/path/)", lo cual reduce notablemente la longitud de los imports, quizás el elemento menos atractivo de Deno:

```js
import { resolve } from "path/mod.ts";

const path = resolve("examples");

console.log(path); //deno-example/examples
```

Adicionalmente, Deno dispone de un namespace u objeto global llamado "Deno" que nos da acceso a un montón de módulos, por lo que no tendremos la necesidad de importar muchos de ellos.

```js
console.log(Deno);

/* { Buffer, readAll, readAllSync, writeAll, writeAllSync, build, chmodSync, chmod, chownSync, chown, transpileOnly, compile,
    bundle, inspect, copyFileSync, copyFile, chdir, cwd, applySourceMap, ErrorKind, DenoError, File, open, openSync.. 
*/
```

### Seguridad

Deno tiene el foco puesto en la seguridad y el objetivo es evitar situaciones similares a la del [malware](https://blog.npmjs.org/post/163723642530/crossenv-malware-on-the-npm-registry) con permisos de escritura que se subió a NPM. Para ello, los programas de Deno se ejecutan en su propio Sandbox y para acceder a elementos como el file system o la red, se debe solicitar permiso. El siguiente ejemplo intenta acceder al file system para crear el fichero test.txt en el:

```js
const encoder = new TextEncoder();
const data = encoder.encode("Hello Deno!");
await Deno.writeFile("test.txt", data);
```

Probamos a ejecutar el script:

```shell
$deno run examples/fsWrite.ts
    error: Uncaught PermissionDenied: write access to "test.txt", run again with the --allow-write flag
```

El propio error ya es bastante descriptivo ya que en Deno los accesos al file system o a la red han de ser explícitos, pasando al propio script los flags --allow-read para lectura, --allow-write para escritura o --allow-network para tener acceso a la red.

### Librería standard y Networking

Deno dispone de una [libreria standard](https://deno.land/std/) tan amplia como la de NodeJs y que no solo nos va a permitir interactuar con el filesystem como hemos visto si no que también ofrece un total soporte para el [networking](https://deno.land/std/http/) haciendo muy sencillo el abordar tareas como montar un simple servidor http:

```js
import { serve } from "https://deno.land/std/http/server.ts";
const s = serve({ port: 8000 });
for await (const req of s) {
  req.respond({ body: "Hello Deno server!" });
}
```

### Herramientas out of the box

Otra característica realmente interesante de Deno es que viene con ciertas herramientas ya integradas como formatter, suite de testing o linter (aún no implementado). Con Deno no será necesario instalar herramientas como [Mocha](https://mochajs.org/), [Chai](https://www.chaijs.com/), etc ya que Deno ya integra una suite de testing, facilmente accesible desde su namespace principal:

```js
import { equal } from "https://deno.land/std/testing/asserts.ts";

Deno.test(function test() {
  equal(1, 1);
});

await Deno.runTests();
// test result: OK 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out (0.00ms)
```

### Primeras conclusiones

Deno aún se encuentra en fase de desarrollo y en el momento de escribir este post se encuentra en su versión 0.34 pero en un titular: Deno tiene una pinta **espectacular**. Todas las decisiones tomadas van en una dirección más que correcta: El empleo de Rust, TypeScript, el repositorio distribuído, la apuesta por el standard, la seguridad...

Parece que nuestro querido y amado NodeJs, al que se le debe mucho y sin él que este [blog](https://github.com/pmagaz/pablomagaz.com) y otras muchas aplicaciones no serían posibles, va a tener algo más que un serio contrincante en frente y del que le puede resultar díficil salir bien parado si no se acomenten ciertos cambios, pues Deno viene a solventar de forma muy clara áreas de mejoras de NodeJs.

Como siempre, puedes encontrar el código de los ejemplos en [github](https://github.com/pmagaz/deno-examples).
