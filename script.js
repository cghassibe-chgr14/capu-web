document.getElementById("year").textContent = new Date().getFullYear();

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
