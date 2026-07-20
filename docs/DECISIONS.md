# Décisions produit & techniques

Journal des choix structurants du projet. Une entrée par décision, la plus récente en haut.

---

## D-001 — Génération IA : modèle « chacun sa clé » au lancement

**Date :** 2026-07-20
**Statut :** en vigueur

### Décision

Pour le lancement, chaque utilisateur colle **sa propre clé API Anthropic** dans les
Paramètres pour activer la génération de recettes par IA. La clé est stockée
**dans son navigateur** (`localStorage`) et sert uniquement à **ses propres appels**.

On **ne cache rien** : le champ clé et les points d'entrée de génération restent
visibles pour tous les utilisateurs. Sans clé configurée, la génération n'affiche
pas d'erreur : elle invite doucement à ajouter une clé dans les Paramètres
(bannière + toast). La génération de **planning**, elle, bascule automatiquement
sur un algorithme local — elle fonctionne donc sans clé.

### Pourquoi

- **Coût nul côté projet** au lancement : chacun paie ses propres appels IA.
- **Simplicité** : aucun backend à déployer ni à maintenir pour démarrer.
- Permet de valider l'usage réel avant d'investir dans une infra.

### Compromis assumé

La clé est en `localStorage` et les appels partent **directement du navigateur**
vers l'API Anthropic, avec le header `anthropic-dangerous-direct-browser-access: true`.

Ce compromis est **accepté** parce qu'il s'agit de la clé **de l'utilisateur**,
pour **ses propres** appels — ce n'est pas un secret partagé du projet qui serait
exposé. Les risques résiduels (une faille XSS ou une dépendance npm compromise
pourrait lire la clé dans `localStorage`) sont jugés acceptables à ce stade et
pour ce modèle.

### Plan de migration (si l'usage décolle) — à documenter, pas à coder maintenant

Basculer vers un **proxy à clé unique** :

1. Une **Vercel Edge/Serverless Function** détient **une seule** clé Anthropic,
   stockée en variable d'environnement serveur (jamais exposée au navigateur).
2. Le front appelle ce proxy (`/api/generate`) au lieu de l'API Anthropic
   directement ; le proxy ajoute la clé côté serveur et relaie la requête.
3. On retire alors le champ clé des Paramètres, le stockage `localStorage` et
   le flag `anthropic-dangerous-direct-browser-access`.
4. Prévoir côté proxy : authentification (n'accepter que les utilisateurs
   connectés Supabase), quotas / rate-limiting par utilisateur, et suivi des coûts.

**Déclencheur envisagé :** adoption suffisante pour que payer les appels
centralement ait du sens, ou friction avérée de l'étape « colle ta clé ».
