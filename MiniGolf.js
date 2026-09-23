// ميني جولف - the holes and one putt, as plain arithmetic.
// Shared by the page and the rooms server, like بولينج: a putt is three
// whole numbers and a start time, and every phone and the server roll the
// ball through exactly the same steps (only + - * / and Math.sqrt / floor /
// abs / min / max, never Math.sin or Math.cos, which may differ in the last
// bit from one engine to another). A hole is x to the right and y away from
// the tee, in course units (one unit is about ten centimetres of a real
// course).
//
// What a hole can hold:
//   green     the playing surface (one polygon); its edges are rails
//   walls     more rails inside it, as segments
//   blocks    solid obstacles (a closed polygon each: a rock, the pyramid)
//   sand      bunkers: the ball slows hard
//   mud       puddles: slower still than sand
//   ice       the ball barely slows
//   water     the ball goes back to where it lay, a stroke added
//   hills     a smooth hump (or a dip, push < 0) running along x or y
//   bowls     a round dip that pulls the ball to its middle
//   pads      arrow pads that push the ball along their direction
//   belts     conveyors that carry the ball along them
//   portals   in at one ring, out of the other at the same speed, a set way
//   bumpers   round posts that send the ball away harder than it came
//   ramps     a slope up to a lip: fast enough and the ball flies off it
//   gates     one-way flaps: through one way, a rail the other
//   mills     a windmill: its tunnel's door shut while a sail hangs in front
//   sliders   a gate sliding to and fro
//   spinners  a bar turning round a post
// Every moving piece is on the hole's clock, which every phone shares: a putt
// carries t0, the clock in ms when it was hit.
//
// Other balls (a room played in turns): a putt can take the balls lying on
// the course as `others` ([{ id, at }]); they are hit, rolled with the same
// steps, and come back in the result (`moved`). Everything is still decided
// by the same numbers, in the same order, on every engine.

const GOLF = {
  BALL_R: 0.22,
  CUP_R: 0.42,
  WALL_R: 0.13,           // half a rail's thickness
  MAX_SPEED: 24,
  GREEN: 3.0,             // how fast the green slows the ball, units/s²
  SAND: 13,
  MUD: 24,                // stickier than sand
  ICE: 0.55,              // the ball barely slows
  STOP: 0.14,
  REST_SLOPE: 2.4,        // a ball stops only where the ground pulls less than this
  SINK_SPEED: 6.2,        // faster than this over the middle of the cup and it lips out (less at the rim)
  BOUNCE: 0.72,
  BALL_BOUNCE: 0.9,       // ball on ball: equal balls, a little of the knock lost
  PAD: 34,                // a speed pad's push, units/s²
  BELT_GRIP: 2.6,         // how fast a belt brings the ball to its own speed
  PORTAL_R: 0.6,          // a portal's ring; the ball goes in within three quarters of it
  BUMPER: 1.35,           // a bumper sends the ball back this much faster
  BUMPER_MIN: 3,          // and at least this fast
  BUMPER_MAX: 15,         // and no faster than this
  RAMP_G: 9,              // a ramp's pull back down it
  RAMP_H: 0.45,           // the lip's height (for the screen, and where a flight starts)
  RAMP_LIFT: 0.5,         // up speed off the lip, for each unit of speed along the ramp
  AIR_G: 20,              // the fall, in the air
  LAND: 0.75,             // speed kept on landing
  DT: 1 / 240,
  MAX_T: 14,
  OVER_PAR: 3,            // strokes past par, then the ball is picked up (golfMaxOf)
  PENALTY: 1
};

// The steepest a hump's profile gets (the largest of 32u(1-u)(1-2u)), and a bowl's (u(1-u²)).
const GOLF_HUMP_MAX = 3.0792;
const GOLF_BOWL_MAX = 0.3849;

/* --- the course -------------------------------------------------------------------
   Eighteen holes, played in order, harder as the course goes on: a game of 3
   plays the first three, of 6 the first six, and so on. Each hole has its own
   place and only the pieces that belong there (the owner, 23 Sep 2026: "each
   map unique, with some of what fits in it"). Each is taller than wide, so it
   fills a phone held upright. Every hole is checked by
   rooms-worker/test/rules.mjs: a search finds a way into the cup within
   par + 1, no ball can come to rest where the cup can't be reached from, and
   the clock's gentle putt holes out in the end. Curved edges are written out
   as numbers (never worked out with Math.cos at load: every engine must see
   the very same rails). */
