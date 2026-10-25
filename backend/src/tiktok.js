import { EventEmitter } from 'node:events';
import { TikTokLiveConnection, WebcastEvent, ControlEvent } from 'tiktok-live-connector';

const pickUser = (u = {}) => ({
  userId: u.userId?.toString(),
  uniqueId: u.uniqueId,
  nickname: u.nickname,
  avatar: u.profilePicture?.urls?.[0],
});

// Réduit chaque événement à un format simple ; `raw` garde le message complet.
const normalizers = {
  [WebcastEvent.CHAT]: (d) => ({ user: pickUser(d.user), comment: d.comment }),
  [WebcastEvent.GIFT]: (d) => ({
    user: pickUser(d.user),
    giftId: d.giftId,
    giftName: d.giftDetails?.giftName,
    diamonds: d.giftDetails?.diamondCount,
    repeatCount: d.repeatCount,
    // Cadeaux "streak" : on ne compte qu'à la fin de la série (repeatEnd)
    streaking: d.giftDetails?.giftType === 1 && !d.repeatEnd,
  }),
  [WebcastEvent.LIKE]: (d) => ({ user: pickUser(d.user), likeCount: d.likeCount, totalLikeCount: d.totalLikeCount }),
  [WebcastEvent.MEMBER]: (d) => ({ user: pickUser(d.user) }),
  [WebcastEvent.FOLLOW]: (d) => ({ user: pickUser(d.user) }),
  [WebcastEvent.SHARE]: (d) => ({ user: pickUser(d.user) }),
  [WebcastEvent.ROOM_USER]: (d) => ({
    viewerCount: d.viewerCount,
    topViewers: (d.topViewers ?? []).filter((t) => t.user).map((t) => ({ user: pickUser(t.user), coins: Number(t.coinCount) })),
  }),
  [WebcastEvent.SUB_NOTIFY]: (d) => ({ user: pickUser(d.user) }),
  [WebcastEvent.EMOTE]: (d) => ({ user: pickUser(d.user) }),
};

export class TikTokLive extends EventEmitter {
  constructor({ username, apiKey, sessionId }) {
    super();
    this.username = username;
    const opts = { processInitialData: true, fetchRoomInfoOnConnect: true };
    if (sessionId) opts.sessionId = sessionId;
    if (apiKey) opts.signApiKey = apiKey;
    this.conn = new TikTokLiveConnection(username, opts);
    this.#bind();
  }

  #emit(type, payload) {
    this.emit('event', { type, ts: Date.now(), ...payload });
  }

  #bind() {
    // Tous les événements Webcast (chat, gift, like, member, follow, share, ...)
    for (const type of Object.values(WebcastEvent)) {
      this.conn.on(type, (raw) => {
        const data = normalizers[type]?.(raw) ?? {};
        this.#emit(type, { data, raw });
      });
    }
    this.conn.on(ControlEvent.CONNECTED, (state) => this.#emit('connected', { data: { roomId: state.roomId } }));
    this.conn.on(ControlEvent.DISCONNECTED, () => {
      this.#emit('disconnected', {});
      this.#retry();
    });
    this.conn.on(ControlEvent.ERROR, (err) => this.#emit('error', { data: { message: String(err?.message ?? err) } }));
  }

  #retry(delay = 10_000) {
    if (this.stopped) return;
    setTimeout(() => this.connect().catch(() => this.#retry(Math.min(delay * 2, 120_000))), delay);
  }

  async connect() {
    try {
      return await this.conn.connect();
    } catch (err) {
      this.#emit('error', { data: { message: `connexion impossible : ${err.message}` } });
      throw err;
    }
  }

  stop() {
    this.stopped = true;
    this.conn.disconnect();
  }
}
