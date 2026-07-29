# Loop Breeder

Interactive evolution for seamless animation loops. You are the fitness function:
keep what you like, discard the rest, let the survivors have children. Every
animation ever made stays in a lineage tree, so an abandoned branch is always
one click away.

Open `index.html`. No build, no dependencies, no network.

![twelve draws from the genome space](preview.png)

Companion to [`../bleuje-playground`](../bleuje-playground) (LoopLab) — anything
bred here can be copied straight into that editor as a normal sketch.

## The loop you're in

| | |
|---|---|
| **New population** | twelve fresh draws from the genome space |
| click a tile | keep it — a gold border means it survives the next breed |
| **✕** | discard it now rather than waiting |
| **Breed** | kept tiles carry over unchanged; the empty slots fill with their children |
| **⤢** | open it full size: genes, source, per-gene rerolls |
| **Lineage** | the whole tree, pruned branches greyed out — click any node to go back |

Populations converge fast, so one child in five is a *bold* mutant at roughly
double the mutation rate. Without it you get twelve near-identical tiles by the
third generation and nothing left to choose between.

## The genome

Six independent genes. They're orthogonal on purpose: each one closes its own
loop, so **any** combination of them also loops. That's what makes random draws
usable rather than noise.

| gene | what it decides |
|---|---|
| `layout` | where elements live — grid, brick, rings, disc, sphere, Hilbert curve, packing, walk |
| `offset` | the phase-delay field — radial, angular, noise, index, diagonal, spiral |
| `shape` | the 1-periodic function each element runs — sine, ping-pong, dwell, ramp |
| `motion` | what that function does — pulse, spin, orbit, jump, wave, breathe, convoy |
| `render` | how one element is drawn — dot, square, ring, arcs, bar, cross, wavelet, polyline |
| `look` | palette, stroke weight, motion blur, loop length |

A genome compiles to readable JavaScript, and **that source is the single source
of truth** — what you see animating is exactly what "copy code" gives you.

### Genes that can't be combined

Most pairs work. A few are structurally impossible and get repaired rather than
discarded — each of these was a bug found by testing, not a guess:

- A **convoy** needs consecutive elements to be *spatially adjacent*, not merely
  ordered. A phyllotaxis disc and a Fibonacci sphere are ordered but not paths;
  markers teleport along them and the result reads as static noise.
- **`ramp`** runs 0 → 1 and never returns, so it only closes the loop when it
  drives a rotation through a symmetry of the shape being drawn. Anywhere else
  it leaves a hard cut at t=1.
- ...and that rotation has to land on a symmetry the render *actually has*. A
  Truchet arc pair looks like it has a quarter-turn symmetry; it doesn't. Its
  true period is a half turn.
- A **polyline** only shows motion that moves its vertices, so `pulse` and
  `spin` would leave it frozen.

## Deterministic, until it needs not to be

The evolution here is ordinary code. Mutation is a seeded perturbation of a
parameter vector; crossover picks each gene from one parent or the other. It runs
instantly, offline, and the same seed always yields the same animation. **No
model is involved and none is needed.**

What that can't do is *invent a gene*. Parametric evolution only recombines the
vocabulary it was given, so a lineage saturates — you start seeing the same seven
motions rearranged. That's where a model earns its place, and only there.

So the architecture is two tiers:

- **Tier 1 — deterministic search inside the vocabulary.** Instant, free,
  reproducible, dozens of candidates per second. This is the inner loop and it's
  where you'll spend nearly all your time.
- **Tier 2 — a model to widen the vocabulary.** Open any animation, hit **Copy
  prompt**, and you get the real source plus the loop-closure rules. Paste
  whatever comes back into the box below it; it's compiled and test-rendered
  before being accepted, then joins the lineage as a child you can keep breeding
  from.

Tier 2 is much slower and much rarer than tier 1, which is the right ratio. The
seam is deliberately manual — no API key, no server, nothing to configure.

## Credits and licensing

The technique vocabulary is drawn from the animations and public
[tutorials](https://bleuje.com/tutorials/) of Etienne Jacob, and the motion blur
is Dave / beesandbombs' template.

Etienne Jacob's own Processing sources are at
[github.com/Bleuje/processing-animations-code](https://github.com/Bleuje/processing-animations-code)
and are **copyright, all rights reserved** — none of that code is reproduced
here. Everything in this repository was written from scratch.