const GOLF_HOLES = [
  {
    // A first straight putt up to a rounded end, a round rock in the way.
    id: 'first', par: 2,
    tee: [4, 2], cup: [4, 16.5],
    green: [[0, 0], [8, 0], [8, 16], [7.696, 17.531], [6.828, 18.828], [5.531, 19.696], [4, 20], [2.469, 19.696], [1.172, 18.828], [0.304, 17.531], [0, 16]],
    blocks: [{ poly: [[4.924, 9.117], [4.924, 9.883], [4.383, 10.424], [3.617, 10.424], [3.076, 9.883], [3.076, 9.117], [3.617, 8.576], [4.383, 8.576]], look: 'rock' }]
  },
  {
    // A narrow bridge over the water, the cup behind a bunker under a rounded end.
    id: 'bridge', par: 3,
    tee: [2.8, 2], cup: [3, 20.5],
    green: [[0, 0], [12, 0], [12, 20], [11.706, 21.854], [10.854, 23.527], [9.527, 24.854], [7.854, 25.706], [6, 26], [4.146, 25.706], [2.473, 24.854], [1.146, 23.527], [0.294, 21.854], [0, 20]],
    water: [
      [[0, 8], [3.4, 8], [5.8, 15], [0, 15]],
      [[6.2, 8], [12, 8], [12, 15], [8.6, 15]]
    ],
    sand: [[[5, 17.4], [7, 17.1], [7.6, 18.8], [5.8, 19.5], [4.8, 18.6]]]
  },
  {
    // The windmill: through the tunnel when no sail hangs in front of it, and
    // round the corner past the pond to a rounded far end.
    id: 'mill', par: 3,
    tee: [3, 2], cup: [13, 22],
    green: [[0, 0], [6, 0], [6, 16], [16, 16], [16, 23], [15.853, 23.927], [15.427, 24.763], [14.763, 25.427], [13.927, 25.853], [13, 26], [0, 26]],
    blocks: [
      { poly: [[0, 9], [2, 9], [2, 10.6], [0, 10.6]], look: 'mill' },
      { poly: [[4, 9], [6, 9], [6, 10.6], [4, 10.6]], look: 'mill' }
    ],
    walls: [[8.4, 17.6, 9.8, 19.6]],
    sand: [[[10, 17], [12.4, 17.2], [12.6, 19.2], [10.8, 19.8], [9.8, 18.6]]],
    water: [[[0.9, 22.6], [3.6, 22.3], [4.3, 24], [3.2, 25.3], [0.9, 25.2]]],
    mills: [{ x: 3, y: 9, dir: 'y', half: 1, blades: 4, w: 1.3, phase: 0.3, shut: 0.17 }]
  },
  {
    // The souq: round the corner into the lane of stalls, and the arrow tiles do the rest.
    id: 'souq', par: 3,
    tee: [9, 2.5], cup: [3, 23.5],
    green: [[0, 0], [12, 0], [12, 10], [6, 10], [6, 26], [0, 26]],
    pads: [
      { x: 3, y: 12.4, dx: 0, dy: 1, w: 2.4, l: 2.2 },
      { x: 7.4, y: 5, dx: -1, dy: 0, w: 2, l: 2.2 }
    ],
    blocks: [
      { poly: [[0, 16], [1.8, 16], [1.8, 17.4], [0, 17.4]], look: 'stall' },
      { poly: [[4.2, 19], [6, 19], [6, 20.4], [4.2, 20.4]], look: 'stall' }
    ],
    sand: [[[9.4, 6.6], [11.4, 6.8], [11.5, 9.2], [9.2, 9]]]
  },
  {
    // Over the camel's two humps: too soft and it rolls back, too hard and it runs on.
    id: 'humps', par: 3,
    tee: [5, 2], cup: [6.6, 20.5],
    green: [[0, 0], [10, 0], [10, 23.5], [8.5, 25], [1.5, 25], [0, 23.5]],
    hills: [
      { x0: 0, y0: 5.5, x1: 10, y1: 10.5, axis: 'y', push: 4.4, h: 0.9 },
      { x0: 0, y0: 11.5, x1: 10, y1: 16.5, axis: 'y', push: 4.4, h: 0.9 }
    ],
    blocks: [
      { poly: [[6.6, 17.6], [6.6, 18.4], [6, 18.8], [5.4, 18.4], [5.4, 17.6], [6, 17.2]], look: 'rock' }
    ],
    sand: [[[4.4, 22.6], [8.6, 22.4], [8.8, 23.6], [4, 23.8]]]
  },
  {
    // The funfair (the moulid): pinball posts on the way and round the cup.
    id: 'fair', par: 3,
    tee: [6, 2], cup: [6, 19],
    green: [[0, 0], [12, 0], [12, 19], [11.706, 20.854], [10.854, 22.527], [9.527, 23.854], [7.854, 24.706], [6, 25], [4.146, 24.706], [2.473, 23.854], [1.146, 22.527], [0.294, 20.854], [0, 19]],
    bumpers: [
      { x: 6, y: 9.5, r: 0.5 }, { x: 3, y: 12.5, r: 0.45 }, { x: 9, y: 12.5, r: 0.45 },
      { x: 3.9, y: 19.8, r: 0.45 }, { x: 8.1, y: 19.8, r: 0.45 }, { x: 6, y: 21.6, r: 0.45 }
    ],
    sand: [[[0.8, 5], [2.6, 4.8], [2.8, 7], [1, 7.2]]]
  },
  {
    // The pyramid in the middle: round it, or off a side wall.
    id: 'pyramid', par: 3,
    tee: [7, 2], cup: [7, 22],
    green: [[0, 0], [14, 0], [14, 22], [10, 26], [4, 26], [0, 22]],
    blocks: [{ poly: [[7, 9.7], [9.8, 12.5], [7, 15.3], [4.2, 12.5]], look: 'pyramid' }],
    sand: [
      [[1, 4], [3.2, 3.6], [3.8, 5.6], [2.4, 6.8], [1, 6.2]],
      [[10.6, 17], [12.8, 16.6], [13.2, 18.6], [11.6, 19.4], [10.4, 18.6]]
    ]
  },
  {
    // The Nile: jump it off the ramp, or go round by the little bridge; mud on the far bank.
    id: 'nile', par: 3,
    tee: [4, 2], cup: [4.5, 20.5],
    green: [[0, 0], [12, 0], [12, 24], [0, 24]],
    ramps: [{ x: 4, y: 7.4, dx: 0, dy: 1, len: 2.6, w: 2.2 }],
    walls: [[2.8, 7.4, 2.8, 10], [5.2, 7.4, 5.2, 10], [9.7, 10, 9.7, 13.5]],
    water: [[[0, 10], [9.7, 10], [9.7, 13.5], [0, 13.5]]],
    mud: [[[0.6, 15.2], [2.6, 14.8], [3, 16.6], [1, 17]]],
    sand: [[[7.4, 19], [9.6, 18.8], [9.8, 20.8], [7.6, 21]]]
  },
  {
    // The waterwheel's beam turning in the middle of the green; the field's mud by its channel.
    id: 'saqia', par: 3,
    tee: [6, 2], cup: [7.8, 20.5],
    green: [[0, 0], [12, 0], [12, 22], [11.772, 23.148], [11.121, 24.121], [10.148, 24.772], [9, 25], [3, 25], [1.852, 24.772], [0.879, 24.121], [0.228, 23.148], [0, 22]],
    spinners: [{ x: 6, y: 11.5, r: 2.8, w: 1.1, phase: 0.4 }],
    blocks: [{ poly: [[8.2, 17.3], [8.2, 18.1], [7.6, 18.5], [7, 18.1], [7, 17.3], [7.6, 16.9]], look: 'jar' }],
    water: [[[0.8, 5.6], [3.2, 5.2], [3.8, 7.8], [2.6, 9.2], [0.8, 8.8]]],
    mud: [[[1.2, 9.8], [3.4, 9.6], [3.8, 11.2], [1.4, 11.6]]],
    sand: [[[2.2, 18.6], [4.6, 18.3], [5, 20.3], [2.8, 21]]]
  },
  {
    // Siwa: over the dunes, past the salt rocks, and mind the mud of the salt marsh.
    id: 'siwa', par: 3,
    tee: [5, 2], cup: [6.5, 20.5],
    green: [[0, 0], [10, 0], [10, 22.5], [8.5, 24], [1.5, 24], [0, 22.5]],
    hills: [{ x0: 0, y0: 6.5, x1: 10, y1: 11.5, axis: 'y', push: 3.6, h: 0.8 }],
    mud: [
      [[5.2, 22.1], [8, 21.9], [8.5, 23.1], [4.8, 23.3]],
      [[0.8, 14.2], [3, 13.8], [3.4, 15.8], [1.6, 16.6], [0.6, 15.6]]
    ],
    sand: [[[6.8, 14.4], [9.2, 14.6], [9.4, 16.4], [7, 16.6]]],
    blocks: [
      { poly: [[3.8, 18.6], [3.6, 19.2], [3.1, 19.4], [2.6, 19.1], [2.5, 18.5], [2.9, 18], [3.4, 18]], look: 'salt' },
      { poly: [[8.6, 4.4], [8.4, 5], [7.9, 5.2], [7.4, 4.9], [7.3, 4.3], [7.7, 3.8], [8.2, 3.8]], look: 'salt' }
    ]
  },
  {
    // Up the column and round the curved wall, the lighthouse at the corner.
    id: 'lighthouse', par: 3,
    tee: [3, 2], cup: [13.5, 18],
    green: [[0, 0], [6, 0], [6, 14], [16, 14], [16, 22], [8, 22], [6.439, 21.846], [4.939, 21.391], [3.555, 20.652],
      [2.343, 19.657], [1.348, 18.445], [0.609, 17.061], [0.154, 15.561], [0, 14]],
    sand: [[[9.4, 14.4], [11.4, 14.4], [11.6, 15.6], [9.6, 15.8]]],
    blocks: [{ poly: [[6, 14], [7.2, 14], [6, 15.2]], look: 'rock' }]
  },
  {
    // The Citadel: two walls, and flaps that open only one way; the wrong door doesn't give.
    id: 'citadel', par: 3,
    tee: [3, 2], cup: [9, 22.5],
    green: [[0, 0], [12, 0], [12, 26], [0, 26]],
    walls: [[0, 9, 4, 9], [6.4, 9, 12, 9], [3.4, 17, 8.6, 17], [11, 17, 12, 17]],
    gates: [
      { x1: 4, y1: 9, x2: 6.4, y2: 9, dx: 0, dy: 1 },
      { x1: 0, y1: 17, x2: 3.4, y2: 17, dx: 0, dy: -1 },
      { x1: 8.6, y1: 17, x2: 11, y2: 17, dx: 0, dy: 1 }
    ],
    blocks: [
      { poly: [[7.4, 8.4], [8.6, 8.4], [8.6, 9.6], [7.4, 9.6]], look: 'tower' },
      { poly: [[5.4, 16.4], [6.6, 16.4], [6.6, 17.6], [5.4, 17.6]], look: 'tower' }
    ],
    sand: [[[1, 20.6], [3.4, 20.4], [3.6, 22.6], [1.2, 22.8]]]
  },
  {
    // The gate: a door sliding in the gap between two towers, the cup under a rounded end.
    id: 'gate', par: 3,
    tee: [5, 2], cup: [5, 20],
    green: [[0, 0], [10, 0], [10, 20], [9.619, 21.913], [8.536, 23.536], [6.913, 24.619], [5, 25], [3.087, 24.619], [1.464, 23.536], [0.381, 21.913], [0, 20]],
    blocks: [
      { poly: [[0, 11.4], [2, 11.4], [2, 12.6], [0, 12.6]], look: 'tower' },
      { poly: [[8, 11.4], [10, 11.4], [10, 12.6], [8, 12.6]], look: 'tower' }
    ],
    sliders: [{ x: 5, y: 12, len: 2.4, axis: 'x', travel: 0.9, period: 3.2, phase: 0 }],
    sand: [[[6.6, 16.6], [8.8, 16.8], [9, 18.6], [7, 18.8]]]
  },
  {
    // The port: two conveyors over the harbour, one carrying the ball over, one bringing it back.
    id: 'port', par: 3,
    tee: [3, 2.5], cup: [8.5, 21.5],
    green: [[0, 0], [12, 0], [12, 26], [0, 26]],
    belts: [
      { x0: 1.8, y0: 10.6, x1: 4.2, y1: 15.4, vx: 0, vy: 3.2 },
      { x0: 7.8, y0: 10.6, x1: 10.2, y1: 15.4, vx: 0, vy: -3 }
    ],
    walls: [[1.8, 11, 1.8, 15], [4.2, 11, 4.2, 15], [7.8, 11, 7.8, 15], [10.2, 11, 10.2, 15]],
    water: [
      [[0, 11], [1.8, 11], [1.8, 15], [0, 15]],
      [[4.2, 11], [7.8, 11], [7.8, 15], [4.2, 15]],
      [[10.2, 11], [12, 11], [12, 15], [10.2, 15]]
    ],
    sand: [[[9.6, 23], [11.4, 22.8], [11.6, 24.8], [9.8, 25]]]
  },
  {
    // Karnak: a wall across the temple, a magic door from one shrine to the other; or walk round by the far gap.
    id: 'temple', par: 3,
    tee: [3, 2], cup: [8, 22.5],
    green: [[0, 0], [12, 0], [12, 26], [0, 26]],
    walls: [[0, 13, 10.4, 13]],
    portals: [{ x: 3, y: 10.4, ox: 5, oy: 15.4, dx: 0, dy: 1 }],
    blocks: [
      { poly: [[1.6, 9.9], [2.2, 9.9], [2.2, 10.9], [1.6, 10.9]], look: 'obelisk' },
      { poly: [[3.8, 9.9], [4.4, 9.9], [4.4, 10.9], [3.8, 10.9]], look: 'obelisk' },
      { poly: [[7.6, 5], [8.6, 5], [8.6, 6], [7.6, 6]], look: 'obelisk' },
      { poly: [[2.2, 19.6], [3.2, 19.6], [3.2, 20.6], [2.2, 20.6]], look: 'obelisk' }
    ],
    sand: [
      [[9.4, 17], [11.4, 16.8], [11.6, 18.8], [9.6, 19]],
      [[0.8, 3.4], [2.4, 3.2], [2.6, 5], [1, 5.2]]
    ]
  },
  {
    // Saint Catherine: the mountain's frozen pond, a zigzag of walls across the ice, snowy rocks.
    id: 'sinai', par: 3,
    tee: [6, 2], cup: [3, 23],
    green: [[0, 0], [12, 0], [12, 22], [11.706, 23.854], [10.854, 25.527], [9.527, 26.854], [7.854, 27.706], [6, 28], [4.146, 27.706], [2.473, 26.854], [1.146, 25.527], [0.294, 23.854], [0, 22]],
    ice: [[[0.5, 4.6], [11.5, 4.6], [11.5, 19.4], [0.5, 19.4]]],
    walls: [[0, 10, 7.6, 10], [4.4, 15.6, 12, 15.6]],
    blocks: [
      { poly: [[10.2, 7], [10, 7.6], [9.5, 7.8], [9, 7.5], [8.9, 6.9], [9.3, 6.4], [9.8, 6.4]], look: 'snow' },
      { poly: [[3, 13], [2.8, 13.6], [2.3, 13.8], [1.8, 13.5], [1.7, 12.9], [2.1, 12.4], [2.6, 12.4]], look: 'snow' }
    ]
  },
  {
    // The oasis: up, across past the pond and its muddy edge, and up to a cup in a hollow.
    id: 'oasis', par: 4,
    tee: [11, 2], cup: [3.5, 24],
    green: [[8, 0], [14, 0], [14, 18], [7, 18], [7, 28], [0, 28], [0, 10], [8, 10]],
    water: [[[5.4, 12.6], [7.6, 12.1], [9.6, 12.8], [10, 14.6], [8.4, 15.9], [6, 15.8], [5, 14.6]]],
    mud: [[[10.2, 15.2], [12, 15], [12.4, 16.6], [10.6, 17]]],
    sand: [
      [[8.6, 5.8], [10.2, 5.4], [10.8, 7.2], [9.2, 7.8]],
      [[4.8, 19.6], [6.4, 20], [6.2, 21.6], [4.8, 21.4]]
    ],
    bowls: [{ x: 3.5, y: 24, r: 2.4, pull: 2.2, h: 0.4 }]
  },
  {
    // Cairo Tower: the gardens at its foot, the arrow path up the promenade, and the tower's lift -
    // a magic door that brings the ball out at the top, rolling for the cup.
    id: 'tower', par: 4,
    tee: [3, 2], cup: [10, 24.5],
    green: [[0, 0], [14, 0], [14, 28], [0, 28]],
    walls: [[0, 9, 8.5, 9], [5, 19, 14, 19]],
    pads: [{ x: 11.2, y: 12.5, dx: 0, dy: 1, w: 2.4, l: 2.2 }],
    portals: [{ x: 2, y: 6.4, ox: 12.6, oy: 24.5, dx: -1, dy: 0 }],
    blocks: [
      { poly: [[5.4, 14.2], [6.4, 13.8], [7.2, 14.4], [7, 15.4], [6, 15.8], [5.2, 15.2]], look: 'rock' },
      { poly: [[3.4, 11.8], [4.4, 11.4], [5.2, 12], [5, 13], [4, 13.4], [3.2, 12.8]], look: 'rock' }
    ],
    sand: [[[6.6, 22.8], [8.2, 22.6], [8.4, 24.4], [6.8, 24.6]]]
  }
];

