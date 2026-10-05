---
title: "Recoil, un nuevo state manager para React"
date: "2020-06-09"
updated: "2021-02-15"
slug: "recoil-nuevo-stage-manager-react"
author: "Pablo Magaz"
excerpt: "Cuando hablamos de state management es imposible no hablar de Redux, líder indiscutible en este área y aunque no son pocas las alternativas existentes, ninguna ha conseguido realmente hacer sombra a Redux. Recoil, el nuevo state manager de Facebook para React puede cambiar esa situación."
category: "technology"
keywords: ["React"]
archived: true
---

## Cuando hablamos de state management es imposible no hablar de Redux, líder indiscutible en este área y aunque no son pocas las alternativas existentes, ninguna ha conseguido realmente hacer sombra a Redux. Recoil, el nuevo state manager de Facebook para React puede cambiar esa situación.

En el mundo FrontEnd podemos situar varios puntos de inflexión que supusieron cambios importantes. El hoy defenestrado [jQuery](https://jquery.com/) supuso un salto importante por allá por 2004. La aparición de Frameworks y/o librerías como [Backbone](https://backbonejs.org/), [AngularJs](https://angularjs.org/) y posteriormente [React](https://es.reactjs.org/) fue otro, aunque se acabó yendo un poco de las manos tanto framework... La aparición del [stage management](https://en.wikipedia.org/wiki/Stage_management) aplicado al FrontEnd y muy especialmente la aparición de [Redux](https://es.redux.js.org/) fue otro. Las aplicaciones web de hoy día serían muy diferentes sin Redux.

Es importante destacar que Redux no "incorporó" el concepto de state management, ni el concepto de store o dispacher tan asociados a Redux. Todos esos conceptos fueron aportados por [Flux](https://github.com/facebook/flux), el paradigma "oficial" de Facebook para la construcción de aplicaciones con React basadas en el propio flujo unidireccional de React, y del que ya nadie se acuerda porque sencillamente fue totalmente eclipasado una evolución de sí mismo: Redux. El concepto de state management ha sido transveral al framework o librería y podemos encontrarlo en el mundo Angular con [@NgRxStore](https://ngrx.io/guide/store) o en el mundo Vue con [Vuex](https://vuex.vuejs.org/).

En el caso de React, ni Redux ni [Mobx](https://mobx.js.org/README.html), la otra opción a Redux, son "parte" de React, y creo que de algún modo Facebook siempre ha querido tener, al menos, una alternativa oficial (sin mucho éxito hasta ahora). La Context API del que hablamos ya hace algún tiempo en este mismo [post](https://pablomagaz.com/blog/old/react-context-api-el-fin-de-redux) pretendía serlo, sin embargo, su adopción ha sido prácticamente nula porque sencillamente no era una alternativa "realista" a todo lo que aporta Redux y su amplio ecosistema.

### Hola Recoil

Facebook retoma la iniciativa de disponer de una solución "oficial" para el state management en React y durante el reciente [React Europe](https://www.react-europe.org/) 2020 presentó [Recoil](https://recoiljs.org/). Recoil aun se encuentra en fase experimental y su API es susceptible de sufrir cambios, pero ya podemos comenzar a probarla.

¿Que es Recoil? Recoil, a diferencia de Context no es parte de la API de React ni tampoco es un compendio de patrones o formas de usar React, con algunos añadidos como lo era Flux. Recoil es una libería totalmente independiente de React y sigue el camino iniciado ya hace tiempo con los [hooks](https://pablomagaz.com/blog/old/react-hooks-gran-cambio-se-avecina) y las funciones de composición, ya que Recoil se basa por completo en ellos así que si estás acostumbrado a trabajar con hooks su uso y aprendizaje te será realmente sencillo, porque esa es sin lugar a dudas una de las características más destacables de Recoil: Su asombrosa simplicidad.

Aunque inicialmente era un poco escéptico a "otro" sistema de stage management (el margen para innovar es ya muy reducido) y sobre todo después del fiasco de Context... después de haber probado Recoil, creo que, ahora sí, Redux tendrá un **serio** contrincante delante. Vamos a ver porqué.

### Atoms

En Recoil todo gira entorno a un concepto muy sencillo: Los [atoms](https://recoiljs.org/docs/introduction/core-concepts#atoms) son unidades o partes de nuestro state y podemos ver los atoms como los nodos de nuestro típico state de Redux y lógicamente pueden ser objetos, arrays o cualquier otro tipo. Los atoms pueden ser usados en uno o mas componentes, compartiendo el mismo state en todos ellos y como veremos más adelante, reaccionando a sus cambios. Definir un atom es realmente sencillo, solo hay que indicar una key, y un valor por defecto, que sería como el estado inicial del atom.

```ts
import { atom } from "recoil";

const myState = atom({
  key: "name",
  default: "Peter",
});
```

Nuestros componentes se suscriben a uno o mas atoms, de la misma forma que lo haríamos en Redux y cuando el valor del atom cambia, el componente, se vuelve a renderizar. ¿Como nos subscribimos a un atom? Pues mediante el hook [useRecoilState()](https://recoiljs.org/docs/api-reference/core/useRecoilState) que recibe como argumento la instancia del atom al que queremos suscribirnos (en nuestro caso myState). Mediante este hook podremos recibir el dato actualizado del atom y también podremos modificarlo sin necesidad de reducers, actions o dispatchers:

```ts
import { useRecoilState } from "recoil";
import { myState } from "../state"; // Import the atom

export const MyComponent: React.FC = () => {
  // Pass the atom instance to useRecoilState
  const [name, setName] = useRecoilState(myState);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    let newName = e.target.value;
    setMyName(newName);
  };

  return (
    <div>
      <input type="text" onChange={onChange} />
      {name}
    </div>
  );
};
```

Como es lógico, todos los componentes que usen useRecoilState para suscribirse a "myState" se volverán a renderizar cuando alguno de ellos modifique su valor mediante setMyName. useRecoilState tiene algunas variaciones. Si no queremos modificar el valor del atom y solo queremos subscribirnos a sus posibles cambios, podemos utilizar [useRecoilValue](https://recoiljs.org/docs/api-reference/core/useRecoilValue) o [useSetRecoilState](https://recoiljs.org/docs/api-reference/core/useSetRecoilState) que no nos suscribe al atom pero nos permite modificarlo, ampliando las posibilidades de suscripción. ¿Sencillo verdad?

### Selectors

El otro destacable en Recoil son los [Selectors](https://recoiljs.org/docs/introduction/core-concepts#selectors). ¿Te acuerdas de [Reselect](https://github.com/reduxjs/reselect)? Reselect es una librería muy popular que permite generar valores computados que permiten reducir el tamaño de la información del store además de implementar mecanismos de memorización. Los selectors de Recoil funcionan de forma muy similar, reciben atoms como parámetros y devuelven valores computados mediante el método "get" a los que podremos acceder mediante su key:

```ts
import { selector, useRecoilValue } from "recoil";
import { myState } from "../state"; // Import the atom

export const myComputedState = selector({
  key: "upperCaseName",
  get: ({ get }) => {
    let name = get(myState);
    return name.toUpperCase();
  },
});

export const UpperCaseName: React.FC = () => {
  const upperName = useRecoilValue(myComputedState);
  return <div>UpperCase Name: {upperCaseName}</div>;
};
```

Pues estos son los conceptos básicos de Recoil. Realmente todo gira entorno a los atoms y los distintos hoooks que Recoil provee para subscribirse y modificar sus valores. Como vemos, nada de actions, nada de reducers, ni nada de dispatchers. Simple y sencillo.

### Probando Recoil

Vamos a probar Recoil con un ejeplo un poquito mas elaborado: El clásico Todo list en el que podemos añadir y borrar todo's de nuestra lista. Para ello vamos a usar Recoil y TypeScript y como siempre, puedes encontrar el código en mi [github](https://github.com/pmagaz/recoil-typescript). Vamos a tener 3 componentes: NewTodo que sera desde donde introduciremos nuevos todos en el state, TodoList que será la lista de todo's y NumTodos que será un tercer componente para contabilizar el numero de todos activos.

```ts
import React from "react";

import { NewTodo } from "./components/NewTodo";
import { TodoList } from "./components/TodoList";
import { NumTodos } from "./components/NumTodos";

const App = () => {
  return (
    <div>
      <NewTodo />
      <TodoList />
      <NumTodos />
    </div>
  );
};

export default App;
```

Todos los componentes van a tener acceso al state ya sea para introducir, leer o computar valores de él. Nuestro state es realmente simple ya que solo necesitamos un único atom y que será un Array donde ir metiéndo los todo's. Cada todo será un simple objeto con id, el nombre y si está completo o no:

```ts
import { atom } from "recoil";

export interface Todo {
  id: string;
  name: string;
  completed: boolean;
}

const initialState: Todo[] = [];

export const todosState = atom({
  key: "todos",
  default: initialState,
});
```

NewTodo es un pequeño formulario con un campo de texto y un botón de guardar y el handler que se encarga de insertar el nuevo todo en el atom. Como solo necesitamos escribir en el state [useSetRecoilState](https://recoiljs.org/docs/api-reference/core/useSetRecoilState) es el hook adecuado.

```ts
import React, { ChangeEvent, MouseEvent, useState } from "react";
import { useSetRecoilState } from "recoil";
import { todosState } from "../state";

export const NewTodo: React.FC = () => {
  const [todoName, setTodoName] = useState("");
  const setTodos = useSetRecoilState(todosState);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    let todoName = e.target.value;
    setTodoName(todoName);
  };

  const onSave = (e: MouseEvent<HTMLInputElement>): void => {
    setTodos((todoList) => [
      ...todoList,
      {
        //Random Autogenerated ID
        id: Math.random().toString(32).substr(2, 9),
        name: todoName,
        completed: false,
      },
    ]);
  };

  return (
    <div>
      <input type="text" onChange={onChange} />
      <input type="button" value="Add" onClick={onSave} />
    </div>
  );
};
```

Como vemos en el ejemplo estamos usando de forma simultánea el hook useState, con el state interno del componente y useSetRecoilState con el state global. Se integran a la perfección ¿verdad? Bien ahora que ya tenemos todo´s guardados en nuestro atom, podemos mostrarlos en el componente TodoList que será el encargado de mostrar la lista de todo´s con un checkbox que nos permite marcarlo como completo para que ya no salga en la lista. Como vamos a leer y modificar el atom, [useRecoilState](https://recoiljs.org/docs/api-reference/core/useRecoilState) es el hook adecuado.

```ts
import React, { ChangeEvent } from "react";
import { useRecoilState } from "recoil";
import { Todo, todosState } from "../state";

export const TodoList: React.FC = () => {
  const [todos, setTodo] = useRecoilState(todosState);

  const completeTodo = (e: ChangeEvent<HTMLInputElement>) => {
    let id = e.target.value;
    let index = todos.findIndex((todo) => todo.id == id);
    let todoList = [...todos];
    todoList[index] = {
      ...todoList[index],
      completed: !todoList[index].completed,
    };
    setTodo(todoList);
  };

  const todoList = todos
    .filter((todo) => !todo.completed)
    .map((todo) => (
      <li key={todo.id}>
        {todo.name}
        <input type="checkbox" value={todo.id} onChange={completeTodo} />
      </li>
    ));
  return <ul>{todoList} </ul>;
};
```

Es hora de probar los selectors para poder devolver valores computados, por lo que en el componente NumTodos podemos contabilizar los todo´s activos (completed: false) y devolver ese resultado. Como solo queremos leer el atom y no modificarlo, [useRecoilValue()](https://recoiljs.org/docs/api-reference/core/useRecoilValue) es el hook adecuado:

```ts
import React from "react";
import { selector, useRecoilValue } from "recoil";
import { todosState } from "../state";

export const numTodosState = selector({
  key: "numTodos",
  get: ({ get }) => {
    let todos = get(todosState);
    return todos.filter((todo) => !todo.completed).length;
  },
});

export const NumTodos: React.FC = () => {
  const numTodos = useRecoilValue(numTodosState);
  return <div>Active todos: {numTodos}</div>;
};
```

Para finalizar, un pequeño apunte. Para poder usar Recoil, nuestra app tiene que estar bajo [RecoilRoot](https://recoiljs.org/docs/api-reference/core/RecoilRoot) que es el wrapper que provee del contexto y acceso a los atoms:

```ts
import React from "react";
import ReactDOM from "react-dom";
import { RecoilRoot } from "recoil";

import App from "./App";

ReactDOM.render(
  <React.StrictMode>
    <RecoilRoot>
      <App />
    </RecoilRoot>
  </React.StrictMode>,
  document.getElementById("root")
);
```

### Conclusiones

Tengo que decir que Recoil me ha gustado mucho, sobre todo porque es, probablemente, una de las librerías de JS que más me han sorprendido en los últimos tiempos por lo simple, sencilla y fácil de aprender que es. Pero a pesar de esa simplicidad ofrece una potencia enorme y no hay ninguna funcionalidad que eche de menos en lo que a stage management se refiere, bueno quizás middleware pero recordemos que Recoil está en su versión 0.0.8 en el momento de escribirse este post y aún tiene mucho por delante. Al estar basada en los hooks que ya conocemos se integra a la perfección con nuestras aplicaciones actuales de React y aun siendo una libería independiente, el nivel de integración con React que se consigue es muy bueno, sensación que solo se tiene con Angular, que es un framework completo.

Recoil, además, presenta un ahorro muy importante en términos de boiler plate con respecto a Redux ya que aquí no hay reducers, action creators o dispatchers ni tenemos la necesidad de librerías adicionales como react-redux, reselect o similares para conectarlo todo. Veremos como avanza y que adopción tiene pero en algún momento tenía que salir una alternativa "de verdad" a Redux no?

"Less is more". [Código](https://github.com/pmagaz/recoil-typescript) del ejemplo.
