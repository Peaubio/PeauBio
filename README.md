# Site PeauBio

Site vitrine statique (HTML + CSS + un peu de JavaScript), sans étape de compilation.
Vercel le publie tel quel.

- `index.html` : accueil
- `le-kit.html` : page produit
- `notre-histoire.html`, `livraison.html`, `retours.html`, `contact.html`, `mentions-legales.html`
- `assets/style.css` : couleurs et polices (bloc `:root` en haut du fichier)
- `assets/main.js` : menu mobile, FAQ, galerie, barre d'achat mobile

Les boutons « Commander » mènent à la fiche produit de la boutique Shopify.

## Compteur « X personnes regardent ce produit »

Vrai compteur de visiteurs actifs sur la page produit (fonction `api/viewers.js`).
Le badge n'apparaît qu'à partir de 2 personnes présentes en même temps.

Pour l'activer sur Vercel : projet > Storage (ou Marketplace) > ajouter « Upstash for Redis » (offre gratuite),
le relier au projet, puis redéployer. Les variables d'accès sont ajoutées automatiquement.
Sans cette base, le badge reste simplement caché.
