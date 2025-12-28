/**
 * Application JavaScript pour le tableau de bord financier
 * Appels directs à l'API Yahoo Finance
 */

/**
 * Gestionnaire de cache utilisant sessionStorage
 */
class CacheManager {
    constructor() {
        this.storage = sessionStorage;
        this.prefix = 'market_cache_';
    }

    /**
     * Stocke des données dans le cache avec un TTL
     */
    set(key, data, ttlMinutes = 5) {
        const item = {
            data: data,
            expiry: Date.now() + (ttlMinutes * 60 * 1000)
        };
        try {
            this.storage.setItem(this.prefix + key, JSON.stringify(item));
        } catch (error) {
            console.error('Erreur cache storage:', error);
        }
    }

    /**
     * Récupère des données du cache si elles ne sont pas expirées
     */
    get(key) {
        try {
            const itemStr = this.storage.getItem(this.prefix + key);
            if (!itemStr) return null;

            const item = JSON.parse(itemStr);
            if (Date.now() > item.expiry) {
                this.storage.removeItem(this.prefix + key);
                return null;
            }
            return item.data;
        } catch (error) {
            console.error('Erreur lecture cache:', error);
            return null;
        }
    }

    /**
     * Efface une entrée du cache
     */
    remove(key) {
        this.storage.removeItem(this.prefix + key);
    }

    /**
     * Efface tout le cache
     */
    clear() {
        const keys = Object.keys(this.storage);
        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                this.storage.removeItem(key);
            }
        });
    }
}

/**
 * Gestionnaire GitHub Gist pour stocker les favoris
 */
class GitHubGistManager {
    constructor() {
        // Priorité 1 : Charger depuis config.js (si existe)
        if (window.APP_CONFIG && window.APP_CONFIG.githubToken && window.APP_CONFIG.githubToken !== 'YOUR_GITHUB_TOKEN_HERE') {
            this.token = window.APP_CONFIG.githubToken;
            this.gistId = window.APP_CONFIG.gistId;
            // Sauvegarder aussi dans localStorage pour compatibilité
            if (this.token) {
                localStorage.setItem('github_token', this.token);
            }
            if (this.gistId) {
                localStorage.setItem('gist_id', this.gistId);
            }
        } else {
            // Priorité 2 : Fallback sur localStorage (configuration manuelle via modal)
            this.gistId = localStorage.getItem('gist_id');
            this.token = localStorage.getItem('github_token');
        }
        this.apiBase = 'https://api.github.com';
    }

    /**
     * Configure le token GitHub
     */
    setToken(token) {
        this.token = token;
        localStorage.setItem('github_token', token);
    }

    /**
     * Vérifie si le token est configuré
     */
    isConfigured() {
        return !!this.token;
    }

    /**
     * Créer un nouveau gist
     */
    async createGist() {
        console.log('🔧 Création d\'un nouveau Gist...');

        try {
            const response = await fetch(`${this.apiBase}/gists`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    description: 'Favoris Bourse Dashboard',
                    public: false,
                    files: {
                        'favorites.json': {
                            content: JSON.stringify({ favorites: [] }, null, 2)
                        }
                    }
                })
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error('❌ Erreur création Gist:', response.status, errorBody);
                throw new Error(`Erreur création Gist (${response.status}): ${errorBody}`);
            }

            const data = await response.json();
            this.gistId = data.id;
            localStorage.setItem('gist_id', data.id);

            // Mettre à jour config.js si possible
            if (window.APP_CONFIG) {
                window.APP_CONFIG.gistId = data.id;
            }

            console.log('✅ Gist créé avec succès!', data.id);
            console.log('📝 Pour mémoriser ce Gist, ajoutez cette ligne dans votre config.js :');
            console.log(`   gistId: '${data.id}',`);

            return data;
        } catch (error) {
            console.error('❌ Erreur lors de la création du Gist:', error);
            throw error;
        }
    }

    /**
     * Récupérer les favoris depuis le gist
     */
    async getFavorites() {
        if (!this.isConfigured()) {
            console.warn('⚠️ GitHub non configuré, pas de favoris à récupérer');
            return [];
        }

        if (!this.gistId) {
            console.log('ℹ️ Pas de Gist existant, création...');
            await this.createGist();
            return [];
        }

        console.log('📥 Récupération des favoris depuis GitHub Gist...', this.gistId);

        try {
            const response = await fetch(`${this.apiBase}/gists/${this.gistId}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                console.error('❌ Gist non trouvé (status:', response.status, ')');
                throw new Error('Gist non trouvé');
            }

            const data = await response.json();
            const content = data.files['favorites.json'].content;
            const favorites = JSON.parse(content).favorites;
            console.log('✅ Favoris récupérés:', favorites.length, 'favoris');
            return favorites;
        } catch (error) {
            console.error('❌ Erreur récupération favoris:', error);
            return [];
        }
    }

    /**
     * Sauvegarder les favoris dans le gist
     */
    async saveFavorites(favorites) {
        if (!this.isConfigured()) {
            throw new Error('GitHub non configuré');
        }

        if (!this.gistId) {
            console.warn('⚠️ Pas de gistId trouvé, création d\'un nouveau Gist...');
            await this.createGist();
        }

        console.log('💾 Sauvegarde des favoris sur GitHub Gist...', {
            gistId: this.gistId,
            nbFavoris: favorites.length
        });

        try {
            const response = await fetch(`${this.apiBase}/gists/${this.gistId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    files: {
                        'favorites.json': {
                            content: JSON.stringify({ favorites }, null, 2)
                        }
                    }
                })
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error('❌ Erreur sauvegarde Gist:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorBody
                });
                throw new Error(`Erreur sauvegarde Gist (${response.status}): ${errorBody}`);
            }

            const data = await response.json();
            console.log('✅ Favoris sauvegardés sur GitHub Gist avec succès!');
            return data;
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde:', error);
            throw error;
        }
    }

    /**
     * Ajouter un favori
     */
    async addFavorite(symbol, name) {
        const favorites = await this.getFavorites();

        // Vérifier si déjà en favoris
        if (favorites.some(f => f.symbol === symbol)) {
            return false;
        }

        favorites.push({
            symbol,
            name,
            addedDate: new Date().toISOString()
        });

        await this.saveFavorites(favorites);
        return true;
    }

    /**
     * Supprimer un favori
     */
    async removeFavorite(symbol) {
        const favorites = await this.getFavorites();
        const filtered = favorites.filter(f => f.symbol !== symbol);
        await this.saveFavorites(filtered);
    }

    /**
     * Vérifier si un symbole est en favoris
     */
    async isFavorite(symbol) {
        const favorites = await this.getFavorites();
        return favorites.some(f => f.symbol === symbol);
    }
}