const GOLF_HOLE_COUNTS = [3, 6, 9, 18];

/** The par of the first `n` holes. */
function golfParOf(n) {
  let p = 0;
  for (let i = 0; i < n && i < GOLF_HOLES.length; i++) p += GOLF_HOLES[i].par;
  return p;
}

/** The most strokes a hole allows: par + 3 (or the hole's own `max`). One more and the ball is picked up, the hole counting max + 1. */
function golfMaxOf(h) {
  return h && h.max ? h.max : ((h && h.par) || 3) + GOLF.OVER_PAR;
}

function golfInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function golfInAny(x, y, list) {
  if (!list) return false;
  for (let i = 0; i < list.length; i++) if (golfInPoly(x, y, list[i])) return true;
  return false;
}

// sin and cos from a polynomial (a spinner's bar): the same bits on every engine.
function golfSinCos(a) {
  const TWO_PI = 6.283185307179586, PI = 3.141592653589793, HALF = 1.5707963267948966;
  const k = Math.floor(a / TWO_PI + 0.5);
  let x = a - k * TWO_PI, sc = 1;
  if (x > HALF) { x = PI - x; sc = -1; } else if (x < -HALF) { x = -PI - x; sc = -1; }
  const x2 = x * x;
  const s = x * (1 + x2 * (-1 / 6 + x2 * (1 / 120 + x2 * (-1 / 5040 + x2 * (1 / 362880 + x2 * (-1 / 39916800))))));
  const c = 1 + x2 * (-1 / 2 + x2 * (1 / 24 + x2 * (-1 / 720 + x2 * (1 / 40320 + x2 * (-1 / 3628800 + x2 / 479001600)))));
  return [s, sc * c];
}

