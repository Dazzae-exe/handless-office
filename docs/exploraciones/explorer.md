

2026-11-05 - Feature: F-002 - Contexto de la exploración: ¿cuál es la forma más pequeña y con tipado estricto (sin any) de pasar a supabase.from() un nombre de tabla, vista o bucket leído de variables de entorno sin perder el tipado de columnas de Database?
Hallazgos:
- postgrest-js (PostgrestClient.ts:152-181) restringe `from()` a `keyof Schema['Tables' | 'Views']`. Los tipos de fila salen solo del literal. En runtime solo comprueba que el string no esté vacío y lo añade a la URL, así que un cast a literal solo afecta a los tipos.
- `supabase.storage.from(bucket)` acepta cualquier string.
- Nombres fijos en servidor: app/(dashboard)/page.tsx (count('posts'|'projects')), posts/page.tsx, posts/[id]/page.tsx, projects/page.tsx (x2), projects/[id]/page.tsx y lib/supabase/analytics.ts (4 vistas analytics_*).
- Nombres fijos en cliente: lib/supabase/posts.ts, projects.ts y storage.ts (bucket tiptap_content y tabla images).
- La tabla tags y posts_tags no se consultan en ninguna parte. No hay llamadas .rpc().
- lib/supabase.ts no lo importa nadie (código muerto con ANON_KEY).
Decisiones tomadas:
- Opción (a): un módulo lib/supabase/tables.ts con TABLES, VIEWS y el bucket, cada nombre leído con `process.env.NEXT_PUBLIC_X || 'default'` y con cast a su clave literal de Database.
- Se usa `||` para que una variable vacía vuelva al valor por defecto.
- Las variables se referencian de forma literal para que Next las incruste en el bundle del cliente. Cambiarlas exige reconstruir.
- No se añade variable para tags, porque no se usa.
- Riesgo asumido: si la tabla propia tiene columnas distintas, los tipos no lo detectan. Se documenta en el README que el esquema debe coincidir.

2026-11-05 - Feature: F-002 (revisión) - Contexto de la exploración: investigación de cómo funciona la configuración de tablas y revisión estricta de calidad del diff.
Hallazgos:
- Las variables NEXT_PUBLIC_* se incrustan al compilar; cambiarlas exige pnpm build (o reiniciar pnpm dev).
- Los clientes no pasan db.schema: todas las tablas deben estar en el schema public.
- `||` no recorta espacios: un valor con espacios produce un nombre de tabla inválido.
- El insert de images con await bloqueaba la inserción de la imagen en el editor y descartaba el error en silencio.
- EDITOR_IMAGE_BUCKET en tables.ts mezclaba configuración de Storage con nombres de tablas; su único consumidor es storage.ts.
- Fuera del diff: conversión de errores inconsistente entre posts.ts y projects.ts/analytics.ts, y UUID_RE duplicado en las páginas [id].
Decisiones tomadas:
- Se mantienen los casts al literal de Database: es la mentira de tipos mínima y está concentrada en un archivo.
- Se mantiene la sanitización de q en lib/list-params.ts; no se añade tipo marcado (branded) porque no hay riesgo real.
- La deuda fuera del diff pasa a F-009.
