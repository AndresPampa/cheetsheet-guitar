# Círculo de Quintas para guitarra

Web interactiva para componer en guitarra. Haces click en una tonalidad del círculo de quintas y se
marcan sus acordes, con grados y calidades (mayor, menor, disminuido). Al lado aparece una tabla con
los 7 modos de la raíz para hacer intercambio modal, con los acordes representativos de cada modo,
los diagramas en la guitarra y el sonido de cada acorde.

## Estado

✅ **v1 completa.** Funcionan el círculo, el interruptor Triadas / Séptimas, la tabla de modos
paralelos, el panel de acorde con sonido y diagrama en la guitarra, la interfaz en español e
inglés, los nombres Do Re Mi, el tema claro / oscuro y la selección guardada en la URL; se usa con
teclado y lector de pantalla, y en el celular. Tests de punta a punta con Playwright.

| Versión | Alcance | Estado |
|---|---|---|
| v1 | Círculo interactivo (triadas/séptimas), tabla de los 7 modos con acordes recomendados, diagramas de acordes, audio al hacer click, ES/EN, C D E / Do Re Mi, accesibilidad y celular | ✅ Completa |
| v2 | Modos de menor armónica y melódica, extensiones (9/11/13, sus, add), armador de progresiones | 💡 Idea |
| v3 | Despliegue y backend para guardar progresiones | 💡 Idea |

## Funcionalidades (v1)

- ✅ **Círculo de quintas**: mayores afuera, menores relativas en el medio y el acorde
  disminuido (vii°) en el anillo interior. Al seleccionar una
  tonalidad se resaltan sus 7 acordes diatónicos con número romano y calidad. Las tonalidades
  enarmónicas (F♯/G♭, C♯/D♭, B/C♭) muestran los dos nombres y se puede cambiar de grafía.
- ✅ **Triadas / Séptimas**: el panel de la tonalidad y la tabla de modos muestran triadas o
  acordes de séptima (maj7, m7, 7, m7♭5).
- ✅ **Tabla de modos paralelos** (jónico… locrio) de la raíz seleccionada: escala, nota
  característica y grados alterados (♭II, ♯iv°, ♭VII). Se marcan los acordes que contienen la nota
  característica, los prestados del jónico y ⭐ el más representativo.
- ✅ **Panel de acorde**: al hacer click en un acorde (panel de tonalidad o tabla de modos) suena
  como un rasgueo y muestra grado, notas, ▶ para repetirlo y en qué modos aparece.
- ✅ **Diagramas en la guitarra** del acorde (trastes, dedos, cejilla, cuerdas al aire y
  silenciadas), con 4 posiciones por acorde para recorrer con ◀ ▶.
- ✅ **Idioma ES / EN** (español por defecto): se traduce todo, incluidos los modos, las calidades
  y lo que anuncia el lector de pantalla.
- ✅ **C D E / Do Re Mi** (C D E por defecto), independiente del idioma: cambia los nombres de las
  notas en toda la app y deja los sufijos de acorde como están (`Fa♯m7`).
- ✅ **Tema claro / oscuro**: sigue al del sistema hasta que elijas uno, y lo recuerda.
- ✅ **La selección queda en la URL** (tonalidad, Triadas / Séptimas, acorde abierto, idioma y
  nombres de notas), así que se puede guardar en favoritos o compartir. Por ejemplo,
  `?key=G&mode=minor&chords=7th&chord=dorian.4` abre G menor con séptimas y el IV7 de G dórico.
- ✅ **Accesible**: todo se usa con teclado (flechas en el círculo), el lector de pantalla anuncia
  cada tonalidad con su armadura y cada acorde con su grado, la calidad no depende solo del color y
  el contraste cumple WCAG 2.1 AA en los dos temas (auditado con axe; el texto del círculo, que axe
  no mide en SVG, con un test propio). En el celular los paneles se apilan sin scroll horizontal,
  incluso a 320 px.

## Arquitectura

Sitio 100 % estático. El código se organiza en módulos con una interfaz chica y la lógica adentro.
La teoría musical vive en `src/theory/`, TypeScript puro sin React, y es la única parte que habla
con `tonal`. La UI no hace cuentas musicales: solo pide datos a `theory` y los presenta.

