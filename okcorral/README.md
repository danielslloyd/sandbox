# OK Corral

Social deduction played through a phone-shaped window. Everyone in the room holds a phone;
each phone is a window into one shared 3D ring of gunfighters. You turn your body to look
around, and the view is narrow enough that you can watch about one person at a time. Some
of you are outlaws, and an outlaw wants to fire while nobody has them on screen.

The mechanic the whole thing rests on: **every avatar faces the direction its real player
is actually looking.** Look at Bob's avatar and you see which way Bob is looking. So the
outlaw needs no "you are being watched" warning — they work it out by watching the ring
watch. Gaze becomes a social act, and mutual gaze is a real, mutual event.

## Running it

```bash
npm install
npm start
```

Then open the printed URL. To play against scripted bots without a room full of people:

```bash
npm run bots
```

Bots sweep their heading back and forth so there is something to watch. They do not shoot.

## HTTPS, which you will need

iOS refuses to hand over motion sensors except over HTTPS, from inside a real tap. Plain
HTTP is fine for desktop development but useless for an actual playtest. With
[mkcert](https://github.com/FiloSottile/mkcert):

```bash
mkcert -install
mkcert -cert-file certs/cert.pem -key-file certs/key.pem localhost 192.168.1.42
```

Use your own LAN address in place of `192.168.1.42`. The server picks the certs up
automatically when `certs/` exists. Each phone has to trust the mkcert root once. If that
is more trouble than it is worth, a Cloudflare quick tunnel gives you real HTTPS instead:

```bash
cloudflared tunnel --url http://localhost:8443
```

## Checking the sensors first

`/diag.html` is a standalone harness that answers whether the heading is good enough to
build on. It shows the quaternion, derived yaw and pitch, event rate, and accumulated
drift, and exports a CSV.

- **Drift:** point at a landmark, hit *Zero here*, wave the phone around for a few minutes,
  come back to the same landmark and hit *Mark*. Under ~3°/min is comfortable.
- **Scale:** zero, turn a careful 90°, hit *Mark*. Should read 90 ± a couple.

Drift matters less here than you would expect. Seats in the ring are abstract, so no two
phones ever need to agree about where real-world north is — each only needs its own
rotation to be self-consistent. With no real-world referent anchoring the virtual world, a
slowly rotating saloon is literally unobservable. That is also why this reads plain
`deviceorientation` and never touches the magnetometer.

## The rules

Everyone is armed. Town wins by shooting all the outlaws **or by surviving the clock** —
that deadline is the pressure that stops the game stalling into a staring contest, because
the outlaws have to move. Shooting a townsperson carries no special penalty; it has already
done the outlaws' work for them.

The one rule that generates all the deduction:

| Event | Who learns what |
| --- | --- |
| Any shot | Every phone bangs at the same instant, so the real room leaks no direction |
| Muzzle flash | Only players who had the shooter on screen |
| Death | Everyone |
| The victim | Only if they happened to be looking at their shooter |

A miss is exactly as loud as a hit, which makes firing at nothing a usable bluff. Outlaws
know each other. Dead players keep watching as ghosts and see everything, which is useless
to them unless they talk — and talking is the game.

All argument happens out loud in the actual room, in real time. The app never mediates
speech; it only mediates sight and shooting.

## Layout

```
server/
  server.js   static serving, websockets, rooms
  game.js     authoritative state: roles, gaze, shot resolution, win conditions
public/
  index.html  join / lobby / game / results
  diag.html   sensor harness
  js/
    config.js       tuning constants and ring geometry, shared by server and client
    orientation.js  sensors: permission gating, quaternion math, zeroing
    net.js          websocket client
    scene.js        three.js ring, heading-driven avatars, muzzle flash
    game.js         client loop, HUD, input
test/
  protocol.test.mjs headless checks of culling, witnessing and cooldown
```

`config.js` is imported by both sides so they can never disagree about what "visible"
means. three.js is vendored out of `node_modules` and served locally, so a playtest needs
no internet.

## Verification

With the server running:

```bash
node test/protocol.test.mjs
```

This connects four headless clients and checks the assertions the game actually rests on:
that a player facing out of the ring receives no data about anyone, that a watcher learns
who fired, that a victim facing away never finds out, and that the reload cooldown holds.

Two implementation notes worth knowing before you change things:

- **Heading reporting is deliberately not on the render loop.** `requestAnimationFrame`
  stops when a page is backgrounded, so a phone that locks would silently freeze at its
  last heading while the server still believed you were staring at someone.
- **The server only sends you heading data for players inside your awareness cone.** If it
  broadcast everyone's heading, a modified client could draw a top-down radar of who is
  watching whom, which makes the outlaw's job trivial. This is the one anti-cheat measure
  that actually matters, and it was much cheaper to build in than to retrofit.

## Known geometry, because it is counterintuitive

Seen from a seat on the circle, the other seats are spaced `180/N` degrees apart, not
`360/N`, and the whole ring subtends about 135° at eight players. So a 20° view holds
roughly one person at a time — but a player only has to sweep ~135°, not turn all the way
around, to check on everybody. If playtesting says the fantasy needs more physical turning,
that is the number to attack.

## Open questions for playtest

- Does the round timer actually force the outlaws to act, or does play stall?
- Is narrow FOV enough to make attention scarce, or does the scene need objectives that
  pull gaze off the ring?
- Cost of shooting: reload length, whether raising the gun should be a gesture, how long
  the muzzle flash should linger.
- Round length. Four minutes is a guess.

Deferred: extra roles beyond town and outlaw, cover and occlusion, and any mapping between
virtual seats and where people are actually standing.
