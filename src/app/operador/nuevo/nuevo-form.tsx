"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { crearNegocio } from "../actions";

const DIAS = [
  { n: 1, nombre: "Lunes" },
  { n: 2, nombre: "Martes" },
  { n: 3, nombre: "Miércoles" },
  { n: 4, nombre: "Jueves" },
  { n: 5, nombre: "Viernes" },
  { n: 6, nombre: "Sábado" },
  { n: 0, nombre: "Domingo" },
];

type DiaHorario = { activo: boolean; d1: string; h1: string; d2: string; h2: string };

const HORARIO_INICIAL: Record<number, DiaHorario> = {
  1: { activo: true, d1: "09:00", h1: "13:00", d2: "14:00", h2: "19:00" },
  2: { activo: true, d1: "09:00", h1: "13:00", d2: "14:00", h2: "19:00" },
  3: { activo: true, d1: "09:00", h1: "13:00", d2: "14:00", h2: "19:00" },
  4: { activo: true, d1: "09:00", h1: "13:00", d2: "14:00", h2: "19:00" },
  5: { activo: true, d1: "09:00", h1: "13:00", d2: "14:00", h2: "19:00" },
  6: { activo: true, d1: "09:00", h1: "14:00", d2: "", h2: "" },
  0: { activo: false, d1: "09:00", h1: "13:00", d2: "", h2: "" },
};

type FilaServicio = { nombre: string; descripcion: string; minutos: string; precio: string };

