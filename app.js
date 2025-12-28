/**
 * Application JavaScript pour le tableau de bord financier
 * Appels directs aux APIs Yahoo Finance et CoinGecko
 */

class MarketAPI {
    constructor() {
        this.corsProxy = 'https://api.allorigins.win/raw?url=';
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
     * Recherche d'une crypto via CoinGecko
     */
    async searchCrypto(cryptoId) {
        cryptoId = cryptoId.toLowerCase().trim();
        const url = 'https://api.coingecko.com/api/v3/simple/price';
        const params = new URLSearchParams({
            ids: cryptoId,
            vs_currencies: 'usd,eur',
            include_24hr_change: 'true',
            include_market_cap: 'true',
            include_24hr_vol: 'true'
        });

        try {
            const response = await fetch(`${url}?${params}`);
            const data = await response.json();

            if (data[cryptoId]) {
                const info = data[cryptoId];
                return {
                    success: true,
                    type: 'crypto',
                    symbol: cryptoId.toUpperCase(),
                    name: this.formatCryptoName(cryptoId),
                    priceUSD: info.usd || 0,
                    priceEUR: info.eur || 0,
                    change24h: info.usd_24h_change || 0,
                    marketCap: info.usd_market_cap || 0,
                    volume24h: info.usd_24h_vol || 0
                };
            } else {
                return { success: false, error: 'Crypto non trouvée' };
            }
        } catch (error) {
            console.error('Erreur recherche crypto:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Formatte le nom d'une crypto
     */
    formatCryptoName(cryptoId) {
        const cryptoNames = {
            'bitcoin': 'Bitcoin',
            'ethereum': 'Ethereum',
            'binancecoin': 'Binance Coin',
            'cardano': 'Cardano',
            'solana': 'Solana',
            'ripple': 'Ripple',
            'polkadot': 'Polkadot',
            'dogecoin': 'Dogecoin'
        };
        return cryptoNames[cryptoId] || cryptoId.charAt(0).toUpperCase() + cryptoId.slice(1);
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
     * Récupère un aperçu du marché
     */
    async getMarketOverview() {
        const indices = {
            'S&P 500': '^GSPC',
            'Dow Jones': '^DJI',
            'NASDAQ': '^IXIC',
            'CAC 40': '^FCHI'
        };

        const results = [];
        for (const [name, symbol] of Object.entries(indices)) {
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
            const params = new URLSearchParams({
                interval: '1d',
                range: '1d'
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
                        name: name,
                        price: price,
                        change: change
                    });
                }
                // Petit délai pour éviter de surcharger l'API
                await this.sleep(300);
            } catch (error) {
                console.error(`Erreur pour ${name}:`, error);
            }
        }

        return results;
    }

    /**
     * Récupère les cryptos populaires
     */
    async getTopCryptos() {
        const cryptos = ['bitcoin', 'ethereum', 'binancecoin', 'cardano', 'solana'];
        const url = 'https://api.coingecko.com/api/v3/simple/price';
        const params = new URLSearchParams({
            ids: cryptos.join(','),
            vs_currencies: 'usd',
            include_24hr_change: 'true'
        });

        try {
            const response = await fetch(`${url}?${params}`);
            const data = await response.json();

            const results = [];
            for (const crypto of cryptos) {
                if (data[crypto]) {
                    results.push({
                        name: this.formatCryptoName(crypto),
                        price: data[crypto].usd || 0,
                        change: data[crypto].usd_24h_change || 0
                    });
                }
            }
            return results;
        } catch (error) {
            console.error('Erreur récupération cryptos:', error);
            return [];
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
                    if (['EQUITY', 'ETF', 'CRYPTOCURRENCY', 'INDEX'].includes(quote.quoteType)) {
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

    // Charger les données initiales
    await loadInitialData();
});

/**
 * Charge les données initiales (indices et cryptos)
 */
async function loadInitialData() {
    try {
        // Charger les indices boursiers
        const indices = await marketAPI.getMarketOverview();
        displayIndices(indices);

        // Charger les cryptos populaires
        const cryptos = await marketAPI.getTopCryptos();
        displayCryptos(cryptos);
    } catch (error) {
        console.error('Erreur chargement données initiales:', error);
    }
}

/**
 * Affiche les indices boursiers
 */
function displayIndices(indices) {
    const container = document.querySelector('.market-overview .cards-grid');
    container.innerHTML = '';

    indices.forEach(index => {
        const changeClass = index.change >= 0 ? 'positive' : 'negative';
        const changeSymbol = index.change >= 0 ? '+' : '';

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-header">
                <h3>${index.name}</h3>
                <span class="badge ${changeClass}">
                    ${changeSymbol}${index.change.toFixed(2)}%
                </span>
            </div>
            <div class="card-price">${index.price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        `;
        container.appendChild(card);
    });
}

/**
 * Affiche les cryptos populaires
 */
function displayCryptos(cryptos) {
    const container = document.querySelector('.crypto-section .cards-grid');
    container.innerHTML = '';

    cryptos.forEach(crypto => {
        const changeClass = crypto.change >= 0 ? 'positive' : 'negative';
        const changeSymbol = crypto.change >= 0 ? '+' : '';

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-header">
                <h3>${crypto.name}</h3>
                <span class="badge ${changeClass}">
                    ${changeSymbol}${crypto.change.toFixed(2)}%
                </span>
            </div>
            <div class="card-price">$${crypto.price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        `;
        container.appendChild(card);
    });
}

/**
 * Fonction de recherche
 */
async function performSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    const searchType = document.querySelector('input[name="searchType"]:checked').value;

    // Masquer les résultats précédents
    searchResult.classList.add('hidden');
    errorMessage.classList.add('hidden');

    try {
        let result = null;

        // Essayer en tant qu'action d'abord
        if (searchType === 'auto' || searchType === 'stock') {
            result = await marketAPI.searchStock(query);
            if (result.success) {
                result.type = 'stock';
                // Ajouter les actualités pour les actions
                result.news = await marketAPI.getNews(query, result.name);
                displayResult(result);
                return;
            }
        }

        // Essayer en tant que crypto
        if (searchType === 'auto' || searchType === 'crypto') {
            result = await marketAPI.searchCrypto(query);
            if (result.success) {
                displayResult(result);
                return;
            }
        }

        showError('Symbole non trouvé');
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
 * Affiche le résultat
 */
function displayResult(data) {
    resultSymbol.textContent = data.symbol || data.name;

    if (data.type === 'stock') {
        resultType.textContent = 'Action';
        resultType.className = 'badge stock';

        const changeClass = data.change >= 0 ? 'positive' : 'negative';
        const changeSymbol = data.change >= 0 ? '+' : '';

        resultContent.innerHTML = `
            <div class="result-grid">
                <div class="result-item main">
                    <div class="result-label">Prix</div>
                    <div class="result-value large">${data.currency} ${data.price.toFixed(2)}</div>
                    <div class="result-change ${changeClass}">
                        ${changeSymbol}${data.changeAbs.toFixed(2)} (${changeSymbol}${data.change.toFixed(2)}%)
                    </div>
                </div>
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
    } else if (data.type === 'crypto') {
        resultType.textContent = 'Crypto';
        resultType.className = 'badge crypto';

        const changeClass = data.change24h >= 0 ? 'positive' : 'negative';
        const changeSymbol = data.change24h >= 0 ? '+' : '';

        resultContent.innerHTML = `
            <div class="result-grid">
                <div class="result-item main">
                    <div class="result-label">Prix USD</div>
                    <div class="result-value large">$${data.priceUSD.toLocaleString('fr-FR')}</div>
                    <div class="result-change ${changeClass}">
                        ${changeSymbol}${data.change24h.toFixed(2)}% (24h)
                    </div>
                </div>
                <div class="result-item">
                    <div class="result-label">Prix EUR</div>
                    <div class="result-value">€${data.priceEUR.toLocaleString('fr-FR')}</div>
                </div>
                <div class="result-item">
                    <div class="result-label">Capitalisation</div>
                    <div class="result-value">$${(data.marketCap / 1e9).toFixed(2)}B</div>
                </div>
                <div class="result-item">
                    <div class="result-label">Volume 24h</div>
                    <div class="result-value">$${(data.volume24h / 1e9).toFixed(2)}B</div>
                </div>
            </div>
        `;
    }

    searchResult.classList.remove('hidden');
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