class MarketAPI {
    constructor() {
        this.corsProxy = 'https://api.allorigins.win/raw?url=';
        this.cache = new CacheManager();
    }

    /**
     * Recherche d'une action via Yahoo Finance
     */
    async searchStock(symbol) {
        symbol = symbol.toUpperCase().trim();
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
        const params = new URLSearchParams({
            interval: '1d',
            range: '5d'
        });

        try {
            const response = await fetch(`${this.corsProxy}${encodeURIComponent(url + '?' + params)}`);
            const data = await response.json();

            if (data.chart && data.chart.result && data.chart.result.length > 0) {
                const result = data.chart.result[0];
                const meta = result.meta;

                const price = meta.regularMarketPrice || 0;
                const prevClose = meta.previousClose || 0;
                const change = prevClose ? ((price - prevClose) / prevClose * 100) : 0;

                return {
                    success: true,
                    symbol: symbol,
                    name: meta.longName || symbol,
                    price: price,
                    currency: meta.currency || 'USD',
                    open: meta.regularMarketOpen || 0,
                    high: meta.regularMarketDayHigh || 0,
                    low: meta.regularMarketDayLow || 0,
                    previousClose: prevClose,
                    volume: meta.regularMarketVolume || 0,
                    change: change,
                    changeAbs: price - prevClose
                };
            } else {
                return { success: false, error: 'Symbole non trouvé' };
            }
        } catch (error) {
            console.error('Erreur recherche action:', error);
            return { success: false, error: error.message };
        }
    }


    /**
     * Récupère les actualités pour un symbole via Yahoo Finance
     */
    async getNews(symbol, companyName = '') {
        symbol = symbol.toUpperCase().trim();
        const url = 'https://query1.finance.yahoo.com/v1/finance/search';
        const params = new URLSearchParams({
            q: symbol,
            quotesCount: 1,
            newsCount: 10,
            enableFuzzyQuery: false
        });

        try {
            const response = await fetch(`${this.corsProxy}${encodeURIComponent(url + '?' + params)}`);
            const data = await response.json();

            const newsList = [];
            if (data.news && data.news.length > 0) {
                for (let i = 0; i < Math.min(6, data.news.length); i++) {
                    const article = data.news[i];
                    newsList.push({
                        title: article.title || '',
                        publisher: article.publisher || '',
                        link: article.link || '',
                        providerPublishTime: article.providerPublishTime || 0,
                        type: article.type || 'STORY'
                    });
                }
            }
            return newsList;
        } catch (error) {
            console.error('Erreur récupération actualités:', error);
            return [];
        }
    }

    /**
     * Récupère la liste des ETF PEA européens
     */
    async getETFList() {
        const etfs = {
            'CW8.PA': {
                name: 'Amundi MSCI World',
                region: 'Monde',
                description: 'Actions mondiales des pays développés'
            },
            'PAEEM.PA': {
                name: 'Amundi MSCI Emerging Markets',
                region: 'Marchés émergents',
                description: 'Actions des pays émergents'
            },
            '500.PA': {
                name: 'Lyxor S&P 500',
                region: 'États-Unis',
                description: 'Les 500 plus grandes entreprises américaines'
            },
            'CAC.PA': {
                name: 'Amundi CAC 40',
                region: 'France',
                description: 'Les 40 plus grandes entreprises françaises'
            },
            'ESE.PA': {
                name: 'Amundi Euro Stoxx 50',
                region: 'Zone Euro',
                description: 'Les 50 plus grandes entreprises de la zone euro'
            },
            'AAEU.PA': {
                name: 'Amundi MSCI Europe',
                region: 'Europe',
                description: 'Actions des grandes entreprises européennes'
            },
            'RS2K.PA': {
                name: 'Amundi Russell 2000',
                region: 'États-Unis',
                description: 'Petites et moyennes capitalisations américaines'
            },
            'PUST.PA': {
                name: 'Amundi MSCI USA',
                region: 'États-Unis',
                description: 'Large couverture du marché américain'
            }
        };

        const results = [];
        for (const [symbol, info] of Object.entries(etfs)) {
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
            const params = new URLSearchParams({
                interval: '1d',
                range: '5d'
            });

            try {
                const response = await fetch(`${this.corsProxy}${encodeURIComponent(url + '?' + params)}`);
                const data = await response.json();

                if (data.chart && data.chart.result && data.chart.result.length > 0) {
                    const meta = data.chart.result[0].meta;
                    const price = meta.regularMarketPrice || 0;
                    const prevClose = meta.previousClose || 0;
                    const change = prevClose ? ((price - prevClose) / prevClose * 100) : 0;

                    results.push({
                        symbol: symbol,
                        name: info.name,
                        region: info.region,
                        description: info.description,
                        price: price,
                        change: change,
                        open: meta.regularMarketOpen || 0,
                        high: meta.regularMarketDayHigh || 0,
                        low: meta.regularMarketDayLow || 0,
                        volume: meta.regularMarketVolume || 0,
                        currency: meta.currency || 'EUR'
                    });
                }
                // Petit délai pour éviter de surcharger l'API
                await this.sleep(300);
            } catch (error) {
                console.error(`Erreur pour ${symbol}:`, error);
            }
        }

        return results;
    }

    /**
     * Récupère la liste des ETF/ETC matières premières PEA
     */
    async getCommoditiesList() {
        const commodities = {
            'SGLD.PA': {
                name: 'WisdomTree Physical Swiss Gold',
                commodity: 'Or',
                description: 'ETC adossé à de l\'or physique stocké en Suisse'
            },
            'GOLD.PA': {
                name: 'Amundi Physical Gold',
                commodity: 'Or',
                description: 'ETC 100% adossé à de l\'or physique'
            },
            'SLVR.PA': {
                name: 'WisdomTree Physical Silver',
                commodity: 'Argent',
                description: 'ETC adossé à de l\'argent physique'
            },
            'COPA.L': {
                name: 'WisdomTree Copper',
                commodity: 'Cuivre',
                description: 'ETC suivant le cours du cuivre'
            }
        };

        const results = [];
        for (const [symbol, info] of Object.entries(commodities)) {
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
            const params = new URLSearchParams({
                interval: '1d',
                range: '5d'
            });

            try {
                const response = await fetch(`${this.corsProxy}${encodeURIComponent(url + '?' + params)}`);
                const data = await response.json();

                if (data.chart && data.chart.result && data.chart.result.length > 0) {
                    const meta = data.chart.result[0].meta;
                    const price = meta.regularMarketPrice || 0;
                    const prevClose = meta.previousClose || 0;
                    const change = prevClose ? ((price - prevClose) / prevClose * 100) : 0;

                    results.push({
                        symbol: symbol,
                        name: info.name,
                        commodity: info.commodity,
                        description: info.description,
                        price: price,
                        change: change,
                        open: meta.regularMarketOpen || 0,
                        high: meta.regularMarketDayHigh || 0,
                        low: meta.regularMarketDayLow || 0,
                        volume: meta.regularMarketVolume || 0,
                        currency: meta.currency || 'EUR'
                    });
                }
                await this.sleep(300);
            } catch (error) {
                console.error(`Erreur pour ${symbol}:`, error);
            }
        }

        return results;
    }

