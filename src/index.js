// FENIX PREMIERE WORKER
// BUILD407 — EPG limpio, sin truncamiento, sin fragmentacion por comerciales.
//
// Cambios respecto a BUILD406:
//   - MAX_GUIDE_EVENTS subido a 5000.
//   - Los comerciales ya NO se publican en el EPG (antes gastaban presupuesto
//     de eventos y forzaban truncamiento prematuro de la ventana).
//   - Los bloques contiguos del mismo programa se FUSIONAN en una sola
//     entrada de EPG. Antes, un capitulo de 80 min partido por cortes cada
//     15 min aparecia como 5-6 "programas" distintos en la app.
//   - "next" del status/guide salta automaticamente los comerciales.
//     Antes devolvia "comercial / Corte promocional" como siguiente.
//   - Se expone nowContent (programa completo actual) ademas de now (bloque).
//
// IMPORTANTE: cambia solamente las URLs de la seccion CANALES por playlists
// HLS VOD (.m3u8) que tengas derecho de transmitir. El Worker no transcodifica.


// ============ CONFIGURACION EDITABLE ============

const WORKER_VERSION = "1.1.0";
const DEFAULT_UPSTREAM_CATALOG_URL =
  "https://raw.githubusercontent.com/ELMANIU/Roku-feed/main/catalog.json";

// Estas fuentes publicas son unicamente material de demostracion tecnica.
// Sustituyelas por tus peliculas, episodios y promos alojados en R2.
const DEMO_PELICULA = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";
const DEMO_SERIE = "https://test-streams.mux.dev/test_001/stream.m3u8";
const DEMO_PROMO = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

export const CANALES = {
  premiere: {
    nombre: "Fénix Premiere 24/7",
    descripcion: "Películas, series y cortes comerciales durante todo el día.",
    epoch: Date.UTC(2026, 0, 1, 0, 0, 0) / 1000,
    intervaloComercialesMinutos: 15,
    comercialEntreProgramas: true,
    programas: [
      {
        nombre: "Guasón (2019)",
        descripcion: "Arthur Fleck es un hombre ignorado por la sociedad, cuya motivación en la vida es hacer reír. Pero una serie de trágicos acontecimientos le llevarán a ver el mundo de otra forma.",
        tipo: "pelicula",
        url: "https://hugh.cdn.rumble.cloud/video/fwe2/14/s8/2/o/M/f/G/oMfGA.gaa.tar?r_file=chunklist.m3u8&r_type=application%2Fvnd.apple.mpegurl&r_range=1951023616-1951097761",
      },
      {
        nombre: "S02E01 — Extraños en una tierra extraña",
        descripcion: "En ausencia del sheriff Boyd, Donna y Kenny tienen problemas para contener el caos cuando unos recién llegados aparecen en el pueblo. Victor y Tabitha emprenden un escalofriante viaje por el laberinto de túneles bajo el pueblo",
        tipo: "serie",
        url: "https://hugh.cdn.rumble.cloud/video/fwe2/fb/s8/2/O/S/T/G/OSTGA.gaa.tar?r_file=chunklist.m3u8&r_type=application%2Fvnd.apple.mpegurl&r_range=764295168-764323740",
      },
    ],
    comerciales: [
      {
        nombre: "Comercial",
        descripcion: "Corte promocional de fenix plus",
        tipo: "comercial",
        url: "https://pub-31c3df763d1f4f2bbd2602595581aa82.r2.dev/Hyii/HLS/index.m3u8",
        maxDurationSeconds: 30,
      },
    ],
  },
  fenixmix: {
    nombre: "Fénix Mix 24/7",
    descripcion: "Una segunda señal lineal con cine, capítulos y promociones.",
    epoch: Date.UTC(2026, 0, 1, 6, 0, 0) / 1000,
    intervaloComercialesMinutos: 15,
    comercialEntreProgramas: true,
    programas: [
      {
        nombre: "S01E01 — Turista atrapado",
        descripcion: "Dos gemelos, Dipper y Mabel Pines, llegan a la remota ciudad de Gravity Falls para pasar sus vacaciones de verano, pero el nuevo novio sospechoso de Mabel revela extraños y misteriosos secretos de la ciudad para el dúo. Cuando el novio de Mabel resulta ser un grupo de gnomos, Dipper intenta salvarla.",
        tipo: "serie",
        url: "https://hugh.cdn.rumble.cloud/video/fwe2/06/s8/2/G/M/D/V/GMDVA.caa.tar?r_file=chunklist.m3u8&r_type=application%2Fvnd.apple.mpegurl&r_range=166684672-166697264",
      },
      {
        nombre: "Amigos Salvajes 4: Tontos por el susto (2015)",
        descripcion: "Cuando por una confusión de identidad tanto humanos como animales creen que hay un hombre lobo suelto en el Bosque Timberline, el ex cazador Shaw aprovecha la oportunidad para reabrir la temporada de caza. Shaw anda suelto y todos los animales corren peligro, así que Boog, Elliot y Mr. Weenie tendrán que enfrentarse a sus miedos, perseguir al esquivo hombre lobo y cerrar la temporada de caza permanentemente, antes de que Shaw pueda hacerles daño.",
        tipo: "pelicula",
        url: "https://hugh.cdn.rumble.cloud/video/fww1/5f/s8/2/s/1/g/X/s1gXA.haa.tar?r_file=chunklist.m3u8&r_type=application%2Fvnd.apple.mpegurl&r_range=2614524928-2614576651",
      },
      {
        nombre: "Reyes de las olas 2: WaveMania (2017)",
        descripcion: "Cody Maverick busca un nuevo desafío cuando se une al legendario grupo de surfistas extremos The Hang 5 para viajar a un misterioso lugar conocido como Las Trincheras, donde se encuentran las olas más peligrosas del mundo. En esta nueva aventura descubrirá el verdadero significado de la amistad, el trabajo en equipo y el espíritu del surf.",
        tipo: "pelicula",
        url: "https://hugh.cdn.rumble.cloud/video/fww1/dd/s8/2/G/_/4/X/G_4XA.haa.tar?r_file=chunklist.m3u8&r_type=application%2Fvnd.apple.mpegurl&r_range=2596488192-2596539640",
      },
      {
        nombre: "Gravity Falls — S01E02 — La leyenda del Gobblewonker",
        descripcion: "Dipper, Mabel, Stan y Soos se embarcan en una excursión al lago Gravity Falls para investigar la existencia de una misteriosa criatura marina conocida como el Gobblewonker. Mientras Dipper busca pruebas para su diario, descubren que el lago esconde secretos inesperados.",
        tipo: "serie",
        url: "https://hugh.cdn.rumble.cloud/video/fww1/9f/s8/2/o/P/D/V/oPDVA.haa.tar?r_file=chunklist.m3u8&r_type=application%2Fvnd.apple.mpegurl&r_range=665805824-665818855",
      },
    ],
    comerciales: [
      {
        nombre: "comercial",
        descripcion: "Corte promocional de fenix plus",
        tipo: "comercial",
        url: "https://pub-31c3df763d1f4f2bbd2602595581aa82.r2.dev/Hyii/HLS/index.m3u8",
        maxDurationSeconds: 30,
      },
    ],
  },
};


