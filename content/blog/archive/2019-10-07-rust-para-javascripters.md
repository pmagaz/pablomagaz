---
title: "Rust para JavaScripters"
date: "2019-10-07"
updated: "2020-02-25"
slug: "rust-para-javascripters"
author: "Pablo Magaz"
excerpt: "Rust es un lenguaje de sistema eficiente, seguro y ultra-rápido que en los últimos tiempos ha ganado mucha popularidad gracias a WebAssembly."
category: "technology"
keywords: ["Rust"]
archived: true
---

## Rust es un lenguaje de sistema eficiente y ultra-rápido. Diseñado por Mozilla, con el foco puesto en la seguridad y la concurrencia, es un lenguaje que en los últimos tiempos ha ganado mucha popularidad en el terreno Web gracias a WebAssembly. En este post acercamos Rust a los JavaScripters.

Este es un post muy especial en El Blog Isomomórfico. No solo se cumplen ya [dos años](https://pablomagaz.com/blog/old/estrenando-blog) de vida de este blog, sino que, además, este va a ser el primer post en el que vamos a hablar sobre un lenguaje de programación que no es JavaScript y que no es otro que [Rust](https://www.rust-lang.org/). ¿Y esto a que se debe? En el post publicado recientemente [Empezando con WebAssembly](https://pablomagaz.com/blog/old/empezando-con-webassembly) hablábamos sobre que es WebAssembly y de como podemos compilar WebAssembly desde distintos lenguajes de programación, siendo Rust uno de ellos. A lo largo de una nueva serie de posts dedicados a [WebAssembly](https://pablomagaz.com/tag/webassembly) vamos a profundizar en las capacidades de WebAssembly y en especial en WebAssembly con Rust,

### ¿Qué es Rust?

Rust es un lenguaje de programación creado por [Mozilla](https://www.mozilla.org). Técnicamente es un lenguaje de sistema, es decir, Rust estaría en la misma categoría que lenguajes como C o C++, y de hecho comparte con ellos parte de su syntaxis. Rust es un lenguaje fuertemente [tipado,](https://doc.rust-lang.org/book/ch03-02-data-types.html) ultrarápido, con un performance similar al de C/C++, pero si hay algo sobre lo que Rust destaca es sin lugar a dudas su **seguridad**. Por su propia naturaleza en Rust los [null pointers](https://en.wikipedia.org/wiki/Null_pointer), [dangling references](https://www.quora.com/What-is-dangling-reference) o [data races](https://es.wikipedia.org/wiki/Condici%C3%B3n_de_carrera) sencillamente no pueden existir. Al final del post veremos porqué.

### ¿Por qué aprender Rust?

Con Rust es posible escribir cualquier cosa, pues es un lenguaje de bajo nivel que permite escribir desde [videojuegos](http://arewegameyet.com/), [APIS](http://ironframework.io/) o cualquier otra cosa. Además, gracias a una comunidad muy amplia y en continuo crecimiento, ha demostrado ser el lenguaje más avanzando en el entorno WebAssembly, con un gran número de recursos disponibles que facilitan enormemente el desarrollo con WebAssembly y su integración con [JavaScript](https://github.com/rustwasm/wasm-bindgen).

Rust va a ser un actor a tener en cuenta en los próximos años de la Web, de hecho, aunque en este post vamos a utilizar [PlayRust](https://play.rust-lang.org), que es un editor online para facilitar los ejemplos, herramientas como Parcel, del que ya hablamos en un [post](https://pablomagaz.com/blog/old/empaquetando-aplicaciones-con-parcel) permiten ya [importar](https://parceljs.org/rust.html) directamente archivos Rust como parte de nuestra aplicación JavaScript. El objetivo de este post es hacer una introducción a Rust, enfocada a un público JavaScripter y que servirá de base en próximos posts sobre WebAssembly. Al final de cada ejemplo encontrarás el link a PlayRust que te permitirá ejecutar y modificar el código del ejemplo. Arrancamos.

### Hello world!

Como todos los lenguajes de programación, Rust dispone de funciones y un hello world en Rust no tiene nada de especial. Todas las funciones se declaran con prefijo fn y todo programa Rust debe contar al menos con una función llamada main. [Println](https://doc.rust-lang.org/rust-by-example/hello/print.html) es la función standard para imprimir valores:

```rust
fn main(){
    println!("Hello world!");
}
```

[PlayRust](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=fa3192accbb9483bc096f96e0c514f86).

### Variables

En Rust no existen los valores nulos y las variables son definidas con let. Mientras que en JavaScript podemos modificar sin más el valor de un let, tenemos que tener en cuenta que en Rust por defecto todo es [inmutable](https://nasciiboy.land/book4all/rust-2nd/ch03-01-variables-and-mutability.html), por lo que no vamos a tener que lidiar con los habituales problemas de mutabilidad ni tampoco tendría sentido un "ImmutableRs". Si queremos modificar una variable tenemos que especificarlo añdiendo el prefijo "mut" antes del nombre de la variable:

```rust
fn main(){
    //Podemos definir una variable sin asignar valor pero....
    let var;
    // ERROR no podemos a acceder a ella porque en Rust no hay valores nulos
    println!("Var value is {}", var);

    let var2 = 5;
    //ERROR no podemos modificar una variable que NO es mutable
    var2 = 2;

    // Si añadimos el prefijo mut la variable se vuelve mutable
    let mut mutable_var = 5;
    mutable_var = 10;
    println!("New value of mutable_var is {}", mutable_var);
}
```

[PlayRust](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=fad6ba525ced86d389fd846a378d5944).

### Tipos, tipos, tipos

Rust es un lenguaje fuertemente tipado, aunque tiene inferencia de tipos, por lo que en Rust podemos encontrar todos los [tipos](https://doc.rust-lang.org/book/ch03-02-data-types.html) tradicionales existentes en la mayoría de lenguajes tipados: Vectores, Strings, enteros, decimales, etc:

```rust
fn main() {
    // Un vector (mutable)
    let mut vec = Vec::new();
    vec.push(1);
    // vec! es una macro, un shorthand para inicializar vectores
    let vec2 = vec![1, 2, 3];
    // String
    let my_string = String::from("Hello");
    // Enteros
    let my_number: usize = 123;
    // Enteros con números negativos
    let my_number: isize = -123;
    // Decimal de
    let float_number: f32 = 500.50;
}
```

[PlayRust](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=8f0eb3e5c6e35934e0f4c7ee67f0b0f7).

### Funciones

El tipado hace que tengamos que definir el tipo de los argumentos de una función usando : tipo y -> tipo para el retorno de la función. En Rust, al igual que en JavaScript, el punto y coma se utiliza para definir el final de cada sentencia pero cuando, por ejemplo, en una función no se finaliza una sentencia con un punto y coma, esto equivale a un return de dicho valor, lo cual evita tener que escribir un montón de returns y puntos y comas, dejando una sintaxis muy limpia y parecida a las de las arrow function:

```rust
//x es un entero de 8 bits
fn square(x: i8) -> i8 { // square devuelve un entero de 8 bits
    x * 2 // al no poner ; es igual que "return x * 2";
}

fn main(){
    let number: i8 = 5;
    let square = square(number);
    // Se usan {} para imprimir distintas variables en la salida
    println!("Square of {} is {}", number, square);
}
```

[PlayRust](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=7af7ca51adc03f2e5380980443dd28cc).

### Bucles

Rust dispone de los clásicos bucles como [for](https://doc.rust-lang.org/1.1.0/book/for-loops.html) o [while](https://doc.rust-lang.org/1.1.0/book/while-loops.html), pero en Rust, los iteradores (que veremos un poco mas adelante) juegan un rol muy importante por lo que es habitual usar bucles que iteran iterables como el bucle [for in expression](https://doc.rust-lang.org/1.1.0/book/for-loops.html), donde expression es un iterador. Este bucle sería equivalente al bucle [for of ](https://developer.mozilla.org/es/docs/Web/JavaScript/Referencia/Sentencias/for...of) de JavaScript:

```rust
fn main(){
    let my_vector = vec![1,2,3,4,5];
    for item in my_vector {
        println!("{}", item);
    }
    //OUTPUT 1,2,3,4,5
}
```

[PlayRust](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=1409fb2eb385664a086a4813c4dbde47).

### Structs

Rust es un lenguaje polifacético que dispone de [orientación a objetos](https://doc.rust-lang.org/book/ch17-00-oop.html), pero Rust huye de las clases, que no existen en Rust (¡bien!) y la habitual parafernalia de la POO al menos en su sentido mas tradicional. Rust dispone de [Structs](https://doc.rust-lang.org/1.9.0/book/structs.html) que son estructuras de datos equivalentes a los objetos en JavaScript. Se definen mediante el parámetro "struct" y se definen los campos del Struct con sus respectivos tipos, para posteriormente instanciar el propio struct:

```rust
//Definición del struct
struct Rectangle {
    width: i32,
    height: i32
}

fn main(){
    // Instanciamos un struct Rectangle
    let rectangle = Rectangle{width: 100, height: 200};
    // Accedemos a sus propiedades mediante .
    println!("Width is {}", rectangle.width);
    //OUTPUT Width is 100
}
```

[PlayRust](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=c06d5549ce3d59b06784ec761641daf1).

Los Structs, al igual que los objetos de JavaScript pueden tener métodos que permiten acceder a las propiedades del objeto mediante a una referencia al propio objeto que en Rust no es this, sino **self**. La forma en de implemenar los métodos de un Struct es mediante el bloque impl Struct:

```rust
struct Rectangle {
    width: i32,
    height: i32
}
// Implementación de Rectangle
impl Rectangle {
    // Definimos el método get_area
    fn get_area(&self) -> i32{
        // se accede a las propiedades del struct mediante self
        self.width * self.height
    }
}

fn main(){
    let rectangle = Rectangle{width: 100, height: 200};
    // Accedemos a sus propiedades mediante .
    println!("Rectangle area is {}", rectangle.get_area());
    //OUTPUT Rectangle area is 20000
}
```

[PlayRust](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=d3890403cad8d24e40fa848e4561e776).

### Tipos Genéricos

Al igual que sucede en Typescript en Rust disponemos de tipos [genéricos](https://doc.rust-lang.org/1.7.0/book/generics.html) que pueden ser aplicados a Structs, funciones, etc y que siguen la nomenclatura T. Además Rust también dispone de los útiles [Enums](https://doc.rust-lang.org/1.29.0/rust-by-example/custom_types/enum.html). En los ejemplos previos hemos definido un Struct con valores que podían ser enteros y enteros negativos, pero qué sucede si queremos que nuestro Struct pueda albergar tanto enteros positivos como enteros con valores también negativos, que en Rust son tipos distintos (usize & isize): Genéricos al rescate:

```rust
enum Shape {
    Rectangle,
    Square,
}
//El Struct usa el tipo genérico T
struct Quadrilateral<T> {
    width: T,
    height: T,
    shape: Shape,
}

fn main(){
    // Instanciamos un struct Quadrilateral que tiene un valor generico
    // T en width / height
    let rectangle_one = Quadrilateral{width: 200, height: 200, shape: Shape::Rectangle};
    let rectangle_two = Quadrilateral{width: -100, height: -200, shape: Shape::Square };
}
```

[PlayRust](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=2c910ab4d23dc2cccca8ea45a770e280).

### Iteradores

Los [iteradores](https://doc.rust-lang.org/book/ch13-02-iterators.html) son ampliamente utilizados en Rust y funcionan exactamente de la misma forma que los [iteradores](https://developer.mozilla.org/es/docs/Web/JavaScript/Guide/Iterators_and_Generators) en JavaScript aunque en Rust no existen los generadores como tal. Los iteradores nos permiten iterar una estructura de datos mediante el método next() pero también pueden ser iterados mediante un bucle for como vimos al principio.

```rust
fn main(){
    //vec! es una macro, un shorthand para iniciar vectores con inferencia del tipo
    let my_vector = vec![1, 2, 3];
    // convertimos el vector en un iterador
    let mut my_iterator = my_vector.iter();
    //Con el metodo next obtenemos el siguiente valor
    println!("First value in iterator is {:?}", my_iterator.next());
    //OUPUT First value in iterator is Some(1)

    //También podemos iterar el iterador con un bucle for in
    for value in my_iterator {
        println!("Value: {}", value);
            //OUPUT Value: 2, Value: 3
    }
}
```

[PlayRust](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=e760c0207e913af4e5f4c3a1ab771e7b).

### Programación Funcional

Rust es, como JavaScript, un lenguaje funcional impuro, es decir, no es un lenguaje puramente funcional como [Haskell](https://www.haskell.org/), pero si dispone de características [funcionales](https://doc.rust-lang.org/book/ch13-00-functional-features.html), como los iteradores que hemos visto en el ejemplo anterior, las closures, el empleo de funciones puras, funciones de orden superior y un catálogo realmente amplio de funciones como filter, map, flatmap, reduce (que en Rust se llama fold), etc. Supongamos que queremos saber cuantas personas varones mayores de edad hay en un Vector:

```rust
#[derive(PartialEq)]
enum Gender {
    Male,
    Female,
}

#[derive(PartialEq)]
struct Person {
    age: usize,
    gender: Gender,
}

fn main(){
    let people = vec![
        Person { age: 16, gender: Gender::Male },
        Person { age: 34, gender: Gender::Female},
        Person { age: 40, gender: Gender::Male },
    ];

    let  adult_males : usize = people
        // into_iter convierte el vector en un iterable
        .into_iter()
        // filter funciona de la misma forma que filter en Js
        .filter(|p| p.gender == Gender::Male && p.age > 18)
        // count contabiliza el numero de elementos
        .count();

    println!("Number of adult males {:?}", adult_males);
    //OUPUT Number of adult males 1
}
```

[PlayRust](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=3fad1bdad318c8f9efa2ec85c3777c73).

En el ejemplo hemos visto el uso de [#[derive]](https://doc.rust-lang.org/rust-by-example/trait/derive.html) que es la forma en la que podemos implementar [traits](https://doc.rust-lang.org/rust-by-example/generics/gen_trait.html) que son elementos que tienen ciertas similitudes con las interfaces y que permiten implementar funcionalidad asociada a tipos.

### Crates y módulos

En Rust podemos importar paquetes o como son denominados en Rust, [crates](https://doc.rust-lang.org/book/ch07-01-packages-and-crates.html) que a su vez están formados por módulos que pueden ser importados y/o exportados de forma similar a los módulos de ECMAScript 6. Estos módulos pueden a su vez importar/exportar otros módulos, funciones, etc. Podemos definir nuestros propios módulos con el perfijo "mod" y para la importación de cualquier módulo, en Rust se importa mediante "use" (equivalente a import) usando doble punto (::) para ir bajando niveles en los submódulos exportados:

```rust
// Importa todo el contenido del crate iron
use iron::*;
// Importa solo el struct HashMap del submódulo collections del crate std (librería standard de Rust)
use std::collections::HashMap;
// Importa Serialize, Deserialize del paquete serde
use serde::{Serialize, Deserialize};

// Definimos nuestro módulo foo que exporta un struct público
mod foo {
    // el struct ha de ser público!
    pub struct Bar;

}
...
//Importación del struct Bar del módulo foo
use foo::Bar;
```

[PlayRust](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=e83271ff705b1aa48e978e633e06bc71).

Como vemos en el ejemplo el sistema de módulos es relativamente parecido al de ECMAScript 6 pero en Rust existe algo llamado [path clarity](https://doc.rust-lang.org/nightly/edition-guide/rust-2018/module-system/path-clarity.html) que permite utilizar el nombre del propio fichero como nombre del módulo, algo muy útil y que ayuda enormemente a la organización de los ficheros de un proyecto.

### Cargo

Rust, tiene un sistema de paquetería llamado [Cargo](https://doc.rust-lang.org/cargo/index.html) y que es el equivalente al Npm de NodeJs pero con funciones ampliadas ya que Cargo además también es la herramienta con la que podemos compilar, ejecutar y empaquetar nuestras aplicaciones además de ser la herramienta con la que instalar dependencias o crates como hemos visto en el ejemplo anterior. [Crates.io](https://crates.io/) es el repositorio donde podemos encontrar todos los crates disponibles. Para la gestión de las dependencias Rust utiliza un fichero en formato [TOML](https://es.wikipedia.org/wiki/TOML) que al igual que el package.json indica las dependencias que tiene un determinado crate:

```toml
[package]
name = "my-rust-package"
version = "0.1.0"
authors = ["userName <user@mail.com>"]
edition = "2018"

[dependencies]
iron = "0.6.1"
mime = "0.3.13"
router = "0.6.0"
urlencoded = "0.6.0"
...
```

Cargo dispone de una una amplia serie de [comandos](https://doc.rust-lang.org/cargo/commands/index.html) para la ejecucción, compilación, documentación y distribución de nuestro código. Notese que Rust es un lenguaje que ya viene con suite de [testing](https://doc.rust-lang.org/rust-by-example/testing/unit_testing.html), [benchmarking](https://doc.rust-lang.org/1.2.0/book/benchmark-tests.html) y [documentación](https://doc.rust-lang.org/cargo/commands/cargo-doc.html)**integrado**, por lo que no hay que instalar o configurar nada adicional. ¿Genial verdad?

### Ownership

He dejado para el final la característica más diferencial de Rust, que recordemos, es un lenguaje de **bajo nivel** con una amplitud superior a la de JavaScript, aunque durante este post nos hemos focalizado en aquellas funcionalidades básicas que comparten ambos lenguajes.

Al principio del post comentábamos que una de las cosas más destacables de Rust es sin lugar a dudas su seguridad. Lenguajes como C o C++ ofrecen un nivel de control muy alto sobre la gestión de la memoria mediante punteros y donde el factor/error humano es importante. Fuente frecuente de bugs. En el otro extremo, estarían lenguajes como JavaScript, Python o Java, que disponen de [Garbage Collector](https://es.wikipedia.org/wiki/Recolector_de_basura) y que es el mecanismo automático que se encarga de toda esa gestión, reduciendo el error humano pero también reduciendo el rendimiento. Nada es gratis en esta vida.

En Rust tenemos **lo mejor de ambos mundos**, pues disponemos de un alto nivel de control ya que no dispone de garbage collector, pero a la vez Rust es ultra-seguro pues no puede haber null pointers, dangling references o data races, como si ocurre en lenguajes como C/C++. ¿Cómo es esto posible? Mediante el sistema de [ownership](https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html)

### Entendiendo el Ownership

En Rust, ciertos tipos como los Strings "mueven" su valor cuando estos son asignados o pasados a funciones lo que **destruye inmediatamente**la variable que los contenía anteriormente (algo que sucede a final de cada bloque) ya que una de las [reglas](https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html#ownership-rules) del ownership es que un valor, solo puede tener un único propietario al mismo tiempo:

```rust
fn main() {
    let str1 = String::from("El Blog Isomórfico");
    //El valor de str es MOVIDO a str2 por lo que str1 es DESTRUIDO
    let str2 = str1;

    //ERROR str1 ya no existe
    println!("{}, world!", str1);

}
```

[PlayRust](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=e83271ff705b1aa48e978e633e06bc71).

Por ello, en Rust, a diferencia de JavaScript, es habitual y obligatorio trabajar con valores pasados por referencias, usando el carácter & para indicar una referencia a un valor lo que permite cumplir las [reglas](https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html#ownership-rules) del ownership. Siguiendo el ejemplo anterior:

```rust
fn main() {
    let str1 = String::from("El Blog Isomórfico");
    //Ahora el valor de str2 es una REFERENCIA a str1 y por tanto NO es movido/destruido
    let str2 = &str1;

    //str1 sigue existiendo
    println!("{}", str1);
    //OUTPUT El Blog Isomórfico
}
```

[PlayRust](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=9527b49728005a2b7546bab6368aee33).

Las implicaciones del ownserhip van más allá de este sencillo ejemplo, pero es el mecanismo que asegura un código ultra seguro. Adaptarse a este sencillo, pero a la vez, profundo sistema puede llevar algún tiempo, pero una vez pasada esa curva inicial comenzarás realmente a apreciarlo.

Pues esto ha sido todo en este post introductorio a Rust, un lenguaje muy amplio, extremadamente potente y con el que vamos a poder escribir cualquier cosa. Rust tiene un futuro brillante por delante y cubrirlo en su justa medida, requeriría de cientos de posts por lo que si te interesa el tema, siempre es bueno echar mano de su excelente [documentacion](https://www.rust-lang.org/learn) y herramientas [online](https://play.rust-lang.org) que facilitan su aprendizaje.
