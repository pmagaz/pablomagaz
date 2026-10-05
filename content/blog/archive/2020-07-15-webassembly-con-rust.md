---
title: "WebAssembly con Rust"
date: "2020-07-15"
updated: "2020-09-22"
slug: "webassembly-con-rust"
author: "Pablo Magaz"
excerpt: "WebAssembly ya es oficialmente el cuarto lenguaje de la Web y su uso y adopción está cada vez mas extendido. Rust, lenguaje de muy creciente popularidad, nos ofrece un amplio ecosistema para escribir WebAssembly e integrarlo con nuestras aplicaciones JavaScript de forma rápida y sencilla."
category: "technology"
keywords: ["WebAssembly", "Rust"]
archived: true
---

## WebAssembly ya es oficialmente el cuarto lenguaje de la Web y su uso y adopción está cada vez mas extendido. Rust, lenguaje de muy creciente popularidad, nos ofrece un amplio ecosistema para escribir WebAssembly e integrarlo con nuestras aplicaciones JavaScript de forma rápida y sencilla.

En posts anteriores hemos hecho una [introducción](https://pablomagaz.com/blog/old/empezando-con-webassembly) a WebAssembly, que se ha convertido de forma oficial en el [cuarto lenguaje](https://www.w3.org/2019/12/pressrelease-wasm-rec.html.en) de la Web (junto a HTML, CSS y JavaScript). WebAssembly tiene una dualidad interesante que no tienen el resto de lenguajes de la Web, ya que es, por una parte, un lenguaje [en sí mismo](https://webassembly.github.io/spec/core/text/index.html) conocido como WAT (WebAssembly Text Format), pero es también un [target de compilación ](https://pablomagaz.com/blog/old/empezando-con-webassembly) por lo que podemos compilar WebAssembly desde otros lenguajes más "amigables" como C/C++, Go y lógicamente Rust que es el que nos interesa.

Rust es probablemente el lenguaje en el que mayor penetración ha tenido WebAssembly y esto se debe a que la comunidad de Rust es muy amplia, activa y dinámica y aquí la mano de Mozilla, creadora de Rust, se nota. Mozilla ha estado y está muy presente en la definición de la Web y es importante recordar que Mozilla es la heredera de la desparecida [Netscape](https://es.wikipedia.org/wiki/Netscape_Communications_Corporation) que fue donde en 1995 se creo [JavaScript](https://es.wikipedia.org/wiki/JavaScript), por lo que a pesar de las distancias, que las hay y muchas, JavaScript y Rust son hijos del mismo padre/madre.

En el post [Rust para JavaScripters](https://pablomagaz.com/blog/old/rust-para-javascripters) vimos los fundamentos de Rust y lógicamente para poder escribir WebAssembly con Rust es más que necesario tener unos mínimos conocimientos en Rust por lo que se recomienda su lectura para entender mucho mejor los ejemplos de este post que podrás encontrar en mi [github](https://github.com/pmagaz/webassembly-rust).

### Un amplio ecosistema

Una de las razones por la que elegir Rust para trabajar con WebAssembly es por su amplio [escosistema](https://rustwasm.github.io/) de paquetes o [crates](https://crates.io/) como se denominan en Rust y que dan soporte a la mayoría de las APIS de la Web como el DOM, WebGL, WebAudio y a una total integración con JavaScript permitiendo una comunicación totalmente **bi-direccional** entre Rust y JavaScript, pudiendo pasar valores, funciones, etc de JavaScript a Rust y de Rust a JavaScript.

Un detalle muy importante a tener en cuenta y que suele sorprender a la gente que se inicia en WebAssembly es que WebAssembly [no tiene acceso](https://developer.mozilla.org/en-US/docs/WebAssembly/Concepts#) a ninguna de las APIS Web mencionadas como el DOM, Canvas, WebGL, etc. Alguno dirá, "pero he visto demos muy chulas de WebAssembly que modificaban el DOM o renderizaban WebGL". Sí, pero no. Técnicamente la única vía de comunicación exterior que tiene WebAssembly es el intercabio de tipos primitivos con JavaScript, que en última instancia será el encargado de llamar a las distintas APIS Web y devolver los resultados a WebAssembly. Esto puede [cambiar](https://github.com/WebAssembly/interface-types/blob/master/proposals/interface-types/Explainer.md) en el futuro cercano pero por ahora JavaScript es el único camino.

Esta característica hace que tareas relativamente sencillas, como acceder a un simple objeto global como window, puedan suponer un importante trabajo adicional de integración y comunicación entre ambas capas si abordamos WebAssembly de forma "nativa", pero el amplio ecosistema de librerías WebAssembly para Rust nos va a facilitar enormemente la vida, permitiéndonos interactuar desde Rust con todas las APIS Web de forma fácil y sencilla como vamos a ver a lo largo del post. Echemos un vistazo a las librerías más destacables.

#### Wasm-bindgen

[Wasm-bingen](https://rustwasm.github.io/docs/wasm-bindgen/) es el crate básico y fundamental y nos permite interacciones entre Rust/WebAssembly y JavaScript, simplificando enormemente la comunicación entre ambas capas permitiéndonos importar/exportar funciones y valores entre Rust y JavaScript y viceversa como veremos en los ejemplos.

#### Web-sys

[Web-sys](https://rustwasm.github.io/wasm-bindgen/web-sys/index.html) nos permite acceder a las APIS Web más importantes como elDOM, Canvas, WebGl, Console, etc y su uso será necesario siempre que queramos interactuar con estas APIS.

#### Js-sys

[Js-sys](https://rustwasm.github.io/wasm-bindgen/api/js_sys/) el crate con el que podremos tener desde Rust, accceso a todos los objetos [globales](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects) de JavaScript como Object, Date, Array, etc.

#### Wasm-pack

[Wasm-pack](https://rustwasm.github.io/docs/wasm-pack/) es un conjunto de herramientas que nos permiten desde compilar nuestro código Rust a WebAssembly hasta publicar directamente en NPM nuestros módulos de WebAssembly escritos en Rust.

### Rust en nuestro entorno JavaScript.

Rust esta más integrado en tu entorno JavaScript habitual de lo que seguramente puedas pensar por lo que una vez [instalado](https://www.rust-lang.org/tools/install) Rust ya podríamos **importar directamente** código Rust en nuestro código JavaScript en la mayoría de las herramientas de building de JavaScript actuales. Si utilizas Parcel, del que ya hablamos en un [post](https://pablomagaz.com/blog/old/empaquetando-aplicaciones-con-parcel), no tendrás que hacer absolutamente nada ya que Parcel trae [soporte para Rust](https://parceljs.org/rust.html) por defecto y Parcel se encargará de compilar a WebAssembly nuestro codigo Rust. Si utilizas Webpack puedes usar el loader [rust-native-wasm-loader](https://github.com/dflemstr/rust-native-wasm-loader).

Evidentemente también puedes usar el command line y herramientas como [Wasm-Pack](https://rustwasm.github.io/wasm-pack/installer/) y compilar e importar por tu cuenta el módulo wasm resultante pero de cara a facilitar el aprendizaje y el alto nivel de integración con el entorno JavaScript actual, te recomiendo el empleo de Parcel y de este [starter](https://github.com/rustwasm/rust-parcel-template) (uno de muchos) en el que ya viene todo listo.

### Lo básico

La naturaleza de WebAssembly lo hace ideal para delegar cálculos pesados en él y para ello lógicamente es necesario poder pasar valores de JavaScript a Rust/WebAssembly y viceversa. Imaginemos que una simple función de multiplicación es una función realmente pesada que requiere un notable esfuerzo computacional. Delegando estas tareas en WebAssembly nuestra aplicación se puede beneficiar de un incremento muy notable en el performane. Gracias al ecosistema de Rust, tareas como estas y otras son realmente simples y sencillas, lo primero va a ser crear esa función de multiplicación "pesada" en Rust:

```rust
//../crate/src/multiply.rs';
#[wasm_bindgen]
// Multiple recibe dos enteros (usize)
pub fn multiply(a: usize, b: usize) -> usize {
    a * b
}
```

Seguramente te haya llamado la atención "#[wasm_bindgen]". Esto es una [macro](https://doc.rust-lang.org/1.7.0/book/macros.html/) de Rust y son notaciones que se pueden añadir a las funciones o los Structs para dotarlas de funcionalidad extra. En este caso, la macro de wasm_bindgen sirve para exponer esta función como módulo exportado de WebAssembly por lo que ahora ya podemos usar esa función de multiplicación en JavaScript como una función normal y corriente pero que será ejecutada en WebAssembly.

```js
// index.js
import { multiply } from "../crate/src/multiply.rs";

// Pasamos los dos enteros que queremos multiplicar
let result = multiply(10, 10);
console.log(result);
// OUTPUT: 100
```

Como puedes oberservar es realmente sencillo comunicar Rust/WebAssembly con nuestra aplicación JavaScript gracias a las características únicas de Rust y el amplio ecosistema para WebAssembly.

### Pasando valores de Rust a JavaScript

De la misma forma que podemos pasar valores de JavaScript a Rust, podemos hacer la inversa, pasar valores de Rust a JavaScript. Vamos a suponer que tenemos un Struct en Rust, que es el equivalente a los objetos en JavaScript y que implementa 2 métodos:

```rust
//../crate/src/rust_struct.rs';
#[wasm_bindgen]
pub struct RustStruct {
    id: i32,
}

#[wasm_bindgen]
impl RustStruct {
    //Esta macro nos permite usar el metodo new como constructor en JavaScript para hacer un new RustStruct
    #[wasm_bindgen(constructor)]
    pub fn new(val: i32) -> Self {
        Self { id: val }
    }

    pub fn get_id(&self) -> i32 {
        self.id
    }
}
```

En Rust, aunque existe POO muy inteligentemente no existen las clases y el concepto de constructor es diferente a JavaScript ya que realmente es un método estático sin más, pero wasm_bidgen transformará este Struct en una clase de JavaScript que vamos a poder instanciar y utilizar como si una clase normal y corriente (con su construcor real) se tratara:

```js
// index.js
import { RustStruct } from "../crate/src/rust_struct.rs";

const rustStruct = new RustStruct(12345);
const id = rustStruct.get_id();
console.log(id);
// OUTPUT: 12345!
```

### Accediendo al DOM

El acceso al DOM desde Rust es bastante sencillo y sobre todo familiar, ya que web_sys nos provee de una API muy extensa para realizar casi cualquier tipo de operación sobre el DOM manteniendo practicamente la misma nomenclatura a la que estamos acostumbrados (aunque en [Snake case](https://en.wikipedia.org/wiki/Snake_case)). Acceder a Window, Document, crear elementos HTMl o incluso dar estilos es realmente sencillo. Vamos a crear un div en el Dom desde Rust e insertar en dicho div un string que sera pasado desde JavaScript:

```rust
// ../crate/src/hello_dom.rs';
//Importamos websys para acceder al DOM
use web_sys::window;

#[wasm_bindgen]
pub fn hello_dom(value: &str) -> Result<(), JsValue> {
  let window = window().expect("Window not found!");
  let document = window.document().expect("Document not found!");
  let body = document.body().expect("Body not found!");
  let div = document.create_element("div")?;
  div.set_inner_html(value);
  body.append_child(&div)?;
  Ok(())
}
```

Ahora desde nuestro codigo JavaScript le pasamos el valor que queremos insertar en el div que creamos desde Rust:

```js
// index.js
import { hello_dom } from "../crate/src/hello_dom.rs";

hello_dom("Hello DOM!");
```

### Pintando en Canvas

Como hemos comentado, un escenario donde WebAssembly resulta muy idóneo es como capa de cálculos pesados como por ejemplo la lógica de un videojuego que podemos pintar en Canvas. Esto se puede afrontar desde diversas maneras sobre todo teniendo en cuenta la memoria linear de WebAssembly, pero Rust y wasm_bindgen simplifican enormemente las cosas por lo que interactuar directamente sobre Canvas con Rust es muy sencillo. Vamos a pintar un simple cuadrado que rellenaremos de un color:

```rust
//../crate/src/draw_canvas.rs
use web_sys::window;

#[wasm_bindgen]
pub fn draw_canvas() {
  //Accedemos a Document
  let document = web_sys::window().unwrap().document().unwrap();
  //Obtenemos la instancia del Canvas
  let canvas = document.get_element_by_id("canvas").unwrap();
  let canvas: web_sys::HtmlCanvasElement = canvas
    .dyn_into::<web_sys::HtmlCanvasElement>()
    .map_err(|_| ())
    .unwrap();

  //Otenemos el contexto, en este caso 2D
  let context = canvas
    .get_context("2d")
    .unwrap()
    .unwrap()
    .dyn_into::<web_sys::CanvasRenderingContext2d>()
    .unwrap();

  //Comienza una nueva ruta
  context.begin_path();

  //Elegiemos el color del cuadrado
  context.set_fill_style(&"rgb(130,150,30)".into());

  //Rellenamos un cuadrado de 100 x 100
  context.fill_rect(0.0, 0.0, 100.0, 100.0);

  context.stroke();
}
```

Ahora desde JavaScript ya podríamos llamar a la función draw_canvas() y como podemos ver, en general todas las APIS web mantienen los mismos nombres que en su versión nativa, con la salvedad de que en Rust los métodos siempre se suelen escribir en snake case, pero los nombres son, en la mayoría de los casos, los mismos.

### Asincronía

Quizás no lo sepas pero en Rust también existe [async/await](https://rust-lang.github.io/async-book/01_getting_started/04_async_await_primer.html) y lógicamente también existe una entidad similar a las promesas pero que en Rust son llamados "[Futures](https://docs.rs/futures/0.3.5/futures/)" pero que en esencia funcionan de la misma forma que las promesas, lo que permite una muy buena integración entre ambos lenguajes a la hora de realizar operaciones asíncronas como llamadas a servicios. Vamos a ilustrarlo con un ejemplo donde vamos a a llamar a la [API de posts](https://pablomagaz.com/api/posts) de este blog, vamos a serializar los datos devueltos por la API a Structs (objetos de Rust) para poder hacer cálculos pesados usando entidades nátivas de Rust y vamos a devolver una promesa con los objetos serializados de JavaScript:

```rust
//crate para serializar / deserializar
use serde::{Deserialize, Serialize};
// JsCast permite devolver objetos JavaScript desde Rust
use wasm_bindgen::JsCast;
//JsFuture transforma un Future de Rust en una Promesa
use wasm_bindgen_futures::JsFuture;
// Dependencias de websys
use web_sys::{window, Request, RequestInit, RequestMode, Response};

//Struct para el Post
#[derive(Debug, Serialize, Deserialize)]
pub struct Post {
  pub id: String,
  pub title: String,
}
//Array de posts
#[derive(Debug, Serialize, Deserialize)]
pub struct Posts {
  pub posts: Vec<Post>,
}

#[wasm_bindgen]
// Funci&oacute;n async, igual que en JS que devuelve un JsValue (valor JavaScript)
pub async fn load_posts() -> Result<JsValue, JsValue> {
  let mut opts = RequestInit::new();
  opts.method("GET");
  opts.mode(RequestMode::Cors);

  //Preparamos la request
  let request = Request::new_with_str_and_init("https://pablomagaz.com/api/posts", &opts)?;

  let window = web_sys::window().unwrap();
  //Ejecutamos la request eseperando recibir un Future / promesa
  //El .await es el equivcalente
  let resp_value = JsFuture::from(window.fetch_with_request(&request)).await?;
  let resp: Response = resp_value.dyn_into().unwrap();
  //Pasamos la respuesta a json
  let json = JsFuture::from(resp.json()?).await?;
  //Serializamos el Json a structs de Rust (Posts) esto nos permitiria
  //manejar los datos como structs nativos de Rust.
  let posts: Posts = json.into_serde().unwrap();
  //... calculos pesados
  //Pasamos nuestro struct de Posts a objetos JavaScript
  Ok(JsValue::from_serde(&posts).unwrap())
}
```

Ahora desde nuestro código JavaScript ya podemos llamar al método load_posts() dentro de nuestra función async, ya que realmente devuelve una promesa (JsFuture). JsValue nos permite serializar esa respuesta y devolver los objetos nátivos de Js.

Como hemos visto a lo largo de los distintos ejemplos, Rust ofrece no solo una total integración con todas las APIS Web que nos ahorrará un montón de trabajo cuando programemos WebAssembly si no que, además, se integra a la perfección con JavaScript gracias a conceptos compartidos por ambos lenguajes como async/await, promesas/futuros, etc y sobre todo a un toolchain que ya permite integrar Rust en nuestras aplicaciones JavaScript de forma fácil y sencilla. En próximos posts nos adentraremos en ejemplos más complejos. Stay tunned!.

Como siempre puedes encontrar el código de los ejemplos en mi [github](https://github.com/pmagaz/webassembly-rust).