// ============ CONFIGURACION DEL MOTOR ============

const SCHEDULE_TTL_MS = 5 * 60 * 1000;
const CATALOG_TTL_SECONDS = 60;
const SOURCE_CACHE_TTL_SECONDS = 60 * 60;
const SEGMENTOS_ATRAS = 15;
const SEGMENTOS_ADELANTE = 12;
const MINIMO_DESPUES_DE_CORTE_SECONDS = 90;
const GUIDE_PAST_DAYS = 1;
const GUIDE_FUTURE_DAYS = 7;
// Antes 2000. Con la fusion de programas y la exclusion de comerciales
// del EPG, el conteo real por ciclo baja drasticamente, pero damos margen
// para canales con parrilla muy fragmentada.
const MAX_GUIDE_EVENTS = 5000;
// Tope de seguridad: una entrada de EPG fusionada no deberia durar mas de
// esto. Evita fusionar accidentalmente dos emisiones contiguas identicas.
const MAX_MERGED_EVENT_SECONDS = 4 * 60 * 60;

const scheduleCache = new Map();
const scheduleCacheTime = new Map();
const schedulePromises = new Map();


// ============ UTILIDADES ============

function errorText(error) {
  return error instanceof Error ? error.message : String(error);
}

function normalizePath(pathname) {
  if (pathname === "/") return pathname;
  return pathname.replace(/\/+$/, "") || "/";
}

function publicBaseUrl(request, env) {
  try {
    const configured = new URL(String(env.PUBLIC_BASE_URL || ""));
    if (configured.protocol === "https:") return configured.origin;
  } catch {
    // Si no existe PUBLIC_BASE_URL se usa el dominio actual del Worker.
  }
  return new URL(request.url).origin;
}

function resolveUri(uri, baseUrl) {
  try {
    const resolved = new URL(String(uri).trim(), baseUrl);
    if (resolved.protocol !== "https:" && resolved.protocol !== "http:") {
      throw new Error("protocolo no permitido");
    }
    return resolved.href;
  } catch {
    throw new Error("URI inválida en el M3U8: " + uri);
  }
}

function makeTagAbsolute(tag, baseUrl) {
  return tag.replace(/URI\s*=\s*(?:"([^"]+)"|([^,\s]+))/i, function (_whole, quoted, plain) {
    return "URI=\"" + resolveUri(quoted || plain, baseUrl) + "\"";
  });
}

function parseBandwidth(tag) {
  const match = tag.match(/\bBANDWIDTH\s*=\s*(\d+)/i);
  return match ? Number(match[1]) : 0;
}

function findBestVariant(text, baseUrl) {
  const lines = text.split(/\r?\n/);
  const variants = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line.toUpperCase().startsWith("#EXT-X-STREAM-INF:")) continue;

    let uri = "";
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const next = lines[cursor].trim();
      if (!next) continue;
      if (!next.startsWith("#")) uri = resolveUri(next, baseUrl);
      break;
    }
    if (uri) variants.push({ uri, bandwidth: parseBandwidth(line) });
  }

  if (!variants.length) throw new Error("La playlist maestra no contiene variantes de video");
  variants.sort(function (left, right) {
    return left.bandwidth - right.bandwidth;
  });
  return variants[variants.length - 1].uri;
}

