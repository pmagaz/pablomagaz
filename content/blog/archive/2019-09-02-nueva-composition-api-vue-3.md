---
title: "La nueva Composition API de Vue 3"
date: "2019-09-02"
updated: "2019-09-04"
slug: "nueva-composition-api-vue-3"
author: "Pablo Magaz"
excerpt: "Vue 3 aún se encuentra en desarrollo pero ya podemos empezar a probar algunas de sus novedades. Su nueva Composition API introduce importantes cambios en la forma en la que vamos a trabajar con Vue en el futuro, girando hacia un modelo más basado en el empleo de funciones de composición de lógica."
category: "technology"
keywords: ["Vue"]
archived: true
---

## Vue 3 aún se encuentra en desarrollo pero ya podemos empezar a probar algunas de sus novedades. Su nueva Composition API introduce importantes cambios en la forma en la que vamos a trabajar con Vue en el futuro, girando hacia un modelo más basado en el empleo de funciones de composición de lógica.

A menudo, en [El Blog Isomórfico](https://pablomagaz.com/blog/old/), hablamos de funcionalidades que aún se encuentran en fase beta, como los posts sobre el motor de rendering de Angular, [Ivy](https://pablomagaz.com/blog/old/ivy-nuevo-motor-render-angular) o los [Hooks](https://pablomagaz.com/blog/old/react-hooks-gran-cambio-se-avecina) de React y que en el momento de su publicación adelantaban cambios importantes. En esta ocasión vamos a hablar de Vue y su próxima versión 3, aún en desarrollo, pero que adelanta cambios muy importantes en la forma en la que se desarrollará con Vue.

En este post, vamos a explorar su nueva Composition API, que aún se encuentra en fase de [RFC](https://github.com/vuejs/rfcs/blob/function-apis/active-rfcs/0000-function-api.md) donde se está discutiendo con la comunidad de desarrolladores los pros y contras de esta nueva API que lógicamente puede sufrir cambios. Es curioso, pero en este post, dedicado a Vue, va a ser imposible no mencionar al que es su gran competidor, React, y el motivo de esto es que la nueva Composition API de Vue, aunque con algunas diferencias va a seguir un camino muy parecido al emprendido por [React](https://github.com/vuejs/rfcs/blob/function-apis/active-rfcs/0000-function-api.md#this-looks-like-react-why-dont-i-just-use-react) con sus recientes [Hooks](https://pablomagaz.com/blog/old/react-hooks-gran-cambio-se-avecina), donde se gira de un modelo más basado en la POO a un modelo más centrado en el empleo de funciones y en especial funciones de composición (luego veremos qué es extactamente). Y cuál es el motivo de este cambio? Pues el motivo es ni más ni menos que favorecer la reusabilidad de lógica entre componentes, algo que es mucho más sencillo con simples funciones.

### Clases y orientación a componentes

En el imaginario colectivo existe una especie de mantra, probablemente gracias a Java, de que las clases y la orientación a objetos son la panacea en términos de representación abstracta, organización de código, etc. Muy enterprise. Sin entrar a debatir que una clase inmensa con miles de getters y setters de organizado tiene poco y que la POO tiene carencias en términos de eficiencia, está empezando a demostrarse que en el desarrollo orientado a componentes, el empleo de clases tiene más [desventajas](https://github.com/vuejs/rfcs/blob/function-apis/active-rfcs/0000-function-api.md#the-class-api-is-much-better) que ventajas porque sencillamente éstas no ayudan a [reutilizar](https://vue-composition-api-rfc.netlify.com/#logic-reuse-code-organization) lógica entre componentes.

### La nueva Composition API

El equipo de Vue ha llegado a [conclusiones](https://github.com/vuejs/rfcs/blob/function-apis/active-rfcs/0000-function-api.md#logic-composition) muy parecidas a las que debió llegar el equipo de React cuando se ¨calzó¨ las clases. Cada librería lógicamente tiene sus matices y diferencias y quizás en Vue el cambio es algo menos drástico ya que los componentes van a seguir siendo bastante parecidos a como lo son actualmente y no pasan a ser funciones, pero se introduce el mismo concepto de [composición de lógica](https://github.com/vuejs/rfcs/blob/function-apis/active-rfcs/0000-function-api.md#logic-composition) mediante funciones que definen lógica dentro de ellas y que pueden ser reutilizadas entre componentes.

Como veremos a lo largo del post algunas de estas funciones ofrecen funcionalidad nueva, mientras que otras, son la equivalencia a funcionalidades ya existentes en Vue 2.x. Aunque la Composition API está aún en fase de RFC, el equipo de Vue ha publicado un [plugin](https://github.com/vuejs/composition-api) que permite probar esta Api con la versión actual de Vue (2.x) así que podemos ir calentando motores. Nota: Se han eliminado los tags `<script>` de los [SFC](https://vuejs.org/v2/guide/single-file-components.html) de ejemplo ya que evitan el highlight correcto del código.

### Setup

El primer cambio importante en esta Composition Api es el nuevo método [setup](https://github.com/vuejs/rfcs/blob/function-apis/active-rfcs/0000-function-api.md#the-setup-function), que cobra una gran importancia y pasa a ser el centro 'neurálgico' donde residirá toda la lógica del componente y que se ejecutará cuando se cree la instancia de dicho componente, recibiendo como primer parámetro las props y como segundo context:

```js
export default {
  props: {
    count: Number,
  },
  setup(props, context) {
    console.log(props.count);
    ...
  },
};
```

Setup funciona de la misma forma que el actual [data()](https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function), devolviendo un objeto con las propiedades que serán usadas en el template:

```jsx
<template>
  <div>{{ totalCount }}</div>
</template>;

export default {
  props: {
    count: Number,
  },
  setup(props) {
    // devolvemos la propiedad totalCount
    return {
      totalCount: `Total Count: ${props.count}!`,
    };
  },
};
```

Desde la función setup podremos tener acceso a todos los eventos de [ciclo de vida](https://vuejs.org/v2/api/#Options-Lifecycle-Hooks) de un componente como hacemos normalmente con la única diferencia de que cada evento pasa a llevar el prefijo ['on'](https://vue-composition-api-rfc.netlify.com/#lifecycle-hooks) antes de su nombre:

```js
import { onMounted, onUpdated, onUnmounted } from "@vue/composition-api";

export default {
  setup() {
    onMounted(() => {
      console.log("Component mounted!");
    });
    onUpdated(() => {
      console.log("Component updated!");
    });
    onUnmounted(() => {
      console.log("Component unmounted!");
    });
  },
};
```

### Ref

Otra de las novedades es [ref()](https://vue-composition-api-rfc.netlify.com/#computed-state-and-refs), una función de composición para el manejo de valores y que actúa como wrapper de valores **reactivos**. Ref devuelve un objeto con la propiedad .value y que nos permite mutar el valor pasado a dicha función usando dicha propiedad. Es importante entender que los [tipos primitivos](https://vue-composition-api-rfc.netlify.com/#computed-state-and-refs) en Js son pasados por valor y no por referencia por lo tanto con ref podemos crear una "referencia mutable" de valor único:

```jsx
<template>
  <div @click="increment">{{ count }}</div>
</template>

import { ref } from '@vue/composition-api';

export default {
  setup() {
    // count es un valor reactivo
    const count = ref(0);
    const increment = () => {
      //incrementamos el valor de count mediante la propiedad value
      count.value = count++;
    };
    // count sera devuelto al template
    return { count, increment };
  }
};
```

### Reactive

Reactive funciona de forma similar a ref con la diferencia de que los valores reactivos no son 'wrappeados', por lo que podremos acceder al valor directamente sin el wrapper de ref(). Realmente es el equivalente de [Vue.observable](https://vuejs.org/v2/api/index.html#Vue-observable) de la actual versión 2.x:

```js
import { reactive } from "@vue/composition-api";

const state = reactive({
  count: 0,
});

state.count++;
```

### Computed

El equivalente a las [computed properties](https://vuejs.org/v2/guide/computed.html) de la versión 2.x también está presente en esta nueva y renovada API. Como su nombre indica, [computed()](https://github.com/vuejs/rfcs/blob/function-apis/active-rfcs/0000-function-api.md#computed-values) nos permite componer propiedades computadas que han podido ser definidas mediante un value o cualquier otro valor:

```jsx
<template>
  <div>{{ square }}</div>
</template>;

import { ref, computed } from "@vue/composition-api";

export default {
  setup() {
    const num = ref(0);
    const square = computed(() => num.value * 2);
    return { square };
  },
};
```

### Watch

Con [watch](https://github.com/vuejs/rfcs/blob/function-apis/active-rfcs/0000-function-api.md#watchers) podemos observar cambios en las propiedades de un componente y ejecutar side effects como llamadas asíncronas, etc en base a estos cambios. Funcionan de forma muy similar a los [watchers](https://it.vuejs.org/v2/guide/computed.html#Watchers) de la versión 2.x pero amplían un poco su funcionamiento. Como primer argumento recibimos el 'source' pudiendo ser éste, un getter, un wrapper devuelto por ref() / computed() o un array con ambos elementos. Como segundo argumento, seguimos teniendo un callback con el nuevo y viejo valor, que se ejecutará después del render y en el que podremos ejecutar los side effect:

```js
import { ref, watch } from "@vue/composition-api";

export default {
  props: {
    userId: Number,
  },
  setup(props) {
    const userData = ref(null);
    // source
    watch(
      () => props.userId,
      async (userId) => {
        // side effect
        userData.value = await fetchUserData(userId);
      }
    );
  },
};
```

Cabe destacar que el comportamiento del callback puede ser [configurado](https://github.com/vuejs/rfcs/blob/function-apis/active-rfcs/0000-function-api.md#watcher-callback-timing) para determinar en que momento se ejecuta: Después del render (comportamiento por defecto), antes de este o de forma síncrona.

### Probando la nueva API.

Despues de haber visto los principales cambios que llegarán en la nueva Composition API de Vue 3 vamos a [probarlo](https://github.com/pmagaz/vue-composition-api) todo junto usando el plugin [@vue/composition-api](https://github.com/vuejs/composition-api) en un ejemplo más de mundo real y cuyo [código](https://github.com/pmagaz/vue-composition-api) puedes encontrar en [github](https://github.com/pmagaz/vue-composition-api).

Imaginemos que queremos realizar la llamada a una API para, por ejemplo, recuperar los posts de un blog. También queremos mostrar un mensaje de carga mientras la petición se realiza. Para todo ello, vamos a usar ref, watch y computed:

```jsx
<template>
  <div>
    <div v-if="loading">
      Loading....
    </div>
    <div v-else>
      <div>Count: {{ count }}</div>
      <div>Posts:</div>
      <ul  id="v-for-object">
        <li v-for="post in posts" :key="post.id">
          {{ post.title }}
        </li>
      </ul>
    </div>
  </div>
</template>

import { ref, watch, computed } from '@vue/composition-api';

export default {

setup(props) {
    const posts = ref([]);
    const loading = ref(true);
    const count = computed(() => posts.value.length);
    watch(
      () => count,
      async () => {
        const res = await fetch('https://pablomagaz.com/api/posts');
        const data = await res.json();
        posts.value = data.posts;
        loading.value = false;
      });

    return { count, posts, loading };

  }
};
```

Dentro de la función setup hemos definido dos values, uno para el array de posts y otro como booleano para determinar cuando ha finalizado la carga (loading). Adicionalmente estamos usando computed para obtener el número total de posts. La función watch nos permite observar esta computed property (source) y en su callback realizamos la llamada al servicio y el seteo de la respuesta mediante posts.value.

Sin embargo, nuestro ejemplo no está fino del todo. Una de las grandes ventajas de las funciones de composición es que permiten reusar lógica a lo largo de diversos componentes, sin embargo en nuestro ejemplo poco vamos a poder reusar ya que todo es encuentra dentro del propio componente. Una aproximación más acertada sería aislar toda la lógica de recuperación de los posts en una función que siguiendo un poco la nomenclatura de los hooks de React vamos a llamar useGetPosts:

```js
import { ref, watch, computed } from "@vue/composition-api";

export const useGetPosts = () => {
  const posts = ref([]);
  const loading = ref(true);
  const count = computed(() => posts.value.length);
  watch(
    () => count,
    async () => {
      const res = await fetch("https://pablomagaz.com/api/posts");
      const data = await res.json();
      posts.value = data.posts;
      loading.value = false;
    }
  );

  return { count, posts, loading };
};
```

Ahora podemos usar nuestra función de composición useGetPosts en cualquier componente, pudiendo reutilizar su lógica.

```jsx
<template>
  <div>
    <div v-if="loading">
      Loading....
    </div>
    <div v-else>
      <div>Count: {{ count }}</div>
      <div>Posts:</div>
      <ul  id="v-for-object">
        <li v-for="post in posts" :key="post.id">
          {{ post.title }}
        </li>
      </ul>
    </div>
  </div>
</template>

import { useGetPosts } from './useGetPosts';

export default {
  setup() {
    const { count, posts, loading } = useGetPosts();
    return { count, posts, loading };
    //o directamente return { ...useGetPosts() };
  }
};
```

No existe mucha diferencia entre el empleo de ref o de reactive, de hecho la version del mismo ejemplo usando reactive es practicamente igual, con la única salvedad de que con reactive se devuelve el state completo en lugar de cada una de las propiedades creadas con ref:

```jsx
import { reactive, watch, computed } from '@vue/composition-api';

export const useGetPostsReactive = () => {
  const state = reactive({
    posts: [],
    loading: true,
  })
  const count = computed(() => state.posts.length);
  watch(
    () => count,
    async () => {
      const res = await fetch('https://pablomagaz.com/api/posts');
      const data = await res.json();
      state.posts = data.posts;
      state.loading = false;
    });

    return state;
  };

  ....

<template>
  <div>
    <div v-if="state.loading">
      Loading....
    </div>
    <div v-else>
      <div>Count: {{ count }}</div>
      <div>Posts:</div>
      <ul  id="v-for-object">
        <li v-for="post in state.posts" :key="post.id">
          {{ post.title }}
        </li>
      </ul>
    </div>
  </div>
</template>

import { useGetPostsReactive } from '../compositions/useGetPostsReactive';

export default {
  setup() {
    const state = useGetPostsReactive();
    return { state };
  }
};
```

Como conclusión final, no ha lugar a dudas de que esta Composition API está fuertemente influenciada por los Hooks de React, algo que el equipo de Vue tampoco [esconde](https://github.com/vuejs/rfcs/blob/function-apis/active-rfcs/0000-function-api.md#this-looks-like-react-why-dont-i-just-use-react) pues al final Vue y React son dos librerías con muchos más parecidos que diferencias y parece bastante obvio que ambos equipos han llegado a conclusiones bastantes parecidas y es que en un entorno orientado a componentes, las clases y la orientación a objetos no acaban de ayudar del todo a la hora de reutilizar lógica, por lo que me alegro enormemente que Vue siga por ese camino.

Como hemos visto en los ejemplos, es una API fácil, sencilla y como casi todo en Vue, simple. Por cierto, cabe destacar de que esta API no va a suponer ningún breaking change por lo que no será un [Angular 2](https://github.com/vuejs/rfcs/blob/function-apis/active-rfcs/0000-function-api.md#is-this-like-python-3--angular-2--do-i-have-to-rewrite-all-my-code) aunque si optaste por el empleo de [class components](https://github.com/vuejs/vue-class-component) en tus proyectos quizás se te esté arqueando una ceja... ;)

Como siempre puedes encontrar todo el código del ejemplo en mi [github](https://github.com/pmagaz/vue-composition-api).
