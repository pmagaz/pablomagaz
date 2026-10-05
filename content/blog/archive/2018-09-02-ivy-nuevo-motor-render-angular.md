---
title: "Ivy, el nuevo motor de render de Angular"
date: "2018-09-02"
updated: "2020-01-03"
slug: "ivy-nuevo-motor-render-angular"
author: "Pablo Magaz"
excerpt: "Ivy, es el nombre del nuevo motor de renderizado que está preparando Google. Aún en fase beta, Ivy ofrece novedades muy interesantes que mejorarán de forma notable el sistema actual de renderizado de las vistas, la velocidad de compilación y sobre todo, el tamaño de los builds en Angular."
category: "technology"
keywords: ["Angular"]
archived: true
---

## Ivy, es el nombre del nuevo motor de renderizado que está preparando Google. Aún en fase beta, Ivy ofrece novedades muy interesantes que mejorarán de forma notable el sistema actual de renderizado de las vistas, la velocidad de compilación y sobre todo, el tamaño de los builds en Angular.

Aún recuerdo los tiempos de las primeras betas de Angular 2, donde un hola mundo ocupaba casi 2 M y el first render era inaceptablemente lento, tanto que Google tuvo que ponerse las pilas y nos trajo el famoso [AOT](https://angular.io/guide/aot-compiler) (Ahead of time compilation) que si bien fue un acierto y supuso tanto una reducción en el tamaño de los builds, como una mejora en el tiempo de renderizado de las vistas, también trajo consigo algunas limitaciones y conflictos con el código JIT (Just in Time).

Ivy no solo es el nuevo sistema de renderizado de Angular que ha sido presentado en la última [NgConf 2018](https://www.ng-conf.org/), si no que también es un nuevo compilador que genera código más óptimo, eficiente y sobre todo, menos pesado, Tanto es así que según las primeras pruebas realizadas con Ivy un ¨Hola mundo¨ en Angular, ocupa tan solo 3.5KB (gziped) como podemos ver en el bundle.js de esta [demo](https://ng-ivy-demo.firebaseapp.com/) creada con Ivy, lo cual es una cifra sorprendente no solo para Angular, sino también para otras librerías, pues recordemos que Angular es un framework completo.

Ivy se encuentra aún en fase [beta](https://is-angular-ivy-ready.firebaseapp.com/#/status) y de hecho en el momento de escribir este post se encuentra a un [60% de su desarrollo](https://is-angular-ivy-ready.firebaseapp.com/#/status), pero aún queda algo de tiempo hasta que lo veamos en una RC. Lo bueno, es que Google ya ha indicado que no traerá [breaking changes](https://github.com/angular/angular/blob/master/packages/compiler/design/architecture.md), lo cual es una excelente noticia.

### Renderer2

Para entender las mejoras que introduce Ivy tenemos que entender cómo funciona el motor de renderización actual, Renderer2, introducido en Angular4 para transformar nuestro template en nodos del DOM siguiendo los siguientes pasos:

#### TEMPLATE HTML -> TEMPLATE DATA -> ANGULAR INTERPRETER -> DOM

El template declarado (Template HTML) en transformado junto a las variables contenidas, (template data) en código JS que es pasado al interpreter en runtime, para procesar y generar el correspondiente abrol DOM. Para poder llevar a cabo estas operaciones Renderer2 realiza un análisis de código estático y genera un fichero metadata.json con las instrucciones de compilación que transformará nuestro template en un código similar a este:

```jsx
// Template
<div>
  Hola!
</div>

//GENERATED CODE
viewDef([
  elementDef(0, 'div', ...);
  textDef('Hola!');
]);
```

#### Renderizado con Ivy

Ivy, por el contrario, cuenta con un sistema de renderizado más optimizado que reduce el número de pasos y elimina la necesidad de crear el archivo metadata.json:

#### TEMPLATE HTML -> TEMPLATE INSTRUCTIONS -> DOM

Este sistema permite la generación de instrucciones que permiten crear y manipular el DOM y sobre todo, generar un código más optimizado, rápido y lo mas importante de todo, más amigable con el Tree Shaking.

```jsx
// Template
<div>Hola!</div>;

//GENERATED CODE
elementStart(0, "div");
text(1, "Hola!");
elementEnd();
```

Como vemos en el código generado, el nuevo motor de Angular genera un código que recuerda mucho a [Incremental Dom](http://google.github.io/incremental-dom/) de Google. El concepto de Incremental DOM es diferente al archiconocido [Virtual Dom](https://reactjs.org/docs/faq-internals.html), donde todos los cálculos se realizan en una representación del DOM en código Js y luego son aplicados al HTML. En Incremental DOM, no se crea ese DOM alternativo o virtual ya que los cambios son aplicados al nodo HTML directamente y de forma incremental lo que reduce el consumo de memoria de forma notable.

Ivy no tiene Incremental DOM como dependencia, pero si implementa una versión propia basada en el concepto de Incremental Dom, empleando instrucciones (elementStart, txt, etc) para la interacción con el DOM y que son fundamentales para que el Tree Shaking funcione de forma correcta.

#### Entendiendo el Tree Shaking

Ivy ha sido reescrito teniendo presente en todo momento la importancia del Tree Shaking, que es el proceso que determina que partes del código son utilizadas y cuáles no, para ser incluidas o eliminadas del build de nuestra aplicación. El elevado tamaño de las aplicaciones Angular, al menos en las primeras versiones, tiene mucho que ver con esto, pero vamos a entender cómo funciona el proceso de Tree Shaking:

```js
import { myFunc } from "myModule";

const load = (x) => {
  if (x) {
    return myFunc();
  }
}; //myFunc será cargado en el bundle aunque myFunc nunca sea llamada

load(false); // false
```

En este ejemplo, sencillo, estamos importando una simple función, myFunc, y esta función, solo se ejecuta si una condición x es cierta. A pesar de que en nuestro código estamos indicando que la condición siempre será falsa y por tanto, nunca se utilizará myFunc, el código de dicha función será incluido en bundle de todas formas. Este es el mismo problema que nos encontramos en el motor de Angular. Volvamos atrás, al código generado por el motor actual de Angular, Renderer2:

```ts
// Código generado por Renderer2...
viewDef([
  elementDef(0, 'div', ...);
  textDef('Hola!');
]);

//En otro lugar, en el motor de Angular algo parecido a esto...
function createViewNode(view: ViewDef){
  view.nodes.forEach(node => {
      if(hasTextDef) text(node); // text será incluido en el build aunque no se cumpla la condición
      if(hasListeners) listeners(node); //  listeners será incluido en el build aunque no se cumpla la condición
      ...
      ...
  }
};
```

El nuevo motor de renderizado, Ivy, evita precisamente esto, ya que el sistema de instrucciones que hemos visto está pensado para generar funciones más pequeñas, atómicas y que hace que el código de Angular no cuente con referencias a funciones o elementos que no vayan a ser usados, siendo mucho más amigable con el Tree Shaking.

```js
//SOLO se incluirán las funciones aquí definidas y ninguna que no se vaya a usar!
elementStart(0, "div"); // se incluirá en el build elementStart
text(1, "Hola!"); // se incluirá en el build text
elementEnd(); // se incluirá en el build elementEnd
```

### El nuevo compilador

Ivy no es solo un nuevo sistema de render, Ivy es también un nuevo compilador que genera un código mucho más óptimo y que ofrece tiempos de compilación y rendering más reducidos. El nuevo compilador cuenta con dos nuevos entry points:

#### NGTSC

Es el transpilador habitual de Typescript pero en Ivy funciona de forma diferente ya que como iremos viendo a lo largo del post, reduce el número de pasos y genera un código más eficiente, rápido y ligero. Para entender mejor como funciona vamos a utilizar un simple componente con un @Input:

```ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-root',
  template: '
  Hello, {{ name }}!
',
})
export class AppComponent {
  title = 'angular-ivy-preview';
  @Input() name: string;

}
```

En versiones previas a Ivy, es decir, en la versión actual de Angular el código que se generara será bastante parecido a esto:

```js
let AppComponent = class AppComponent {
    constructor() {
      this.title = 'angular-ivy-preview';
    }
};
__decorate([
    Object(_angular_core_module0_["Input"])(),
    __metadata("design:type", String)
], AppComponent.prototype, "name", void 0);
AppComponent = __decorate([
    Object(_angular_core_module0__["Component"])({
        selector: 'app-root',
        template: '
  Hello, {{ name }}!
',
    })
], AppComponent);
```

Como podemos observar los decoradores son transpilados a funciones que serán ejecutadas en runtime (en JIT) y el template y sus variables aún se encuentran en "en bruto" para ser pasados al interpreter para el parseo del template y la transformación de los decoradores. Sin embargo, el código generado por Ivy es diferente:

```js
import { Component, Input } from "@angular/core";
import * as i0 from "@angular/core";
export class AppComponent {
  constructor() {
    this.title = "angular-ivy-preview";
  }
}
AppComponent.propDecorators = {
  name: [{ type: Input }], // El decorador input ahora es una simple propiedad
};
AppComponent.ngComponentDef = i0.ɵdefineComponent({
  type: AppComponent,
  selectors: [["app-root"]],
  factory: function AppComponent_Factory() {
    // Factoría que devuelve una nueva instancia del componente
    return new AppComponent();
  },
  inputs: { name: "name" },
  template: function AppComponent_Template(rf, ctx) {
    if (rf & 1) {
      i0.ɵE(0, "div"); // Instrucciones para generar el dom (elementStart)
      i0.ɵT(1); // Instrucciones para generar el dom (text)
      i0.ɵe();
    }
    if (rf & 2) {
      i0.ɵt(1, i0.ɵi1(" Hello, ", ctx.name, "! "));
    }
  },
});
//# sourceMappingURL=app.component.js.map
```

El nuevo compilador de Ivy genera la definición del componente mediante propiedades estáticas que ya han sido resueltas por Typescript y que son añadidas a la clase del propio componente, lo cual es bastante más eficiente que el sistema previo. También vemos que el template pasa a ser una función que contiene las instrucciones del propio template (elementStart, text, etc) pero renombradas a ɵE, ɵT, etc lo cual además reducirá el tamaño del build.

#### NGCC

Ngcc es el acrónimo de Ng Compatibility Compiler, que nos da una pista de su utilidad. Ngcc se encargará de convertir cualquier tipo de paquete externo proveniente de node_modules en paquetes compatibles con Ivy, es decir, transpilados al mismo formato generado por Ngtsc . Para ello, Ngcc generará su propia versión de node_modules, llamada ¨ngcc_node_modules¨, asegurando la retrocompatibilidad hacia atrás de cualquier librería. Una muy buena noticia sin lugar a dudas.

### Probando Ivy

Las APIS de Ivy vienen incluidas en Angular 6, aunque se encuentran en una fase experimental, no obstante, es posible comenzar a probar Ivy. En este [repositorio](https://github.com/pmagaz/angular-ivy-preview) puedes encontrar todo el [código](https://github.com/pmagaz/angular-ivy-preview) de ejemplo pero como vamos a ver en los siguientes pasos, es muy sencillo comenzar a utilizar Ivy:

#### 1 Configurar Tsconfig.app.json

Activar Ivy es bastante fácil, basta con añadir la propiedad enableIvy, configurar el directorio de salida y cambiar el target a es2016 ya que puede darnos alguna incompatibilidad con es2015:

```json
//Tsconfig.app.json
...
"angularCompilerOptions": {
    "enableIvy": true
},
"compilerOptions": {
  "outDir": "../my-out-dir/app",
  "target": "es2016"
  ...
}
```

#### 2 Eliminar browser module

Ya no es necesaria la importación de BrowserModule para el boostrap de nuestra aplicación, por lo que nuestro app module quedaría parecido a este:

```ts
//app.module.ts
import { NgModule } from "@angular/core";

import { AppComponent } from "./app.component";

@NgModule({
  declarations: [AppComponent],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

#### 4 NGC

Solo nos queda añadir ngc a nuestro package.json para compilar nuestro tsconfig.app.json:

```json
//package.json
...
"scripts": {
  "ngc": "ngc -p src/tsconfig.app.json"
  ...
}
```

Y por último ya solo resta compilar usando la tarea ngc que acabamos de añadir a nuestro package.json:

```shell
$ yarn ngc
$ ngc -p src/tsconfig.app.json
    Done in 6.60s.
```

Con esto ya podremos ver el código generado en el directorio que hayamos indicado en outDir de compilerOptions en nuestro Tsconfig.app.json.

### Conclusiones

Ivy tiene buena pinta, tiene muy buena pinta sobre todo porque Google da en la diana a la hora de mejorar y solventar aquellas áreas donde Angular podía necesitar algunas mejoras. Habrá que esperar a las pruebas de rendimiento para ver como rinde Ivy, ya que recordemos aún está en una fase beta bastante temprana pero el resultado parece muy prometedor.

[Código del ejemplo](https://github.com/pmagaz/angular-ivy-preview)
