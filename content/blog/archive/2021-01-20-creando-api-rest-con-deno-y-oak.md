---
title: "Creando una API REST con Deno y Oak"
date: "2021-01-20"
updated: "2021-01-20"
slug: "creando-api-rest-con-deno-y-oak"
author: "Pablo Magaz"
excerpt: "Los operadores de RxJs son una de las piezas clave de esta gran librería, ya que el amplio catalogo existente nos permite cubrir casi cualquier tarea imaginable. Sin embargo, en ciertas ocasiones es necesario poder implementar nuestros propios operadores. En este post aprenderemos como hacerlo."
category: "technology"
keywords: ["Deno", "TypeScript"]
archived: true
---

## La popularidad de Deno, el nuevo runtime para la V8 que compite con NodeJs va en aumento y con ella su ecosistema de librerías y frameworks. Oak, es el middleware framework para APIS y aplicaciones Web más popular en Deno y en este post aprendemos como escribir una API REST con ambos.

Hace algunos posts hablabamos de [Deno](https://pablomagaz.com/blog/old/deno-el-remplazo-de-nodejs), un nuevo runtime basado en la V8 de Chrome que ha nacido para competir directamente con NodeJs. De hecho Deno y NodeJs son hijos del mismo Padre, [Ryan Dahl](https://en.wikipedia.org/wiki/Ryan_Dahl) que con Deno, ha querido solucionar los problemas o áreas de mejora conocidos de NodeJs. Puedes conocer las diferencias en este [post](https://pablomagaz.com/blog/old/deno-el-remplazo-de-nodejs). Si bien Deno es bastante reciente, pues la versión 1.0 fue publicada hace pocos meses, avanza a gran velocidad y en el momento de escribir este post se encuentra en su versión 1.6 y el ecosistema de librerías y frameworks que comienza ya a tener es sorprendentemente amplio.

Si tuviéramos que escoger el framework o libreria de NodeJs para escribir una API REST seguramente todos pensariamos en [Express](https://expressjs.com/) o [Koa](https://koajs.com/), una versión más moderna que Express y de los mismos creadores. En el ecosistema Deno, no existe Express, al menos de forma oficial ya que hay algún port raro por ahí, o Koa, pero existe lo que nos interesa en este post: [Oak](https://github.com/oakserver/oak). El parecido entre "Koa" y "Oak" no es casual y esto se debe a que Oak se encuentra fuertemente influenciado por Koa, y su concepto de middleware y comparte con Koa su facilidad de uso, que nos va a permitir escribir APIS de forma rápida y extremadamente sencilla. Como siempre podrás encontrar todo el código del ejemplo en mi [github](https://github.com/pmagaz/deno-oak-rest-api).

Oak se basa en 3 simples conceptos, que nos van a ser muy familiares pues los podemos encontrar en otros frameworks: Aplication, middleware y context. Con estos 3 conceptos vamos a ser capaces de contrustuir cualquier API o aplicación Web sin importar su tamaño. Vamos al lío.

### Application

Empezando por arriba tendríamos Application y que como sucede en la mayoría de los frameworks es simplemente un wrapper del servidor http del runtime, en este caso Deno. Application tiene un método listen que nos permite levantar dicho servidor http en el puerto que indiquemos:

```ts
import { Application } from "https://deno.land/x/oak/mod.ts";

const app = new Application();

await app.listen({ port: 8000 });
```

Algo que destacar es el [top level await](https://github.com/tc39/proposal-top-level-await) que vemos en el ejemplo y que permite usar await sin async, ya que recordemos, el lenguaje por defecto de Deno es [Typescript](https://www.typescriptlang.org/) y por tanto podemos usar las features de TypeScript, que soporta top level await desde hace tiempo.

### Middleware

En la propia definición de Oak podemos ver que es un **middleware framework** por lo que en Oak todo gira entorno al middleware y de hecho, en Oak, todo es un middleware. Para clarificar esto un poco, el middlweare en Oak no es más que un stack de funciones asíncronas que se van a ejecutar con cada petición. Para registrar un middleware tan solo hemos de utilizar el metodo use y pasar nuestra función de middleware. Para ilustrarlo un poco mejor, vamos con el tradicional hello world que queremos mostrar por consola con cada petición que llegue a nuestra aplicación:

```ts
import { Application } from "https://deno.land/x/oak/mod.ts";

const app = new Application();

app.use((context) => {
  console.log("Hello World!");
});

await app.listen({ port: 8000 });
```

### Context

Probablemente te habrás dado cuenta del parámetro context de nuestra función. Es el tercer concepto importante en Oak y sirve para acceder a la request y poder enviar el response. Si quisiéramos responder con nuestro hello world a todas las peticiones, en lugar de simplemente enviar la salida por consola, solo tenemos que añadir la salida a la propiedad response.body que hay en context.

```ts
import { Application } from "https://deno.land/x/oak/mod.ts";

const app = new Application();

app.use((context) => {
  context.response.body = "Hello World!";
});

await app.listen({ port: 8000 });
```

Como te puedes imaginar, context es un objeto muy grande que entre otras cosas nos va a permitir acceder a la request con todos los parámetros enviados y manejar distintos parámetros del response como el contenido del body, el status code, que salvo que se indique lo contrario es 200, etc.

### Routing

Como era de esperar, en Oak tenemos un router que nos va a permitir definir las rutas de nuestra API REST, pero a efectos el router de Oak es también un middleware con la salvedad de que en él podemos definir el método (GET, POST, DELETE, PATCH, etc) al que el middleware va responder, la ruta especifica y lógicamente un handler o función que se va a ejecutar cuando una petición se realice a dicha ruta/método:

```ts
import { Application, Router } from "https://deno.land/x/oak/mod.ts";

const app = new Application();
const router = new Router();

// GET request to "/api/helloworld"
router.get("/api/helloworld", (ctx) => {
  ctx.response.body = "Hello World!";
  ctx.response.status = 201;
});

await app.listen({ port: 8000 });
```

Sencillo verdad? Pues estos son los conceptos básicos de Oak así que vamos a ponernos manos a la obra con un ejemplo un poquito más de mundo real y lógicamente un código algo más complejo como lo es un CRUD de creación de usuarios mediante API REST y con conexión "fake" a una base de datos.

### Estructura del proyecto

A fin de que nuestro proyecto sea un poquito más elaborado y sobre todo, mas escalable vamos a separar en distintas entidades, más pequeñas la lógica de nuestra aplicación:

**\* src/server** El servidor de Oak!
**\* src/routes** Rutas de nuestra API
**\* src/handlers** Route handlers, es decir las funciones que van a responder a cada ruta definida en routes.
**\* src/db** Directorio que contendrá la conexión fake/queries a la base de datos.
**\* src/middleware** Middleware propios.
**\* src/types** Types de TypeScript

### Modelo

El modelo que vamos a manejar es realmente simple. Una interface con 3 parámetros: Uuid que será el identificador del usuario, el nombre y la fecha de nacimiento. El objetivo de nuestra API como es lógico será la de buscar, crear y actualizar usuarios.

```ts
export type Uuid = string;

export interface User {
  uuid: Uuid;
  name: string;
  birthDate: Date;
}
```

### Routes

En este fichero importamos el router de Oak y definimos que método responde a cada ruta mediante los metodos get, post, delete y patch y las rutas para cada método de nuestra aplicación. Aunque podemos implementar la lógica para cada ruta directamente es buena idea tenerlo separado por capas:

```ts
import { Router } from "https://deno.land/x/oak/mod.ts";
import {
  createUser,
  deleteUser,
  findUser,
  updateUser,
} from "../handlers/user.ts";

export const router = new Router()
  //User routes
  .get("/api/users/:userId", findUser)
  .delete("/api/users/:userId", deleteUser)
  .patch("/api/users", updateUser)
  .post("/api/users", createUser);
```

### Handlers

Los handlers son simplemente las funciones que responden a cada ruta

y que como vemos hemos llamado findUser, deleteUser, updateUser y createUser por lo que es fácil identificarlos. Lógicamente cuando llamemos al método GET para obtener un determinado usuario será necesario acceder a los parámetros GET de la url. Esto en Oak se realiza mediante el helper getQuery que nos permite acceder a los slugs de la url, parámetros queryString etc. En el caso de los parámetros POST, en la propiedad request existe un método body que nos devuelve los valores pasados en el mismo. Estos valores serán pasados a nuestras queries para buscar dicho usuario y devolver en la response o en caso de no encontrarlo, devolver un 404 y un mensaje de error:

```ts
import { Context, helpers } from "https://deno.land/x/oak/mod.ts";
import type { User } from "../types/user.ts";
import * as db from "../db/index.ts";

export const findUser = async (ctx: Context) => {
  const { userId } = helpers.getQuery(ctx, { mergeParams: true });
  try {
    let user: User = await db.findUserById(userId);
    ctx.response.body = user;
  } catch (err) {
    ctx.response.status = 404;
    ctx.response.body = { msg: err.message };
  }
};

export const createUser = async (ctx: Context) => {
  const { name, birthDate } = await ctx.request.body().value;
  try {
    let createdUser: User = await db.createUser(name, birthDate);
    ctx.response.body = createdUser;
  } catch (err) {
    ctx.response.status = 500;
    ctx.response.body = { msg: err.message };
  }
};
...
```

### Queries

Con los datos que hemos recogido en los handlers, queremos ejecutar queries y aunque en este ejemplo no vamos a implementar una conexión a base de datos real vamos a simular una que implementa los métodos findUserById y que recibe el uuid del usuario y createUser que recibe los parámetros name y birthdate para "crear" un nuevo usuario, asignarle un uuid autogenerado y devolver el objeto:

```ts
import type { User, Uuid } from "../types/user.ts";
import { v4 } from "https://deno.land/std@0.77.0/uuid/mod.ts";

//Fake Db Queries
export const findUserById = async (uuid: Uuid): Promise<User> =>
  new Promise((resolve, reject) => {
    if (uuid !== "23ceab21-98e3-42c1-85fa-d28ed3f5afb7") {
      throw new Error("User not found");
    }
    setTimeout(() => {
      resolve({
        uuid,
        name: "Paul",
        birthDate: new Date(),
      });
    }, 50);
  });

export const createUser = async (
  name: string,
  birthDate: Date
): Promise<User> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve({
        uuid: v4.generate(),
        name,
        birthDate,
      });
    }, 50);
  });
```

En ambos casos hemos utilizado una promesa con un timeout para simular una petición totalmente asíncrona con cualquier base de datos.

### Logger

Una cosa que seguramente queramos hacer y que es tradicional en cualquier API que se precie es un logger. Como hemos comentado en Oak, todo es un middleware y los handlers que usamos en las rutas no son diferentes a un middleware custom. Quizás la única diferencia es el empleo explícito del famoso método next, al que como sucede en otros frameworks tenemos que llamar para pasar al siguiente middleware en el stack.

En nuestro logger queremos mostrar por consola todas las peticiones que nos lleguen, el método de dicha petición mediante la propiedad method y los parámetros que ésta recibe cuando es una petición POST (por ejemplo) algo que podemos hacer de forma sencilla accediendo al body como vimos anteriormente:

```ts
import type { Context } from "https://deno.land/x/oak/mod.ts";

export const logger = async (ctx: Context, next: () => any) => {
  await next();
  const body = await ctx.request.body().value;
  let params = body ? `with params ${JSON.stringify(body)}` : "";
  console.log(`${ctx.request.method} request to ${ctx.request.url} ${params}`);
};
```

### Server

Pues ya tenemos las rutas, los handlers, las querie a la base de datos y hasta un logger custom, así que ya lo único que nos quedaría sería el server que como vimos al prinipio no es más que una instancia de Application al que pasamos todos los middlewares que queremos usar, sean estos el router o nuestro logger. Para hacerlo un poquito mejor hemos usado ficheros .env gracias al paquete [dotenv](https://deno.land/x/dotenv@v2.0.0), y donde hemos guardado la configuración y que podemos recuperar mediante config();

```ts
import { config } from "https://deno.land/x/dotenv/mod.ts";
import { Application } from "https://deno.land/x/oak/mod.ts";

import { router } from "./routes/index.ts";
import { logger } from "./middleware/logger.ts";

const { PORT } = config();
const app = new Application();

app.use(logger);
app.use(router.routes());
app.use(router.allowedMethods());

console.log(`Server up on port ${PORT}`);

await app.listen({ port: Number(PORT) });
```

Pues ya lo tendríamos todo listo para ejecutar nuestro server. Es importante recordar que debido a las políticas de seguridad de Deno, tenemos que ser explícitos en cuanto a los permisos que requiere nuestra aplicación, como acceso a la red, lectura de disco o variables de entorno por lo que para poder ejecutar nuestro server debemos ejecutar:

```shell
deno run --allow-net --allow-read --allow-env src/server.ts
```

Adicionalmente, y si has desarollado con NodeJs, probablemente conozcas NodeMon, una popular aplicación que permite hotreload y facilita el desarollo. En Deno no existe NodeMon pero existe [Denon](https://deno.land/x/denon@2.4.6), que al caso viene a ser lo mismo. Es necesario instalar Denon previamente mediante cargo u otro sistema, pero una vez instalado solo necesitamos este script para tener un entorno de desarollo totalmente óptimo:

```ts
import type { DenonConfig } from "https://deno.land/x/denon@2.4.4/mod.ts";

const config: DenonConfig = {
  watch: true,
  scripts: {
    start: {
      cmd: "deno run --allow-net --allow-read --allow-env src/server.ts",
      desc: "Run dev server",
      watch: true,
    },
  },
};

export default config;
```

Pues esto ha sido todo. Como hemos visto a lo largo del post crear APIS REST con Oak es realmente fácil, sencillo y sobre todo productivo ya que con muy poco código/esfuerzo obtenemos mucho. Oak aún es joven pero todo parece indicar que puede ser a Deno lo que Express ha sido a NodeJs, y no es precisamente, decir poco.

[Código](https://github.com/pmagaz/deno-oak-rest-api) del ejemplo en github.