function slugDe(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

const campo =
  "mt-1 w-full rounded-xl border border-white/15 bg-ink-3 px-3 py-2.5 outline-none focus:border-accent";
const etiqueta = "text-sm font-semibold";

export function NuevoForm() {
  const router = useRouter();
  const [creado, setCreado] = useState<{
    slug: string;
    email: string;
    contrasena?: string;
    aviso?: string;
  } | null>(null);
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEditado, setSlugEditado] = useState(false);
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [servicios, setServicios] = useState<FilaServicio[]>([
    { nombre: "", descripcion: "", minutos: "30", precio: "" },
  ]);
  const [profesionales, setProfesionales] = useState<string[]>([""]);
  const [horario, setHorario] = useState(HORARIO_INICIAL);
  const [duenoEmail, setDuenoEmail] = useState("");
  const [duenoNombre, setDuenoNombre] = useState("");
  const [anticipacion, setAnticipacion] = useState("60");
  const [ventana, setVentana] = useState("30");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function cambiarNombre(valor: string) {
    setNombre(valor);
    if (!slugEditado) setSlug(slugDe(valor));
  }

  function actualizarServicio(i: number, cambios: Partial<FilaServicio>) {
    setServicios((lista) => lista.map((s, j) => (j === i ? { ...s, ...cambios } : s)));
  }

  function actualizarDia(n: number, cambios: Partial<DiaHorario>) {
    setHorario((h) => ({ ...h, [n]: { ...h[n], ...cambios } }));
  }

  async function enviar() {
    setEnviando(true);
    setError(null);

    const tramos: { dia: number; desde: string; hasta: string }[] = [];
    for (const { n } of DIAS) {
      const d = horario[n];
      if (!d.activo) continue;
      tramos.push({ dia: n, desde: d.d1, hasta: d.h1 });
      if (d.d2 && d.h2) tramos.push({ dia: n, desde: d.d2, hasta: d.h2 });
    }

    const r = await crearNegocio({
      slug,
      nombre,
      email,
      telefono,
      direccion,
      anticipacionMinutos: Number(anticipacion),
      ventanaDias: Number(ventana),
      servicios: servicios.map((s) => ({
        nombre: s.nombre,
        descripcion: s.descripcion,
        duracionMinutos: Number(s.minutos),
        precio: Number(s.precio || 0),
      })),
      profesionales: profesionales.map((p) => ({ nombre: p })),
      horario: tramos,
      duenoEmail,
      duenoNombre,
    });
    setEnviando(false);

    if (!r.ok) {
      setError(r.mensaje);
      return;
    }
    // Con un dueño nuevo hay que mostrar la contraseña provisoria una sola vez, antes de salir.
    if (r.acceso) setCreado({ slug: r.slug, ...r.acceso });
    else router.push(`/operador?creado=${encodeURIComponent(r.slug)}`);
  }

  if (creado) {
    return (
      <section className="space-y-4 rounded-3xl border border-accent/40 bg-accent/10 p-6">
        <h2 className="font-display text-2xl font-bold">Listo, «{creado.slug}» quedó creado</h2>
        {creado.contrasena ? (
          <>
            <p className="text-white/75">
              Pasale estos datos al dueño. La contraseña es provisoria: al entrar por primera vez el
              panel le pide elegir una propia. Después de salir de esta pantalla no se vuelve a
              mostrar.
            </p>
            <dl className="space-y-3 rounded-2xl border border-white/15 bg-ink-2 p-4">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-white/50">
                  Entrar en
                </dt>
                <dd className="font-semibold">{`${typeof window === "undefined" ? "" : window.location.origin}/login`}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-white/50">
                  Mail
                </dt>
                <dd className="font-semibold">{creado.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-white/50">
                  Contraseña provisoria
                </dt>
                <dd className="font-mono text-lg font-bold select-all">{creado.contrasena}</dd>
              </div>
            </dl>
          </>
        ) : (
          <p className="text-white/75">{creado.aviso}</p>
        )}
        <button
          type="button"
          onClick={() => router.push(`/operador?creado=${encodeURIComponent(creado.slug)}`)}
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-6 font-bold text-accent-ink"
        >
          Ya la anoté, volver
        </button>
      </section>
    );
  }

  return (
    <form
      className="space-y-10"
      onSubmit={(e) => {
        e.preventDefault();
        void enviar();
      }}
    >
      {error && (
        <p
          role="alert"
          className="sticky top-3 z-10 rounded-2xl border border-red-400/40 bg-red-950/90 px-4 py-3 text-sm text-red-100 backdrop-blur"
        >
          {error}
        </p>
      )}

      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold">1. El negocio</h2>
        <label className="block">
          <span className={etiqueta}>Nombre</span>
          <input
            value={nombre}
            onChange={(e) => cambiarNombre(e.target.value)}
            required
            className={campo}
          />
        </label>
        <label className="block">
          <span className={etiqueta}>
            Dirección web <span className="font-normal text-white/50">(/slug)</span>
          </span>
          <input
            value={slug}
            onChange={(e) => {
              setSlugEditado(true);
              setSlug(slugDe(e.target.value));
            }}
            required
            className={campo}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={etiqueta}>Mail del negocio</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className={campo}
            />
          </label>
          <label className="block">
            <span className={etiqueta}>Teléfono / WhatsApp</span>
            <input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              type="tel"
              className={campo}
            />
          </label>
        </div>
        <label className="block">
          <span className={etiqueta}>Dirección</span>
          <input
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            className={campo}
          />
        </label>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold">2. Servicios</h2>
        {servicios.map((s, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-ink-2 p-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_6rem_7rem]">
              <label className="block">
                <span className={etiqueta}>Nombre</span>
                <input
                  value={s.nombre}
                  onChange={(e) => actualizarServicio(i, { nombre: e.target.value })}
                  className={campo}
                />
              </label>
              <label className="block">
                <span className={etiqueta}>Minutos</span>
                <input
                  value={s.minutos}
                  onChange={(e) => actualizarServicio(i, { minutos: e.target.value })}
                  type="number"
                  min={5}
                  max={600}
                  step={5}
                  className={campo}
                />
              </label>
              <label className="block">
                <span className={etiqueta}>Precio ($)</span>
                <input
                  value={s.precio}
                  onChange={(e) => actualizarServicio(i, { precio: e.target.value })}
                  type="number"
                  min={0}
                  className={campo}
                />
              </label>
            </div>
            <label className="mt-3 block">
              <span className={etiqueta}>
                Descripción <span className="font-normal text-white/50">(opcional)</span>
              </span>
              <input
                value={s.descripcion}
                onChange={(e) => actualizarServicio(i, { descripcion: e.target.value })}
                className={campo}
              />
            </label>
            {servicios.length > 1 && (
              <button
                type="button"
                onClick={() => setServicios((l) => l.filter((_, j) => j !== i))}
                className="mt-3 text-sm text-white/55 hover:text-red-300"
              >
                Quitar servicio
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setServicios((l) => [...l, { nombre: "", descripcion: "", minutos: "30", precio: "" }])
          }
          className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold hover:border-accent hover:text-accent"
        >
          + Otro servicio
        </button>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold">3. Profesionales</h2>
        <p className="text-sm text-white/55">
          Todos hacen todos los servicios y tienen el horario de abajo. Un negocio de una sola
          persona carga un solo profesional.
        </p>
        {profesionales.map((p, i) => (
          <div key={i} className="flex items-center gap-3">
            <input
              value={p}
              onChange={(e) =>
                setProfesionales((l) => l.map((x, j) => (j === i ? e.target.value : x)))
              }
              placeholder="Nombre"
              aria-label={`Profesional ${i + 1}`}
              className={campo + " mt-0"}
            />
            {profesionales.length > 1 && (
              <button
                type="button"
                onClick={() => setProfesionales((l) => l.filter((_, j) => j !== i))}
                className="shrink-0 text-sm text-white/55 hover:text-red-300"
              >
                Quitar
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setProfesionales((l) => [...l, ""])}
          className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold hover:border-accent hover:text-accent"
        >
          + Otro profesional
        </button>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold">4. Horario de atención</h2>
        <p className="text-sm text-white/55">
          Un segundo tramo es opcional (horario partido): dejalo vacío si abren corrido.
        </p>
        <div className="space-y-2">
          {DIAS.map(({ n, nombre: dia }) => {
            const d = horario[n];
            return (
              <div
                key={n}
                className="grid items-center gap-2 rounded-xl border border-white/10 bg-ink-2 p-3 sm:grid-cols-[8rem_1fr_1fr]"
              >
                <label className="flex items-center gap-2 font-semibold">
                  <input
                    type="checkbox"
                    checked={d.activo}
                    onChange={(e) => actualizarDia(n, { activo: e.target.checked })}
                    className="size-4 accent-accent"
                  />
                  {dia}
                </label>
                <div className="flex items-center gap-2 disabled:opacity-40">
                  <input
                    type="time"
                    value={d.d1}
                    disabled={!d.activo}
                    onChange={(e) => actualizarDia(n, { d1: e.target.value })}
                    aria-label={`${dia}: abre`}
                    className={campo + " mt-0 disabled:opacity-30"}
                  />
                  <span>a</span>
                  <input
                    type="time"
                    value={d.h1}
                    disabled={!d.activo}
                    onChange={(e) => actualizarDia(n, { h1: e.target.value })}
                    aria-label={`${dia}: cierra`}
                    className={campo + " mt-0 disabled:opacity-30"}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={d.d2}
                    disabled={!d.activo}
                    onChange={(e) => actualizarDia(n, { d2: e.target.value })}
                    aria-label={`${dia}: segundo tramo, abre`}
                    className={campo + " mt-0 disabled:opacity-30"}
                  />
                  <span>a</span>
                  <input
                    type="time"
                    value={d.h2}
                    disabled={!d.activo}
                    onChange={(e) => actualizarDia(n, { h2: e.target.value })}
                    aria-label={`${dia}: segundo tramo, cierra`}
                    className={campo + " mt-0 disabled:opacity-30"}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={etiqueta}>Anticipación mínima (minutos)</span>
            <input
              value={anticipacion}
              onChange={(e) => setAnticipacion(e.target.value)}
              type="number"
              min={0}
              className={campo}
            />
          </label>
          <label className="block">
            <span className={etiqueta}>Se puede reservar hasta (días)</span>
            <input
              value={ventana}
              onChange={(e) => setVentana(e.target.value)}
              type="number"
              min={1}
              max={365}
              className={campo}
            />
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold">5. Dueño (opcional)</h2>
        <p className="text-sm text-white/55">
          Con su mail va a poder entrar a su agenda desde /login. Sin mail, el negocio funciona
          igual y las reservas las ves vos.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={etiqueta}>Mail del dueño</span>
            <input
              value={duenoEmail}
              onChange={(e) => setDuenoEmail(e.target.value)}
              type="email"
              className={campo}
            />
          </label>
          <label className="block">
            <span className={etiqueta}>Nombre</span>
            <input
              value={duenoNombre}
              onChange={(e) => setDuenoNombre(e.target.value)}
              className={campo}
            />
          </label>
        </div>
      </section>

      <button
        type="submit"
        disabled={enviando}
        className="inline-flex min-h-12 items-center rounded-full bg-accent px-8 font-bold text-accent-ink transition hover:brightness-110 disabled:opacity-40"
      >
        {enviando ? "Creando…" : "Crear negocio"}
      </button>
    </form>
  );
}
