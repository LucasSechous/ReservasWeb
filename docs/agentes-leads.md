# Agentes de leads

Corren como rutinas programadas en la nube de Anthropic, no en esta máquina. Se comunican solo a través del
**tracker** (un artefacto de Claude con su propia base): https://claude.ai/artifact/AxEQG2t2U6apWecR21TKs3

**Regla de oro: ningún agente le escribe a un lead.** Todo queda como borrador y lo manda Lucas, con un toque,
desde el tracker. Cambiar eso es una decisión de Lucas.

## Rutinas

| Rutina | Cuándo (hora de Uruguay) | Qué hace | Id |
| --- | --- | --- | --- |
| Prospección | lunes y jueves, madrugada | Busca negocios, los califica con la rúbrica y carga leads nuevos | `trig_01UEQQ9qdePdQSarRC7YsnnD` |
| Redactor | lunes a viernes, 07:30 | Deja escritos el primer mensaje, la versión por mail y dos seguimientos de cada lead nuevo | `trig_016z3aox6T1QYjsyhdEhRYgf` |
| Demos | lunes a viernes, 08:27 | Arma la demo de los leads con demo pedida | `trig_01Tp1u39cpTPL1q7Hib5WNzY` |
| Orquestador | lunes a viernes, 09:00 | Solo lee el tracker y le avisa a Lucas qué necesita hoy | `trig_019ouvgsgp1NUqB165F9KR6Q` |

El agente de demos todavía arma páginas sueltas desde `main`. Con el sistema actual, una demo es una fila en la
base, una entrada en `src/lib/tema.ts` y fotos (ver `docs/fotos-demos.md`). Falta actualizarlo.

## Qué escribe el redactor en cada lead

Solo escribe los campos que faltan, y solo en leads con estado `nuevo`:

- `mensaje`: primer mensaje para WhatsApp o Instagram.
- `mensajeMail`: `{ asunto, cuerpo }`.
- `seguimiento1`: para mandar a los 4 días si no respondió.
- `seguimiento2`: para mandar a los 10 días. Es el último.
- `seguimientos`: cuántos seguimientos mandó Lucas (empieza en 0).

## Cómo se manda (tracker)

Cada tarjeta muestra lo que toca mandar ahora y los botones para hacerlo:

- **Abrir WhatsApp**: abre el chat con el número del lead y el mensaje ya escrito (`wa.me`). Si el lead no tiene
  celular pero sí Instagram, abre su perfil, y el mensaje se copia y se pega en el chat.
- **Copiar asunto / Copiar texto**: para el mail. Los links `mailto:` no son confiables dentro de un artefacto.
- **Ya lo mandé**: pasa el lead a `contactado` y arranca el reloj de los seguimientos. Abrir el chat no cuenta
  como enviado hasta que se toca este botón.
- **Ya mandé el seguimiento**: suma uno a `seguimientos`.

Plazos: primer seguimiento a los 4 días del contacto, segundo a los 10. Después ya no corresponde avisar.

## Pendiente

- Agente de propuestas (faltan paquetes y precios).
- Actualizar el agente de demos al sistema actual.
- Completar `senales` (profesionales y actividad) en los leads.
- Telegram: descartado por ahora. Alcanza con la notificación del orquestador y los botones del tracker.
