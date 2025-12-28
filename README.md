# Tableau de Bord Financier

Tableau de bord financier interactif permettant de suivre les actions et indices boursiers en temps réel.

## Fonctionnalités

- **Recherche en temps réel** : Actions et indices boursiers
- **Autocomplétion intelligente** : Suggestions de symboles boursiers
- **Données en direct** : Cours, variations, volumes
- **Actualités financières** : Dernières nouvelles pour chaque entreprise
- **Vue d'ensemble du marché** : S&P 500, Dow Jones, NASDAQ, CAC 40
- **Interface responsive** : Optimisé pour mobile et desktop

## Technologies

- **HTML5** : Structure sémantique
- **CSS3** : Design moderne avec dégradés et animations
- **JavaScript (Vanilla)** : Sans framework, pur JavaScript
- **API utilisée** :
  - Yahoo Finance (actions, indices, actualités)
  - AllOrigins (proxy CORS)

## Déploiement sur GitHub Pages

### Étape 1 : Créer un dépôt GitHub

1. Allez sur [GitHub](https://github.com)
2. Cliquez sur **New Repository**
3. Nommez votre dépôt (ex: `bourse-dashboard`)
4. Choisissez **Public**
5. Cliquez sur **Create repository**

### Étape 2 : Initialiser Git localement

Ouvrez un terminal dans le dossier du projet et exécutez :

```bash
git init
git add .
git commit -m "Initial commit - Tableau de bord financier"
git branch -M main
git remote add origin https://github.com/VOTRE-USERNAME/bourse-dashboard.git
git push -u origin main
```

Remplacez `VOTRE-USERNAME` par votre nom d'utilisateur GitHub et `bourse-dashboard` par le nom de votre dépôt.

### Étape 3 : Activer GitHub Pages

1. Allez sur votre dépôt GitHub
2. Cliquez sur **Settings** (Paramètres)
3. Dans le menu latéral, cliquez sur **Pages**
4. Sous **Source**, sélectionnez **main** (ou **master**)
5. Cliquez sur **Save**
6. Attendez quelques minutes
7. Votre site sera disponible à : `https://VOTRE-USERNAME.github.io/bourse-dashboard/`

## Structure du projet

```
bourse/
├── index.html          # Page HTML principale
├── style.css           # Styles CSS
├── app.js              # Logique JavaScript
├── README.md           # Documentation
└── .gitignore          # Fichiers à ignorer par Git
```

## Utilisation

1. **Recherche simple** : Tapez un symbole (ex: AAPL, MSFT) ou un nom d'entreprise
2. **Autocomplétion** : Commencez à taper et sélectionnez dans les suggestions
3. **Navigation clavier** : Utilisez les flèches haut/bas pour naviguer
4. **Exemples rapides** : Cliquez sur les tags d'exemples en bas de page

## Exemples de recherche

### Actions US
- `AAPL` - Apple Inc.
- `MSFT` - Microsoft Corporation
- `GOOGL` - Alphabet Inc.
- `TSLA` - Tesla Inc.
- `NVDA` - NVIDIA Corporation

### Actions françaises
- `MC.PA` - LVMH
- `OR.PA` - L'Oréal
- `TTE.PA` - TotalEnergies
- `SAN.PA` - Sanofi
- `AI.PA` - Air Liquide

## Limitations

- **CORS** : Utilise un proxy CORS (AllOrigins) pour contourner les restrictions
- **Rate limiting** : Les APIs gratuites ont des limites de requêtes
- **Actualités** : Principalement disponibles pour les entreprises américaines
- **Données** : Délai de quelques minutes possible selon l'API

## Améliorations futures

- [ ] Graphiques interactifs avec Chart.js
- [ ] Historique des prix
- [ ] Watchlist personnalisée
- [ ] Alertes de prix
- [ ] Mode sombre
- [ ] Support multilingue
- [ ] PWA (Progressive Web App)

## Contribuer

Les contributions sont les bienvenues ! N'hésitez pas à :
1. Fork le projet
2. Créer une branche (`git checkout -b feature/amelioration`)
3. Commit vos changements (`git commit -m 'Ajout d'une fonctionnalité'`)
4. Push vers la branche (`git push origin feature/amelioration`)
5. Ouvrir une Pull Request

## Licence

Ce projet est open source et disponible sous licence MIT.

## Ressources

- [Documentation Yahoo Finance API](https://finance.yahoo.com/)
- [Guide GitHub Pages](https://pages.github.com/)

---

**Note** : Ce projet est à but éducatif. Les données fournies ne constituent pas des conseils financiers. Consultez toujours un professionnel avant de prendre des décisions d'investissement.
