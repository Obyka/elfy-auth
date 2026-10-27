# elfy-auth

Écran de consentement OAuth du serveur MCP d'Elfy (dépôt privé Obyka/elfy), servi par GitHub Pages.

- Site URL de Supabase Auth : `https://obyka.github.io/elfy-auth`
- Chemin d'autorisation (Authentication → OAuth Server) : `/oauth/consent`

Page statique : supabase-js 2.118.0 depuis jsDelivr (épinglé, avec SRI), session limitée à l'onglet
(`sessionStorage`), CSP stricte, refus d'affichage dans un cadre. Seule la clé publique (publishable) du projet y
figure ; la RLS protège les données.
