# Círculo de Quintas para guitarra

Web interactiva para componer en guitarra. Haces click en una tonalidad del círculo de quintas y se
marcan sus acordes, con grados y calidades (mayor, menor, disminuido). Al lado aparece una tabla con
los 7 modos de la raíz para hacer intercambio modal, con los acordes representativos de cada modo,
los diagramas en la guitarra y el sonido de cada acorde.

## Estado

🚧 **En diseño.** La idea y las decisiones de la v1 están definidas, pero todavía no hay código.

| Versión | Alcance | Estado |
|---|---|---|
| v1 | Círculo interactivo (triadas/séptimas), tabla de los 7 modos con acordes recomendados, diagramas de acordes, audio al hacer click, ES/EN, C D E / Do Re Mi | ⏳ Pendiente |
| v2 | Modos de menor armónica y melódica, extensiones (9/11/13, sus, add), armador de progresiones | 💡 Idea |
| v3 | Despliegue y backend para guardar progresiones | 💡 Idea |

## Funcionalidades (v1)

- **Círculo de quintas**: mayores afuera y menores relativas adentro. Al seleccionar una tonalidad
  se resaltan sus 7 acordes diatónicos con número romano y calidad.
- **Tabla de modos paralelos** (jónico… locrio) de la raíz seleccionada, con los grados de cada modo
  y los acordes que contienen la nota característica resaltados (⭐ el más representativo).
- **Panel de acorde**: notas, ▶ para escucharlo, diagrama en la guitarra y en qué modos aparece.
- Interruptores **Triadas / Séptimas**, **C D E / Do Re Mi** e idioma **ES / EN**.
- La selección queda en la URL, así que se puede guardar en favoritos o compartir.

## Stack

TypeScript · React · Vite · [tonal](https://github.com/tonaljs/tonal) (teoría) ·
[Tone.js](https://tonejs.github.io/) (audio) · [svguitar](https://www.npmjs.com/package/svguitar)
(diagramas) · Vitest · Testing Library · Playwright

## Licencia

MIT
