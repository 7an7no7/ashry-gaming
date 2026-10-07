/*
 * «الشلة» (the crew): one Durable Object per crew code, kept on the free plan with
 * nothing to look after. A crew is a name, its members and the nights its rooms
 * played; the tables, titles and records are worked out from the nights when a
 * page asks (Crew.js). No accounts: a phone joins with the code (a link or a QR)
 * and is given a key that is its proof of membership, as a room gives its phones
 * keys. The manager's power is a KEY's, not a member id's (Crew.js, «the keys»):
 * the code alone lets anyone claim any name, so a claim gives a member key only.
 *
 * Storage: 'crew' (the name, members, keys, the frozen champions, packs) and one
 * key per night, 'n:<id>' (a night is written again whenever its room banks more,
 * so it is replaced, never counted twice). A crew nobody has touched for a year
 * deletes itself. The nights are read only once a key has been checked and a page
 * is about to be drawn (loadNights): a wrong key costs one read, not four hundred.
 *
 * Called by the Worker (index.js: /crew/create, /crew/join, /crew/peek, /crew/get,
 * /crew/act) and, server to server, by a Room (verify, recordNight, dropNight).
 * Other features call recordNight and the packs methods the same way (see
 * notes/games/crew.md).
 */
import { DurableObject } from 'cloudflare:workers';
import {
  CREW_MAX_MEMBERS, CREW_MAX_NIGHTS, CREW_MAX_PACKS, CREW_NAME_MAX, CREW_MEMBER_NAME_MAX,
  crewFold, crewCleanName, crewCleanNight, crewView, crewFreezeChamps, crewAddPackTo, crewRemovePackFrom,
  crewKeysMigrate, crewKeyRec, crewKeyIsManager, crewIssueKey, crewSetManager, crewPairMake, crewPairUse
} from '../generated/rules.js';

const YEAR_MS = 365 * 24 * 3600 * 1000;
const TOUCH_EVERY_MS = 24 * 3600 * 1000;   // a page view keeps a crew alive, written at most once a day

const newId = () => 'm' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
const newKey = () => {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
};
/** Six digits for pairing the manager's other phone (crewPairMake). */
const newPairCode = () => {
  const b = new Uint32Array(1);
  crypto.getRandomValues(b);
  return String(b[0] % 1000000).padStart(6, '0');
};
const fail = (error) => ({ ok: false, error });