/** Every fixed rail of a hole as a segment: the green's edges, the walls, the blocks' edges. Kept per hole. */
const GOLF_SEGS = {};
function golfSegs(h) {
  if (GOLF_SEGS[h.id]) return GOLF_SEGS[h.id];
  const out = [];
  const loop = (poly) => { for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; out.push([a[0], a[1], b[0], b[1]]); } };
  loop(h.green);
  (h.walls || []).forEach(w => out.push(w.slice()));
  (h.blocks || []).forEach(b => loop(b.poly));
  GOLF_SEGS[h.id] = out;
  return out;
}
/** What a ball in the air still meets: the fence round the green and the blocks (the rails are low). */
const GOLF_TALL = {};
function golfTallSegs(h) {
  if (GOLF_TALL[h.id]) return GOLF_TALL[h.id];
  const out = [];
  const loop = (poly) => { for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; out.push([a[0], a[1], b[0], b[1]]); } };
  loop(h.green);
  (h.blocks || []).forEach(b => loop(b.poly));
  GOLF_TALL[h.id] = out;
  return out;
}

/** A unit vector (a pad's, a ramp's, a portal's or a gate's way). */
function golfUnit(dx, dy) {
  const l = Math.sqrt(dx * dx + dy * dy) || 1;
  return [dx / l, dy / l];
}
/** A speed pad under (x, y)? Its unit direction, else null. */
function golfPadAt(pad, x, y) {
  const u = golfUnit(pad.dx, pad.dy);
  const rx = x - pad.x, ry = y - pad.y;
  const along = rx * u[0] + ry * u[1], across = ry * u[0] - rx * u[1];
  return Math.abs(along) <= pad.l / 2 && Math.abs(across) <= pad.w / 2 ? u : null;
}
/** How far up a ramp (x, y) is (0 at its foot, len at its lip), or -1 off it. */
function golfRampU(rp, x, y) {
  const u = golfUnit(rp.dx, rp.dy);
  const rx = x - rp.x, ry = y - rp.y;
  const along = rx * u[0] + ry * u[1], across = ry * u[0] - rx * u[1];
  return along >= 0 && along <= rp.len && Math.abs(across) <= rp.w / 2 ? along : -1;
}
function golfBeltAt(h, x, y) {
  const belts = h.belts || [];
  for (let i = 0; i < belts.length; i++) {
    const bl = belts[i];
    if (x >= bl.x0 && x <= bl.x1 && y >= bl.y0 && y <= bl.y1) return bl;
  }
  return null;
}

// Is a windmill's door shut at time t (seconds on the hole's clock)? A blade
// hangs down every 2π/blades of turn; the door is shut while one is within
// a blade's width of hanging straight down. No sin or cos needed.
function golfMillShut(m, t) {
  const TWO_PI = 6.283185307179586;
  const per = TWO_PI / m.blades;
  let a = m.phase + m.w * t;
  a = a - Math.floor(a / per) * per;           // 0..per
  const off = a < per / 2 ? a : per - a;       // distance from hanging down
  return off < (m.shut || 0.2);
}
function golfMillAngle(m, t) { return m.phase + m.w * t; }

/** A slider's middle at time t: to and fro along its axis, easing at each end. */
function golfSliderAt(sl, t) {
  let p = t / sl.period + sl.phase;
  p = p - Math.floor(p);
  const q = p < 0.5 ? 1 - 2 * p : 2 * p - 1;        // 1 → 0 → 1
  const e = q * q * (3 - 2 * q);                     // eased
  const off = sl.travel * (2 * e - 1);
  return sl.axis === 'x' ? [sl.x + off, sl.y] : [sl.x, sl.y + off];
}
function golfSliderSeg(sl, t) {
  const c = golfSliderAt(sl, t), hl = sl.len / 2;
  return sl.axis === 'x' ? [c[0] - hl, c[1], c[0] + hl, c[1]] : [c[0], c[1] - hl, c[0], c[1] + hl];
}
/** A spinner's bar at time t: its two ends. */
function golfSpinnerSeg(sp, t) {
  const sc = golfSinCos(sp.phase + sp.w * t);
  const dx = sc[1] * sp.r, dy = sc[0] * sp.r;
  return [sp.x - dx, sp.y - dy, sp.x + dx, sp.y + dy];
}
function golfSpinnerAngle(sp, t) { return sp.phase + sp.w * t; }

/** How high the ground is (display units; hills and ramps up, bowls down). The rules only use its slope. */
function golfHeight(h, x, y) {
  let z = 0;
  (h.hills || []).forEach(hl => {
    if (x < hl.x0 || x > hl.x1 || y < hl.y0 || y > hl.y1) return;
    const u = hl.axis === 'y' ? (y - hl.y0) / (hl.y1 - hl.y0) : (x - hl.x0) / (hl.x1 - hl.x0);
    const b = u * (1 - u);
    z += (hl.push < 0 ? -1 : 1) * hl.h * 16 * b * b;
  });
  (h.bowls || []).forEach(bw => {
    const dx = x - bw.x, dy = y - bw.y;
    const d2 = (dx * dx + dy * dy) / (bw.r * bw.r);
    if (d2 >= 1) return;
    z -= bw.h * (1 - d2) * (1 - d2);
  });
  (h.ramps || []).forEach(rp => {
    const u = golfRampU(rp, x, y);
    if (u >= 0) z += GOLF.RAMP_H * u / rp.len;
  });
  return z;
}

/** The ground's pull at a point: hills and bowls (and any plain slope polygons). */
function golfPull(h, x, y) {
  let ax = 0, ay = 0;
  const slopes = h.slopes || [];
  for (let i = 0; i < slopes.length; i++) if (golfInPoly(x, y, slopes[i].poly)) { ax += slopes[i].ax; ay += slopes[i].ay; }
  const hills = h.hills || [];
  for (let i = 0; i < hills.length; i++) {
    const hl = hills[i];
    if (x < hl.x0 || x > hl.x1 || y < hl.y0 || y > hl.y1) continue;
    const u = hl.axis === 'y' ? (y - hl.y0) / (hl.y1 - hl.y0) : (x - hl.x0) / (hl.x1 - hl.x0);
    const a = -hl.push * (32 * u * (1 - u) * (1 - 2 * u)) / GOLF_HUMP_MAX;   // downhill
    if (hl.axis === 'y') ay += a; else ax += a;
  }
  const bowls = h.bowls || [];
  for (let i = 0; i < bowls.length; i++) {
    const bw = bowls[i];
    const dx = bw.x - x, dy = bw.y - y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d >= bw.r || d < 1e-6) continue;
    const u = d / bw.r;
    const a = bw.pull * u * (1 - u * u) / GOLF_BOWL_MAX;
    ax += dx / d * a; ay += dy / d * a;
  }
  return [ax, ay];
}

/** How fast the ground under (x, y) slows a rolling ball: the green, ice, sand or mud. */
function golfDragAt(h, x, y) {
  let drag = GOLF.GREEN;
  if (golfInAny(x, y, h.ice)) drag = GOLF.ICE;
  if (golfInAny(x, y, h.sand)) drag = GOLF.SAND;
  if (golfInAny(x, y, h.mud)) drag = GOLF.MUD;
  return drag;
}

function golfCleanShot(s) {
  const n = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(Number(v) || 0)));
  let dx = n(s && s.dx, -1000, 1000), dy = n(s && s.dy, -1000, 1000);
  if (dx === 0 && dy === 0) dy = 1000;
  return { dx, dy, power: n(s && s.power, 20, 1000), t0: n(s && s.t0, 0, 3600000) };
}

/** One ball on the course: where it is, how it moves, and what has happened to it. */
function golfBody(x, y) {
  return {
    x, y, sx: x, sy: y, vx: 0, vy: 0, roll: 0,
    end: null,            // 'rest' | 'cup' | 'water'
    lip: 0,
    sand: false, mud: false, ice: false, pad: false, belt: false,   // what it is on this step (for the screen)
    hits: 0,              // rails and pieces hit (for the knock on screen)
    air: false, z: 0, vz: 0, jumps: 0,
    bumps: 0, warps: 0, warp: null, knocks: 0, moved: false
  };
}