```mermaid
flowchart LR
    subgraph ui["src/ui — React"]
        KE["AppShell<br/>encabezado + interruptores<br/>+ 3 paneles"]
        COF["CircleOfFifths"]
        KP["KeyPanel<br/>+ Triadas / Séptimas"]
        MT["ModesTable"]
        CP["ChordPanel<br/>▶ + modos donde aparece"]
        KE --> COF & KP & MT & CP
    end

    subgraph state["src/state"]
        URL["useUrlState<br/>selección ↔ URL"]
        THEME["useTheme<br/>localStorage o sistema"]
    end

    subgraph i18n["src/i18n"]
        MSG["getMessages(idioma, nombres)<br/>diccionarios ES / EN"]
        NOT["notation<br/>♯ ♭, Do Re Mi, lectura hablada"]
        MSG --> NOT
    end

    KE --> URL & THEME & MSG
    COF & KP & MT & CP -.->|useMessages| MSG

    subgraph theory["src/theory — TS puro"]
        KEY["key.ts<br/>getKey"]
        MOD["modes.ts<br/>getParallelModes<br/>getModesContaining"]
        CIR["circle.ts<br/>CIRCLE_OF_FIFTHS"]
        MOD --> KEY
        CIR --> KEY
    end

    subgraph audio["src/audio"]
        PORT["AudioPort<br/>playChord(notas)"]
        TONEA["toneAudio<br/>rasgueo, carga diferida"]
        PORT --- TONEA
    end

    TONAL[("tonal")]
    TONEJS[("Tone.js")]

    KE --> KEY & CIR & MOD
    KE --> PORT
    TONEA --> TONEJS
    KEY & MOD & CIR --> TONAL

    subgraph voicings["src/voicings"]
        LV["loadVoicings<br/>chords-db + erratas"]
    end

    DRAW["svguitarDiagram<br/>dibujo del mástil"]
    CHORDSDB[("chords-db")]
    SVGUITAR[("svguitar")]

    KE --> LV & DRAW
    LV --> CHORDSDB
    DRAW --> SVGUITAR
```

Regla de dependencias: `ui` puede usar `state`, `theory`, `voicings`, `audio` e `i18n`; `theory`
no importa nada del proyecto, solo `tonal`.

Qué pasa al hacer click en una tonalidad del círculo:

```mermaid
sequenceDiagram
    actor U as Guitarrista
    participant C as CircleOfFifths
    participant E as AppShell
    participant T as theory
    participant P as KeyPanel
    participant M as ModesTable
    participant CP as ChordPanel

    U->>C: click en "A menor"
    C->>E: onSelect(posición, anillo)
    E->>E: estado = A menor, acorde = i
    E->>E: URL = ?key=A&mode=minor (replaceState)
    E->>T: getKey("A", "minor")
    T-->>E: escala, armadura y 7 acordes
    E->>T: getCircleHighlights(tonalidad)
    E->>C: sectores resaltados con su grado
    E->>T: getParallelModes("A")
    T-->>E: 7 modos con sus acordes y marcas
    E->>P: acordes (triadas o séptimas)
    E->>M: modos de A + triadas / séptimas
    E->>CP: acorde i (Am), sin sonar
```

La corrección musical se prueba contra un **oracle escrito a mano** (nunca contra `tonal`, que
sería circular) más invariantes sobre todas las tonalidades del círculo.

## Stack

TypeScript · React · Vite · [tonal](https://github.com/tonaljs/tonal) (teoría) ·
[Tone.js](https://tonejs.github.io/) (audio) · [svguitar](https://www.npmjs.com/package/svguitar)
(diagramas) · Vitest · Testing Library · Playwright

## Desarrollo

Requiere Node.js ≥ 22.12.

```bash
npm install          # instalar dependencias
npm run dev          # servidor local en http://localhost:5173
npm test             # tests (Vitest)
npx playwright install chromium   # una sola vez, para los tests de punta a punta
npm run test:e2e     # tests de punta a punta (Playwright: escritorio y celular)
npm run lint         # oxlint + chequeo de tipos
npm run build        # build de producción en dist/
```

## Licencia

MIT
