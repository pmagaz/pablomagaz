---
title: "Escribiendo microservicios con Moleculer"
date: "2020-01-02"
updated: "2020-01-07"
slug: "escribiendo-microservicios-con-moleculer"
author: "Pablo Magaz"
excerpt: "Las arquitecturas orientadas a microservicios son cada vez más populares debido a las grandes ventajas que aportan y aunque en NodeJs podemos abordarlas con distintas soluciones, en este post vamos a hablar de todo lo que nos ofrece Moleculer, el framework para microservicios en NodeJs."
category: "technology"
keywords: ["NodeJs"]
archived: true
---

## Las arquitecturas orientadas a microservicios son cada vez más populares debido a las grandes ventajas que aportan y aunque en NodeJs podemos abordarlas con distintas soluciones, en este post vamos a hablar de todo lo que nos ofrece Moleculer, el framework para microservicios en NodeJs.

Tradicionnalmente la arquitectura usada para la construcción de aplicaciones se ha basado en aplicaciones monolíticas, donde las distintas piezas que componen la arquitectura de un aplicación formaban parte de una única entidad, indivisible y en la mayoría de las ocasiones incluso un único ejecutable. A esto se le cononce como monolito y presenta desventajas, especialmente en términos de adataptabilidad, por el fuerte acople existente entre todas las piezas. También presenta desventajas en en términos de escalabilidad y durante mucho tiempo la única forma de solventar esto ha sido a base de incrementar la cantidad y/o capacidad del hardware.

### ¿Qué son los microservicios?

