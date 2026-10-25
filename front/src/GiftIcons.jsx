import { giftInfo } from './gifts.js';

// Icônes des cadeaux (dessinées pour ressembler aux cadeaux TikTok) et des effets. Aucun texte : tout passe par les icônes.
const svg = (children, cls = 'gi') => (
  <svg className={cls} viewBox="0 0 24 24" aria-hidden="true">{children}</svg>
);

const GIFT = {
  rose: svg(<>
    <path d="M12 22V14" stroke="#3a9d4f" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 19c3-.6 5-2 6-4.2-3 0-5.2 1.2-6 4.200z" fill="#3a9d4f" />
    <circle cx="12" cy="9" r="6.8" fill="#e0384f" />
    <path d="M12 4.200c-3 1.2-3 5.2 0 5.8 3-.6 3-4.6 0-5.800z" fill="#a8223a" />
    <path d="M7.2 8c.6 3.2 3 4.8 4.8 4.800M16.8 8c-.6 3.2-3 4.8-4.8 4.8" stroke="#b92a43" strokeWidth="1.2" fill="none" strokeLinecap="round" />
  </>),
  handHeart: svg(<>
    <path d="M12 19.500C4.2 14 3 9 6.5 6.8 9 5.4 11 6.6 12 8.200c1-1.6 3-2.8 5.5-1.400C21 9 19.8 14 12 19.500z" fill="#ff5c8a" />
    <path d="M3.5 21c2-1.8 4.4-2.8 8.5-2.800s6.5 1 8.5 2.8" stroke="#f3c9a6" strokeWidth="3" strokeLinecap="round" fill="none" />
    <path d="M8 8.800c.6-1 1.8-1.2 2.6-.4" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity=".7" />
  </>),
  confetti: svg(<>
    <path d="M3 21 8.5 8 16 15.500z" fill="#ffc83a" />
    <path d="M5.5 15.5 10 11M8 18.5 13 13.5" stroke="#ff6a3a" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="16" cy="6" r="1.6" fill="#ff4f8b" /><circle cx="20" cy="10" r="1.4" fill="#4fd3ff" /><circle cx="13" cy="3.5" r="1.2" fill="#7dff7d" />
    <rect x="18" y="14" width="3" height="1.8" rx=".5" fill="#c77dff" transform="rotate(25 19.5 15)" /><rect x="9.5" y="4.5" width="2.6" height="1.6" rx=".5" fill="#ffd23f" transform="rotate(-20 10.8 5.3)" />
  </>),
  galaxy: svg(<>
    <circle cx="12" cy="12" r="10.5" fill="#24164f" />
    <path d="M12 12c0-4 5-5.5 7-3.200M12 12c0 4-5 5.5-7 3.200M12 12c-3.6-.8-4.5-5.6-2-7M12 12c3.6.8 4.5 5.6 2 7" stroke="#ff7ad9" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    <path d="M12 12c1.8-1 3.8-.4 4.2 1M12 12c-1.8 1-3.8.4-4.2-1" stroke="#7ee7ff" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    <circle cx="12" cy="12" r="1.8" fill="#fff6c8" /><circle cx="5.5" cy="6" r=".7" fill="#fff" /><circle cx="19" cy="17.5" r=".7" fill="#fff" /><circle cx="18" cy="5" r=".5" fill="#fff" />
  </>),
  gg: svg(<>
    <rect x="1.5" y="3.5" width="21" height="17" rx="5.5" fill="#ff5fa8" />
    <rect x="1.5" y="3.5" width="21" height="17" rx="5.5" fill="none" stroke="#fff" strokeWidth="1.4" />
    <text x="12" y="16.5" textAnchor="middle" fontFamily="Barlow Condensed, Arial Narrow, sans-serif" fontWeight="700" fontSize="12.5" fill="#fff" letterSpacing=".4">GG</text>
  </>),
  rosa: svg(<>
    <path d="M7 14.5 12 23l5-8.500z" fill="#b684ff" />
    <circle cx="12" cy="9" r="6.5" fill="#ff7aa8" />
    <circle cx="8.5" cy="10" r="3.6" fill="#ff9bbd" /><circle cx="15.5" cy="10" r="3.6" fill="#ff9bbd" /><circle cx="12" cy="6.5" r="3.6" fill="#ffb3cc" />
    <path d="M12 5.500c-1.8.6-1.8 3.2 0 3.6 1.8-.4 1.8-3 0-3.600z" fill="#e0527f" />
  </>),
  boxing: svg(<>
    <path d="M6 10.500C6 6 9 3.5 13 3.500s6 3 6 6.500v5c0 3-2 5-5 5H9.500C7 20 5.5 18 5.5 15.500z" fill="#e0243a" />
    <path d="M6 10.500c1.5-.6 3-.6 4.5.4" stroke="#a81a2c" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    <rect x="6.5" y="19" width="9" height="3.6" rx="1" fill="#f4f1e8" />
    <path d="M14 8c2 .4 3 1.8 3 3.6" stroke="#ff7a8a" strokeWidth="1.4" fill="none" strokeLinecap="round" />
  </>),
  disco: svg(<>
    <path d="M12 1v3.5" stroke="#b8c0d0" strokeWidth="1.4" />
    <circle cx="12" cy="13" r="8.5" fill="#cfd6e6" />
    <path d="M3.5 13h17M12 4.500v17M5.5 8c4 2 9 2 13 0M5.5 18c4-2 9-2 13 0" stroke="#7d88a6" strokeWidth=".9" fill="none" />
    <path d="M7 9c1-2 3-3.2 5-3.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity=".9" />
    <path d="M19.5 3.500v3M18 5h3" stroke="#ffd23f" strokeWidth="1.2" strokeLinecap="round" /><path d="M3 18.500v2.500M1.8 19.800h2.4" stroke="#4fd3ff" strokeWidth="1.2" strokeLinecap="round" />
  </>),
  box: svg(<>
    <rect x="3.5" y="9" width="17" height="12" rx="1.5" fill="#ff5c8a" />
    <rect x="2.5" y="6" width="19" height="4.5" rx="1.5" fill="#ff7aa8" />
    <path d="M12 6v15" stroke="#ffe0ea" strokeWidth="2.2" />
    <path d="M12 6c-1-3.5-5-3-4 0M12 6c1-3.5 5-3 4 0" stroke="#ffe0ea" strokeWidth="1.6" fill="none" strokeLinecap="round" />
  </>),
};