// from: where the ball lies. shot.t0 is the hole's clock in ms at the putt.
// others: the balls lying on the course that this one can hit ([{ id, at }]).
function golfStart(hole, from, shot, others) {
  shot = golfCleanShot(shot);
  const l = Math.sqrt(shot.dx * shot.dx + shot.dy * shot.dy);
  const v = GOLF.MAX_SPEED * shot.power / 1000;
  const sim = golfBody(from[0], from[1]);
  Object.assign(sim, {
    hole, shot, t: 0, id: null,
    vx: shot.dx / l * v, vy: shot.dy / l * v,
    moved: true,
    others: [],           // the other balls, each a body with its `id`
    done: false,          // every ball has stopped, sunk or splashed
    ghost: {},            // pairs lying on each other at the start pass through until they part
    flaps: {},            // gate k: the hole's clock (s) when a ball last swung it
    bumped: {}            // bumper k: the clock (s) when a ball last hit it
  });
  (others || []).forEach(o => {
    const b = golfBody(Number(o.at[0]), Number(o.at[1]));
    b.id = o.id;
    b.end = 'rest';
    sim.others.push(b);
  });
  if (sim.others.length) {
    const all = [sim].concat(sim.others), R2 = 2 * GOLF.BALL_R;
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
      const dx = all[i].x - all[j].x, dy = all[i].y - all[j].y;
      if (dx * dx + dy * dy < R2 * R2) sim.ghost[i + ':' + j] = true;
    }
  }
  return sim;
}

// A rail against the ball. (wvx, wvy) is how the rail itself moves at the
// point of contact, for a moving piece; 0 for a fixed rail.
function golfSegHit(sim, x1, y1, x2, y2, rr, wvx, wvy) {
  const ex = x2 - x1, ey = y2 - y1;
  const len2 = ex * ex + ey * ey;
  let u = len2 ? ((sim.x - x1) * ex + (sim.y - y1) * ey) / len2 : 0;
  u = u < 0 ? 0 : u > 1 ? 1 : u;
  const px = x1 + ex * u, py = y1 + ey * u;
  const dx = sim.x - px, dy = sim.y - py;
  const d2 = dx * dx + dy * dy;
  if (d2 >= rr * rr) return false;
  const d = Math.sqrt(d2) || 1e-6, nx = dx / d, ny = dy / d;
  sim.x = px + nx * rr; sim.y = py + ny * rr;
  const wx = wvx || 0, wy = wvy || 0;
  const vn = (sim.vx - wx) * nx + (sim.vy - wy) * ny;
  if (vn < 0) {
    sim.vx -= (1 + GOLF.BOUNCE) * vn * nx; sim.vy -= (1 + GOLF.BOUNCE) * vn * ny;
    sim.hits++;
  }
  return true;
}

/**
 * A one-way gate: a ball on its far side coming back meets it as a rail; one
 * coming through the right way swings the flap and goes on. Returns true when
 * the ball swung it.
 */
function golfGateHit(b, g, rr) {
  const ex = g.x2 - g.x1, ey = g.y2 - g.y1;
  const len2 = ex * ex + ey * ey;
  let u = len2 ? ((b.x - g.x1) * ex + (b.y - g.y1) * ey) / len2 : 0;
  u = u < 0 ? 0 : u > 1 ? 1 : u;
  const px = g.x1 + ex * u, py = g.y1 + ey * u;
  const dx = b.x - px, dy = b.y - py;
  if (dx * dx + dy * dy >= rr * rr) return false;
  // the line's normal, turned toward the way through
  const w = golfUnit(g.dx, g.dy);
  let nx = -ey, ny = ex;
  if (nx * w[0] + ny * w[1] < 0) { nx = -nx; ny = -ny; }
  const nl = Math.sqrt(nx * nx + ny * ny) || 1;
  nx /= nl; ny /= nl;
  const side = (b.x - g.x1) * nx + (b.y - g.y1) * ny;
  const vn = b.vx * nx + b.vy * ny;
  if (side > 0 && vn < 0) { golfSegHit(b, g.x1, g.y1, g.x2, g.y2, rr, 0, 0); return false; }
  return vn > 0;
}

/** Is the ball where a moving piece will reach it? Then it isn't allowed to stop there. */
function golfInSweep(h, x, y) {
  const rr = GOLF.BALL_R + GOLF.WALL_R;
  const mills = h.mills || [];
  for (let i = 0; i < mills.length; i++) {
    const m = mills[i];
    const along = m.dir === 'y' ? x - m.x : y - m.y, across = m.dir === 'y' ? y - m.y : x - m.x;
    if (Math.abs(across) < rr - 0.02 && Math.abs(along) < m.half) return true;
  }
  const sliders = h.sliders || [];
  for (let i = 0; i < sliders.length; i++) {
    const sl = sliders[i];
    const along = sl.axis === 'x' ? x - sl.x : y - sl.y, across = sl.axis === 'x' ? y - sl.y : x - sl.x;
    if (Math.abs(across) < rr - 0.02 && Math.abs(along) < sl.travel + sl.len / 2) return true;
  }
  const spinners = h.spinners || [];
  for (let i = 0; i < spinners.length; i++) {
    const sp = spinners[i];
    const dx = x - sp.x, dy = y - sp.y;
    const reach = sp.r + rr - 0.02;
    if (dx * dx + dy * dy < reach * reach) return true;
  }
  return false;
}

/** A ball in the air: it flies on, meeting only the fence and the blocks, and lands. */
function golfFly(sim, b) {
  const h = sim.hole, dt = GOLF.DT;
  b.x += b.vx * dt; b.y += b.vy * dt;
  b.z += b.vz * dt; b.vz -= GOLF.AIR_G * dt;
  const rr = GOLF.BALL_R + GOLF.WALL_R;
  const tall = golfTallSegs(h);
  for (let i = 0; i < tall.length; i++) { const w = tall[i]; golfSegHit(b, w[0], w[1], w[2], w[3], rr, 0, 0); }
  if (b.z <= 0) {
    b.z = 0; b.vz = 0; b.air = false;
    b.vx *= GOLF.LAND; b.vy *= GOLF.LAND;
  }
}