Los [microservicios](https://microservices.io/patterns/microservices.html) o las [arquitecturas](https://es.wikipedia.org/wiki/Arquitectura_de_microservicio) orientadas a microservicios enfocan el desarrollo de aplicaciones desde una perspectiva distribuida, desacoplada y granular, donde las piezas de la aplicación son más pequeñas, pero sobre todo, son independientes entre sí, eliminando los acoplamientos y permitiendo que un servicio pueda ser compartido por varias aplicaciones.

Los microservicios se suelen organizan en torno a las funcionalidades de negocio donde cada servicio representa un proceso con una responsabilidad delimitada. En una tienda online, por ejemplo, la gestión del stock podría ser un Microservicio, los usuarios otro y los envíos otro.

Con esto se elimina el acoplamiento permitiendo que cada microservicio pueda no solo estar en [nodos](https://moleculer.services/docs/0.12/nodes.html) o servidores diferentes, si no incluso, usar technologías diferentes donde un Microservicio puede estar escrito en NodeJs y otro en Java por ejemplo. Además, siendo ortodoxos, los microservicios no deberían compartir base de datos entre ellos. A esto se le conoce como [base de datos por servicio](https://microservices.io/patterns/data/database-per-service.html) donde cada servicio tiene su propia base de datos (stock, clientes, envíos). Moleculer sigue el principio de base de datos por servicio pero

Lógicamente hace falta una vía de comunicación entre microservicios y para ello los Microservivicios pueden exponer su propia API (REST, GraphQl, etc) como vía de comunicación pero también es posible la comunicación mediante sistemas de mensajería [AMQP](https://www.amqp.org/) o sistemas más modernos como [Nats](https://docs.nats.io/) y que es el que veremos en este post, pues simplifica enormente la comunicación entre microservicios.

### Moleculer

Después de haber visto, de forma básica, que son los microservicios, está claro que podríamos escribir microservicios en NodeJs de muchas formas diferentes y con muchas soluciones diferentes. Podríamos usar [Express](https://expressjs.com/es/), [Koa](https://koajs.com/) o cualquier framework para escribir APIS pero tendríamos una cantidad de trabajo adicional muy importante que realizar para llegar al nivel de fucionalidad ofrecida por [Moleculer](hhttps://moleculer.services/), que es el primer framework diseñado específicamente para microservicios con NodeJs y dispone de un amplio catálogo de [modulos](https://moleculer.services/modules.html) que permiten el desarrollo de Microservcios con [GraphQL](https://github.com/MerlinLabs/moleculer-graphql#readme), [SocketIo](https://github.com/davidroman0O/moleculer-socketio) asi como conexión a distintas bases de datos como [MongoDb](https://github.com/moleculerjs/moleculer-db/tree/master/packages/moleculer-db-adapter-mongo#readme) y ORM's como [Moongose](https://github.com/moleculerjs/moleculer-db/tree/master/packages/moleculer-db-adapter-mongoose#readme). Adicionalmente Moleculer ya trae por defecto piezas fundamentales en cualquier Microservicio como [Api Gateway](https://microservices.io/patterns/apigateway.html), que veremos un poco más adelante, así como un sistema de comunicación entre los distintos servicios mediante diferentes [transporters](https://moleculer.services/docs/0.12/transporters.html). Arrancamos.

### Instalación

De cara a facilitar el seguimiento del post, como siempre podéis encontrar todo el código del ejemplo en el repositorio [moleculer-microservices](https://github.com/pmagaz/moleculer-microservices) y que ya viene con todo lo necesario para desarollar tus Microsevicios usando [Moleculer](hhttps://moleculer.services/), [TypeScript](https://www.typescriptlang.org/), [Eslint](https://eslint.org/) y [dotenv](https://www.npmjs.com/package/dotenv) pero también puedes instalarlo desde 0.

```shell
$ yarn add moleculer moleculer-repl moleculer-web nats typescript ts-node @types/node nats
```

### Estructura del proyecto

Moleculer usa un sistema realmente simple y sencillo a la hora de organizar, levantar y gestionar nuestros microservicios. Tan solo es necesario que nuestros servicios se encuentren en una carpeta llamada services y Moleculer se encargará de localizarlos y ejecutarlos por lo que la estructura del proyecto es realmente simple, aunque lógicamente a medida que vayamos añadiendo más capas irá ganando en complejidad y será necesario añadir elementos adicionales.

### Hello World!

Vamos a escribir nuestro primer Microservicio y como no podía ser de otra forma vamos a hacer el clásico HelloWorld. Un Microservicio en Moleculer es denominado [service](https://moleculer.services/docs/0.12/service.html) y dispone de un [schema](https://moleculer.services/docs/0.12/service.html) que define las propiedades, como el nombre del servicio (helloWorld), acciones/métodos de dicho servicio, asi como los distintos eventos del ciclo de vida que tiene el servicio. Para nuestro hello world vamos a añadir un método en el objeto actions, que es el objeto donde se encuentran todos los métodos o funciones de los servicios. Nuestro action simplemente se llamará "sayHello" y devolverá el clásico "Hello World!"

```ts
import { ServiceSchema } from "moleculer";

const helloWorld: ServiceSchema = {
  name: "helloWorld",
  actions: {
    sayHello(): string {
      return "Hello World!";
    },

    async started(): Promise<void> {
      this.logger.info("HelloWorld microservice started!");
    },
  },
};

export = helloWorld;
```

Adicionalmente dentro del método started, evento del ciclo de vida que se ejecuta cuando se levanta el microservicio hemos usado el [logger](https://moleculer.services/docs/0.12/logger.html) de Moleculer y que nos permite utilizar las configuraciones habituales de los logger para mostrar la salida en la consola. Nuestro Microservicio Hello World ésta listo.

### API Gateway

Una pieza fundamental en los microservicios es el [API Gateway](https://microservices.io/patterns/apigateway.html). Podemos ver el API Gateway como el "router" que se encargará de redirigir las peticiones al microservicio correspondiente. Todas las peticiones pasan por el API Gateway que se encarga de hacer transparente para los consumidores la arquitectura que se encuentra por detrás, pues ésta, puede estar formada por muchos microservicios en distintos nodos, con distintas ips o en contenedores Docker, Kubernetes etc y sería muy confuso, complicado y poco adecuado exponer todo esto a los consumidores.

Moleculer dispone de API Gateway por defecto gracias a los [Mixins](hhttps://moleculer.services/docs/0.12/service.html#Mixins) que permiten reusar y extender lógica entre Microsercicios. Existe un mixing especial que entre otras cosas, nos permite transformar un servicio en nuestro API Gateway. En él definiremos mediante la propiedad settings, el puerto donde queremos levantar el API Gateway y el path del API Gateway, en nuestro caso /api, por lo que todos los microservicios serán accesibles desde [http://localhost:8000/api](http://localhost:8000/api). A partir de aquí simplemente definiremos una tabla de "alias" para cada Microservicio.

En el ejemplo anterior hemos creado un servicio llamado "helloWorld" y que tenía un método llamado "sayHello". Ahora, en el API Gateway vamos a definir un alias para acceder al método de dicho microservicio, por lo que el API Gateway se encargará de que las peticiones GET que lleguen a [http://localhost:8000/api/helloWorld](http://localhost:8000/api/helloWorld) ejecuten el método sayHello de nuestro microservio helloWorld.

```ts
import { ServiceSchema } from "moleculer";
import ApiGwService from "moleculer-web";

const ApiGateWayService: ServiceSchema = {
  name: "ApiGateway",
  mixins: [ApiGwService],
  settings: {
    port: process.env.APIGATEWAY_PORT || 8000,
    routes: [
      {
        path: "/api",
        aliases: {
          "GET /helloWorld": "helloWorld.sayHello",
        },
      },
    ],
    onError(req, res, err): void {
      if (err) {
        const { code, type } = err;
        this.logger.error(code, type);
      }
    },
  },
  async started(): Promise<void> {
    this.logger.info("ApiGateway started!");
  },
};

export = ApiGateWayService;
```

Con esto ya tendriamos todo lo necesario, un Microservicio con un método que devuelve el HelloWorld y el API Gataway que redirecciona a dicho método, por lo que cuando levantemos el servidor y accedamos a la url [http://localhost:8000/api/helloWorld](http://localhost:8000/api/helloWorld) veremos un bonito Hello World!.

### Pasando parámetros

El paso de parámetros es algo fundamental y con Moleculer el paso de parámetros vía GET, POST, etc es realmente sencillo gracias a [Context](https://moleculer.services/docs/0.12/context.html). Cada vez que un action (metodo de nuestro microservicio) es ejecutado, Moleculer pasa una instancia de Context con toda la informacion de la request a dicho action por lo que podemos acceder a él desde el primer argumento de la función. Ahora lo que queremos hacer es, mediante POST, pasar el nombre de la persona a la que queremos decir hello y para ello definimos un nuevo método llamado sayHelloTo que recibe el context (ctx) como primer argumento y a través del cual tenemos acceso a la propiedad params que recoge todos los parámetros de la request.

```ts
import { ServiceSchema, Context } from "moleculer";

const helloWorld: ServiceSchema = {
  name: "helloWorld",
  actions: {
    sayHello(): string {
      return "Hello World!";
    },

    sayHelloTo(ctx: Context): string {
      const { name } = ctx.params;
      return `Hello ${name}!`;
    },

    async started(): Promise<void> {
      this.logger.info("HelloWorld microservice started!");
    },
  },
};

export = helloWorld;
```

Lógicamente tenemos que habilitar el action en nuestro API Gateway y como podemos ver, podemos habilitar dicho método para GET y POST:

```ts
import { ServiceSchema } from "moleculer";
import ApiGwService from "moleculer-web";

const ApiGateWayService: ServiceSchema = {
  name: "ApiGateway",
  mixins: [ApiGwService],
  settings: {
    port: process.env.APIGATEWAY_PORT || 8000,
    routes: [
      {
        path: "/api",
        aliases: {
          "GET /helloWorld": "helloWorld.sayHello",
          "POST /sayHelloTo": "helloWorld.sayHelloTo",
          "GET /sayHelloTo/:name": "helloWorld.sayHelloTo",
          "GET /posts": "posts.getNumPosts",
        },
      },
    ],
    onError(req, res, err): void {
      if (err) {
        const { code, type } = err;
        this.logger.error(code, type);
      }
    },
  },
  async started(): Promise<void> {
    this.logger.info("ApiGateway started!");
  },
};

export = ApiGateWayService;
```

### Peticiones asíncronas.

Algo que será habitual es el consumo de otras APIS, Servicios o Bases de datos cuya respuesta será asíncrona. En Moleculer podemos utilizar async/await con total normalidad para indicar que actions van a devolver una respuesta asíncrona. Para ello vamos a crear un Microservicio llamado 'posts' con un action llamado "getNumPosts" y que devuelve el número de posts de este blog.

```ts
import { ServiceSchema } from "moleculer";
import fetch from "node-fetch";

const posts: ServiceSchema = {
  name: "posts",
  actions: {
    async getNumPosts(): Promise<number> {
      const res = await fetch("https://pablomagaz.com/api/posts");
      const json = await res.json();
      const { posts } = json;
      return posts.length;
    },
  },
  async started(): Promise {
    this.logger.info("Posts microservice started!");
  },
};

export = posts;
```

### Comunicando microservicios

Como hemos comentado al principio del post, la comunicación entre microservicios es fundamental en cualquier arquitectura orientada a microservicios. Moleculer dispone de un amplio catálogo de [transporters](https://moleculer.services/docs/0.12/transporters.html) que permiten la comunicación entre los distintos microservicios mediante distintos protocolos o sistemas de comunicación como [AMQP](https://moleculer.services/docs/0.12/transporters.html) y que utilizarían sistemas de mensajería como [RabbitMQ](https://www.rabbitmq.com/), [Apache Kafka](https://moleculer.services/docs/0.12/transporters.html#Kafka-Transporter) o incluso mediante [Redis](https://moleculer.services/docs/0.12/transporters.html#Redis-Transporter) que es un Key/Value en memoria, pero lo que nos interesa en este post es [Nats](https://docs.nats.io/nats-concepts/intro) que es un sistema open source de comunicación pub/sub distribuida, ligera y de alto rendimiento, perfecta para microservicios.

Aunque nosotros vamos a utilizar Nats, elegir un transporter u otro en Moleculer es realmente sencillo. Tan solo tenenemos que indicarlo en la configuración en nuestro fichero .env, con el resto de [configuracion](https://moleculer.services/docs/0.12/broker.html) y que luego pasaremos desde el script de arranque con --envfile path al .env.

```ts
NODE_ENV=development
APIGATEWAY_PORT=8000
HOTRELOAD=true
LOGGER=true
LOGLEVEL=info
TRANSPORTER_TYPE=NATS
TRANSPORTER_OPTIONS_URL=nats://localhost:422
```

En nuestro caso vamos a especificar NATS en TRANSPORTER_TYPE y vamos a especificar que Moleculer se encarge de levantar el servidor de NATS en el puerto 422.

Vamos a comunicar microservicios y vamos a suponer que en nuestro servicio helloWorld queremos recuperar también el número de posts que devuelve el Microservicio de posts que acabamos de crear. Para ello vamos a crear un método llamado sayHelloWithPosts que recibe el nombre del usuario por parámetro, pero adicionalmente llama de forma "interna" (mediante NATS) al microservicio de posts para recuperar el numero de posts, usando el método [call](https://moleculer.services/docs/0.12/broker#Call-services) del context, pasando el nombre del microservicio (posts) y el action que queremos ejecutar (getNumPosts).

```ts
import { ServiceSchema, Context } from "moleculer";

const helloWorld: ServiceSchema = {
  name: "helloWorld",
  actions: {
    sayHello(): string {
      return "Hello World!";
    },

    sayHelloTo(ctx: Context): string {
      const { name } = ctx.params;
      return `Hello ${name}!`;
    },

    async sayHelloWithPosts(ctx: Context): Promise<string> {
      const { name } = ctx.params;
      //LLamamos al action getNumPosts del microservicio posts mediante Nats
      const numPosts = await ctx.call("posts.getNumPosts");
      return `Hello ${name}!. There are ${numPosts} posts in this blog.`;
    },

    async started(): Promise<void> {
      this.logger.info("HelloWorld microservice started!");
    },
  },
};

export = helloWorld;
```

Una vez añadido el método sayHelloWithPosts al Api Gateway cuando llamemos a este método, para el consumidor será totalmente transparente lo que sucede detrás,él simplemente llama a un único método. Obviamente es un ejemplo muy sencillo pero pensemos en ejemplos un poco más elaborados que pueden implicar las llamadas a varias APIS o distintas consultas a bases de datos para mostrar un determinado dato. Para el consumidor todo esto es transparente.

Como hemos podido ver, Moleculer es un framework para microservicios realmente excepcional que trae por defecto todo lo necesario para escribir arquitecturas orientadas a microservicios como API Gateway, distintos tipos de transporters según nuestras necesidades, etc y lo hace además con una simplicidad de uso realmente interesante.

Como siempre, puedes encontrar el código del ejemplo en mi [github](https://github.com/pmagaz/moleculer-microservices).