const EFFECT = {
  1: svg(<> {/* tir : cible */}
    <circle cx="12" cy="12" r="10" fill="#fff" /><circle cx="12" cy="12" r="10" fill="none" stroke="#e0384f" strokeWidth="2" />
    <circle cx="12" cy="12" r="6.2" fill="#e0384f" /><circle cx="12" cy="12" r="3.4" fill="#fff" /><circle cx="12" cy="12" r="1.5" fill="#e0384f" />
  </>, 'ei'),
  10: svg(<> {/* tir à effet : flamme */}
    <path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-2.5 1.2-3.8 2.2-5C8.8 11 10 11.5 10.5 12 10 8 11 5 12 2z" fill="#ff7a2a" />
    <path d="M12 11c.8 2 3 3 3 5.500a3 3 0 0 1-6 0c0-1.8 1.4-2.5 3-5.500z" fill="#ffd23f" />
  </>, 'ei'),
  100: svg(<> {/* carreau + balayage : explosion */}
    <path d="M12 1.5 14.2 7.5 20 5l-2.5 5.8 5.5 2.2-5.8 2.200L19 21l-5.7-2.600L12 23l-1.5-4.600L5 21l2.5-5.800L1.5 13l5.8-2.200L5 5l5.8 2.500z" fill="#ff7a2a" />
    <path d="M12 6l1.4 4.400L18 12l-4.6 1.600L12 18l-1.4-4.400L6 12l4.6-1.600z" fill="#ffe14a" />
  </>, 'ei'),
  1000: svg(<> {/* bombe */}
    <circle cx="11" cy="14" r="8" fill="#222a3a" />
    <path d="M7 11c1-1.8 3-2.8 5-2.6" stroke="#6b7a99" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    <path d="M15.5 7.5 18 5" stroke="#b8a070" strokeWidth="2" strokeLinecap="round" />
    <path d="M19 1.500v3M17.2 3h3.600M16.5 .8l1 1.800M21.5 5.500l-1.8-.7" stroke="#ffd23f" strokeWidth="1.4" strokeLinecap="round" />
  </>, 'ei'),
};

const NAME_TO_ICON = {
  rose: 'rose', handheart: 'handHeart', confetti: 'confetti', galaxy: 'galaxy',
  gg: 'gg', rosa: 'rosa', boxinggloves: 'boxing', discoball: 'disco',
};

// Image du vrai cadeau TikTok (si son nom n'est pas connu, on retombe sur une icône dessinée).
export const giftIcon = (name) => {
  const info = giftInfo(name);
  if (info) return <img className="gi" src={info.image} alt="" draggable="false" />;
  return GIFT[NAME_TO_ICON[String(name ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')] ?? 'box'];
};
export const effectIcon = (tier) => EFFECT[tier];
export const arrowIcon = svg(<path d="M6 5l7 7-7 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />, 'ai');
