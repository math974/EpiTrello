---
title: "Cahier des charges — EpiTrello"
author: "Équipe EpiTrello"
date: "Février 2026"
---

<style>
  @page { margin: 20mm 18mm; }
  @page:first { margin: 0; }
  html, body { background: #ffffff; color: #1f2937; }
  body { margin: 0; padding: 0; font-family: "Inter", "Segoe UI", Arial, sans-serif; line-height: 1.55; font-size: 16px; }
  h1, h2, h3 { color: #111827; }
  h2 { font-size: 26px; margin-top: 18px; }
  .content { margin: 0 48px; background: #ffffff; }
  .cover {
    width: 100vw;
    height: 100vh;
    padding: 48px;
    border-radius: 0;
    background: radial-gradient(1200px 500px at 0% 0%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.0) 60%),
                linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 50%, #38bdf8 100%);
    border: 1px solid rgba(255,255,255,0.25);
    box-sizing: border-box;
    color: #f8fafc;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .cover-header { display: flex; align-items: center; justify-content: center; gap: 14px; margin-top: 16px; }
  .brand { font-size: 22px; font-weight: 600; letter-spacing: 0.4px; }
  .cover-title { font-size: 64px; margin: 18px 0 8px 0; text-align: center; letter-spacing: 0.5px; }
  .cover-subtitle { font-size: 18px; margin: 0; text-align: center; color: #e2e8f0; }
  .cover-meta { margin-top: 32px; color: #e2e8f0; font-size: 14px; text-align: center; }
  .cover-badge {
    display: inline-block;
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(255,255,255,0.18);
    color: #fff;
    font-size: 12px;
    letter-spacing: 0.6px;
    text-transform: uppercase;
  }
  .toc {
    margin-top: 16px;
    padding: 14px 18px;
    background: #e0f2fe;
    border: 1px solid #bae6fd;
    border-radius: 12px;
  }
  .toc-item {
    font-weight: 600;
    color: #111827;
    padding: 4px 0;
    font-size: 15px;
  }
  .toc-sub {
    color: #6b7280;
    font-size: 13.5px;
    padding: 2px 0 2px 18px;
  }
  .toc-note {
    margin-top: 10px;
    font-size: 13px;
    color: #6b7280;
  }
</style>

<div class="cover" style="page-break-after: always;">
  <div class="cover-header">
    <img src="./assets/epitrello-logo.svg" alt="EpiTrello" width="48" height="48" />
    <div class="brand">EpiTrello</div>
  </div>
  <div style="margin-top: 40px; text-align:center;">
    <div class="cover-badge">Project brief</div>
    <h1 class="cover-title">Cahier des Charges</h1>
    <p class="cover-subtitle">Plateforme de gestion de tableaux et collaboration</p>
  </div>
  <div class="cover-meta">
    Version : 1.0 • Date : Février 2026
  </div>
</div>

<div class="content">

## Sommaire
<div style="height: 4px; width: 120px; background: #1d4ed8; border-radius: 999px; margin: 6px 0 14px 0;"></div>
<div class="toc">
  <div class="toc-item"><a href="#resume-executif">1. Résumé exécutif</a></div>
  <div class="toc-item"><a href="#contexte-vision-objectifs">2. Contexte, vision et objectifs</a></div>
  <div class="toc-sub"><a href="#contexte">2.1 Contexte</a></div>
  <div class="toc-sub"><a href="#vision-produit">2.2 Vision produit</a></div>
  <div class="toc-sub"><a href="#objectifs-fonctionnels">2.3 Objectifs fonctionnels</a></div>
  <div class="toc-sub"><a href="#objectifs-techniques">2.4 Objectifs techniques</a></div>
  <div class="toc-item"><a href="#perimetre-fonctionnel">3. Périmètre fonctionnel (actuel + cible)</a></div>
  <div class="toc-sub"><a href="#deja-en-place">3.1 Déjà en place</a></div>
  <div class="toc-sub"><a href="#cible-proche">3.2 Cible proche</a></div>
  <div class="toc-sub"><a href="#evolutions-prevues">3.3 Évolutions prévues</a></div>
  <div class="toc-item"><a href="#architecture-technique">4. Architecture technique</a></div>
  <div class="toc-sub"><a href="#architecture-frontend">4.1 Frontend</a></div>
  <div class="toc-sub"><a href="#architecture-backend">4.2 Backend</a></div>
  <div class="toc-sub"><a href="#architecture-infrastructure">4.3 Infrastructure</a></div>
  <div class="toc-item"><a href="#benchmark-technologique">5. Benchmark technologique (choix justifiés)</a></div>
  <div class="toc-sub"><a href="#benchmark-frontend">5.1 Frontend</a></div>
  <div class="toc-sub"><a href="#benchmark-backend">5.2 Backend</a></div>
  <div class="toc-sub"><a href="#benchmark-api">5.3 API</a></div>
  <div class="toc-sub"><a href="#benchmark-bdd">5.4 Base de données</a></div>
  <div class="toc-sub"><a href="#benchmark-infra">5.5 Infra</a></div>
  <div class="toc-item"><a href="#environnements">6. Environnements</a></div>
  <div class="toc-item"><a href="#cicd-qualite">7. CI/CD & Qualité</a></div>
  <div class="toc-item"><a href="#organisation-projet">8. Organisation du projet (Git/GitHub)</a></div>
  <div class="toc-item"><a href="#plan-livraison">9. Plan de livraison (macro)</a></div>
  <div class="toc-item"><a href="#risques-mitigations">10. Risques & mitigations</a></div>
  <div class="toc-item"><a href="#livrables">11. Livrables</a></div>
  <div class="toc-note">Document évolutif, mis à jour au fil des itérations.</div>
</div>

<div style="page-break-after: always;"></div>

<a id="resume-executif"></a>
## 1. Résumé exécutif
EpiTrello est une application de gestion de projets inspirée de Trello, centrée sur des tableaux kanban, des workspaces et la collaboration. Le produit vise une expérience fluide et moderne, avec une base technique scalable et une organisation de projet rigoureuse (CI/CD, branches par feature, environnements dev/prod).

L’objectif est de livrer une première version solide (auth, tableaux, workspaces, paramètres) tout en préparant les évolutions stratégiques : temps réel, templates de tableaux, automatisations et notifications.

Le projet s’appuie sur une stack web moderne (Next.js, GraphQL, Prisma, PostgreSQL) et une infrastructure reproductible via Docker et Terraform. Les environnements dev/prod sont séparés, et la chaîne CI/CD intègre la couverture de code backend pour sécuriser les évolutions.

L’organisation du travail se fait par features (branches dédiées, issues et PR) afin de maintenir une cadence claire et une traçabilité des changements.

<div style="page-break-before: always;"></div>

<a id="contexte-vision-objectifs"></a>
## 2. Contexte, vision et objectifs
<a id="contexte"></a>
### 2.1 Contexte
Le besoin est de fournir un outil de pilotage simple et efficace, adapté à un usage académique et à un usage produit réel. Le projet doit également démontrer une capacité à concevoir une architecture complète (front, back, infra) et à l’exploiter via un pipeline CI/CD.

<a id="vision-produit"></a>
### 2.2 Vision produit
Offrir une alternative claire et performante à Trello : interface cohérente, navigation rapide, et collaboration au cœur du flux de travail. Le produit doit être agréable dès le premier usage, tout en restant extensible.

<a id="objectifs-fonctionnels"></a>
### 2.3 Objectifs fonctionnels
- Gestion intuitive des tableaux, listes et cartes.
- Collaboration par workspaces (membres, rôles, permissions).
- Authentification moderne (email/mdp et OAuth).
- Paramètres utilisateur complets (profil, accessibilité, sécurité).

<a id="objectifs-techniques"></a>
### 2.4 Objectifs techniques
- Stack front moderne (Next.js, composants réutilisables, design system).
- API GraphQL robuste et typée.
- Infrastructure reproductible (Docker, Terraform, GCP).
- Qualité logicielle via CI/CD et couverture de code côté backend.

<div style="page-break-before: always;"></div>

<a id="perimetre-fonctionnel"></a>
## 3. Périmètre fonctionnel (actuel + cible)
<a id="deja-en-place"></a>
### Déjà en place
- Frontend Next.js (pages landing, login/signup, account settings, boards).
- Sidebar boards avec favoris/récents/workspaces.
- Pages de paramètres utilisateur (profil, activité, paramètres, accessibilité).
- Navbar commune.

<a id="cible-proche"></a>
### Cible proche
- Auth OAuth (GitHub, Discord) + email/mdp.
- Gestion complète des workspaces (membres, rôles, paramètres, danger zone).
- Gestion des boards (création, visibilité, templates).

<a id="evolutions-prevues"></a>
### Évolutions prévues
- Temps réel via WebSocket (cartes, listes, commentaires).
- Templates de boards.
- Notifications et activité.
- Filtrage avancé et recherche.

<div style="page-break-before: always;"></div>

<a id="architecture-technique"></a>
## 4. Architecture technique
<a id="architecture-frontend"></a>
### Frontend
- Next.js 14 + React 18.
- Tailwind CSS + shadcn/ui.
- Apollo Client pour GraphQL.

<a id="architecture-backend"></a>
### Backend
- Node.js + Express + Apollo Server (GraphQL).
- Prisma ORM.
- PostgreSQL.

<a id="architecture-infrastructure"></a>
### Infrastructure
- Docker Compose (dev/prod).
- Terraform pour l’infra.
- Provider cloud : Google Cloud Platform (GCP).

<div style="page-break-before: always;"></div>

<a id="benchmark-technologique"></a>
## 5. Benchmark technologique (choix justifiés)
<a id="benchmark-frontend"></a>
### Frontend
- **Next.js** vs Vite+React: Next.js apporte SSR/SSG, routing intégré, et un déploiement simple. Vite est plus léger mais nécessite plus d’assemblage.

<a id="benchmark-backend"></a>
### Backend
- **Apollo Server + Express** vs NestJS: Apollo/Express est plus direct et léger pour GraphQL, NestJS apporte davantage de structure mais peut être plus lourd pour ce besoin.

<a id="benchmark-api"></a>
### API
- **GraphQL** vs REST: GraphQL réduit le sur-fetching, permet de composer les vues rapidement et convient bien aux interfaces complexes (boards, cartes, membres).

<a id="benchmark-bdd"></a>
### Base de données
- **PostgreSQL** vs MySQL/MongoDB: PostgreSQL est robuste pour les relations (workspaces, boards, permissions) et bien supporté par Prisma.

<a id="benchmark-infra"></a>
### Infra
- **GCP + Terraform** vs alternatives (AWS/Azure): choix motivé par la capacité à automatiser l’infra via Terraform et la cohérence avec les environnements de déploiement visés.

<div style="page-break-before: always;"></div>

<a id="environnements"></a>
## 6. Environnements
- **Dev** : Docker Compose dev + variables `env.dev.template`.
- **Prod** : Docker Compose prod + variables `env.prod.template`.

<div style="page-break-before: always;"></div>

<a id="cicd-qualite"></a>
## 7. CI/CD & Qualité
- CI/CD avec pipeline de build/test/deploy.
- Intégration **Codecov** pour couverture backend.
- Déploiements automatisés via Terraform (GCP).

<div style="page-break-before: always;"></div>

<a id="organisation-projet"></a>
## 8. Organisation du projet (Git/GitHub)
- Branching par **feature**.
- `main` = branche de production.
- PR obligatoires, review avant merge.
- Issues et PR gérées via **GitHub CLI** (`gh`), avec assignation et labels.
- Les PR indiquent les issues clôturées (`Closes #id`).

<div style="page-break-before: always;"></div>

<a id="plan-livraison"></a>
## 9. Plan de livraison (macro)
1. Stabilisation auth + pages publiques.
2. Boards + workspaces (CRUD, permissions).
3. Temps réel et activité.
4. Templates et automatisations.
5. Optimisations + monitoring.

<div style="page-break-before: always;"></div>

<a id="risques-mitigations"></a>
## 10. Risques & mitigations
- **OAuth instable** : config stricte des redirect URI, tests multi-env.
- **Temps réel** : introduire progressivement via WebSocket + feature flags.
- **Complexité UI** : composants UI standardisés (shadcn/ui).

<div style="page-break-before: always;"></div>

<a id="livrables"></a>
## 11. Livrables
- Frontend complet (Next.js).
- Backend GraphQL + DB.
- Infra Terraform GCP.
- Documentation technique + scripts.

---

Document évolutif, mis à jour au fil des features et livraisons.

</div>
