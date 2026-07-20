-- ============================================================
-- Migration 0001 — Row Level Security de la table `recipes`
-- ============================================================
-- POURQUOI ce fichier existe :
-- Les policies RLS sont l'UNIQUE rempart de sécurité de l'app (client
-- 100 % navigateur, pas de backend maison). Les versionner ici les rend
-- auditables, reproductibles, et protégées d'une modif accidentelle dans
-- le dashboard Supabase.
--
-- Ce script est REJOUABLE : on drop avant de recréer, donc on peut le
-- relancer sans erreur si les policies existent déjà.
-- ============================================================

-- ─── Nettoyage préalable ─────────────────────────────────────
-- POURQUOI : `drop policy if exists` rend la migration idempotente.
-- Sans le drop, un second passage échouerait ("policy already exists").
drop policy if exists "Users manage own recipes" on public.recipes;
drop policy if exists "Public recipes visible"   on public.recipes;

-- ─── Policy de LECTURE (SELECT) ──────────────────────────────
-- POURQUOI : on recrée cette policy À L'IDENTIQUE de l'existant.
-- Elle autorise à lire une recette si :
--   - elle est publique (is_public), OU
--   - elle est officielle/système (is_system), OU
--   - elle appartient à l'utilisateur connecté (owner_id).
-- C'est ce qui permet à l'Explorer de voir les recettes des autres
-- sans exposer les recettes privées.
create policy "Public recipes visible"
  on public.recipes
  for select
  using (
    is_public = true
    or is_system = true
    or auth.uid() = owner_id
  );

-- ─── Policy d'ÉCRITURE + gestion (ALL) ───────────────────────
-- POURQUOI le `using` : filtre les lignes EXISTANTES sur lesquelles on
-- peut agir (select/update/delete). On ne gère que ses propres recettes.
--
-- POURQUOI le `with_check` (le correctif de sécurité) : il valide les
-- lignes APRÈS insert/update. Avant, n'importe qui pouvait créer une
-- recette avec is_system = true et se faire passer pour une source
-- officielle. Désormais is_system ne peut être true QUE pour le compte
-- propriétaire de l'app.
create policy "Users manage own recipes"
  on public.recipes
  for all
  using (auth.uid() = owner_id)
  with check (
    auth.uid() = owner_id
    and (
      is_system = false
      or owner_id = '39983024-d414-4a91-8404-26bdec4b7232'
    )
  );
