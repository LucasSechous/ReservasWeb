// Tipografías para las imágenes de vista previa (opengraph-image.tsx). ImageResponse solo trae una
// fuente regular, así que los títulos piden a Google Fonts la misma letra de cada landing, recortada a
// los caracteres que se usan. El resto del texto va en Geist (TEXTO), cargada igual: si una fuente recortada
// fuera la única, los caracteres que le faltan saldrían de otra y se mezclarían. Si Google no responde, la
// imagen sale igual con la fuente por defecto.
export const TEXTO = "Geist";

type Fuente = { name: string; data: ArrayBuffer; weight: 400 | 500 | 600 | 700 | 800; style: "normal" };

export async function cargarFuente(
  familia: string,
  peso: Fuente["weight"],
  texto: string,
): Promise<Fuente[]> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${familia.replaceAll(" ", "+")}:wght@${peso}&text=${encodeURIComponent(texto)}`,
    ).then((r) => r.text());
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!url) return [];
    const data = await fetch(url).then((r) => r.arrayBuffer());
    return [{ name: familia, data, weight: peso, style: "normal" }];
  } catch {
    return [];
  }
}
