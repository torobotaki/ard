# Audio-Reactive Coverage

This file tracks which original Delahaye sketch families fit the current audio-reactive master, and which ones are intentionally left out for now.

## Tier guide

- Tier 1: best fit for the current master UX. These families respond well to continuous animation, centering, global controls, and per-parameter audio routing.
- Tier 2: good fit, but needed a dedicated integration pass. These still behave well inside the same master UI.
- Tier 3: possible later, but likely to add visual or UI clutter unless handled selectively.
- Tier 4: awkward in the current master UX. These probably want a simpler wrapper, a curated subset, or a separate interaction model.

## Coverage table

| Drawings | Family | Supported | Tier | Notes |
| --- | --- | --- | --- | --- |
| 1-12 | Polygones / Etoiles reguliers | Yes | 3 | Integrated into the master as simple animated polygon and star modes. |
| 14-19 | Composition 1 | Yes | 1 | Integrated into the master sketch. |
| 20-25 | Composition 2 | Yes | 1 | Integrated into the master sketch. |
| 26-32 | Joligones | Yes | 3 | Integrated into the master with fitted centering. |
| 33 | Joligones | No | 3 | Still pending. |
| 34-43 | Dessins a partir de donnees / Cheval | No | 4 | Data-driven source material; not a natural fit for the current live modulation UX. |
| 44-45 | Dessins a partir de donnees / Lion | No | 4 | Same issue as other data-driven drawings. |
| 46-47 | Dessins a partir de donnees / Oiseaux-Poissons | No | 4 | Data-driven family, better treated separately. |
| 48-49 | Dessins a partir de donnees / Smurf | No | 4 | Data-driven family, better treated separately. |
| 50-54 | Dragons | No | 4 | Recursive family; likely needs a different interaction model. |
| 65-77 | Etoiles fractales | No | 4 | Fractal family; likely too awkward for the current control model. |
| 78-80 | Courbes orbitales | Yes | 1 | Integrated into the master. |
| 81-84 | Courbes orbitales | Yes | 1 | Integrated into the master. |
| 85-86 | Courbes orbitales | Yes | 1 | Integrated into the master. |
| 87-92 | Courbes tournantes | Yes | 1 | Integrated into the master. |
| 93-96 | Courbes tournantes | Yes | 1 | Integrated into the master. |
| 97-100 | Courbes spirales | Yes | 2 | Tier 2 family integrated into the master. |
| 101-104 | Biparti complet | Yes | 3 | Integrated into the master. |
| 105-109 | Lineaires modulo | Yes | 1 | Favorites plus the remaining family variant are integrated into the master. |
| 110-114 | Lineaires batons | Yes | 1 | Integrated into the master. |
| 114-135 | Fractales simples | No | 4 | Fractal family; not yet a good fit for the current panel and routing model. |
| 136-139 | Fractales simples arrondies | No | 4 | Same as above. |
| 140-144 | Fractales simples arrondies | No | 4 | Same as above. |
| 145-147 | Fractales simples arrondies | No | 4 | Same as above. |
| 148-151 | Fractales simples arrondies | No | 4 | Same as above. |
| 152-154 | Fractales simples deformees | No | 4 | Same as above. |
| 153-156 | Fractales generales | No | 4 | Same as above. |
| 155-159 | Fractales simples deformees | No | 4 | Same as above. |
| 164-176 | Quadrillages elastiques | Yes | 1 | Integrated into the master. |
| 175-177 | Fractales generales | No | 4 | Fractal family; separate UX likely needed. |
| 178-200 | Surfaces | No | 3 | Possible later, but heavy and more complex than the current supported families. |
| 180-182 | Fractales generales | No | 4 | Fractal family; separate UX likely needed. |
| 201-203, 205 | D3Data | No | 4 | Data-driven 3D family; poor fit for the current master UI. |
| 206 | D3Data | No | 4 | Same as above. |
| 207 | D3Cube | Yes | 2 | Integrated with auto-fit and centering. |
| 208 | D3Cube | Yes | 2 | Integrated. |
| 210 | D3Cube | Yes | 2 | Integrated. |
| 212 | D3Cube | Yes | 2 | Integrated. |
| 213 | D3Cube | Yes | 2 | Integrated; size handling expanded because it tended to read small. |
| 215-217 | D3Cube | Yes | 2 | Integrated. |
| 218 | D3Cube | No | 2 | Upstream grouped source does not appear to expose a real `218` variant cleanly. |
| 219-220 | D3Cube | Yes | 2 | Integrated. |
| 221-235 | D3Structures | Yes | 1 | Favorites. Integrated into the master. |
| 236-239 | D3Structures | Yes | 1 | Favorites. Integrated into the master. |
| 240-252 | D3Structures | Yes | 1 | Integrated into the master. |

## Current strategy

1. Keep the master coherent rather than exhaustive.
2. Finish the high-fit families before adding awkward ones.
3. Expand within already-compatible families before forcing every upstream sketch into the same UX.
4. Revisit Tier 3 and Tier 4 families only when the current master remains readable and stable.
