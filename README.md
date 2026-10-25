# Live TikTok — duel de pétanque de super-héros

Un jeu 3D (format vertical 9:16) piloté par les événements d'un live TikTok : les spectateurs envoient des cadeaux pour déclencher des tirs, des effets et des bombes pendant un duel de pétanque (premier à 13) entre un super-héros (à gauche) et une super-héroïne (à droite).

| Dossier | Rôle |
|---|---|
| `backend/` | Se connecte au live TikTok (`tiktok-live-connector`) et diffuse les événements via Socket.IO (port 3000). Contient un mode test qui invente des événements. |
| `front/` | Le jeu (React + Three.js), à afficher en source navigateur 1080×1920 dans OBS. |
| `admin/` | Tableau de bord qui affiche les commentaires, les dons et les présents. |
| `run.js` | Lance le backend et une interface en même temps. |

## Lancer

```bash
npm install --prefix backend && npm install --prefix front && npm install --prefix admin

npm run front --test            # jeu + événements aléatoires (sans live)
npm run front nom_du_streamer   # jeu + vrai live TikTok
npm run admin nom_du_streamer   # tableau de bord + vrai live
```

Le jeu s'ouvre sur http://localhost:5175 et l'admin sur http://localhost:5173.
Raccourcis de test dans le jeu : `1 2 3 4` (dons du personnage de gauche), `7 8 9 0` (personnage de droite), `K` (fin de partie), `M` (couper la musique).

## Cadeaux

Chaque côté a 4 paliers de cadeaux (1, 10, 100, 1000 pièces) : tir, tir à effet, carreau + balayage, bombe (+3 points). Les cadeaux, leurs valeurs et leurs images se règlent dans `front/src/gifts.js` ; les images sont dans `front/public/gifts`.

## Musique

Une boucle de jazz originale est générée par le navigateur. Pour utiliser votre propre musique, déposez `front/public/music.mp3` (ce fichier n'est pas versionné).
