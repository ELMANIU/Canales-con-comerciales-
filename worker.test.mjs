import assert from "node:assert/strict";
import test from "node:test";

import worker, { __test } from "../src/index.js";

function mediaPlaylist(prefix, segmentCount, duration) {
  const lines = [
    "#EXTM3U",
    "#EXT-X-VERSION:3",
    "#EXT-X-TARGETDURATION:" + Math.ceil(duration),
    "#EXT-X-MEDIA-SEQUENCE:0",
    "#EXT-X-PLAYLIST-TYPE:VOD",
  ];
  for (let index = 0; index < segmentCount; index += 1) {
    lines.push("#EXTINF:" + duration.toFixed(3) + ",");
    lines.push(prefix + "-" + index + ".ts");
  }
  lines.push("#EXT-X-ENDLIST");
  return lines.join("\n") + "\n";
}

const originalCatalog = {
  movies: [{ id: "movie-existing", Title: "Película existente", Stream: "https://example.test/movie.mp4" }],
  series: [{ id: "series-existing", Title: "Serie existente", episodes: [] }],
  tvCategories: [
    {
      Title: "Noticias",
      Key: "noticias",
      Channels: [{ id: "news-existing", Title: "Noticias", Url: "https://example.test/news.m3u8" }],
    },
  ],
  catalogUrl: "https://example.test/redirect-that-must-be-removed.json",
};

globalThis.fetch = async function (input) {
  const url = String(input);
  if (url.includes("raw.githubusercontent.com")) {
    return new Response(JSON.stringify(originalCatalog), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
  if (url === "https://example.test/redirect-that-must-be-removed.json") {
    const redirected = { ...originalCatalog };
    delete redirected.catalogUrl;
    return new Response(JSON.stringify(redirected), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
  if (url.endsWith("/x36xhzz.m3u8")) {
    return new Response(
      "#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=800000\nlow.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=2400000\nhigh.m3u8\n",
      { status: 200 },
    );
  }
  if (url.endsWith("/high.m3u8")) {
    return new Response(mediaPlaylist("movie", 180, 10), { status: 200 });
  }
  if (url.endsWith("/low.m3u8")) {
    return new Response(mediaPlaylist("movie-low", 180, 10), { status: 200 });
  }
  if (url.endsWith("/test_001/stream.m3u8")) {
    return new Response(mediaPlaylist("series", 120, 10), { status: 200 });
  }
  throw new Error("URL inesperada en prueba: " + url);
};

async function request(path) {
  return worker.fetch(new Request("https://fenix-premiere-worker.test" + path), {});
}

test("la señal premiere genera una playlist HLS lineal", async function () {
  const response = await request("/premiere/live.m3u8");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /mpegurl/i);
  const body = await response.text();
  assert.match(body, /^#EXTM3U/m);
  assert.match(body, /#EXT-X-PROGRAM-DATE-TIME:/);
  assert.match(body, /#EXT-X-DISCONTINUITY/);
  assert.match(body, /https:\/\/test-streams\.mux\.dev\/(?:x36xhzz|test_001)\//);
});

test("status entrega AHORA, DESPUES y progreso", async function () {
  const response = await request("/premiere/status");
  assert.equal(response.status, 200);
  const status = await response.json();
  assert.equal(status.id, "premiere");
  assert.ok(status.now.title);
  assert.ok(status.next.title);
  assert.ok(status.now.start.endsWith("Z"));
  assert.ok(status.now.end.endsWith("Z"));
  assert.ok(status.progressPercent >= 0 && status.progressPercent <= 100);
});

test("la guía contiene programas y cortes comerciales", async function () {
  const response = await request("/fenixmix/guide.json");
  assert.equal(response.status, 200);
  const guide = await response.json();
  assert.ok(Array.isArray(guide.epg));
  assert.ok(guide.epg.length > 10);
  assert.ok(guide.epg.some(function (event) { return event.isCommercial === true; }));
  assert.ok(guide.epg.some(function (event) { return event.type === "pelicula" || event.type === "serie"; }));
});

test("un corte intermedio retoma el programa en el segmento siguiente", async function () {
  const schedule = await __test.buildSchedule("premiere");
  const firstCommercial = schedule.blocks.findIndex(function (block) { return block.isCommercial; });
  assert.ok(firstCommercial > 0);
  const before = schedule.blocks[firstCommercial - 1];
  const after = schedule.blocks[firstCommercial + 1];
  assert.equal(before.title, after.title);
  const beforeSegments = schedule.segments.filter(function (segment) { return segment.blockIndex === before.index; });
  const afterSegments = schedule.segments.filter(function (segment) { return segment.blockIndex === after.index; });
  assert.equal(afterSegments[0].localIndex, beforeSegments.at(-1).localIndex + 1);
});

test("catalog.json conserva el catálogo existente e inyecta los dos canales", async function () {
  const response = await request("/catalog.json");
  assert.equal(response.status, 200);
  const catalog = await response.json();
  assert.equal(catalog.movies[0].id, "movie-existing");
  assert.equal(catalog.catalogUrl, undefined);
  const category = catalog.tvCategories.find(function (item) { return item.Key === "fenix_en_vivo"; });
  assert.ok(category);
  assert.equal(category.Channels.length, 2);
  assert.deepEqual(
    category.Channels.map(function (channel) { return channel.id; }).sort(),
    ["fenix-live-fenixmix", "fenix-live-premiere"],
  );
  for (const channel of category.Channels) {
    assert.match(channel.Url, /^https:\/\/fenix-premiere-worker\.test\//);
    assert.ok(Array.isArray(channel.epg));
    assert.ok(channel.epg.length > 0);
  }
});

test("rutas inválidas y métodos no permitidos responden correctamente", async function () {
  const missing = await request("/no-existe");
  assert.equal(missing.status, 404);
  const post = await worker.fetch(
    new Request("https://fenix-premiere-worker.test/premiere/live.m3u8", { method: "POST" }),
    {},
  );
  assert.equal(post.status, 405);
});
