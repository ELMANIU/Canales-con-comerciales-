# Fénix Premiere Worker 1.0.0

Worker separado para dos señales HLS lineales:

- Fénix Premiere 24/7
- Fénix Mix 24/7

Cada canal reproduce películas y episodios en orden, introduce comerciales cada
15 minutos aproximadamente, agrega otro corte entre programas y vuelve a empezar
al terminar el ciclo. El corte ocurre en el límite del siguiente segmento HLS y,
al finalizar, el contenido continúa exactamente desde el segmento siguiente.

## 1. Reemplazar el contenido demo

Abre src/index.js y edita únicamente la sección CANALES que aparece al principio.
Cada película, episodio o comercial debe apuntar a una playlist HLS VOD .m3u8
pública:

    {
      nombre: "Mi película",
      descripcion: "Descripción para la guía",
      tipo: "pelicula",
      url: "https://mi-r2.example/peliculas/mi-pelicula/index.m3u8"
    }

Para una promo corta se puede limitar la duración sin volver a editar el video:

    {
      nombre: "Promo Fénix",
      tipo: "comercial",
      url: "https://mi-r2.example/promos/promo/index.m3u8",
      maxDurationSeconds: 30
    }

Para cambiar la frecuencia de los cortes:

    intervaloComercialesMinutos: 15

Para quitar el corte que aparece entre dos programas:

    comercialEntreProgramas: false

Puedes agregar todos los elementos que necesites dentro de programas y
comerciales. El motor rota los comerciales automáticamente.

## 2. Requisito importante de video

El Worker une playlists; no convierte ni vuelve a codificar los videos. Para una
reproducción estable en Roku, todos los programas y comerciales de un canal deben
usar parámetros compatibles:

- H.264 para video y AAC estéreo para audio.
- La misma resolución y frecuencia de cuadros, preferentemente.
- El mismo tipo de segmento: todos .ts o todos fMP4.
- Playlists VOD completas, no señales HLS en vivo como fuentes.
- Segmentos de aproximadamente 6 segundos y fotogramas clave alineados.
- Audio incluido en la misma variante de video.

Si preparas archivos con FFmpeg, usa el mismo perfil para todos. Un ejemplo base:

    ffmpeg -i entrada.mp4 -c:v libx264 -profile:v high -level 4.1 \
      -pix_fmt yuv420p -c:a aac -b:a 128k -ar 48000 -ac 2 \
      -force_key_frames "expr:gte(t,n_forced*6)" \
      -f hls -hls_time 6 -hls_playlist_type vod \
      -hls_segment_filename "segmento_%05d.ts" index.m3u8

En R2 usa application/vnd.apple.mpegurl para .m3u8 y video/mp2t para .ts.
Utiliza solamente material para el que tengas derechos de transmisión.

## 3. Desplegar el Worker

Desde la carpeta del proyecto:

    npm install
    npm run check
    npm test
    npm run deploy

El archivo wrangler.toml ya usa el nombre fenix-premiere-worker. En la cuenta
actual de Fénix, las rutas esperadas son:

- https://fenix-premiere-worker.elmanuchale.workers.dev/premiere/live.m3u8
- https://fenix-premiere-worker.elmanuchale.workers.dev/fenixmix/live.m3u8
- https://fenix-premiere-worker.elmanuchale.workers.dev/catalog.json

Si Cloudflare entrega otro subdominio, modifica la única URL indicada en
components/FenixRemoteCatalog.brs dentro del ZIP de Roku y también la URL
principal de DeepLinkResolverTask.brs.

## 4. JSON y guía

No tienes que construir el EPG a mano. El Worker calcula los horarios reales con
la duración de cada segmento y genera:

- /premiere/status: contenido actual, siguiente y porcentaje transcurrido.
- /premiere/guide.json: guía completa del primer canal.
- /fenixmix/status y /fenixmix/guide.json: datos del segundo canal.
- /guide.json: las dos señales en un solo JSON.
- /catalog-fragment.json: solamente la nueva categoría para inspección.
- /catalog.json: tu catálogo de GitHub más los dos canales y su EPG dinámico.
- /health: valida que todas las playlists pudieron cargarse.

El ZIP de Roku BUILD398 incluido en la entrega ya consulta /catalog.json. Así
conserva películas, series y canales anteriores y agrega “Fénix en vivo”. La
pantalla de televisión mostrará el título actual, el avance y la programación
de Ayer, Hoy y los cinco días siguientes.

Si el Worker nuevo está temporalmente fuera de línea, la app conserva como
respaldo el catálogo original de GitHub.

## 5. Qué hace y qué no hace esta versión

Incluye señal lineal continua, dos canales, pausas comerciales, reanudación del
programa, Ahora/Después, EPG y JSON para Roku. Todavía no incrusta un logo sobre
el video; eso requiere procesar la imagen en el archivo o dibujar el logo desde
la aplicación.

Las fuentes Mux incluidas son demostraciones técnicas para que el proyecto tenga
una configuración inicial. Antes de publicar Fénix Premiere, sustitúyelas por tus
propios HLS alojados en R2.