    /**
     * Récupère les données historiques pour un symbole
     */
    async getHistoricalData(symbol, range = '1y') {
        const cacheKey = `hist_${symbol}_${range}`;
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        symbol = symbol.toUpperCase().trim();
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
        const params = new URLSearchParams({
            interval: '1d',
            range: range
        });

        try {
            const response = await fetch(`${this.corsProxy}${encodeURIComponent(url + '?' + params)}`);
            const data = await response.json();

            if (data.chart?.result?.[0]) {
                const result = data.chart.result[0];
                const timestamps = result.timestamp || [];
                const quotes = result.indicators.quote[0];

                const formatted = {
                    timestamps: timestamps,
                    prices: quotes.close || [],
                    volumes: quotes.volume || [],
                    opens: quotes.open || [],
                    highs: quotes.high || [],
                    lows: quotes.low || []
                };

                this.cache.set(cacheKey, formatted, 5);
                return formatted;
            }
            return null;
        } catch (error) {
            console.error('Erreur récupération données historiques:', error);
            return null;
        }
    }

    /**
     * Récupère le résumé financier détaillé d'un symbole
     */
    async getQuoteSummary(symbol) {
        const cacheKey = `summary_${symbol}`;
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        symbol = symbol.toUpperCase().trim();
        const modules = 'defaultKeyStatistics,financialData,summaryDetail';
        const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}`;
        const params = new URLSearchParams({
            modules: modules
        });

        try {
            const response = await fetch(`${this.corsProxy}${encodeURIComponent(url + '?' + params)}`);
            const data = await response.json();

            if (data.quoteSummary?.result?.[0]) {
                const result = data.quoteSummary.result[0];
                const metrics = {
                    marketCap: result.summaryDetail?.marketCap?.raw,
                    peRatio: result.summaryDetail?.trailingPE?.raw,
                    forwardPE: result.summaryDetail?.forwardPE?.raw,
                    dividendYield: result.summaryDetail?.dividendYield?.raw,
                    beta: result.defaultKeyStatistics?.beta?.raw,
                    fiftyTwoWeekHigh: result.summaryDetail?.fiftyTwoWeekHigh?.raw,
                    fiftyTwoWeekLow: result.summaryDetail?.fiftyTwoWeekLow?.raw,
                    averageVolume: result.summaryDetail?.averageVolume?.raw,
                    eps: result.defaultKeyStatistics?.trailingEps?.raw,
                    bookValue: result.defaultKeyStatistics?.bookValue?.raw,
                    priceToBook: result.defaultKeyStatistics?.priceToBook?.raw
                };

                this.cache.set(cacheKey, metrics, 1);
                return metrics;
            }
            return null;
        } catch (error) {
            console.error('Erreur récupération résumé financier:', error);
            return null;
        }
    }

    /**
     * Recherche pour l'autocomplétion
     */
    async autocompleteSearch(query) {
        query = query.trim();
        if (query.length < 2) {
            return [];
        }

        const url = 'https://query1.finance.yahoo.com/v1/finance/search';
        const params = new URLSearchParams({
            q: query,
            quotesCount: 10,
            newsCount: 0,
            enableFuzzyQuery: false
        });

        try {
            const response = await fetch(`${this.corsProxy}${encodeURIComponent(url + '?' + params)}`);
            const data = await response.json();

            const results = [];
            if (data.quotes) {
                for (const quote of data.quotes) {
                    if (['EQUITY', 'ETF', 'INDEX'].includes(quote.quoteType)) {
                        results.push({
                            symbol: quote.symbol || '',
                            name: quote.longname || quote.shortname || '',
                            type: quote.quoteType || 'EQUITY',
                            exchange: quote.exchange || ''
                        });
                    }
                }
            }

            return results.slice(0, 10);
        } catch (error) {
            console.error('Erreur autocomplétion:', error);
            return this.fallbackAutocomplete(query);
        }
    }

    /**
     * Liste de secours pour l'autocomplétion
     */
    fallbackAutocomplete(query) {
        const popularStocks = [
            { symbol: 'AAPL', name: 'Apple Inc.', type: 'EQUITY', exchange: 'NASDAQ' },
            { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'EQUITY', exchange: 'NASDAQ' },
            { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'EQUITY', exchange: 'NASDAQ' },
            { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'EQUITY', exchange: 'NASDAQ' },
            { symbol: 'TSLA', name: 'Tesla Inc.', type: 'EQUITY', exchange: 'NASDAQ' },
            { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'EQUITY', exchange: 'NASDAQ' },
            { symbol: 'META', name: 'Meta Platforms Inc.', type: 'EQUITY', exchange: 'NASDAQ' },
            { symbol: 'NFLX', name: 'Netflix Inc.', type: 'EQUITY', exchange: 'NASDAQ' },
            { symbol: 'JPM', name: 'JPMorgan Chase & Co.', type: 'EQUITY', exchange: 'NYSE' },
            { symbol: 'V', name: 'Visa Inc.', type: 'EQUITY', exchange: 'NYSE' },
            { symbol: 'WMT', name: 'Walmart Inc.', type: 'EQUITY', exchange: 'NYSE' },
            { symbol: 'DIS', name: 'The Walt Disney Company', type: 'EQUITY', exchange: 'NYSE' },
            { symbol: 'MC.PA', name: 'LVMH Moët Hennessy Louis Vuitton', type: 'EQUITY', exchange: 'EPA' },
            { symbol: 'OR.PA', name: "L'Oréal S.A.", type: 'EQUITY', exchange: 'EPA' },
            { symbol: 'SAN.PA', name: 'Sanofi S.A.', type: 'EQUITY', exchange: 'EPA' },
            { symbol: 'AI.PA', name: 'Air Liquide S.A.', type: 'EQUITY', exchange: 'EPA' },
            { symbol: 'TTE.PA', name: 'TotalEnergies SE', type: 'EQUITY', exchange: 'EPA' }
        ];

        const queryLower = query.toLowerCase();
        const matches = popularStocks.filter(stock =>
            stock.symbol.toLowerCase().includes(queryLower) ||
            stock.name.toLowerCase().includes(queryLower)
        );

        return matches.slice(0, 10);
    }

    /**
     * Fonction utilitaire pour le délai
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Instance globale de l'API
const marketAPI = new MarketAPI();
const gistManager = new GitHubGistManager();

/**
 * Formate un grand nombre en notation abrégée (T, B, M, K)
 */
function formatLargeNumber(num) {
    if (!num && num !== 0) return '--';

    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
}

/**
 * Calcule les statistiques de performance sur plusieurs périodes
 */
function calculatePerformanceStats(historicalData) {
    if (!historicalData || !historicalData.prices || historicalData.prices.length === 0) {
        return null;
    }

    const prices = historicalData.prices.filter(p => p != null);
    const timestamps = historicalData.timestamps;

    if (prices.length === 0) return null;

    const currentPrice = prices[prices.length - 1];
    const now = Date.now() / 1000;

    // Définir les périodes en secondes
    const periods = {
        '1J': 1 * 24 * 60 * 60,
        '1S': 7 * 24 * 60 * 60,
        '1M': 30 * 24 * 60 * 60,
        '3M': 90 * 24 * 60 * 60,
        '1A': 365 * 24 * 60 * 60
    };

    const stats = {};

    for (const [label, seconds] of Object.entries(periods)) {
        const targetTime = now - seconds;
        let closestIdx = 0;
        let minDiff = Math.abs(timestamps[0] - targetTime);

        // Trouver l'index le plus proche de la période cible
        for (let i = 1; i < timestamps.length; i++) {
            const diff = Math.abs(timestamps[i] - targetTime);
            if (diff < minDiff) {
                minDiff = diff;
                closestIdx = i;
            }
        }

        const oldPrice = prices[closestIdx];
        if (oldPrice && oldPrice > 0) {
            const change = ((currentPrice - oldPrice) / oldPrice) * 100;
            stats[label] = change;
        } else {
            stats[label] = null;
        }
    }

    return stats;
}

/**
 * Crée un graphique de prix interactif avec Lightweight Charts
 */
function createPriceChart(containerId, data, currentPrice) {
    const container = document.getElementById(containerId);
    if (!container || !window.LightweightCharts) return null;

    const chart = LightweightCharts.createChart(container, {
        width: container.clientWidth,
        height: 300,
        layout: {
            background: { color: '#ffffff' },
            textColor: '#333',
        },
        grid: {
            vertLines: { color: '#f0f0f0' },
            horzLines: { color: '#f0f0f0' },
        },
        rightPriceScale: {
            borderColor: '#e0e0e0',
        },
        timeScale: {
            borderColor: '#e0e0e0',
            timeVisible: true,
        },
    });

    const lineSeries = chart.addLineSeries({
        color: '#667eea',
        lineWidth: 2,
        priceFormat: {
            type: 'price',
            precision: 2,
            minMove: 0.01,
        },
    });

    // Formater les données pour le graphique
    const chartData = [];
    for (let i = 0; i < data.timestamps.length; i++) {
        if (data.prices[i] != null) {
            chartData.push({
                time: data.timestamps[i],
                value: data.prices[i]
            });
        }
    }

    lineSeries.setData(chartData);

    // Ajouter une ligne pour le prix actuel
    if (currentPrice) {
        lineSeries.createPriceLine({
            price: currentPrice,
            color: '#2e7d32',
            lineWidth: 1,
            lineStyle: 2, // dashed
            axisLabelVisible: true,
        });
    }

    // Rendre le graphique responsive
    const resizeObserver = new ResizeObserver(entries => {
        if (entries.length === 0 || entries[0].target !== container) return;
        const newRect = entries[0].contentRect;
        chart.applyOptions({ width: newRect.width });
    });

    resizeObserver.observe(container);

    return { chart, lineSeries, resizeObserver };
}

/**
 * Crée un graphique de volumes
 */
function createVolumeChart(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container || !window.LightweightCharts) return null;

    const chart = LightweightCharts.createChart(container, {
        width: container.clientWidth,
        height: 100,
        layout: {
            background: { color: '#ffffff' },
            textColor: '#333',
        },
        grid: {
            vertLines: { color: '#f0f0f0' },
            horzLines: { color: '#f0f0f0' },
        },
        rightPriceScale: {
            borderColor: '#e0e0e0',
        },
        timeScale: {
            borderColor: '#e0e0e0',
            visible: false,
        },
    });

    const volumeSeries = chart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: {
            type: 'volume',
        },
    });

    const volumeData = [];
    for (let i = 0; i < data.timestamps.length; i++) {
        if (data.volumes[i] != null) {
            volumeData.push({
                time: data.timestamps[i],
                value: data.volumes[i],
                color: i > 0 && data.prices[i] >= data.prices[i - 1] ? '#26a69a' : '#ef5350'
            });
        }
    }

    volumeSeries.setData(volumeData);

    // Rendre le graphique responsive
    const resizeObserver = new ResizeObserver(entries => {
        if (entries.length === 0 || entries[0].target !== container) return;
        const newRect = entries[0].contentRect;
        chart.applyOptions({ width: newRect.width });
    });

    resizeObserver.observe(container);

    return { chart, volumeSeries, resizeObserver };
}

/**
 * Affiche les métriques financières clés
 */
function displayFinancialMetrics(metrics) {
    const section = document.getElementById('financialMetricsSection');
    if (!section) return;

    const html = `
        <h3 class="section-title">Indicateurs Clés</h3>
        <div class="metrics-grid">
            <div class="metric-item">
                <div class="metric-label">Capitalisation</div>
                <div class="metric-value">${formatLargeNumber(metrics.marketCap)}</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Ratio P/E</div>
                <div class="metric-value">${metrics.peRatio ? metrics.peRatio.toFixed(2) : '--'}</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Rendement Div.</div>
                <div class="metric-value">${metrics.dividendYield ? (metrics.dividendYield * 100).toFixed(2) + '%' : '--'}</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Beta</div>
                <div class="metric-value">${metrics.beta ? metrics.beta.toFixed(2) : '--'}</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">BPA</div>
                <div class="metric-value">${metrics.eps ? metrics.eps.toFixed(2) : '--'}</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Plus haut 52s</div>
                <div class="metric-value">${metrics.fiftyTwoWeekHigh ? metrics.fiftyTwoWeekHigh.toFixed(2) : '--'}</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Plus bas 52s</div>
                <div class="metric-value">${metrics.fiftyTwoWeekLow ? metrics.fiftyTwoWeekLow.toFixed(2) : '--'}</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Vol. Moyen</div>
                <div class="metric-value">${formatLargeNumber(metrics.averageVolume)}</div>
            </div>
        </div>
    `;

    section.innerHTML = html;
    section.classList.remove('loading');
}

/**
 * Affiche les statistiques de performance
 */
function displayPerformanceStats(stats) {
    const section = document.getElementById('performanceStatsSection');
    if (!section) return;

    let html = '<h3 class="section-title">Performance</h3><div class="performance-grid">';

    for (const [period, change] of Object.entries(stats)) {
        if (change !== null) {
            const changeClass = change >= 0 ? 'positive' : 'negative';
            const changeSymbol = change >= 0 ? '+' : '';
            const arrow = change >= 0 ? '↑' : '↓';

            html += `
                <div class="performance-badge ${changeClass}">
                    <span class="perf-period">${period}</span>
                    <span class="perf-value">${arrow} ${changeSymbol}${change.toFixed(2)}%</span>
                </div>
            `;
        }
    }

    html += '</div>';
    section.innerHTML = html;
    section.classList.remove('loading');
}

// Variables DOM
let searchInput, searchBtn, searchResult, errorMessage;
let resultSymbol, resultType, resultContent, autocompleteResults;
let autocompleteTimeout = null;
let selectedIndex = -1;

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
    // Récupération des éléments DOM
    searchInput = document.getElementById('searchInput');
    searchBtn = document.getElementById('searchBtn');
    searchResult = document.getElementById('searchResult');
    errorMessage = document.getElementById('errorMessage');
    resultSymbol = document.getElementById('resultSymbol');
    resultType = document.getElementById('resultType');
    resultContent = document.getElementById('resultContent');
    autocompleteResults = document.getElementById('autocompleteResults');

    // Event listeners
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('input', handleAutocomplete);
    searchInput.addEventListener('keydown', handleKeydown);

    // Fermer l'autocomplétion si on clique ailleurs
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-input-wrapper')) {
            autocompleteResults.classList.add('hidden');
        }
    });

    // Exemples cliquables
    document.querySelectorAll('.example-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            searchInput.value = tag.dataset.search;
            performSearch();
        });
    });

    // Event listeners pour la configuration GitHub
    document.getElementById('configGithubBtn').addEventListener('click', () => {
        document.getElementById('githubConfigModal').classList.remove('hidden');
    });

    document.getElementById('saveGithubToken').addEventListener('click', () => {
        const token = document.getElementById('githubToken').value.trim();
        if (token) {
            gistManager.setToken(token);
            document.getElementById('githubConfigModal').classList.add('hidden');
            document.getElementById('githubToken').value = '';
            displayFavorites();
        } else {
            alert('Veuillez entrer un token valide');
        }
    });

    document.getElementById('cancelGithubToken').addEventListener('click', () => {
        document.getElementById('githubConfigModal').classList.add('hidden');
        document.getElementById('githubToken').value = '';
    });

    // Charger les données initiales
    await loadInitialData();
});

/**
 * Charge les données initiales (ETF PEA)
 */
async function loadInitialData() {
    try {
        // Charger les favoris en premier
        await displayFavorites();

        // Charger les ETF PEA européens
        const etfs = await marketAPI.getETFList();
        displayETFs(etfs);

        // Charger les matières premières PEA
        const commodities = await marketAPI.getCommoditiesList();
        displayCommodities(commodities);
    } catch (error) {
        console.error('Erreur chargement données initiales:', error);
    }
}

/**
 * Affiche les ETF PEA avec accordéons
 */
function displayETFs(etfs) {
    const container = document.querySelector('#etfAccordion');
    container.innerHTML = '';

    etfs.forEach((etf, index) => {
        const changeClass = etf.change >= 0 ? 'positive' : 'negative';
        const changeSymbol = etf.change >= 0 ? '+' : '';
        const changeIcon = etf.change >= 0 ? '↑' : '↓';

        const etfItem = document.createElement('div');
        etfItem.className = 'etf-item';
        etfItem.innerHTML = `
            <div class="etf-header" data-index="${index}">
                <div class="etf-header-left">
                    <div class="etf-name">${etf.name}</div>
                    <div class="etf-region">${etf.region} • ${etf.symbol}</div>
                </div>
                <div class="etf-header-right">
                    <div class="etf-price">${etf.price.toFixed(2)} ${etf.currency}</div>
                    <div class="etf-change ${changeClass}">
                        ${changeIcon} ${changeSymbol}${etf.change.toFixed(2)}%
                    </div>
                </div>
                <div class="etf-chevron">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
            </div>
            <div class="etf-content" data-index="${index}">
                <div class="etf-description">${etf.description}</div>
                <div class="etf-details-grid">
                    <div class="etf-detail">
                        <div class="etf-detail-label">Ouverture</div>
                        <div class="etf-detail-value">${etf.open.toFixed(2)} ${etf.currency}</div>
                    </div>
                    <div class="etf-detail">
                        <div class="etf-detail-label">Plus haut</div>
                        <div class="etf-detail-value">${etf.high.toFixed(2)} ${etf.currency}</div>
                    </div>
                    <div class="etf-detail">
                        <div class="etf-detail-label">Plus bas</div>
                        <div class="etf-detail-value">${etf.low.toFixed(2)} ${etf.currency}</div>
                    </div>
                    <div class="etf-detail">
                        <div class="etf-detail-label">Volume</div>
                        <div class="etf-detail-value">${formatLargeNumber(etf.volume)}</div>
                    </div>
                </div>
            </div>
        `;

        // Ajouter l'événement click pour l'accordéon
        const header = etfItem.querySelector('.etf-header');
        header.addEventListener('click', () => toggleETF(index));

        container.appendChild(etfItem);
    });
}

/**
 * Gère l'ouverture/fermeture d'un ETF accordéon
 */
function toggleETF(index) {
    const content = document.querySelector(`.etf-content[data-index="${index}"]`);
    const header = document.querySelector(`.etf-header[data-index="${index}"]`);
    const item = header.closest('.etf-item');

    // Fermer tous les autres accordéons
    document.querySelectorAll('.etf-item').forEach((otherItem, i) => {
        if (i !== index && otherItem.classList.contains('active')) {
            otherItem.classList.remove('active');
            const otherContent = otherItem.querySelector('.etf-content');
            otherContent.style.maxHeight = null;
        }
    });

    // Toggle l'accordéon actuel
    item.classList.toggle('active');
    if (item.classList.contains('active')) {
        content.style.maxHeight = content.scrollHeight + 'px';
    } else {
        content.style.maxHeight = null;
    }
}

/**
 * Affiche les matières premières PEA avec accordéons
 */
function displayCommodities(commodities) {
    const container = document.querySelector('#commoditiesAccordion');
    container.innerHTML = '';

    commodities.forEach((commodity, index) => {
        const changeClass = commodity.change >= 0 ? 'positive' : 'negative';
        const changeSymbol = commodity.change >= 0 ? '+' : '';
        const changeIcon = commodity.change >= 0 ? '↑' : '↓';

        const commodityItem = document.createElement('div');
        commodityItem.className = 'commodity-item';
        commodityItem.innerHTML = `
            <div class="commodity-header" data-index="${index}">
                <div class="commodity-header-left">
                    <div class="commodity-name">${commodity.name}</div>
                    <div class="commodity-type">${commodity.commodity} • ${commodity.symbol}</div>
                </div>
                <div class="commodity-header-right">
                    <div class="commodity-price">${commodity.price.toFixed(2)} ${commodity.currency}</div>
                    <div class="commodity-change ${changeClass}">
                        ${changeIcon} ${changeSymbol}${commodity.change.toFixed(2)}%
                    </div>
                </div>
                <div class="commodity-chevron">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
            </div>
            <div class="commodity-content" data-index="${index}">
                <div class="commodity-description">${commodity.description}</div>
                <div class="commodity-details-grid">
                    <div class="commodity-detail">
                        <div class="commodity-detail-label">Ouverture</div>
                        <div class="commodity-detail-value">${commodity.open.toFixed(2)} ${commodity.currency}</div>
                    </div>
                    <div class="commodity-detail">
                        <div class="commodity-detail-label">Plus haut</div>
                        <div class="commodity-detail-value">${commodity.high.toFixed(2)} ${commodity.currency}</div>
                    </div>
                    <div class="commodity-detail">
                        <div class="commodity-detail-label">Plus bas</div>
                        <div class="commodity-detail-value">${commodity.low.toFixed(2)} ${commodity.currency}</div>
                    </div>
                    <div class="commodity-detail">
                        <div class="commodity-detail-label">Volume</div>
                        <div class="commodity-detail-value">${formatLargeNumber(commodity.volume)}</div>
                    </div>
                </div>
            </div>
        `;

        // Ajouter l'événement click pour l'accordéon
        const header = commodityItem.querySelector('.commodity-header');
        header.addEventListener('click', () => toggleCommodity(index));

        container.appendChild(commodityItem);
    });
}

/**
 * Gère l'ouverture/fermeture d'un accordéon matière première
 */
function toggleCommodity(index) {
    const content = document.querySelector(`.commodity-content[data-index="${index}"]`);
    const header = document.querySelector(`.commodity-header[data-index="${index}"]`);
    const item = header.closest('.commodity-item');

    // Fermer tous les autres accordéons
    document.querySelectorAll('.commodity-item').forEach((otherItem, i) => {
        if (i !== index && otherItem.classList.contains('active')) {
            otherItem.classList.remove('active');
            const otherContent = otherItem.querySelector('.commodity-content');
            otherContent.style.maxHeight = null;
        }
    });

    // Toggle l'accordéon actuel
    item.classList.toggle('active');
    if (item.classList.contains('active')) {
        content.style.maxHeight = content.scrollHeight + 'px';
    } else {
        content.style.maxHeight = null;
    }
}

/**
 * Affiche les favoris avec accordéons
 */
async function displayFavorites() {
    const container = document.querySelector('#favoritesAccordion');
    const section = document.querySelector('#favoritesSection');
    const helpMessage = document.getElementById('githubHelpMessage');

    // Toujours afficher la section (pour voir le bouton de configuration)
    section.classList.remove('hidden');

    if (!gistManager.isConfigured()) {
        // Afficher message d'aide pour configuration manuelle
        container.innerHTML = '<div class="favorite-item"><div class="favorite-header">Aucun favori configuré. Cliquez sur "Configurer" pour commencer.</div></div>';
        if (helpMessage) {
            helpMessage.classList.add('hidden');
        }
        return;
    }

    // Afficher message de succès si config.js chargé
    if (window.APP_CONFIG && window.APP_CONFIG.githubToken && window.APP_CONFIG.githubToken !== 'YOUR_GITHUB_TOKEN_HERE') {
        if (helpMessage) {
            helpMessage.classList.remove('hidden');
        }
    } else {
        if (helpMessage) {
            helpMessage.classList.add('hidden');
        }
    }

    const favorites = await gistManager.getFavorites();

    if (favorites.length === 0) {
        container.innerHTML = '<div class="favorite-item"><div class="favorite-header">Aucun favori pour le moment. Recherchez une action et cliquez sur ☆</div></div>';
        return;
    }

    container.innerHTML = '';

    // Récupérer les prix en temps réel
    for (const favorite of favorites) {
        try {
            const stockData = await marketAPI.searchStock(favorite.symbol);

            if (stockData.success) {
                const changeClass = stockData.change >= 0 ? 'positive' : 'negative';
                const changeSymbol = stockData.change >= 0 ? '+' : '';
                const changeIcon = stockData.change >= 0 ? '↑' : '↓';

                const favoriteItem = document.createElement('div');
                favoriteItem.className = 'favorite-item';
                favoriteItem.innerHTML = `
                    <div class="favorite-header" data-symbol="${favorite.symbol}">
                        <div class="favorite-header-left">
                            <div class="favorite-name">${favorite.name}</div>
                            <div class="favorite-symbol">${favorite.symbol}</div>
                        </div>
                        <div class="favorite-header-right">
                            <div class="favorite-price">${stockData.price.toFixed(2)} ${stockData.currency}</div>
                            <div class="favorite-change ${changeClass}">
                                ${changeIcon} ${changeSymbol}${stockData.change.toFixed(2)}%
                            </div>
                        </div>
                        <button class="favorite-delete" data-symbol="${favorite.symbol}" title="Supprimer">🗑️</button>
                    </div>
                `;

                // Event: Clic sur en-tête = rechercher l'action
                const header = favoriteItem.querySelector('.favorite-header');
                header.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('favorite-delete')) {
                        document.getElementById('searchInput').value = favorite.symbol;
                        performSearch();
                    }
                });

                // Event: Supprimer
                const deleteBtn = favoriteItem.querySelector('.favorite-delete');
                deleteBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await removeFavorite(favorite.symbol);
                });

                container.appendChild(favoriteItem);
            }
        } catch (error) {
            console.error(`Erreur chargement favori ${favorite.symbol}:`, error);
        }
    }
}

/**
 * Ajouter un favori
 */
async function addFavorite(symbol, name) {
    try {
        console.log('⭐ Ajout aux favoris:', { symbol, name });
        const added = await gistManager.addFavorite(symbol, name);
        if (added) {
            await displayFavorites();
            updateFavoriteButton(symbol, true);

            // Afficher notification de succès
            showNotification('✅ Favori ajouté et synchronisé sur GitHub Gist!', 'success');
        }
    } catch (error) {
        console.error('❌ Erreur ajout favori:', error);

        // Message d'erreur détaillé
        let errorMsg = 'Erreur lors de l\'ajout aux favoris:\n';
        if (error.message.includes('401')) {
            errorMsg += 'Token GitHub invalide ou expiré. Vérifiez votre config.js';
        } else if (error.message.includes('404')) {
            errorMsg += 'Gist non trouvé. Supprimez le gistId dans config.js et réessayez.';
        } else if (error.message.includes('GitHub non configuré')) {
            errorMsg += 'Configurez votre token GitHub en cliquant sur ⚙️';
        } else {
            errorMsg += error.message;
        }

        alert(errorMsg);
    }
}

/**
 * Supprimer un favori
 */
async function removeFavorite(symbol) {
    await gistManager.removeFavorite(symbol);
    await displayFavorites();
    updateFavoriteButton(symbol, false);
}

/**
 * Met à jour le bouton étoile
 */
function updateFavoriteButton(symbol, isFavorite) {
    const btn = document.querySelector('.favorite-star-btn');
    if (btn) {
        btn.textContent = isFavorite ? '⭐' : '☆';
        btn.dataset.favorited = isFavorite;
    }
}

/**
 * Affiche une notification temporaire
 */
function showNotification(message, type = 'info') {
    // Créer l'élément notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Ajouter au body
    document.body.appendChild(notification);

    // Afficher avec animation
    setTimeout(() => notification.classList.add('show'), 10);

    // Masquer après 3 secondes
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Fonction de recherche
 */
async function performSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    // Masquer les résultats précédents
    searchResult.classList.add('hidden');
    errorMessage.classList.add('hidden');

    try {
        // Rechercher l'action
        const result = await marketAPI.searchStock(query);
        if (result.success) {
            result.type = 'stock';
            // Ajouter les actualités pour les actions
            result.news = await marketAPI.getNews(query, result.name);
            displayResult(result);
        } else {
            showError('Symbole non trouvé');
        }
    } catch (error) {
        showError('Erreur de connexion: ' + error.message);
    }
}

/**
 * Formate la date des actualités
 */
function formatNewsDate(timestamp) {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
        return 'Il y a quelques minutes';
    } else if (diffHours < 24) {
        return `Il y a ${diffHours}h`;
    } else if (diffDays < 7) {
        return `Il y a ${diffDays}j`;
    } else {
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
}

/**
 * Affiche les actualités
 */
function displayNews(news) {
    if (!news || news.length === 0) {
        return `
            <div class="news-section">
                <h3 class="news-title">Actualités</h3>
                <div class="news-empty">
                    <p>Aucune actualité récente disponible pour cette entreprise.</p>
                    <p class="news-empty-hint">Les actualités sont principalement disponibles pour les entreprises américaines via Yahoo Finance.</p>
                </div>
            </div>
        `;
    }

    let newsHtml = `
        <div class="news-section">
            <h3 class="news-title">Actualités</h3>
            <div class="news-list">
    `;

    news.forEach(article => {
        newsHtml += `
            <a href="${article.link}" target="_blank" class="news-item">
                <div class="news-header">
                    <span class="news-publisher">${article.publisher}</span>
                    <span class="news-time">${formatNewsDate(article.providerPublishTime)}</span>
                </div>
                <div class="news-article-title">${article.title}</div>
            </a>
        `;
    });

    newsHtml += `
            </div>
        </div>
    `;

    return newsHtml;
}

/**
 * Affiche le résultat avec la nouvelle structure enrichie
 */
async function displayResult(data) {
    resultSymbol.textContent = data.symbol || data.name;
    resultType.textContent = 'Action';
    resultType.className = 'badge stock';

    const changeClass = data.change >= 0 ? 'positive' : 'negative';
    const changeSymbol = data.change >= 0 ? '+' : '';

    // Vérifier si en favoris
    const isFav = await gistManager.isFavorite(data.symbol);

    // Afficher la structure HTML avec placeholders pour chargement asynchrone
    resultContent.innerHTML = `
        <div class="result-main-info">
            <div class="result-grid">
                <div class="result-item main">
                    <div class="result-label">Prix</div>
                    <div class="result-value large">${data.currency} ${data.price.toFixed(2)}</div>
                    <div class="result-change ${changeClass}">
                        ${changeSymbol}${data.changeAbs.toFixed(2)} (${changeSymbol}${data.change.toFixed(2)}%)
                    </div>
                </div>
            </div>
            <button class="favorite-star-btn" data-symbol="${data.symbol}" data-name="${data.name}" data-favorited="${isFav}">
                ${isFav ? '⭐' : '☆'}
            </button>
        </div>