export class Crew extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.meta = undefined;    // undefined: not read yet; null: no crew
    this.nights = null;       // Map id -> night, read only when needed (loadNights)
  }

  /** The crew's record only (the keys among it). Keys from before their kinds are sorted once. */
  async loadMeta() {
    if (this.meta === undefined) {
      this.meta = (await this.ctx.storage.get('crew')) || null;
      if (this.meta && crewKeysMigrate(this.meta)) await this.save();
    }
    return this.meta;
  }

  /** The nights too: for drawing a page, or a room's night. */
  async loadNights() {
    await this.loadMeta();
    if (this.meta && !this.nights) {
      this.nights = new Map();
      const all = await this.ctx.storage.list({ prefix: 'n:' });
      for (const [, n] of all) if (n && n.id) this.nights.set(n.id, n);
    }
    return this.meta;
  }

  async save() {
    await this.ctx.storage.put('crew', this.meta);
  }

  /** Every write and (once a day) every view: the year starts again. */
  async touch(write) {
    const now = Date.now();
    if (!write && now - (this.meta.activeAt || 0) < TOUCH_EVERY_MS) return;
    this.meta.activeAt = now;
    if (!write) await this.save();
    await this.ctx.storage.setAlarm(now + YEAR_MS);
  }

  async alarm() {
    await this.loadMeta();
    if (!this.meta) return;
    if (Date.now() - (this.meta.activeAt || 0) >= YEAR_MS - 60000) {
      await this.ctx.storage.deleteAll();
      this.meta = null;
      this.nights = null;
      return;
    }
    await this.ctx.storage.setAlarm((this.meta.activeAt || Date.now()) + YEAR_MS);
  }

  memberOfKey(key) {
    const k = crewKeyRec(this.meta, key);
    return k ? this.meta.members.find((m) => m.id === k.m) || null : null;
  }

  /** A key used: its last use noted (kept with the next write; it orders which key goes first). */
  used(key) {
    const k = crewKeyRec(this.meta, key);
    if (k) k.u = Date.now();
  }

  async view(memberId, key) {
    await this.loadNights();
    return crewView(this.meta, [...this.nights.values()], Date.now(), memberId, crewKeyIsManager(this.meta, key));
  }

  nameTaken(name, exceptId) {
    const f = crewFold(name);
    return this.meta.members.some((m) => m.id !== exceptId && crewFold(m.name) === f);
  }

  /* --- the Worker's calls ------------------------------------------------------ */

  async create(code, rawName, rawMe) {
    await this.loadMeta();
    if (this.meta) return { taken: true };
    const name = crewCleanName(rawName, CREW_NAME_MAX);
    const me = crewCleanName(rawMe, CREW_MEMBER_NAME_MAX);
    if (!name) return fail('اكتب اسم الشلة');
    if (!me) return fail('اكتب اسمك');
    const id = newId();
    const now = Date.now();
    this.meta = { code, name, createdAt: now, activeAt: now, managerId: id, members: [{ id, name: me, at: now }], keys: {}, keysV: 2, champs: [], packs: [] };
    this.nights = new Map();
    const key = crewIssueKey(this.meta, id, 'create', now, newKey());
    await this.save();
    await this.touch(true);
    return { ok: true, code, memberId: id, key, crew: await this.view(id, key) };
  }

  /** What the join sheet shows before joining: the name and who is in it (no keys, no nights). */
  async peek() {
    await this.loadMeta();
    if (!this.meta) return fail('CREW_NOT_FOUND');
    return { ok: true, crew: { code: this.meta.code, name: this.meta.name, members: this.meta.members.map((m) => ({ id: m.id, name: m.name })) } };
  }

  /**
   * «إنت مين فيهم؟»: `claim` is an existing member's id (this phone is theirs),
   * otherwise `name` joins as someone new. No passwords, as with rooms: the code is
   * what lets a phone in - and so a claim's key is a member's, never the manager's
   * (the manager's other phone pairs: act 'pair').
   */
  async join(claim, rawName) {
    await this.loadMeta();
    if (!this.meta) return fail('CREW_NOT_FOUND');
    let member;
    if (claim) {
      member = this.meta.members.find((m) => m.id === String(claim));
      if (!member) return fail('الاسم ده مش في الشلة دلوقتي');
    } else {
      const name = crewCleanName(rawName, CREW_MEMBER_NAME_MAX);
      if (!name) return fail('اكتب اسمك');
      if (this.nameTaken(name)) return { ok: false, error: 'NAME_TAKEN', id: this.meta.members.find((m) => crewFold(m.name) === crewFold(name)).id };
      if (this.meta.members.length >= CREW_MAX_MEMBERS) return fail('الشلة اتملت');
      member = { id: newId(), name, at: Date.now() };
      this.meta.members.push(member);
    }
    const key = crewIssueKey(this.meta, member.id, claim ? 'claim' : 'join', Date.now(), newKey());
    if (!key) return fail('الاسم ده داخل من موبايلات كتير');
    await this.save();
    await this.touch(true);
    return { ok: true, code: this.meta.code, memberId: member.id, key, crew: await this.view(member.id, key) };
  }

  async get(key) {
    await this.loadMeta();
    if (!this.meta) return { ok: false, gone: true, error: 'CREW_NOT_FOUND' };
    const me = this.memberOfKey(key);
    if (!me) return { ok: false, out: true, error: 'NOT_IN_CREW' };
    this.used(key);
    await this.touch(false);
    return { ok: true, crew: await this.view(me.id, key) };
  }

  /** A member's move: the manager's (rename, members, pairing), anyone's (leave, packs). */
  async act(key, action, payload) {
    await this.loadMeta();
    if (!this.meta) return { ok: false, gone: true, error: 'CREW_NOT_FOUND' };
    const me = this.memberOfKey(key);
    if (!me) return { ok: false, out: true, error: 'NOT_IN_CREW' };
    this.used(key);
    const p = payload && typeof payload === 'object' ? payload : {};
    const manager = crewKeyIsManager(this.meta, key);
    const needManager = () => { if (!manager) throw new Error('ده للي ماسك الشلة بس'); };
    const target = () => {
      const m = this.meta.members.find((x) => x.id === String(p.id || ''));
      if (!m) throw new Error('مش في الشلة');
      return m;
    };
    let extra = null;
    try {
      if (action === 'rename') {
        needManager();
        const name = crewCleanName(p.name, CREW_NAME_MAX);
        if (!name) throw new Error('اكتب اسم الشلة');
        this.meta.name = name;
      } else if (action === 'renameMember') {
        needManager();
        const m = target();
        const name = crewCleanName(p.name, CREW_MEMBER_NAME_MAX);
        if (!name) throw new Error('اكتب الاسم');
        if (this.nameTaken(name, m.id)) throw new Error('الاسم ده موجود في الشلة');
        m.name = name;
      } else if (action === 'removeMember') {
        needManager();
        const m = target();
        if (m.id === me.id) throw new Error('عشان تخرج انت، استخدم «اخرج من الشلة»');
        this.dropMember(m.id);
      } else if (action === 'handOver') {
        needManager();
        const m = target();
        crewSetManager(this.meta, m.id);
      } else if (action === 'pairCode') {
        // «ضيف موبايلك التاني»: a code for the manager's other phone (crewPairMake checks the key).
        extra = { pair: crewPairMake(this.meta, key, Date.now(), newPairCode()) };
      } else if (action === 'pair') {
        // The manager's other phone, in by a claim of their name, types the code.
        try {
          crewPairUse(this.meta, key, p.code, Date.now());
        } catch (err) {
          await this.save();     // a wrong try counts, even though the move fails
          throw err;
        }
      } else if (action === 'leave') {
        const k = crewKeyRec(this.meta, key);
        if (k && k.c && !k.mg) {
          // A phone in by a claim: only this phone goes. Anyone with the code can claim a name,
          // so a claim can't take the member (or, the last one, the crew and its history) away.
          delete this.meta.keys[String(key)];
          await this.save();
          await this.touch(true);
          return { ok: true, left: true, phoneOnly: true };
        }
        this.dropMember(me.id);
        if (!this.meta.members.length) {
          await this.ctx.storage.deleteAll();
          this.meta = null;
          this.nights = null;
          return { ok: true, left: true, gone: true };
        }
        await this.save();
        await this.touch(true);
        return { ok: true, left: true };
      } else if (action === 'addPack') {
        crewAddPackTo(this.meta, me, p);            // Crew.js: the rule (a member, a code, CREW_MAX_PACKS)
      } else if (action === 'removePack') {
        crewRemovePackFrom(this.meta, Object.assign({ manager }, me), p.code);  // the one who added it, or the manager's key
      } else if (action !== 'get') {
        throw new Error('إجراء غير معروف');
      }
    } catch (err) {
      return fail(String((err && err.message) || err));
    }
    if (action !== 'get') { await this.save(); await this.touch(true); } else await this.touch(false);
    return Object.assign({ ok: true, crew: await this.view(me.id, key) }, extra || {});
  }

  dropMember(id) {
    this.meta.members = this.meta.members.filter((m) => m.id !== id);
    const keys = this.meta.keys || {};
    Object.keys(keys).forEach((k) => { if (keys[k].m === id) delete keys[k]; });
    // The manager leaving hands the crew to whoever has been in it longest.
    if (this.meta.managerId === id && this.meta.members.length) {
      crewSetManager(this.meta, this.meta.members.slice().sort((a, b) => (a.at || 0) - (b.at || 0))[0].id);
    }
  }

  /* --- packs: codes of quizzes and word packs the crew keeps (other features') --- */

  /** Server to server: a pack attached without a phone (another feature's own endpoint). */
  async attachPack(pack) {
    await this.loadMeta();
    if (!this.meta) return fail('CREW_NOT_FOUND');
    try { crewAddPackTo(this.meta, { server: true, name: String((pack && pack.by) || '') }, pack || {}); } catch (err) { return fail(err.message); }
    await this.save();
    await this.touch(true);
    return { ok: true };
  }

  async listPacks() {
    await this.loadMeta();
    if (!this.meta) return fail('CREW_NOT_FOUND');
    return { ok: true, packs: (this.meta.packs || []).map((p) => ({ code: p.code, kind: p.kind, title: p.title, by: p.by, at: p.at })) };
  }

  /* --- a Room's calls (server to server; a phone never reaches these) ---------- */

  /**
   * «تاج البطل» (the owner's pick of 7 Oct 2026): the reigning champion(s) a room opened for
   * the crew crowns - this month's leader once a night of it is won, else the last month's
   * champion - as member ids and names (members still in the crew only).
   */
  async crown() {
    await this.loadNights();
    if (!this.meta) return { ok: false };
    const v = crewView(this.meta, [...this.nights.values()], Date.now(), null);
    const members = new Set((v.members || []).map((m) => m.id));
    const t = v.table || [];
    let ids = [], names = [];
    if (t.length && t[0].won) {
      const top = t.filter((r) => r.won === t[0].won && r.points === t[0].points);
      ids = top.map((r) => r.id); names = top.map((r) => r.name);
    } else if ((v.champions || []).length) {
      ids = v.champions[0].ids || []; names = v.champions[0].names || [];
    }
    const keep = ids.map((id, i) => [id, names[i] || '']).filter((x) => members.has(x[0]));
    return { ok: true, ids: keep.map((x) => x[0]), names: keep.map((x) => x[1]) };
  }

  /** A phone's key -> the member it proves, and the crew's name, or null. */
  async verify(key) {
    await this.loadMeta();
    const m = this.memberOfKey(key);
    return m ? { ok: true, memberId: m.id, memberName: m.name, name: this.meta.name, code: this.meta.code } : { ok: false };
  }

  /**
   * A night, as a room sends it (crewNightInput): written under its id, replacing the
   * same night sent before (every time its room banks more, and when it closes). A
   * night with no member on it is not kept (dropped if it was).
   */
  async recordNight(input) {
    await this.loadNights();
    if (!this.meta) return fail('CREW_NOT_FOUND');
    const now = Date.now();
    const night = crewCleanNight(input, this.meta.members, now);
    if (!night.id) return fail('no id');
    const old = this.nights.get(night.id);
    if (old) { night.start = old.start; night.date = old.date; night.month = old.month; }
    if (!night.rows.some((r) => r.m)) {
      if (old) { this.nights.delete(night.id); await this.ctx.storage.delete('n:' + night.id); }
      return { ok: true, kept: false };
    }
    this.nights.set(night.id, night);
    await this.ctx.storage.put('n:' + night.id, night);
    // The oldest nights go past the cap (the champions' wall is frozen first).
    crewFreezeChamps(this.meta, [...this.nights.values()], now);
    if (this.nights.size > CREW_MAX_NIGHTS) {
      const drop = [...this.nights.values()].sort((a, b) => a.start - b.start).slice(0, this.nights.size - CREW_MAX_NIGHTS);
      for (const n of drop) { this.nights.delete(n.id); await this.ctx.storage.delete('n:' + n.id); }
    }
    await this.save();
    await this.touch(true);
    return { ok: true, kept: true };
  }

  /** The room moved to another crew (or none): this night is no longer this crew's. */
  async dropNight(id) {
    await this.loadNights();
    if (!this.meta || !this.nights.has(String(id))) return { ok: true };
    this.nights.delete(String(id));
    await this.ctx.storage.delete('n:' + String(id));
    return { ok: true };
  }
}
