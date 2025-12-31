# Tableau de Bord - ETF PEA Européens

Tableau de bord simple et épuré permettant de suivre en temps réel les ETF éligibles au Plan d'Épargne en Actions (PEA).

## Fonctionnalités

- **Liste complète des ETF PEA** : 18 ETF européens éligibles au PEA
- **Données en temps réel** : Cours, variations, volumes
- **Métriques détaillées** : Performance 52 semaines, indicateurs financiers, frais de gestion (TER)
- **Organisation par catégories** : France, Europe, S&P 500, MSCI World, Marchés émergents, etc.
- **Interface responsive** : Optimisé pour mobile et desktop
- **Aucune dépendance** : Fonctionne directement en ouvrant index.html

## ETF Disponibles

### 🇫🇷 ETF PEA France
- Amundi CAC 40

### 🇪🇺 ETF PEA Europe
- Amundi Euro Stoxx 50
- Amundi MSCI Europe
- iShares Core MSCI Europe
- iShares Core EURO STOXX 50
- BNP Paribas Easy Low Carbon 100 Europe PAB

### 🇺🇸 ETF PEA S&P 500
- Lyxor S&P 500
- Amundi MSCI USA
- iShares S&P 500 Swap PEA
- BNP Paribas Easy S&P 500

### 📈 ETF PEA small caps
- Amundi Russell 2000

### 💻 ETF PEA sur la tech américaine
- Amundi PEA US Tech Screened

### 🌍 ETF PEA MSCI World
- Amundi MSCI World
- iShares MSCI World Swap PEA

### 🌏 ETF PEA Emerging Markets
- Amundi MSCI Emerging Markets
- BNP Paribas Easy MSCI Emerging Min TE

### 🇮🇳 ETF PEA sur l'Inde
- Amundi PEA Inde (MSCI India)

### 💧 ETF PEA sur l'eau
- Amundi PEA Eau (MSCI Water)

## Technologies

- **HTML5** : Structure sémantique
- **CSS3** : Design moderne avec dégradés et animations
- **JavaScript (Vanilla)** : Sans framework, pur JavaScript
- **APIs utilisées** :
  - Yahoo Finance (données boursières)
  - AllOrigins (proxy CORS)

## Utilisation

### En local

Rien de plus simple ! Double-cliquez simplement sur `index.html` pour ouvrir l'application dans votre navigateur.

```bash
# Ou avec un navigateur en ligne de commande
start index.html       # Windows
open index.html        # macOS
xdg-open index.html    # Linux
```

## Déploiement sur GitHub Pages

### Étape 1 : Créer un dépôt GitHub

1. Allez sur [GitHub](https://github.com)
2. Cliquez sur **New Repository**
3. Nommez votre dépôt (ex: `etf-pea-dashboard`)
4. Choisissez **Public**
5. Cliquez sur **Create repository**

### Étape 2 : Initialiser Git localement

Ouvrez un terminal dans le dossier du projet et exécutez :

```bash
git init
git add .
git commit -m "Initial commit - Tableau de bord ETF PEA"
git branch -M main
git remote add origin https://github.com/VOTRE-USERNAME/etf-pea-dashboard.git
git push -u origin main
```

Remplacez `VOTRE-USERNAME` par votre nom d'utilisateur GitHub et `etf-pea-dashboard` par le nom de votre dépôt.

### Étape 3 : Activer GitHub Pages

1. Allez sur votre dépôt GitHub
2. Cliquez sur **Settings** (Paramètres)
3. Dans le menu latéral, cliquez sur **Pages**
4. Sous **Source**, sélectionnez **main** (ou **master**)
5. Cliquez sur **Save**
6. Attendez quelques minutes
7. Votre site sera disponible à : `https://VOTRE-USERNAME.github.io/etf-pea-dashboard/`

## Structure du projet

```
bourse/
├── index.html          # Page HTML principale
├── style.css           # Styles CSS
├── app.js              # Logique JavaScript
├── README.md           # Documentation
└── .gitignore          # Fichiers à ignorer par Git
```

## Informations affichées pour chaque ETF

### Données de Trading
- Ouverture, Plus haut, Plus bas
- Clôture précédente
- Volume, Volume moyen

### Performance 52 Semaines
- Plus haut 52 semaines
- Plus bas 52 semaines
- Moyenne 50 jours
- Moyenne 200 jours

### Indicateurs Financiers
- Capitalisation boursière
- Ratio P/E
- BPA (Bénéfice Par Action)
- Beta
- Rendement du dividende
- **Frais de gestion (TER)** - Important pour comparer les coûts

### Informations Générales
- Bourse de cotation
- Type de produit
- État du marché
- Dernière mise à jour

## Limitations

- **CORS** : Utilise un proxy CORS (AllOrigins) pour contourner les restrictions
- **Rate limiting** : Les APIs gratuites ont des limites de requêtes
- **Données** : Délai de quelques minutes possible selon l'API
- **TER** : Le ratio de frais n'est pas toujours disponible pour tous les ETF

## Avantages de cette approche

✅ **Simple** : Aucune installation requise
✅ **Rapide** : Chargement instantané
✅ **Gratuit** : Utilise des APIs gratuites
✅ **Portable** : Fonctionne sur n'importe quel appareil
✅ **Focus** : Uniquement les ETF éligibles au PEA
✅ **Éducatif** : Code source clair et commenté

## Contribuer

Les contributions sont les bienvenues ! N'hésitez pas à :
1. Fork le projet
2. Créer une branche (`git checkout -b feature/amelioration`)
3. Commit vos changements (`git commit -m 'Ajout d'un ETF'`)
4. Push vers la branche (`git push origin feature/amelioration`)
5. Ouvrir une Pull Request

## Ajouter un nouvel ETF

Pour ajouter un ETF PEA, éditez le fichier `app.js` et ajoutez-le dans l'objet `etfs` de la méthode `getETFList()` :

```javascript
'TICKER.PA': {
    name: 'Nom de l\'ETF',
    category: 'Catégorie appropriée',
    region: 'Région géographique',
    description: 'Description de l\'ETF'
}
```

## Licence

Ce projet est open source et disponible sous licence MIT.

## Ressources

- [Documentation Yahoo Finance API](https://finance.yahoo.com/)
- [Guide GitHub Pages](https://pages.github.com/)
- [Liste des ETF PEA](https://www.amf-france.org/)

---

**Note** : Ce projet est à but éducatif et informatif. Les données fournies ne constituent pas des conseils financiers. Consultez toujours un professionnel avant de prendre des décisions d'investissement. Les performances passées ne préjugent pas des performances futures.
