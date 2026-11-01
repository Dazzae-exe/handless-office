# [CLAUDE.md](http://CLAUDE.md)

Esto es una guia para el agente de claude code para que conozca un poco sobre el repositorio.

## Agentes

- Implementador: Se encarga solo de implementar las tareas que esten en pendiente que ya se tienen en la lista de tareas. Trabaja una tarea hasta que llegue a done.
- Manager: Descompone las tareas y las actualiza dentro de la lista de tareas. El invoca al implementador para realizar una tarea y espera que el implementador finalice completamente con visto bueno del reviewer.
- Reviewer: Te encargas de revisar la tarea que finaliza el implementador y te encargas de darle el visto bueno o malo para que prosiga su camino.

## Package

`pnpm start` para encender el proyecto localmente.
`pnpm build` para realizar build del proyecto.
`pnpm lint` lint del proyecto.

## Stack

El stack y el que se debe trabajar con buenas practicas:

- Next.js 16 (APP ROUTER)
- React 19
- TypeScript
- TailwindCSS v4
- TipTap 3 (HTML EDITOR)
- Supabase (Funciona con Storage, RLS y PostgresSQL)
- ESlint

## Arquitectura de la aplicación

### App (App Router)

- Dashboard
  - Home
  - Posts (Archived / Draft / Posted)
    - Post Editor Page
  - Analytics

### Components

- Commons: Most commons components re-used like buttons, inputs, dialogs, selects, pagination, forms, cards, etc.
- Layout: Navbar, Footer.
- Analytics: Charts and anaylitics cards.

### Assets

Carpeta de recursos graficos si es necesario.

### Lib

Carpeta donde manejamos modulos externos y complejo.

### Utils

Carpeta donde manejamos código interno de funciones puras para el proyecto.

### Types

Carpeta para organizar los tipos de datos, interfaces y contratos de escritura. Los types en esta carpeta no deben existir en un solo archivo es decir cada propuesta debe tener su propio archivo.

### Public

Carpeta donde son publicos las imagenes u otro tipo de documento.

### Hooks

Carpeta para manejar los hooks que se crean solo si es necesario y funciona para manejar los estados y comportamientos complejos sin la necesidad de utilizar antiguas clases de JavaScript.

## Reglas del proyecto

- TypeScript estrictamente, evita any y undefined.
- Evitar a toda costa el useEffect y realizar muchas funciones dentro de componentes.
- Utiliza practicas buenas de React 19.
- Proyecto MIT. Debe ser accesible para la persona que quiera utilizarlo y guardar sus publicaciones en Supabase sin importar como se llame su tabla.