async function fetchPlaylist(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.apple.mpegurl, application/x-mpegURL, text/plain, */*",
      "User-Agent": "Fenix-Premiere-Worker/" + WORKER_VERSION,
    },
    cf: {
      cacheTtl: SOURCE_CACHE_TTL_SECONDS,
      cacheEverything: true,
    },
  });

  if (!response.ok) throw new Error("HTTP " + response.status + " al cargar " + url);
  const text = await response.text();
  if (!text.includes("#EXTM3U")) throw new Error("La fuente no devolvió una playlist HLS: " + url);
  return { text, finalUrl: response.url || url };
}

async function loadSource(item, sourceIndex, depth) {
  const currentDepth = depth || 0;
  if (currentDepth > 3) {
    throw new Error("Demasiadas playlists maestras encadenadas en " + item.nombre);
  }

  const loaded = await fetchPlaylist(item.url);
  const baseUrl = new URL(loaded.finalUrl);
  if (/#EXT-X-STREAM-INF:/i.test(loaded.text)) {
    const variantUrl = findBestVariant(loaded.text, baseUrl);
    return loadSource({ ...item, url: variantUrl }, sourceIndex, currentDepth + 1);
  }

  const lines = loaded.text.split(/\r?\n/);
  const segments = [];
  let pendingDuration = null;
  let pendingByteRange = null;
  let pendingDiscontinuity = false;
  let currentMapTag = null;
  let currentKeyTag = null;
  let localIndex = 0;
  let accumulated = 0;
  const maximum = Number(item.maxDurationSeconds || 0);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const upper = line.toUpperCase();

    if (upper.startsWith("#EXT-X-MAP:")) {
      currentMapTag = makeTagAbsolute(line, baseUrl);
      continue;
    }
    if (upper.startsWith("#EXT-X-KEY:")) {
      currentKeyTag = makeTagAbsolute(line, baseUrl);
      continue;
    }
    if (upper.startsWith("#EXT-X-BYTERANGE:")) {
      pendingByteRange = line;
      continue;
    }
    if (upper === "#EXT-X-DISCONTINUITY") {
      pendingDiscontinuity = true;
      continue;
    }
    if (upper.startsWith("#EXTINF:")) {
      const match = line.match(/^#EXTINF:\s*([0-9]+(?:\.[0-9]+)?)/i);
      if (!match) throw new Error("EXTINF inválido en " + item.nombre + ": " + line);
      pendingDuration = Number(match[1]);
      if (!Number.isFinite(pendingDuration) || pendingDuration <= 0) {
        throw new Error("Duración inválida en " + item.nombre + ": " + line);
      }
      continue;
    }

    if (!line.startsWith("#") && pendingDuration !== null) {
      if (maximum > 0 && segments.length > 0 && accumulated + pendingDuration > maximum) break;
      segments.push({
        duration: pendingDuration,
        uri: resolveUri(line, baseUrl),
        mapTag: currentMapTag,
        keyTag: currentKeyTag,
        byteRange: pendingByteRange,
        sourceDiscontinuity: pendingDiscontinuity,
        sourceIndex,
        localIndex,
      });
      accumulated += pendingDuration;
      localIndex += 1;
      pendingDuration = null;
      pendingByteRange = null;
      pendingDiscontinuity = false;
      if (maximum > 0 && accumulated >= maximum) break;
    }
  }

  if (!segments.length) throw new Error("No se encontraron segmentos en " + item.nombre);
  return segments;
}

function sumDurations(segments, startIndex, endIndexExclusive) {
  let total = 0;
  for (let index = startIndex; index < endIndexExclusive; index += 1) {
    total += segments[index].duration;
  }
  return total;
}

function appendBlock(timeline, sourceSegments, startIndex, endIndexExclusive, item, type) {
  if (startIndex >= endIndexExclusive) return;
  const blockIndex = timeline.blocks.length;
  const blockStart = timeline.total;

  for (let index = startIndex; index < endIndexExclusive; index += 1) {
    const sourceSegment = sourceSegments[index];
    const start = timeline.total;
    timeline.segments.push({
      ...sourceSegment,
      start,
      end: start + sourceSegment.duration,
      blockIndex,
    });
    timeline.total += sourceSegment.duration;
    timeline.targetDuration = Math.max(timeline.targetDuration, Math.ceil(sourceSegment.duration));
  }

  timeline.blocks.push({
    index: blockIndex,
    title: item.nombre,
    description: item.descripcion || (type === "comercial" ? "Corte comercial de Fénix TV." : "Programación de Fénix TV."),
    type,
    isCommercial: type === "comercial",
    start: blockStart,
    end: timeline.total,
    duration: timeline.total - blockStart,
  });
}

function appendCommercial(timeline, commercials, commercialLists, commercialState) {
  if (!commercials.length) return;
  const index = commercialState.value % commercials.length;
  commercialState.value += 1;
  const item = commercials[index];
  const segments = commercialLists[index];
  appendBlock(timeline, segments, 0, segments.length, item, "comercial");
}

async function buildSchedule(channelKey) {
  const channel = CANALES[channelKey];
  if (!channel) throw new Error("Canal no encontrado: " + channelKey);
  if (!Array.isArray(channel.programas) || !channel.programas.length) {
    throw new Error("El canal " + channelKey + " no tiene programas");
  }

  const commercials = Array.isArray(channel.comerciales) ? channel.comerciales : [];
  const programLists = await Promise.all(
    channel.programas.map(function (item, index) {
      return loadSource(item, index, 0);
    }),
  );
  const commercialLists = await Promise.all(
    commercials.map(function (item, index) {
      return loadSource(item, channel.programas.length + index, 0);
    }),
  );

  const timeline = { segments: [], blocks: [], total: 0, targetDuration: 1 };
  const commercialState = { value: 0 };
  const intervalSeconds = Math.max(0, Number(channel.intervaloComercialesMinutos || 0) * 60);

  for (let programIndex = 0; programIndex < channel.programas.length; programIndex += 1) {
    const item = channel.programas[programIndex];
    const sourceSegments = programLists[programIndex];
    let partStart = 0;
    let sinceCommercial = 0;

    for (let index = 0; index < sourceSegments.length; index += 1) {
      sinceCommercial += sourceSegments[index].duration;
      if (!intervalSeconds || !commercials.length || sinceCommercial < intervalSeconds) continue;

      const remaining = sumDurations(sourceSegments, index + 1, sourceSegments.length);
      if (remaining < MINIMO_DESPUES_DE_CORTE_SECONDS) continue;

      appendBlock(timeline, sourceSegments, partStart, index + 1, item, item.tipo || "programa");
      appendCommercial(timeline, commercials, commercialLists, commercialState);
      partStart = index + 1;
      sinceCommercial = 0;
    }

    appendBlock(timeline, sourceSegments, partStart, sourceSegments.length, item, item.tipo || "programa");
    if (channel.comercialEntreProgramas && commercials.length) {
      appendCommercial(timeline, commercials, commercialLists, commercialState);
    }
  }

  if (!timeline.segments.length || !Number.isFinite(timeline.total) || timeline.total <= 0) {
    throw new Error("El calendario de " + channelKey + " no tiene una duración válida");
  }

  const discontinuitiesBefore = new Array(timeline.segments.length + 1).fill(0);
  for (let index = 0; index < timeline.segments.length; index += 1) {
    const previous = index > 0 ? timeline.segments[index - 1] : null;
    const current = timeline.segments[index];
    const blockChanged = Boolean(previous && previous.blockIndex !== current.blockIndex);
    discontinuitiesBefore[index + 1] =
      discontinuitiesBefore[index] + (blockChanged || current.sourceDiscontinuity ? 1 : 0);
  }

  return {
    channelKey,
    channelName: channel.nombre,
    channelDescription: channel.descripcion || "",
    epoch: channel.epoch,
    segments: timeline.segments,
    blocks: timeline.blocks,
    total: timeline.total,
    targetDuration: timeline.targetDuration,
    playlistVersion: timeline.segments.some(function (segment) {
      return Boolean(segment.mapTag);
    })
      ? 7
      : timeline.segments.some(function (segment) {
          return Boolean(segment.byteRange);
        })
        ? 4
        : 3,
    discontinuitiesBefore,
    cycleDiscontinuities: discontinuitiesBefore[timeline.segments.length] + 1,
  };
}

async function getSchedule(channelKey) {
  const now = Date.now();
  const cached = scheduleCache.get(channelKey);
  const cachedAt = scheduleCacheTime.get(channelKey) || 0;
  if (cached && now - cachedAt < SCHEDULE_TTL_MS) return cached;

  if (!schedulePromises.has(channelKey)) {
    const promise = buildSchedule(channelKey)
      .then(function (schedule) {
        scheduleCache.set(channelKey, schedule);
        scheduleCacheTime.set(channelKey, Date.now());
        return schedule;
      })
      .catch(function (error) {
        if (cached) {
          console.error("No se pudo actualizar " + channelKey + "; se conserva el calendario anterior", error);
          return cached;
        }
        throw error;
      })
      .finally(function () {
        schedulePromises.delete(channelKey);
      });
    schedulePromises.set(channelKey, promise);
  }
  return schedulePromises.get(channelKey);
}


// ============ SENAL HLS ============

function getLiveState(schedule, nowSeconds) {
  const elapsed = Math.max(0, nowSeconds - schedule.epoch);
  let cycle = Math.floor(elapsed / schedule.total);
  let position = elapsed - cycle * schedule.total;

  if (position >= schedule.total - 0.001) {
    cycle += 1;
    position = 0;
  }

  let low = 0;
  let high = schedule.segments.length - 1;
  let index = high;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const segment = schedule.segments[middle];
    if (position < segment.start) {
      high = middle - 1;
    } else if (position >= segment.end) {
      low = middle + 1;
    } else {
      index = middle;
      break;
    }
  }

  return {
    cycle,
    position,
    index,
    absolute: cycle * schedule.segments.length + index,
  };
}

function segmentForAbsolute(schedule, absolute) {
  const count = schedule.segments.length;
  const index = ((absolute % count) + count) % count;
  return schedule.segments[index];
}

function hasDiscontinuityBefore(schedule, absolute) {
  if (absolute <= 0) return false;
  const count = schedule.segments.length;
  const index = ((absolute % count) + count) % count;
  if (index === 0) return true;
  const previous = schedule.segments[index - 1];
  const current = schedule.segments[index];
  return previous.blockIndex !== current.blockIndex || Boolean(current.sourceDiscontinuity);
}

function discontinuitySequenceBefore(schedule, absolute) {
  if (absolute <= 0) return 0;
  const count = schedule.segments.length;
  const cycle = Math.floor(absolute / count);
  const index = absolute - cycle * count;
  return cycle * schedule.cycleDiscontinuities + schedule.discontinuitiesBefore[index];
}

function programDateTimeFor(schedule, absolute, segment) {
  const cycle = Math.floor(absolute / schedule.segments.length);
  return schedule.epoch + cycle * schedule.total + segment.start;
}

function buildLivePlaylist(schedule, state) {
  const first = Math.max(0, state.absolute - SEGMENTOS_ATRAS);
  const last = state.absolute + SEGMENTOS_ADELANTE;
  const lines = [
    "#EXTM3U",
    "#EXT-X-VERSION:" + schedule.playlistVersion,
    "#EXT-X-TARGETDURATION:" + schedule.targetDuration,
    "#EXT-X-MEDIA-SEQUENCE:" + first,
    "#EXT-X-DISCONTINUITY-SEQUENCE:" + discontinuitySequenceBefore(schedule, first),
  ];

  let previousMapTag = null;
  let previousKeyTag = "__unset__";
  for (let absolute = first; absolute <= last; absolute += 1) {
    const segment = segmentForAbsolute(schedule, absolute);
    if (hasDiscontinuityBefore(schedule, absolute)) {
      lines.push("#EXT-X-DISCONTINUITY");
      previousMapTag = null;
      previousKeyTag = "__unset__";
    }
    if (segment.mapTag && segment.mapTag !== previousMapTag) {
      lines.push(segment.mapTag);
      previousMapTag = segment.mapTag;
    }
    if (segment.keyTag !== previousKeyTag) {
      lines.push(segment.keyTag || "#EXT-X-KEY:METHOD=NONE");
      previousKeyTag = segment.keyTag;
    }

    const programDateTime = programDateTimeFor(schedule, absolute, segment);
    lines.push("#EXT-X-PROGRAM-DATE-TIME:" + new Date(programDateTime * 1000).toISOString());
    if (segment.byteRange) lines.push(segment.byteRange);
    lines.push("#EXTINF:" + segment.duration.toFixed(6) + ",");
    lines.push(segment.uri);
  }
  return lines.join("\n") + "\n";
}


// ============ AHORA, DESPUES Y EPG ============

function blockOccurrence(schedule, cycle, blockIndex) {
  const block = schedule.blocks[blockIndex];
  const startSeconds = schedule.epoch + cycle * schedule.total + block.start;
  const endSeconds = schedule.epoch + cycle * schedule.total + block.end;
  return {
    title: block.title,
    description: block.description,
    type: block.type,
    isCommercial: block.isCommercial,
    start: new Date(startSeconds * 1000).toISOString(),
    end: new Date(endSeconds * 1000).toISOString(),
    startSeconds,
    endSeconds,
    durationSeconds: Number(block.duration.toFixed(3)),
  };
}

// Devuelve el bloque NO comercial mas cercano hacia adelante desde el indice
// de bloque dado. Si el bloque actual ya es no comercial, lo devuelve tal cual.
function findNextContentBlock(schedule, fromBlockIndex, fromCycle) {
  const total = schedule.blocks.length;
  let blockIndex = fromBlockIndex;
  let cycle = fromCycle;
  let guard = 0;
  while (schedule.blocks[blockIndex].isCommercial && guard < total * 2) {
    blockIndex = (blockIndex + 1) % total;
    if (blockIndex === 0) cycle += 1;
    guard += 1;
  }
  return { blockIndex, cycle };
}

function nowAndNext(schedule, state, nowSeconds) {
  const currentBlockIndex = schedule.segments[state.index].blockIndex;

  // "next" siempre apunta al proximo CONTENIDO real, nunca a un comercial.
  const found = findNextContentBlock(
    schedule,
    (currentBlockIndex + 1) % schedule.blocks.length,
    state.cycle + (currentBlockIndex + 1 >= schedule.blocks.length ? 1 : 0),
  );

  const current = blockOccurrence(schedule, state.cycle, currentBlockIndex);
  const next = blockOccurrence(schedule, found.cycle, found.blockIndex);
  const elapsed = Math.max(0, nowSeconds - current.startSeconds);
  const progress = Math.max(0, Math.min(1, elapsed / Math.max(0.001, current.durationSeconds)));
  return {
    now: current,
    next,
    progressPercent: Number((progress * 100).toFixed(2)),
  };
}

// Fusiona bloques contiguos del mismo programa. Un capitulo partido por
// cortes internos deja de aparecer como 5-6 "programas" separados.
function mergeGuideEvent(events, event, cycle, lastEventCycle) {
  const previous = events[events.length - 1];
  const canMerge =
    previous &&
    lastEventCycle === cycle &&
    previous.title === event.title &&
    previous.description === event.description &&
    previous.type === event.type &&
    Math.abs(previous.endSeconds - event.startSeconds) < 1 &&
    previous.durationSeconds + event.durationSeconds <= MAX_MERGED_EVENT_SECONDS;

  if (canMerge) {
    previous.end = event.end;
    previous.endSeconds = event.endSeconds;
    previous.durationSeconds = Number((previous.endSeconds - previous.startSeconds).toFixed(3));
    return false;
  }

  events.push({
    start: event.start,
    end: event.end,
    startSeconds: event.startSeconds,
    endSeconds: event.endSeconds,
    durationSeconds: event.durationSeconds,
    title: event.title,
    description: event.description,
    type: event.type,
    isCommercial: false,
  });
  return true;
}

function buildGuide(schedule, fromSeconds, untilSeconds) {
  const events = [];
  const firstCycle = Math.max(0, Math.floor((fromSeconds - schedule.epoch) / schedule.total) - 1);
  const lastCycle = Math.max(firstCycle, Math.floor((untilSeconds - schedule.epoch) / schedule.total) + 1);
  let lastEventCycle = -1;

  for (let cycle = firstCycle; cycle <= lastCycle; cycle += 1) {
    for (let blockIndex = 0; blockIndex < schedule.blocks.length; blockIndex += 1) {
      const block = schedule.blocks[blockIndex];
      // Los comerciales ya no forman parte del EPG visible. Antes consumian
      // presupuesto de MAX_GUIDE_EVENTS y truncaban la ventana.
      if (block.isCommercial) continue;

      const event = blockOccurrence(schedule, cycle, blockIndex);
      if (event.endSeconds <= fromSeconds || event.startSeconds >= untilSeconds) continue;

      mergeGuideEvent(events, event, cycle, lastEventCycle);
      lastEventCycle = cycle;

      if (events.length >= MAX_GUIDE_EVENTS) return events;
    }
  }
  return events;
}

function guideWindow(schedule, nowSeconds) {
  return buildGuide(
    schedule,
    nowSeconds - GUIDE_PAST_DAYS * 86400,
    nowSeconds + GUIDE_FUTURE_DAYS * 86400,
  );
}

// Programa completo actual (fusionado). Se calcula sobre la misma ventana
// que sirve la app para que "AHORA" coincida visualmente con la parrilla.
function findContentAt(events, nowSeconds) {
  for (const event of events) {
    if (event.startSeconds <= nowSeconds && event.endSeconds > nowSeconds) return event;
  }
  return null;
}

function scheduleSummary(schedule, nowSeconds, events) {
  const state = getLiveState(schedule, nowSeconds);
  const status = nowAndNext(schedule, state, nowSeconds);
  const nowContent = events ? findContentAt(events, nowSeconds) : null;
  return {
    id: schedule.channelKey,
    channel: schedule.channelName,
    description: schedule.channelDescription,
    now: status.now,
    next: status.next,
    nowContent,
    progressPercent: status.progressPercent,
    cycle: state.cycle,
    positionInCycle: Number(state.position.toFixed(3)),
    cycleDurationSeconds: Number(schedule.total.toFixed(3)),
    mediaSequence: state.absolute,
    updatedAt: new Date().toISOString(),
  };
}


// ============ CATALOGO PARA ROKU ============

async function fetchUpstreamCatalog(env, blockedCatalogUrl) {
  let currentUrl = String(env.UPSTREAM_CATALOG_URL || DEFAULT_UPSTREAM_CATALOG_URL).trim();
  if (!currentUrl) return {};
  let lastGoodCatalog = {};

  // Sigue hasta dos catalogUrl existentes para conservar el comportamiento
  // de la app, pero nunca permite regresar a este mismo Worker.
  for (let depth = 0; depth < 3; depth += 1) {
    if (currentUrl.toLowerCase() === blockedCatalogUrl.toLowerCase()) return lastGoodCatalog;
    try {
      const response = await fetch(currentUrl, {
        headers: { Accept: "application/json", "User-Agent": "Fenix-Premiere-Catalog/" + WORKER_VERSION },
        cf: { cacheTtl: CATALOG_TTL_SECONDS, cacheEverything: true },
      });
      if (!response.ok) throw new Error("HTTP " + response.status);
      const parsed = await response.json();
      if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
        throw new Error("el JSON no es un objeto");
      }
      lastGoodCatalog = parsed;
      const nextUrl = String(parsed.catalogUrl || "").trim();
      if (!nextUrl || nextUrl.toLowerCase() === currentUrl.toLowerCase()) return parsed;
      const validated = new URL(nextUrl);
      if (validated.protocol !== "https:") throw new Error("catalogUrl debe usar HTTPS");
      currentUrl = validated.href;
    } catch (error) {
      console.error("No se pudo cargar el catálogo original; se conserva el último JSON válido", error);
      return lastGoodCatalog;
    }
  }
  return lastGoodCatalog;
}

function sameCatalogItem(left, right) {
  if (!left || !right) return false;
  const leftId = String(left.id || left.contentId || left.slug || "").toLowerCase();
  const rightId = String(right.id || right.contentId || right.slug || "").toLowerCase();
  if (leftId && rightId && leftId === rightId) return true;
  const leftUrl = String(left.Url || left.url || left.streamUrl || "").toLowerCase();
  const rightUrl = String(right.Url || right.url || right.streamUrl || "").toLowerCase();
  return Boolean(leftUrl && rightUrl && leftUrl === rightUrl);
}

function upsertCatalogItem(items, item) {
  const index = items.findIndex(function (current) {
    return sameCatalogItem(current, item);
  });
  if (index >= 0) items[index] = item;
  else items.push(item);
}

async function buildFenixCategory(baseUrl, nowSeconds) {
  const channels = [];
  for (const channelKey of Object.keys(CANALES)) {
    try {
      const schedule = await getSchedule(channelKey);
      const events = guideWindow(schedule, nowSeconds);
      const status = scheduleSummary(schedule, nowSeconds, events);
      channels.push({
        id: "fenix-live-" + channelKey,
        contentId: "fenix-live-" + channelKey,
        Title: schedule.channelName,
        Description: schedule.channelDescription,
        Url: baseUrl + "/" + channelKey + "/live.m3u8",
        streamFormat: "hls",
        mediaType: "livefeed",
        contentType: "livefeed",
        quality: "Full HD",
        audio: "Español",
        tagline: "AHORA: " + status.now.title + " · DESPUÉS: " + status.next.title,
        statusUrl: baseUrl + "/" + channelKey + "/status",
        guideUrl: baseUrl + "/" + channelKey + "/guide.json",
        epg: events,
        enabled: true,
      });
    } catch (error) {
      console.error("No se agregó " + channelKey + " al catálogo", error);
    }
  }
  if (!channels.length) throw new Error("Ninguno de los canales nuevos pudo cargar sus fuentes HLS");
  return {
    Title: "Fénix en vivo",
    Key: "fenix_en_vivo",
    Description: "Canales lineales originales con películas, series y cortes comerciales.",
    enabled: true,
    Channels: channels,
  };
}

function mergeFenixCategory(catalog, fenixCategory) {
  const categories = Array.isArray(catalog.tvCategories) ? catalog.tvCategories : [];
  const wanted = String(fenixCategory.Key).toLowerCase();
  let existing = categories.find(function (category) {
    return String(category && (category.Key || category.key) || "").toLowerCase() === wanted;
  });

  if (!existing) {
    existing = { ...fenixCategory, Channels: [] };
    categories.push(existing);
  } else {
    existing.Title = fenixCategory.Title;
    existing.Key = fenixCategory.Key;
    existing.Description = fenixCategory.Description;
    existing.enabled = true;
  }

  if (!Array.isArray(existing.Channels)) existing.Channels = [];
  for (const channel of fenixCategory.Channels) upsertCatalogItem(existing.Channels, channel);
  catalog.tvCategories = categories;
  return catalog;
}

async function buildMergedCatalog(request, env) {
  const nowSeconds = Date.now() / 1000;
  const baseUrl = publicBaseUrl(request, env);
  const catalog = await fetchUpstreamCatalog(env, baseUrl + "/catalog.json");

  // Evita que la app siga un catalogUrl del catálogo original y pierda esta mezcla.
  delete catalog.catalogUrl;
  try {
    const fenixCategory = await buildFenixCategory(baseUrl, nowSeconds);
    mergeFenixCategory(catalog, fenixCategory);
    catalog.fenixPremiere = {
      version: WORKER_VERSION,
      ready: fenixCategory.Channels.length === Object.keys(CANALES).length,
      channelCount: fenixCategory.Channels.length,
      generatedAt: new Date().toISOString(),
      worker: baseUrl,
    };
  } catch (error) {
    // El catálogo original sigue disponible aun cuando una fuente HLS nueva falle.
    console.error("Los canales Fénix en vivo no están listos; se conserva el catálogo original", error);
    catalog.fenixPremiere = {
      version: WORKER_VERSION,
      ready: false,
      generatedAt: new Date().toISOString(),
      worker: baseUrl,
      error: errorText(error),
    };
  }
  return catalog;
}


// ============ RESPUESTAS HTTP ============

function commonCorsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, HEAD, OPTIONS",
    "access-control-allow-headers": "*",
    "x-content-type-options": "nosniff",
  };
}

function hlsHeaders() {
  return {
    ...commonCorsHeaders(),
    "content-type": "application/vnd.apple.mpegurl; charset=utf-8",
    "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
    "cdn-cache-control": "no-store",
    pragma: "no-cache",
  };
}

function jsonHeaders() {
  return {
    ...commonCorsHeaders(),
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
    "cdn-cache-control": "no-store",
    pragma: "no-cache",
  };
}

function jsonResponse(value, status, headOnly) {
  return new Response(headOnly ? null : JSON.stringify(value, null, 2), {
    status: status || 200,
    headers: jsonHeaders(),
  });
}

function textResponse(value, status, headOnly, headers) {
  return new Response(headOnly ? null : value, {
    status: status || 200,
    headers: headers || { ...commonCorsHeaders(), "content-type": "text/plain; charset=utf-8" },
  });
}

async function allChannelGuide(request, env, headOnly) {
  const baseUrl = publicBaseUrl(request, env);
  const nowSeconds = Date.now() / 1000;
  const channels = [];
  for (const channelKey of Object.keys(CANALES)) {
    try {
      const schedule = await getSchedule(channelKey);
      const events = guideWindow(schedule, nowSeconds);
      const summary = scheduleSummary(schedule, nowSeconds, events);
      channels.push({
        id: channelKey,
        channel: schedule.channelName,
        ready: true,
        liveUrl: baseUrl + "/" + channelKey + "/live.m3u8",
        now: summary.now,
        next: summary.next,
        nowContent: summary.nowContent,
        progressPercent: summary.progressPercent,
        epg: events,
      });
    } catch (error) {
      channels.push({ id: channelKey, channel: CANALES[channelKey].nombre, ready: false, error: errorText(error) });
    }
  }
  return jsonResponse({ version: WORKER_VERSION, generatedAt: new Date().toISOString(), channels }, 200, headOnly);
}


// ============ MANEJADOR PRINCIPAL ============

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = normalizePath(url.pathname);
    const headOnly = request.method === "HEAD";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: commonCorsHeaders() });
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      return textResponse("Método no permitido", 405, headOnly, {
        ...commonCorsHeaders(),
        "content-type": "text/plain; charset=utf-8",
        allow: "GET, HEAD, OPTIONS",
      });
    }

    try {
      const baseUrl = publicBaseUrl(request, env);
      if (path === "/") {
        return jsonResponse(
          {
            service: "fenix-premiere-worker",
            version: WORKER_VERSION,
            mensaje: "Dos canales HLS lineales con programación y cortes comerciales.",
            catalog: baseUrl + "/catalog.json",
            catalogFragment: baseUrl + "/catalog-fragment.json",
            guide: baseUrl + "/guide.json",
            canales: Object.keys(CANALES).map(function (key) {
              return {
                id: key,
                nombre: CANALES[key].nombre,
                live: baseUrl + "/" + key + "/live.m3u8",
                status: baseUrl + "/" + key + "/status",
                guide: baseUrl + "/" + key + "/guide.json",
              };
            }),
          },
          200,
          headOnly,
        );
      }

      if (path === "/catalog.json") {
        return jsonResponse(await buildMergedCatalog(request, env), 200, headOnly);
      }
      if (path === "/catalog-fragment.json") {
        const category = await buildFenixCategory(baseUrl, Date.now() / 1000);
        return jsonResponse({ tvCategories: [category] }, 200, headOnly);
      }
      if (path === "/guide.json" || path === "/epg.json") {
        return allChannelGuide(request, env, headOnly);
      }
      if (path === "/health") {
        const channels = [];
        for (const key of Object.keys(CANALES)) {
          try {
            const schedule = await getSchedule(key);
            channels.push({
              id: key,
              ready: schedule.segments.length > 0,
              segments: schedule.segments.length,
              blocks: schedule.blocks.length,
              cycleDurationSeconds: Number(schedule.total.toFixed(3)),
            });
          } catch (error) {
            channels.push({ id: key, ready: false, error: errorText(error) });
          }
        }
        const ready = channels.every(function (channel) { return channel.ready; });
        return jsonResponse({ success: ready, version: WORKER_VERSION, channels }, ready ? 200 : 503, headOnly);
      }

      const pathParts = path.split("/").filter(Boolean);
      const channelKey = pathParts[0] || "";
      if (!CANALES[channelKey]) {
        return jsonResponse({ success: false, error: "Canal o ruta no encontrada." }, 404, headOnly);
      }

      const route = "/" + pathParts.slice(1).join("/");
      const schedule = await getSchedule(channelKey);
      const nowSeconds = Date.now() / 1000;
      const state = getLiveState(schedule, nowSeconds);

      if (route === "/live.m3u8" || route === "/") {
        const playlist = buildLivePlaylist(schedule, state);
        return textResponse(playlist, 200, headOnly, hlsHeaders());
      }
      if (route === "/status") {
        const events = guideWindow(schedule, nowSeconds);
        const summary = scheduleSummary(schedule, nowSeconds, events);
        return jsonResponse(summary, 200, headOnly);
      }
      if (route === "/guide.json" || route === "/epg.json") {
        const events = guideWindow(schedule, nowSeconds);
        const summary = scheduleSummary(schedule, nowSeconds, events);
        return jsonResponse(
          {
            id: channelKey,
            channel: schedule.channelName,
            liveUrl: baseUrl + "/" + channelKey + "/live.m3u8",
            generatedAt: new Date().toISOString(),
            now: summary.now,
            next: summary.next,
            nowContent: summary.nowContent,
            progressPercent: summary.progressPercent,
            epg: events,
          },
          200,
          headOnly,
        );
      }

      return jsonResponse({ success: false, error: "Ruta del canal no encontrada." }, 404, headOnly);
    } catch (error) {
      console.error("Error generando Fénix Premiere", error);
      return jsonResponse(
        { success: false, error: "Error generando la señal: " + errorText(error) },
        502,
        headOnly,
      );
    }
  },
};

export const __test = {
  buildSchedule,
  buildLivePlaylist,
  getLiveState,
  nowAndNext,
  buildGuide,
  mergeFenixCategory,
};