/** One step of one ball: the ground, the rails and pieces, the water, the cup, and whether it stops. */
function golfMove(sim, b, clock) {
  const h = sim.hole, dt = GOLF.DT;
  let slope = 0, onBelt = false;
  if (b.air) {
    golfFly(sim, b);
    if (b.air) return;
    const pl = golfPull(h, b.x, b.y);
    slope = Math.sqrt(pl[0] * pl[0] + pl[1] * pl[1]);
  } else {
    const pull = golfPull(h, b.x, b.y);
    let ax = pull[0], ay = pull[1];
    // A speed pad pushes along its arrow; a ramp pulls back down to its foot.
    b.pad = false;
    const pads = h.pads || [];
    for (let i = 0; i < pads.length; i++) {
      const u = golfPadAt(pads[i], b.x, b.y);
      if (u) { const push = pads[i].push || GOLF.PAD; ax += u[0] * push; ay += u[1] * push; b.pad = true; }
    }
    let ramp = null;
    const ramps = h.ramps || [];
    for (let i = 0; i < ramps.length; i++) {
      if (golfRampU(ramps[i], b.x, b.y) >= 0) { ramp = ramps[i]; const u = golfUnit(ramp.dx, ramp.dy); ax -= u[0] * GOLF.RAMP_G; ay -= u[1] * GOLF.RAMP_G; }
    }
    slope = Math.sqrt(ax * ax + ay * ay);
    let drag = GOLF.GREEN;
    b.sand = false; b.mud = false; b.ice = false;
    const ice = h.ice || [];
    for (let i = 0; i < ice.length; i++) if (golfInPoly(b.x, b.y, ice[i])) { drag = GOLF.ICE; b.ice = true; }
    const sand = h.sand || [];
    for (let i = 0; i < sand.length; i++) if (golfInPoly(b.x, b.y, sand[i])) { drag = GOLF.SAND; b.sand = true; b.ice = false; }
    const mud = h.mud || [];
    for (let i = 0; i < mud.length; i++) if (golfInPoly(b.x, b.y, mud[i])) { drag = GOLF.MUD; b.mud = true; b.sand = false; b.ice = false; }
    const belt = (h.belts || []).length ? golfBeltAt(h, b.x, b.y) : null;
    onBelt = !!belt;
    b.belt = onBelt;

    b.vx += ax * dt; b.vy += ay * dt;
    const sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
    if (belt) {
      // The belt brings the ball to its own speed.
      const k = GOLF.BELT_GRIP * dt;
      b.vx += (belt.vx - b.vx) * k; b.vy += (belt.vy - b.vy) * k;
    } else if (sp > 0) {
      const k = sp > drag * dt ? (sp - drag * dt) / sp : 0;
      b.vx *= k; b.vy *= k;
    }
    if (b.pad && sp > GOLF.MAX_SPEED) { const k = GOLF.MAX_SPEED / sp; b.vx *= k; b.vy *= k; }
    b.x += b.vx * dt; b.y += b.vy * dt;
    b.roll += sp * dt / GOLF.BALL_R;

    const rr = GOLF.BALL_R + GOLF.WALL_R;
    const segs = golfSegs(h);
    for (let i = 0; i < segs.length; i++) { const w = segs[i]; golfSegHit(b, w[0], w[1], w[2], w[3], rr, 0, 0); }
    const gates = h.gates || [];
    for (let i = 0; i < gates.length; i++) if (golfGateHit(b, gates[i], rr)) sim.flaps[i] = clock;
    const mills = h.mills || [];
    for (let i = 0; i < mills.length; i++) {
      const m = mills[i];
      if (!golfMillShut(m, clock)) continue;
      if (m.dir === 'y') golfSegHit(b, m.x - m.half, m.y, m.x + m.half, m.y, rr, 0, 0);
      else golfSegHit(b, m.x, m.y - m.half, m.x, m.y + m.half, rr, 0, 0);
    }
    const sliders = h.sliders || [];
    for (let i = 0; i < sliders.length; i++) {
      const sl = sliders[i];
      const s1 = golfSliderSeg(sl, clock), c0 = golfSliderAt(sl, clock - dt), c1 = golfSliderAt(sl, clock);
      golfSegHit(b, s1[0], s1[1], s1[2], s1[3], rr, (c1[0] - c0[0]) / dt, (c1[1] - c0[1]) / dt);
    }
    const spinners = h.spinners || [];
    for (let i = 0; i < spinners.length; i++) {
      const spn = spinners[i];
      const s1 = golfSpinnerSeg(spn, clock);
      // The bar's own speed where it meets the ball: ω × r.
      const rx = b.x - spn.x, ry = b.y - spn.y;
      golfSegHit(b, s1[0], s1[1], s1[2], s1[3], rr, -spn.w * ry, spn.w * rx);
    }
    // A bumper sends the ball away harder than it came.
    const bumpers = h.bumpers || [];
    for (let i = 0; i < bumpers.length; i++) {
      const bp = bumpers[i];
      const br = bp.r + GOLF.BALL_R;
      const dx = b.x - bp.x, dy = b.y - bp.y;
      const d2 = dx * dx + dy * dy;
      if (d2 >= br * br) continue;
      const d = Math.sqrt(d2) || 1e-6, nx = d2 ? dx / d : 1, ny = d2 ? dy / d : 0;
      b.x = bp.x + nx * br; b.y = bp.y + ny * br;
      const vn = b.vx * nx + b.vy * ny;
      if (vn < 0) {
        const out = Math.min(GOLF.BUMPER_MAX, Math.max(GOLF.BUMPER_MIN, -vn * GOLF.BUMPER));
        b.vx += (out - vn) * nx; b.vy += (out - vn) * ny;
        const s2 = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        if (s2 > GOLF.BUMPER_MAX) { const k = GOLF.BUMPER_MAX / s2; b.vx *= k; b.vy *= k; }
        b.bumps++; b.hits++;
        sim.bumped[i] = clock;
      }
    }
    // A portal: in at one ring, out of the other at the same speed, its own way.
    const portals = h.portals || [];
    for (let i = 0; i < portals.length; i++) {
      const pt = portals[i];
      const dx = b.x - pt.x, dy = b.y - pt.y, rin = GOLF.PORTAL_R * 0.75;
      if (dx * dx + dy * dy >= rin * rin) continue;
      const s2 = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      const u = golfUnit(pt.dx, pt.dy);
      b.x = pt.ox + u[0] * 0.3; b.y = pt.oy + u[1] * 0.3;
      b.vx = u[0] * s2; b.vy = u[1] * s2;
      b.lip = 0;
      b.warps++;
      b.warp = { k: i, t: clock };
      break;
    }
    // Off a ramp's lip fast enough, it flies.
    if (ramp) {
      const u = golfUnit(ramp.dx, ramp.dy);
      const rx = b.x - ramp.x, ry = b.y - ramp.y;
      const along = rx * u[0] + ry * u[1], across = ry * u[0] - rx * u[1];
      const va = b.vx * u[0] + b.vy * u[1];
      if (along > ramp.len && Math.abs(across) <= ramp.w / 2 + GOLF.BALL_R && va > 0) {
        b.air = true; b.z = GOLF.RAMP_H; b.vz = va * GOLF.RAMP_LIFT; b.jumps++;
        return;
      }
    }
  }

  const water = h.water || [];
  if (!onBelt) {
    for (let i = 0; i < water.length; i++) {
      if (golfInPoly(b.x, b.y, water[i])) { b.end = 'water'; b.vx = b.vy = 0; return; }
    }
  }

  // the cup: slow enough and it drops; too fast and it rattles out. Over the
  // middle of the cup it takes a firmer ball than across its rim.
  const cx = b.x - h.cup[0], cy = b.y - h.cup[1];
  const cd2 = cx * cx + cy * cy;
  const sp2 = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
  if (cd2 < GOLF.CUP_R * GOLF.CUP_R) {
    if (sp2 < GOLF.SINK_SPEED * (1 - 0.55 * cd2 / (GOLF.CUP_R * GOLF.CUP_R))) { b.end = 'cup'; b.x = h.cup[0]; b.y = h.cup[1]; b.vx = b.vy = 0; return; }
    if (!b.lip) { b.lip = 1; b.vx *= 0.7; b.vy *= 0.7; }
  } else if (b.lip && cd2 > (GOLF.CUP_R + 0.3) * (GOLF.CUP_R + 0.3)) b.lip = 0;

  if (sp2 < GOLF.STOP && slope < GOLF.REST_SLOPE && !onBelt && !golfInSweep(h, b.x, b.y)) { b.end = 'rest'; b.vx = b.vy = 0; return; }
  if (sim.t >= GOLF.MAX_T) { b.end = 'rest'; b.vx = b.vy = 0; }
}

/** Balls meeting on the ground: equal balls, the knock shared along the line between them. */
function golfBallsMeet(sim, all) {
  const R2 = 2 * GOLF.BALL_R;
  for (let i = 0; i < all.length; i++) {
    const a = all[i];
    if (a.air || (a.end && a.end !== 'rest')) continue;
    for (let j = i + 1; j < all.length; j++) {
      const b = all[j];
      if (b.air || (b.end && b.end !== 'rest')) continue;
      if (a.end === 'rest' && b.end === 'rest') continue;
      const dx = a.x - b.x, dy = a.y - b.y;
      const d2 = dx * dx + dy * dy;
      const key = i + ':' + j;
      if (sim.ghost[key]) { if (d2 >= R2 * R2) delete sim.ghost[key]; continue; }
      if (d2 >= R2 * R2) continue;
      const d = Math.sqrt(d2);
      const nx = d > 1e-9 ? dx / d : 1, ny = d > 1e-9 ? dy / d : 0;
      const over = (R2 - d) / 2;
      a.x += nx * over; a.y += ny * over;
      b.x -= nx * over; b.y -= ny * over;
      const vrel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
      if (vrel < 0) {
        const k = -(1 + GOLF.BALL_BOUNCE) * vrel / 2;
        a.vx += k * nx; a.vy += k * ny;
        b.vx -= k * nx; b.vy -= k * ny;
        a.knocks++; b.knocks++;
      }
      if (a.end === 'rest') a.end = null;
      if (b.end === 'rest') b.end = null;
      a.moved = true; b.moved = true;
    }
  }
}