        <!-- Section Métriques Financières -->
        <div id="financialMetricsSection" class="metrics-section loading">
            <h3 class="section-title">Indicateurs Clés</h3>
            <div class="metrics-grid">
                <div class="metric-skeleton"></div>
                <div class="metric-skeleton"></div>
                <div class="metric-skeleton"></div>
                <div class="metric-skeleton"></div>
            </div>
        </div>

        <!-- Section Performance -->
        <div id="performanceStatsSection" class="performance-section loading">
            <h3 class="section-title">Performance</h3>
            <div class="performance-grid">
                <div class="perf-skeleton"></div>
            </div>
        </div>

        <!-- Section Graphique -->
        <div id="chartSection" class="chart-section">
            <h3 class="section-title">Historique du Cours</h3>
            <div class="chart-controls">
                <button class="period-btn active" data-period="1mo">1M</button>
                <button class="period-btn" data-period="3mo">3M</button>
                <button class="period-btn" data-period="6mo">6M</button>
                <button class="period-btn" data-period="1y">1A</button>
                <button class="period-btn" data-period="5y">5A</button>
            </div>
            <div id="priceChart" class="chart-container"></div>
            <div id="volumeChart" class="chart-container-small"></div>
        </div>

        <!-- Métriques journalières originales -->
        <div class="result-grid">
            <div class="result-item">
                <div class="result-label">Ouverture</div>
                <div class="result-value">${data.open.toFixed(2)}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Plus haut</div>
                <div class="result-value">${data.high.toFixed(2)}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Plus bas</div>
                <div class="result-value">${data.low.toFixed(2)}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Clôture préc.</div>
                <div class="result-value">${data.previousClose.toFixed(2)}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Volume</div>
                <div class="result-value">${data.volume.toLocaleString('fr-FR')}</div>
            </div>
        </div>

