---
title: "React Context API ¿El fin de Redux?"
date: "2018-04-03"
updated: "2018-05-09"
slug: "react-context-api-el-fin-de-redux"
author: "Pablo Magaz"
excerpt: "React 16.3 ya está aquí, y con el uno de los grandes cambios, Context API. Aunque no es solo el único sí que es un cambio lo suficientemente transcendental como para dedicarle un post entero. ¿Por qué? Porque puede hacer innecesario el empleo de Redux para la gestión del estado de nuestra aplicación."
category: "technology"
keywords: ["React", "Redux"]
archived: true
---

## React 16.3 ya está aquí, y con el uno de los grandes cambios: Context API. Aunque no es solo el único sí que es un cambio lo suficientemente transcendental como para dedicarle un post entero. ¿Por qué? Porque puede hacer innecesario el empleo de Redux para la gestión del estado de nuestra aplicación.

Las novedades de React 16.3 vienen sin ningún breaking change, de hecho, este [blog](https://github.com/pmagaz/pablomagaz.com) ya se encuentra actualizado. En este post vamos a centrarnos en la novedad más destacable de React 16.3: Context API, que realmente no es una novedad en si mismo ya que, ya estaba siendo utilizada por paquetes como [react-redux](https://github.com/reactjs/react-redux) en modo experimental, pero en React 16.3 pasa a ser estable y este hecho puede hacer que Redux y otro tipo de librerías para la gestión del estado puedan no ser tan necesarias como hasta ahora...

A lo largo de este post, vamos a realizar un ejemplo sencillo, tratando de acercarnos a una gestión de estado de aplicación, únicamente con Context API así que, antes de nada, vamos a ver los elementos que nos trae Context API:

### CreateContext

Create Context es el nuevo método que está accesible en el paquete 'react'. Es una simple función que al ejecutarla nos devuelve un objeto del que vamos a poder extraer varios elementos fundamentales en la nueva context API, el Provider y el Consumer:

```js
import React, { createContext } from 'react'

const AplicationContext = createContext({ data... }) // Creamos el contexto
const { Provider, Consumer } = AplicationContext // Obtenemos el provider y el consumer
```

### Provider

Tal y como indica su nombre, es el encargado de proveer el mecanismo de paso de los valores a los componentes hijos en la jerarquía mediante la propiedad value. Si estamos intentando emular Redux, sin usar Redux, está claro que vamos a necesitar un store, que al final es un simple objeto y un initial state como valor inicial del store:

```js
import React, { Component, createContext } from "react";

const { Provider, Consumer } = createContext();
const initialState = { count: 0 }; // definimos un estado inicial

class App extends Component {
  render() {
    return (
      <Provider value={initialState}>
        {" "}
        // Se lo pasamos al provider ...
      </Provider>
    );
  }
}
```

### Consumer

El consumer, es el consumidor del context provisto por el Provider. Para poder acceder a los datos del context desde cualquier componente, necesitamos "wrappear" nuestra jerarquía de componentes con el consumer:

```js
import React, { Component, createContext } from "react";
const { Provider, Consumer } = createContext();
const initialState = { count: 0 };

export const MyComponent = (props) => (
  <Consumer>
    {(context) => {
      // context = { count: 0 }
      return <div>Count: {context.count}</div>;
    }}
  </Consumer>
);

class App extends Component {
  render() {
    return (
      <Provider value={initialState}>
        <MyComponent />
      </Provider>
    );
  }
}
```

Al ejecutar todo esto podremos ver en pantalla: "count: 0". Sin embargo, no estamos obligados a utilizar el provider, ya que esté es una pieza "opcional", no así el consumer. Si obviamos el provider, podemos pasar los valores de nuestro "initialState" directamente al crear el contexto, obteniendo el mismo resultado:

```js
import React, { Component, createContext } from "react";

const { Consumer } = createContext({ count: 0 }); // pasamos los valores por defecto directamente a createContext

export const MyComponent = (props) => (
  <Consumer>
    {(context) => {
      return (
        <div>Count: {context.count} // Accedemos al contexto sin provider</div>
      );
    }}
  </Consumer>
);

class App extends Component {
  render() {
    // Sin provider, solo nuestro componente "wrapeado" como consumer
    return <MyComponent />;
  }
}
```

### Consumer Wrapper

Es buena idea disponer de un Wrapper que envuelva nuestros componentes con el consumer, especialmente en el caso de los containers ya que tradicionalmente en Redux, los componentes que tienen acceso a la instancia del store son los containers (salvo excepciones), y son éstos los que pasan los valores del store a los componentes hijos. Aquí vamos a hacer lo mismo, vamos a crear un wrapper que nos dé acceso al context para ese componente de "primer nivel" o container:

```js
import React, { Component, createContext } from "react";

const { Consumer } = createContext({ count: 0 });

// Envuelve nuestros componentes con el consumer, ideal para containers
export const createConsumer = (MyComponent) => (props) =>
  <Consumer>{(context) => <MyComponent {...context} />}</Consumer>;

// Componente hijo que recibirá el state a través de las props
const ChildComponent = (props) => <div>Count: {props.count}</div>;

// Nuestro componente Container
const ContainerComponent = (context) => (
  <MyChildComponent {...context} /> // Paso de los datos del context a los componentes hijos
);

//Creamos el container
const MyContainer = createConsumer(ContainerComponent);

class App extends Component {
  render() {
    return <MyContainer />;
  }
}
```

### Reemplazando Redux

Nuestro ejemplo por ahora es bastante sencillo y limitado, está muy lejos de poder ser un reemplazo de Redux y además comienza a hacer daño a los ojos tanto componente en el mismo fichero ¿verdad?. Necesitamos añadir ciertos elementos fundamentales como un mecanismo de actualización del store, una suerte de reducers, así que vamos a tener que profundizar un poquito más para disponer de la funcionalidad que nos ofrece Redux. Para ello he creado un [ejemplo](https://github.com/pmagaz/react-context-api-example), algo más elaborado y que trata precisamente de cubrir esa funcionalidad que nos da Redux. Vamos a ver paso por paso cada uno de los elementos:

#### createActions.js

Como hemos dicho, necesitamos un mecanismo de actualización del store. Aquí vamos a definir acciones que tienen acceso al state de nuestra aplicación y que, ya que no tenemos Redux, será el state "interno" de nuestro componente App. El mecanismo de actualización será, por tanto, el método setState:

```js
export const createActions = (store) => ({
  increment: (num) => store.setState({ count: store.state.count + num }), // Acción de incremento
  decrement: (num) => store.setState({ count: store.state.count - num }), // Acción de decremento
});
```

#### createStore.js

Funciona de una forma parecida al createStore de Redux, con la única diferencia que devuelve el state del componente APP y las acciones devueltas por createActions en un mismo objeto (por simplificación)

```js
import { createActions } from "./createActions";

export const createStore = (state) => {
  const actions = createActions(state);
  return { ...state, actions };
};
```

#### createConsumer.js

Es el encargado de generar tanto el Provider como el Consumer mediante createContext. Actúa como wrapper envolviendo cualquier componente con el consumer, por lo que es ideal para la creación de containers que necesitan acceso al store consumido por el consumer:

```js
import React, { createContext } from "react";
const { Provider, Consumer } = createContext();

const createConsumer = (Component) => () =>
  (
    <Consumer>
      {(context) => <Component {...context} />} // Consumer wrapper
    </Consumer>
  );

export { Provider, createConsumer };
```

#### MyContainer.jsx

El container generado por createConsumer y que propaga los valores del store y las acciones de cambio a sus hijos (en este caso ChildComponent) por medio de sus props.

```js
import React from "react";
import { createConsumer } from "./createConsumer";
import ChildComponent from "./ChildComponent";

const ContainerComponent = (context) => <ChildComponent {...context} />;

const MyContainer = createConsumer(ContainerComponent);

export default MyContainer;
```

#### ChildComponent.jsx

El componente hijo que recibe por props el store y las acciones que realizan cambios en el mismo, con esto nos aseguramos que cualquier componente de la jerarquía pueda modificar el state:

```js
import React from "react";

const ChildComponent = (props) => {
  return (
    <div>
      <button onClick={() => props.actions.increment(1)}>increment</button>
      <button onClick={() => props.actions.decrement(1)}>decrement</button>
      count: {props.state.count}
    </div>
  );
};

export default ChildComponent;
```

#### App.js

Es el archivo básico de nuestra aplicación y en él se define el initialState y se pasa el store creado con el state de la App y sus acciones al provider devuelto por createContext:

```js
import { createStore } from "./createStore";
import { Provider } from "./createConsumer";
import MyContainer from "./MyContainer";

class App extends Component {
  state = { count: 0 }; // initialState
  render() {
    return (
      <Provider value={createStore(this)}>
        <MyContainer />
      </Provider>
    );
  }
}

export default App;
```

Pues esto es todo en nuestro ejemplo reemplazando Redux con Context API y que logicamente no debería ser usado en producción. Todo el código está disponible en [github](https://github.com/pmagaz/react-context-api-example)

### Conclusiones

Bueno, está claro que Context API nos provee de mecanismos muy interesantes y extremadamente potentes, no hay duda. Con este ejemplo sencillo hemos podido cubrir la mayor parte (si no toda) de la funcionalidad que nos ofrece Redux pero al hacerlo podemos estar reescribiendo la rueda, es decir, quitar Redux para volver a escribir por nosotros mismos la funcinalidad de Redux.

Creo que aún es pronto para evaluar las diversificaciones que puede tener esta nueva API, ya que falta por examinar factores como performance, curva de aprendizaje o productividad. Yo, como fanboy de Redux que soy, (este [blog](https://github.com/pmagaz/pablomagaz.com) está totalmente basado en Redux) no me atrevo a ser tan tajante como aquellos que ya dictaminan un [RIP](https://react-etc.net/entry/rip-redux-dan-abramov-announces-future-fetcher) para Redux. En proyectos de tamaño medio o incluso más "enterprise", Redux hace de "standard" desde hace un par de años, incluso en entornos Angular con @[ngrxStore](https://github.com/ngrx/store) En estos escenaros la implantación de una solución solo Context API va a requerir de algo de ingenio y tiempo efectivo invertido. En aplicaciones de poco tamaño, probablemente Context API sea una mejor solución.
