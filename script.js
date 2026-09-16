document.getElementById("year").textContent = new Date().getFullYear();

/**
 * Carrusel de atributos: un track con scroll-snap horizontal, navegado por
 * botones prev/next y puntos (generados según la cantidad real de slides,
 * así no hay que tocar JS si se agrega o quita un grupo). El track sigue
 * siendo un <div> con overflow, no una librería -- el sitio es HTML/CSS/JS
 * plano a propósito (ver README).
 */
function iniciarCarrusel() {
  const carrusel = document.querySelector("[data-carousel]");
  if (!carrusel) return;

  const track = carrusel.querySelector("[data-carousel-track]");
  const slides = Array.from(carrusel.querySelectorAll("[data-carousel-slide]"));
  const dotsWrap = carrusel.querySelector("[data-carousel-dots]");
  const btnPrev = carrusel.querySelector("[data-carousel-prev]");
  const btnNext = carrusel.querySelector("[data-carousel-next]");
  if (!track || slides.length === 0 || !dotsWrap) return;

  const dots = slides.map((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "carousel-dot";
    dot.setAttribute("aria-label", `Ir al grupo ${i + 1}`);
    dot.addEventListener("click", () => irASlide(i));
    dotsWrap.appendChild(dot);
    return dot;
  });

  function indiceActual() {
    // El slide activo es el más cercano al borde izquierdo del track.
    const izquierda = track.scrollLeft;
    let mejor = 0;
    let mejorDistancia = Infinity;
    slides.forEach((slide, i) => {
      const distancia = Math.abs(slide.offsetLeft - izquierda);
      if (distancia < mejorDistancia) {
        mejorDistancia = distancia;
        mejor = i;
      }
    });
    return mejor;
  }

  function marcarActivo() {
    const actual = indiceActual();
    dots.forEach((dot, i) => dot.classList.toggle("is-active", i === actual));
  }

  function irASlide(i) {
    const objetivo = slides[Math.max(0, Math.min(slides.length - 1, i))];
    track.scrollTo({ left: objetivo.offsetLeft, behavior: "smooth" });
  }

  btnPrev?.addEventListener("click", () => irASlide(indiceActual() - 1));
  btnNext?.addEventListener("click", () => irASlide(indiceActual() + 1));

  // Mientras se hace scroll/swipe manual, los puntos se actualizan solos.
  let scrollTimer;
  track.addEventListener("scroll", () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(marcarActivo, 80);
  });

  window.addEventListener("resize", marcarActivo);

  marcarActivo();
}

iniciarCarrusel();

/**
 * Trae la última release de `neto-releases` (repo público, sin token) y
 * conecta cada botón de descarga al asset real -- así el sitio nunca queda
 * desincronizado de la versión que la app usa para autoactualizarse.
 *
 * Si la llamada falla (sin red, rate limit de GitHub sin auth), los botones
 * ya tienen como fallback un link a la página de releases -- nunca quedan
 * rotos, solo menos directos.
 */
async function cargarDescargas() {
  const metaAndroid = document.querySelector("#download-android [data-role='meta']");
  const linkAndroid = document.querySelector("#download-android [data-role='link']");
  const metaWindows = document.querySelector("#download-windows [data-role='meta']");
  const linkWindows = document.querySelector("#download-windows [data-role='link']");

  try {
    const resp = await fetch(
      "https://api.github.com/repos/cghassibe/neto-releases/releases/latest",
      { headers: { Accept: "application/vnd.github+json" } },
    );
    if (!resp.ok) throw new Error(`GitHub respondió ${resp.status}`);
    const release = await resp.json();
    const version = (release.tag_name || "").replace(/^v/, "") || null;
    const assets = Array.isArray(release.assets) ? release.assets : [];

    const apk = assets.find((a) => a.name.toLowerCase().endsWith(".apk"));
    const exe = assets.find((a) => a.name.toLowerCase().endsWith(".exe"));

    if (apk) {
      linkAndroid.href = apk.browser_download_url;
      metaAndroid.textContent = version ? `Versión ${version}` : "Última versión";
    } else {
      metaAndroid.textContent = "Aún no hay APK publicado";
    }

    if (exe) {
      linkWindows.href = exe.browser_download_url;
      linkWindows.textContent = "Descargar instalador";
      linkWindows.classList.remove("is-disabled");
      linkWindows.removeAttribute("aria-disabled");
      metaWindows.textContent = version ? `Versión ${version}` : "Última versión";
    } else {
      metaWindows.textContent = "Próximamente";
    }
  } catch (err) {
    // Sin red o GitHub no respondió: los links de fallback ya apuntan a la
    // página de releases, así que no hace falta hacer nada más acá -- solo
    // dejar constancia en consola para depurar si hace falta.
    console.warn("No se pudo consultar la última release:", err);
    metaAndroid.textContent = "Ver en GitHub";
  }
}

cargarDescargas();