        ${displayNews(data.news)}
    `;

    searchResult.classList.remove('hidden');

    // Event listener pour le bouton favori
    const starBtn = document.querySelector('.favorite-star-btn');
    if (starBtn) {
        starBtn.addEventListener('click', async (e) => {
            const btn = e.target;
            const symbol = btn.dataset.symbol;
            const name = btn.dataset.name;
            const isFavorited = btn.dataset.favorited === 'true';

            if (isFavorited) {
                await removeFavorite(symbol);
            } else {
                await addFavorite(symbol, name);
            }
        });
    }

    // Charger les données enrichies de manière asynchrone
    await loadEnhancedData(data.symbol, data.price);
}

/**
 * Charge les données enrichies (métriques, performance, graphiques)
 */
async function loadEnhancedData(symbol, currentPrice) {
    let priceChartInstance = null;
    let volumeChartInstance = null;
    let currentRange = '1mo';

    try {
        // Récupérer les données en parallèle
        const [metrics, historicalData] = await Promise.all([
            marketAPI.getQuoteSummary(symbol),
            marketAPI.getHistoricalData(symbol, currentRange)
        ]);

        // Afficher les métriques financières
        if (metrics) {
            displayFinancialMetrics(metrics);
        }

        // Afficher la performance et les graphiques
        if (historicalData) {
            // Calculer et afficher les statistiques de performance
            const stats = calculatePerformanceStats(historicalData);
            if (stats) {
                displayPerformanceStats(stats);
            }

            // Créer les graphiques
            priceChartInstance = createPriceChart('priceChart', historicalData, currentPrice);
            volumeChartInstance = createVolumeChart('volumeChart', historicalData);
        }

        // Ajouter les gestionnaires d'événements pour le sélecteur de période
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const period = e.target.dataset.period;
                if (period === currentRange) return;

                // Mettre à jour l'état actif
                document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                // Afficher l'état de chargement
                const priceChartContainer = document.getElementById('priceChart');
                const volumeChartContainer = document.getElementById('volumeChart');
                priceChartContainer.classList.add('loading');
                volumeChartContainer.classList.add('loading');

                try {
                    // Récupérer les nouvelles données
                    const newData = await marketAPI.getHistoricalData(symbol, period);
                    if (newData) {
                        // Mettre à jour le graphique de prix
                        if (priceChartInstance && priceChartInstance.lineSeries) {
                            const chartData = [];
                            for (let i = 0; i < newData.timestamps.length; i++) {
                                if (newData.prices[i] != null) {
                                    chartData.push({
                                        time: newData.timestamps[i],
                                        value: newData.prices[i]
                                    });
                                }
                            }
                            priceChartInstance.lineSeries.setData(chartData);
                        }

                        // Mettre à jour le graphique de volumes
                        if (volumeChartInstance && volumeChartInstance.volumeSeries) {
                            const volumeData = [];
                            for (let i = 0; i < newData.timestamps.length; i++) {
                                if (newData.volumes[i] != null) {
                                    volumeData.push({
                                        time: newData.timestamps[i],
                                        value: newData.volumes[i],
                                        color: i > 0 && newData.prices[i] >= newData.prices[i - 1] ? '#26a69a' : '#ef5350'
                                    });
                                }
                            }
                            volumeChartInstance.volumeSeries.setData(volumeData);
                        }

                        currentRange = period;
                    }
                } catch (error) {
                    console.error('Erreur changement période:', error);
                } finally {
                    priceChartContainer.classList.remove('loading');
                    volumeChartContainer.classList.remove('loading');
                }
            });
        });

    } catch (error) {
        console.error('Erreur chargement données enrichies:', error);
    }
}

/**
 * Affiche une erreur
 */
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

/**
 * Gestion de l'autocomplétion
 */
async function handleAutocomplete(e) {
    clearTimeout(autocompleteTimeout);
    autocompleteTimeout = setTimeout(async () => {
        const query = e.target.value.trim();
        if (query.length < 2) {
            autocompleteResults.classList.add('hidden');
            return;
        }

        try {
            const results = await marketAPI.autocompleteSearch(query);
            if (results.length > 0) {
                displayAutocomplete(results);
            } else {
                autocompleteResults.classList.add('hidden');
            }
        } catch (error) {
            console.error('Erreur autocomplétion:', error);
            autocompleteResults.classList.add('hidden');
        }
    }, 300);
}

/**
 * Affiche les résultats d'autocomplétion
 */
function displayAutocomplete(results) {
    autocompleteResults.innerHTML = '';
    selectedIndex = -1;

    results.forEach((result, index) => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.dataset.index = index;
        item.dataset.symbol = result.symbol;

        item.innerHTML = `
            <div class="autocomplete-symbol">${result.symbol}</div>
            <div class="autocomplete-name">${result.name || result.symbol}</div>
            <div class="autocomplete-exchange">${result.exchange || ''}</div>
        `;

        item.addEventListener('click', () => {
            searchInput.value = result.symbol;
            autocompleteResults.classList.add('hidden');
            performSearch();
        });

        item.addEventListener('mouseenter', () => {
            removeActiveClass();
            selectedIndex = index;
            item.classList.add('active');
        });

        autocompleteResults.appendChild(item);
    });

    autocompleteResults.classList.remove('hidden');
}

/**
 * Retire la classe active de tous les items
 */
function removeActiveClass() {
    document.querySelectorAll('.autocomplete-item').forEach(item => {
        item.classList.remove('active');
    });
}

/**
 * Sélectionne un item d'autocomplétion
 */
function selectAutocompleteItem(direction) {
    const items = document.querySelectorAll('.autocomplete-item');
    if (items.length === 0) return;

    removeActiveClass();

    if (direction === 'down') {
        selectedIndex = (selectedIndex + 1) % items.length;
    } else if (direction === 'up') {
        selectedIndex = selectedIndex <= 0 ? items.length - 1 : selectedIndex - 1;
    }

    items[selectedIndex].classList.add('active');
    items[selectedIndex].scrollIntoView({ block: 'nearest' });
}

/**
 * Gestion des touches clavier
 */
function handleKeydown(e) {
    if (!autocompleteResults.classList.contains('hidden')) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectAutocompleteItem('down');
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectAutocompleteItem('up');
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const activeItem = document.querySelector('.autocomplete-item.active');
            if (activeItem) {
                searchInput.value = activeItem.dataset.symbol;
                autocompleteResults.classList.add('hidden');
            }
            performSearch();
        } else if (e.key === 'Escape') {
            autocompleteResults.classList.add('hidden');
        }
    } else if (e.key === 'Enter') {
        e.preventDefault();
        performSearch();
    }
}
