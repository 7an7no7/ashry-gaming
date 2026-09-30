/*
 * «الشلة» (the crew): one Durable Object per crew code, kept on the free plan with
 * nothing to look after. A crew is a name, its members and the nights its rooms
 * played; the tables, titles and records are worked out from the nights when a
 * page asks (Crew.js). No accounts: a phone joins with the code (a link or a QR)
 * and is given a key that is its proof of membership, as a room gives its phones
 * keys. The member who manages the crew proves it with their own key.
 *
 * Storage: 'crew' (the name, members, keys, the frozen champions, packs) and one
 * key per night, 'n:<id>' (a night is written again whenever its room banks more,
 * so it is replaced, never counted twice). A crew nobody has touched for a year
 * deletes itself.
 *
 * Called by the Worker (index.js: /crew/create, /crew/join, /crew/peek, /crew/get,
 * /crew/act) and, server to server, by a Room (verify, recordNight, dropNight).
 * Other features call recordNight and the packs methods the same way (see
 * notes/builders/crew.md).
 */
import { DurableObject } from 'cloudflare:workers';
import {
  CREW_MAX_MEMBERS, CREW_MAX_NIGHTS, CREW_MAX_PACKS, CREW_NAME_MAX, CREW_MEMBER_NAME_MAX,
  crewFold, crewCleanName, crewCleanNight, crewView, crewFreezeChamps
} from '../generated/rules.js';

const YEAR_MS = 365 * 24 * 3600 * 1000;
const TOUCH_EVERY_MS = 24 * 3600 * 1000;   // a page view keeps a crew alive, written at most once a day
const KEYS_PER_MEMBER = 6;                  // phones a member can be on at once; the oldest key goes

const newId = () => 'm' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
const newKey = () => {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
};
const fail = (error) => ({ ok: false, error });