function golfStep(sim) {
  if (sim.done) return;
  sim.t += GOLF.DT;
  const clock = sim.shot.t0 / 1000 + sim.t;
  if (!sim.end) golfMove(sim, sim, clock);
  const others = sim.others;
  if (!others.length) { sim.done = !!sim.end; return; }
  for (let i = 0; i < others.length; i++) if (!others[i].end) golfMove(sim, others[i], clock);
  const all = [sim].concat(others);
  golfBallsMeet(sim, all);
  if (sim.t >= GOLF.MAX_T) all.forEach(b => { if (!b.end) { b.end = 'rest'; b.vx = b.vy = 0; } });
  let done = true;
  for (let i = 0; i < all.length; i++) if (!all[i].end) { done = false; break; }
  sim.done = done;
}

function golfRun(hole, from, shot, others) {
  const sim = golfStart(hole, from, shot, others);
  while (!sim.done) golfStep(sim);
  return sim;
}

const golfR3 = (v) => Math.round(v * 1000) / 1000;

/**
 * Where a ball that went into the water goes back to: the spot it was hit
 * (or knocked) from - unless another ball lies there now, then the tee.
 */
function golfWetSpot(h, spot, taken) {
  const R2 = 2 * GOLF.BALL_R;
  const busy = taken.some(p => { const dx = p[0] - spot[0], dy = p[1] - spot[1]; return dx * dx + dy * dy < R2 * R2; });
  return busy ? [h.tee[0], h.tee[1]] : [spot[0], spot[1]];
}

// One putt from start to finish: where the ball lies after it, and how it ended.
// In the water the ball goes back to where it was hit from, a stroke added.
// With `others`, the balls it hit are in `moved` ([{ id, end, at, wet? }]): a
// ball knocked into the water goes back to its own spot with no stroke added,
// one knocked into the cup is holed.
function golfPutt(hole, from, shot, others) {
  const sim = golfRun(hole, from, shot, others);
  const withOthers = Array.isArray(others);
  if (!withOthers) {
    if (sim.end === 'water') return { end: 'water', at: [from[0], from[1]], strokes: 1 + GOLF.PENALTY, t: sim.t, wet: [golfR3(sim.x), golfR3(sim.y)] };
    return { end: sim.end, at: [golfR3(sim.x), golfR3(sim.y)], strokes: 1, t: sim.t };
  }
  // Where every ball on the course ends up, in the order the balls are listed.
  const all = [sim].concat(sim.others);
  const fin = all.map(b => (b.end === 'rest' ? [golfR3(b.x), golfR3(b.y)] : null));
  const takenBut = (k) => fin.filter((p, i) => p && i !== k);
  const out = { end: sim.end, at: null, strokes: 1, t: sim.t, moved: [] };
  if (sim.end === 'water') {
    const spot = golfWetSpot(hole, from, takenBut(0));
    fin[0] = spot;
    out.at = spot; out.strokes = 1 + GOLF.PENALTY; out.wet = [golfR3(sim.x), golfR3(sim.y)];
  } else out.at = sim.end === 'cup' ? [hole.cup[0], hole.cup[1]] : fin[0].slice();
  sim.others.forEach((b, k) => {
    if (!b.moved) return;
    const i = k + 1;
    if (b.end === 'water') {
      const spot = golfWetSpot(hole, [b.sx, b.sy], takenBut(i));
      fin[i] = spot;
      out.moved.push({ id: b.id, end: 'water', at: spot, wet: [golfR3(b.x), golfR3(b.y)] });
    } else if (b.end === 'cup') out.moved.push({ id: b.id, end: 'cup', at: [hole.cup[0], hole.cup[1]] });
    else out.moved.push({ id: b.id, end: 'rest', at: fin[i].slice() });
  });
  return out;
}

/* --- the way to the cup ------------------------------------------------------------
   A grid over the hole, every square the ball could lie on, and how far each
   is from the cup going round rails, blocks and water (moving pieces are left
   out: they open again; a one-way gate is crossed only its own way; a ramp and
   a portal are shortcuts the walk never needs). The clock's gentle putt aims
   along it, and the tests use it to judge how close a putt got. */
const GOLF_FIELD = {};
const GOLF_CELL = 0.5;

/** Could the ball lie here: on the green, dry, off the ramps, clear of every rail, block and bumper. */
function golfOpen(h, x, y) {
  if (!golfInPoly(x, y, h.green)) return false;
  const water = h.water || [];
  for (let i = 0; i < water.length; i++) if (golfInPoly(x, y, water[i])) return false;
  const blocks = h.blocks || [];
  for (let i = 0; i < blocks.length; i++) if (golfInPoly(x, y, blocks[i].poly)) return false;
  const ramps = h.ramps || [];
  for (let i = 0; i < ramps.length; i++) if (golfRampU(ramps[i], x, y) >= 0) return false;
  const bumpers = h.bumpers || [];
  for (let i = 0; i < bumpers.length; i++) {
    const bp = bumpers[i], dx = x - bp.x, dy = y - bp.y, r = bp.r + GOLF.BALL_R - 0.02;
    if (dx * dx + dy * dy < r * r) return false;
  }
  const rr = GOLF.BALL_R + GOLF.WALL_R - 0.02;
  // What a moving piece never leaves: the middle of a sliding gate, a beam's post.
  const sliders = h.sliders || [];
  for (let i = 0; i < sliders.length; i++) {
    const sl = sliders[i], core = sl.len / 2 - sl.travel;
    if (core <= 0) continue;
    const along = sl.axis === 'x' ? x - sl.x : y - sl.y, across = sl.axis === 'x' ? y - sl.y : x - sl.x;
    if (Math.abs(across) < rr && Math.abs(along) < core + GOLF.BALL_R) return false;
  }
  const spinners = h.spinners || [];
  for (let i = 0; i < spinners.length; i++) {
    const dx = x - spinners[i].x, dy = y - spinners[i].y;
    if (dx * dx + dy * dy < rr * rr) return false;
  }
  const segs = golfSegs(h);
  for (let i = 0; i < segs.length; i++) {
    const w = segs[i];
    const ex = w[2] - w[0], ey = w[3] - w[1], len2 = ex * ex + ey * ey;
    let u = len2 ? ((x - w[0]) * ex + (y - w[1]) * ey) / len2 : 0;
    u = u < 0 ? 0 : u > 1 ? 1 : u;
    const dx = x - (w[0] + ex * u), dy = y - (w[1] + ey * u);
    if (dx * dx + dy * dy < rr * rr) return false;
  }
  return true;
}

/** Has the hole a way that goes one way only: a gate or a conveyor? */
function golfOneWay(h) { return (h.gates || []).length > 0 || (h.belts || []).length > 0; }

/** Does going from a to b cross a one-way gate the wrong way, or go against a conveyor? */
function golfGateBlocks(h, ax, ay, bx, by) {
  const belts = h.belts || [];
  for (let i = 0; i < belts.length; i++) {
    const bl = belts[i];
    if ((bx - ax) * bl.vx + (by - ay) * bl.vy >= 0) continue;
    // against the belt: blocked where the way runs over it
    for (let k = 0; k <= 8; k++) {
      const x = ax + (bx - ax) * k / 8, y = ay + (by - ay) * k / 8;
      if (x >= bl.x0 && x <= bl.x1 && y >= bl.y0 && y <= bl.y1) return true;
    }
  }
  const gates = h.gates || [];
  for (let i = 0; i < gates.length; i++) {
    const g = gates[i];
    const d1x = bx - ax, d1y = by - ay, d2x = g.x2 - g.x1, d2y = g.y2 - g.y1;
    const den = d1x * d2y - d1y * d2x;
    if (!den) continue;
    const s = ((g.x1 - ax) * d2y - (g.y1 - ay) * d2x) / den;
    const t = ((g.x1 - ax) * d1y - (g.y1 - ay) * d1x) / den;
    if (s < 0 || s > 1 || t < 0 || t > 1) continue;
    if (d1x * g.dx + d1y * g.dy <= 0) return true;
  }
  return false;
}

