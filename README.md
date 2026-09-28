# Documentacion
## Comando para ejecutar el servidor
`node --run dev`

(Para mas info revisar el archivo `package.json`)

## Rutas para fetch (END-POINTS)
Aqui basicamente estaran las rutas a las que se les proda hacer una peticion con fetch para obtener la informacion que quiera, ademas tambien estaran las rutas donde estara cada pagina html

(Esto obviamtene es en la ruta `http://localhost:3000`. Basicamente solo tendras que añadirle la extension para cada pagina. Ej: `http://localhost:3000/login` aqui esta la pagina inicio de sesion, )

### Paginas
Estas son las rutas de las paginas que mostrara al usuario, las que se hacen en el frontend

(No confundan rutas abosolutas con relativas no sean brutos :D)
* `/` Pagina inicio 
* `/login` Pagina de inicio de sesion
* `/2fa` Pagina para la autenticacion en dos pasos (no hecha aun) 

### API
Aqui estaran las rutas para peticiones a la API tambien se especificara el metodo y para que es
* `/api/login` **METHOD: POST** Aqui se piden peticiones para inicio de sesion, comprueba que los datos proporcionados por el usuario coincidan con los de otro usuario, ademas, devuelve una cookie con un token de acceso que valida la sesion del usuario.
* `/api/register` **METHOD**: POST Peticiones para crear un usuario, luego de leer los datos puesto por el usuario se envian a esta api, en el body de la peticion debe estar los datos del usuario con el siguiente formato:
~~~javascript
{
    _id,
    username,
    nombre,
    apellido,
    ci,
    email,
    phone,
    password
}
// Lo pueden pasar como un objeto o pasar todos los campos en variables individuales
~~~
* `/api/logout` **METHOD:** POST  Este elimina la cookie de sesion, eliminando la sesion XD, el usuario perdera acceso a las paginas protegidas


* `/api/login/2fa/request` **METHOD:** POST Para solicitar el token para la verificacion en dos pasos (Por hacer...)
* `/api/login/2fa/verify` **METHOD:** POST Para verificar el token proporcionado por el usuario (Por hacer...)
