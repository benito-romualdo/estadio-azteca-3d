# EL COLOSO — Estadio Azteca · Tres Soles, Un Estadio

Experiencia cinematográfica 3D en WebGL donde el **Estadio Azteca** es el protagonista:
seis capítulos que recorren del México prehispánico al **11 de junio de 2026**, el día en
que el Coloso de Santa Úrsula se convierte en el primer estadio de la historia en
inaugurar **tres Copas del Mundo** (1970 · 1986 · 2026).

**Todo es procedural**: ni un solo modelo, textura o sonido externo. El estadio, la
multitud, la música y los efectos nacen del código.

## Cómo verla

```bash
npx serve . -l 4173
# abre http://localhost:4173
```

Cualquier servidor estático sirve (los módulos ES requieren `http://`, no `file://`).
Requiere internet para los CDN de three.js, GSAP y las fuentes.

## Los seis capítulos

| # | Capítulo | Momento |
|---|----------|---------|
| I | **Raíces** | Amanecer prehispánico: pirámide encendida, Quetzalcóatl de 700 partículas sobrevuela el vaso, la Piedra del Sol arde en el césped, tambores de huéhuetl. |
| II | **El Coloso de Santa Úrsula** | 29·V·1966 — paseo exterior por la celosía de concreto y *El Sol Rojo* de Calder. |
| III | **El Primer Sol** | México 70 — hora dorada, gradas vestidas de oro, confeti, el Partido del Siglo. |
| IV | **La Noche del 86** | Las torres parpadean y se encienden; un cometa de luz repite los 10 segundos del **Gol del Siglo** derribando cinco sombras; rugido, flashes y **La Ola** (nacida aquí). |
| V | **Alma de México** | Ofrenda en el estadio: papel picado al viento, lluvia de cempasúchil, 45.000 asientos convertidos en velas. |
| VI | **El Tercer Sol** | Hoy. Mosaico tricolor humano, haces de luz, pirotecnia y el ascenso final sobre el Valle de México. |

## Controles

- **Espacio** — pausa / reanuda · **← →** — saltar capítulo · **C** — cámara libre (orbitar) · **M** — sonido
- Línea de tiempo inferior: clic en cualquier era.
- `#auto` en la URL salta la portada; `#auto&cap=3` entra directo a un capítulo (0–5).

## Bajo el capó

- **three.js r170** + composer con bloom cinematográfico (UnrealBloom) y tonemapping ACES.
- **Multitud de ~45.000 instancias** con shader propio: mosaicos (bandera, oro, velas, tricolor), La Ola y flashes de cámaras se calculan 100% en GPU.
- Estadio generado por revolución de perfil (lathe elíptico): tres tribunas escalonadas, techumbre voladiza, celosía diagonal, foso, pantallas con canvas dinámico.
- Valle de México: Popocatépetl con fumarola, Iztaccíhuatl, 4.200 luces urbanas, estrellas y niebla con seis estados de ánimo lumínicos interpolados con GSAP.
- Sonido **sintetizado** con WebAudio: rumor de multitud (ruido café filtrado), viento, colchón armónico, huéhuetl y estallidos de pirotecnia.
- Cancha y Piedra del Sol pintadas a mano en `<canvas>`.

*Hecho con Claude Code · sin assets, solo matemáticas y cariño por México.*