function golfField(h) {
  if (GOLF_FIELD[h.id]) return GOLF_FIELD[h.id];
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  h.green.forEach(p => { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); });
  const c = GOLF_CELL;
  const cols = Math.floor((x1 - x0) / c) + 1, rows = Math.floor((y1 - y0) / c) + 1;
  const open = new Array(cols * rows);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) open[j * cols + i] = golfOpen(h, x0 + (i + 0.5) * c, y0 + (j + 0.5) * c);
  const dist = new Array(cols * rows).fill(Infinity);
  const f = { x0, y0, cols, rows, open, dist };
  const gated = golfOneWay(h);
  // Dijkstra from the cup's square, eight ways round.
  const ci = Math.min(cols - 1, Math.max(0, Math.floor((h.cup[0] - x0) / c)));
  const cj = Math.min(rows - 1, Math.max(0, Math.floor((h.cup[1] - y0) / c)));
  const heap = [];
  const push = (d, k) => {
    heap.push([d, k]);
    let i = heap.length - 1;
    while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; const t = heap[p]; heap[p] = heap[i]; heap[i] = t; i = p; }
  };
  const pop = () => {
    const top = heap[0], last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
        if (m === i) break;
        const t = heap[m]; heap[m] = heap[i]; heap[i] = t; i = m;
      }
    }
    return top;
  };
  const start = cj * cols + ci;
  dist[start] = 0;
  push(0, start);
  const DIAG = 1.4142135623730951 * c;
  while (heap.length) {
    const top = pop();
    const d = top[0], k = top[1];
    if (d > dist[k]) continue;
    const i = k % cols, j = (k - i) / cols;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue;
      const ni = i + di, nj = j + dj;
      if (ni < 0 || nj < 0 || ni >= cols || nj >= rows) continue;
      const nk = nj * cols + ni;
      if (!open[nk]) continue;
      if (di && dj && (!open[j * cols + ni] || !open[nj * cols + i])) continue;
      // the ball would go from the neighbour to this square: a gate only lets it through its own way
      if (gated && golfGateBlocks(h, x0 + (ni + 0.5) * c, y0 + (nj + 0.5) * c, x0 + (i + 0.5) * c, y0 + (j + 0.5) * c)) continue;
      const nd = d + (di && dj ? DIAG : c);
      if (nd < dist[nk]) { dist[nk] = nd; push(nd, nk); }
    }
  }
  GOLF_FIELD[h.id] = f;
  return f;
}

/** How far a point is from the cup, round everything in the way (Infinity: the cup can't be reached from there). */
function golfDistance(h, x, y) {
  const f = golfField(h), c = GOLF_CELL;
  const i = Math.floor((x - f.x0) / c), j = Math.floor((y - f.y0) / c);
  let best = Infinity;
  for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
    const ni = i + di, nj = j + dj;
    if (ni < 0 || nj < 0 || ni >= f.cols || nj >= f.rows) continue;
    const k = nj * f.cols + ni;
    if (!f.open[k] || f.dist[k] === Infinity) continue;
    const cx = f.x0 + (ni + 0.5) * c - x, cy = f.y0 + (nj + 0.5) * c - y;
    if (golfOneWay(h) && golfGateBlocks(h, x, y, x + cx, y + cy)) continue;
    best = Math.min(best, f.dist[k] + Math.sqrt(cx * cx + cy * cy));
  }
  return best;
}

/**
 * Can a ball roll straight from a to b without meeting a rail, a block or a
 * gate the wrong way - and without passing the water close enough to drop in?
 */
function golfClearLine(h, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  if (golfOneWay(h) && golfGateBlocks(h, ax, ay, bx, by)) return false;
  const d = Math.sqrt(dx * dx + dy * dy);
  const n = Math.max(1, Math.ceil(d / 0.2));
  const water = h.water || [];
  const m = 0.45, sx = d ? -dy / d * m : 0, sy = d ? dx / d * m : 0;
  for (let k = 1; k <= n; k++) {
    const x = ax + dx * k / n, y = ay + dy * k / n;
    if (!golfOpen(h, x, y)) return false;
    // the water kept a ball's width and a little more away on either side
    if (water.length && (golfInAny(x + sx, y + sy, water) || golfInAny(x - sx, y - sy, water))) return false;
  }
  return true;
}

/**
 * The speed a ball needs to roll straight from a to b and stop there: the
 * ground's drag all the way (ice, sand, mud), less what a speed pad on the
 * way gives it. Slopes are left out.
 */
function golfSpeedFor(h, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (!d) return 0;
  const n = Math.max(1, Math.ceil(d / 0.1)), ds = d / n, ux = dx / d, uy = dy / d;
  let need = 0;       // the speed squared still needed, from b back to a
  for (let k = n - 1; k >= 0; k--) {
    const x = ax + dx * (k + 0.5) / n, y = ay + dy * (k + 0.5) / n;
    let push = 0;
    (h.pads || []).forEach(p => { const u = golfPadAt(p, x, y); if (u) push += (p.push || GOLF.PAD) * (u[0] * ux + u[1] * uy); });
    need = Math.max(0, need + 2 * (golfDragAt(h, x, y) - push) * ds);
  }
  return Math.sqrt(need);
}

/**
 * The phone's putt for a player whose clock ran out (or the host's "play for"):
 * gently toward the cup - straight at it when nothing is in the way, else at the
 * farthest-along point in sight - with only as much as it needs to get there.
 */
function golfAutoShot(h, at, t0) {
  const f = golfField(h), c = GOLF_CELL;
  let tx = h.cup[0], ty = h.cup[1], toCup = golfClearLine(h, at[0], at[1], tx, ty);
  if (!toCup) {
    let best = golfDistance(h, at[0], at[1]), found = false;
    for (let j = 0; j < f.rows; j++) for (let i = 0; i < f.cols; i++) {
      const k = j * f.cols + i;
      if (!f.open[k] || f.dist[k] >= best - 0.25) continue;
      const x = f.x0 + (i + 0.5) * c, y = f.y0 + (j + 0.5) * c;
      const ex = x - at[0], ey = y - at[1];
      if (ex * ex + ey * ey > 100) continue;
      if (!golfClearLine(h, at[0], at[1], x, y)) continue;
      best = f.dist[k]; tx = x; ty = y; found = true;
    }
    if (!found) { tx = h.cup[0]; ty = h.cup[1]; }
  }
  const dx = tx - at[0], dy = ty - at[1];
  const d = Math.sqrt(dx * dx + dy * dy) || 1;
  // Just past the cup (a putt that dies at the rim drops), just to a point on the way.
  const over = toCup ? 0.6 : 0;
  const reach = Math.min(d + over, 12);
  const v = Math.min(10, golfSpeedFor(h, at[0], at[1], at[0] + dx / d * reach, at[1] + dy / d * reach));
  return {
    dx: Math.round(dx / d * 1000), dy: Math.round(dy / d * 1000),
    power: Math.max(40, Math.min(700, Math.round(v / GOLF.MAX_SPEED * 1000))),
    t0: Math.max(0, Math.round(Number(t0) || 0))
  };
}

/** A hole's score in words: 'ace', 'albatross', 'eagle', 'birdie', 'par', 'bogey', 'double', 'more'. */
function golfScoreWord(strokes, par) {
  if (strokes === 1) return 'ace';
  const d = strokes - par;
  if (d <= -3) return 'albatross';
  if (d === -2) return 'eagle';
  if (d === -1) return 'birdie';
  if (d === 0) return 'par';
  if (d === 1) return 'bogey';
  if (d === 2) return 'double';
  return 'more';
}