export class Crew extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.meta = undefined;    // undefined: not read yet; null: no crew
    this.nights = null;       // Map id -> night
  }

  async load() {
    if (this.meta === undefined) this.meta = (await this.ctx.storage.get('crew')) || null;
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
    await this.load();
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
    const k = this.meta && this.meta.keys && this.meta.keys[String(key || '')];
    if (!k) return null;
    return this.meta.members.find((m) => m.id === k.m) || null;
  }

  issueKey(memberId) {
    const keys = this.meta.keys = this.meta.keys || {};
    const mine = Object.keys(keys).filter((k) => keys[k].m === memberId).sort((a, b) => keys[a].at - keys[b].at);
    while (mine.length >= KEYS_PER_MEMBER) delete keys[mine.shift()];
    const key = newKey();
    keys[key] = { m: memberId, at: Date.now() };
    return key;
  }

  view(memberId) {
    return crewView(this.meta, [...this.nights.values()], Date.now(), memberId);
  }

  nameTaken(name, exceptId) {
    const f = crewFold(name);
    return this.meta.members.some((m) => m.id !== exceptId && crewFold(m.name) === f);
  }

  /* --- the Worker's calls ------------------------------------------------------ */

  async create(code, rawName, rawMe) {
    await this.load();
    if (this.meta) return { taken: true };
    const name = crewCleanName(rawName, CREW_NAME_MAX);
    const me = crewCleanName(rawMe, CREW_MEMBER_NAME_MAX);
    if (!name) return fail('اكتب اسم الشلة');
    if (!me) return fail('اكتب اسمك');
    const id = newId();
    const now = Date.now();
    this.meta = { code, name, createdAt: now, activeAt: now, managerId: id, members: [{ id, name: me, at: now }], keys: {}, champs: [], packs: [] };
    this.nights = new Map();
    const key = this.issueKey(id);
    await this.save();
    await this.touch(true);
    return { ok: true, code, memberId: id, key, crew: this.view(id) };
  }

  /** What the join sheet shows before joining: the name and who is in it (no keys, no nights). */
  async peek() {
    await this.load();
    if (!this.meta) return fail('CREW_NOT_FOUND');
    return { ok: true, crew: { code: this.meta.code, name: this.meta.name, members: this.meta.members.map((m) => ({ id: m.id, name: m.name })) } };
  }

  /**
   * «إنت مين فيهم؟»: `claim` is an existing member's id (this phone is theirs),
   * otherwise `name` joins as someone new. No passwords, as with rooms: the code is
   * what lets a phone in.
   */
  async join(claim, rawName) {
    await this.load();
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
    const key = this.issueKey(member.id);
    await this.save();
    await this.touch(true);
    return { ok: true, code: this.meta.code, memberId: member.id, key, crew: this.view(member.id) };
  }

  async get(key) {
    await this.load();
    if (!this.meta) return { ok: false, gone: true, error: 'CREW_NOT_FOUND' };
    const me = this.memberOfKey(key);
    if (!me) return { ok: false, out: true, error: 'NOT_IN_CREW' };
    await this.touch(false);
    return { ok: true, crew: this.view(me.id) };
  }

  /** A member's move: the manager's (rename, members), anyone's (leave, packs). */
  async act(key, action, payload) {
    await this.load();
    if (!this.meta) return { ok: false, gone: true, error: 'CREW_NOT_FOUND' };
    const me = this.memberOfKey(key);
    if (!me) return { ok: false, out: true, error: 'NOT_IN_CREW' };
    const p = payload && typeof payload === 'object' ? payload : {};
    const manager = me.id === this.meta.managerId;
    const needManager = () => { if (!manager) throw new Error('ده للي ماسك الشلة بس'); };
    const target = () => {
      const m = this.meta.members.find((x) => x.id === String(p.id || ''));
      if (!m) throw new Error('مش في الشلة');
      return m;
    };
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
        this.meta.managerId = m.id;
      } else if (action === 'leave') {
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
        this.addPack(me, p);
      } else if (action === 'removePack') {
        const code = String(p.code || '');
        const pack = (this.meta.packs || []).find((x) => x.code === code);
        if (!pack) throw new Error('مش موجودة');
        if (!manager && pack.byId !== me.id) throw new Error('اللي ضافها أو اللي ماسك الشلة بس');
        this.meta.packs = this.meta.packs.filter((x) => x !== pack);
      } else if (action !== 'get') {
        throw new Error('إجراء غير معروف');
      }
    } catch (err) {
      return fail(String((err && err.message) || err));
    }
    if (action !== 'get') { await this.save(); await this.touch(true); }
    return { ok: true, crew: this.view(me.id) };
  }

  dropMember(id) {
    this.meta.members = this.meta.members.filter((m) => m.id !== id);
    const keys = this.meta.keys || {};
    Object.keys(keys).forEach((k) => { if (keys[k].m === id) delete keys[k]; });
    // The manager leaving hands the crew to whoever has been in it longest.
    if (this.meta.managerId === id && this.meta.members.length) {
      this.meta.managerId = this.meta.members.slice().sort((a, b) => (a.at || 0) - (b.at || 0))[0].id;
    }
  }

  /* --- packs: codes of quizzes and word packs the crew keeps (other features') --- */

  addPack(me, p) {
    const code = String(p.code || '').trim().slice(0, 16);
    if (!/^[A-Za-z0-9_-]{3,16}$/.test(code)) throw new Error('كود مش صحيح');
    const kind = String(p.kind || 'pack').replace(/[^a-z0-9_-]/gi, '').slice(0, 16) || 'pack';
    const title = crewCleanName(p.title, 40);
    const packs = this.meta.packs = (this.meta.packs || []).filter((x) => x.code !== code);
    if (packs.length >= CREW_MAX_PACKS) throw new Error('الشلة فيها حاجات كتير، امسح واحدة الأول');
    packs.unshift({ code, kind, title, by: me.name, byId: me.id, at: Date.now() });
  }

  /** Server to server: a pack attached without a phone (another feature's own endpoint). */
  async attachPack(pack) {
    await this.load();
    if (!this.meta) return fail('CREW_NOT_FOUND');
    try { this.addPack({ name: String((pack && pack.by) || ''), id: '' }, pack || {}); } catch (err) { return fail(err.message); }
    await this.save();
    await this.touch(true);
    return { ok: true };
  }

  async listPacks() {
    await this.load();
    if (!this.meta) return fail('CREW_NOT_FOUND');
    return { ok: true, packs: (this.meta.packs || []).map((p) => ({ code: p.code, kind: p.kind, title: p.title, by: p.by, at: p.at })) };
  }

  /* --- a Room's calls (server to server; a phone never reaches these) ---------- */

  /** A phone's key -> the member it proves, and the crew's name, or null. */
  async verify(key) {
    await this.load();
    const m = this.memberOfKey(key);
    return m ? { ok: true, memberId: m.id, memberName: m.name, name: this.meta.name, code: this.meta.code } : { ok: false };
  }

  /**
   * A night, as a room sends it (crewNightInput): written under its id, replacing the
   * same night sent before (every time its room banks more, and when it closes). A
   * night with no member on it is not kept (dropped if it was).
   */
  async recordNight(input) {
    await this.load();
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
    await this.load();
    if (!this.meta || !this.nights.has(String(id))) return { ok: true };
    this.nights.delete(String(id));
    await this.ctx.storage.delete('n:' + String(id));
    return { ok: true };
  }
}
