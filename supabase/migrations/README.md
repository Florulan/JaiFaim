# Migrations Supabase

Ce dossier contient le **schéma et les policies RLS** de la base, versionnés en SQL.

## Pourquoi

L'app est 100 % client (aucun backend maison) : la sécurité repose entièrement
sur les **Row Level Security policies** de Supabase. Les garder ici permet de :

- les **auditer** (revoir la sécurité en lisant le repo, pas le dashboard) ;
- les **reproduire** (recréer une base identique) ;
- éviter qu'une modif manuelle dans le dashboard passe inaperçue.

Chaque fichier est **idempotent** (`drop ... if exists` avant `create`) : il peut
être rejoué sans casser une base déjà à jour.

## Convention de nommage

`NNNN_description.sql` — numéro croissant, jamais réutilisé.
Ex : `0001_recipes_rls.sql`.

## Comment appliquer une migration

### Option A — CLI Supabase (recommandé, une fois le projet lié)

```bash
# Installation ponctuelle de la CLI
npm install -D supabase

# Lier le projet (à faire une seule fois) — récupère le ref dans
# Dashboard > Project Settings > General > Reference ID
npx supabase link --project-ref <ton-project-ref>

# Appliquer les migrations de ce dossier à la base distante
npx supabase db push
```

### Option B — Manuel (sans CLI)

Dashboard Supabase → **SQL Editor** → coller le contenu du fichier `.sql` → **Run**.

## Vérifier les policies en place

```sql
select tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'recipes'
order by cmd;
```
