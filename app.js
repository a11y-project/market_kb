/**
 * Application JavaScript pour le tableau de bord des ETF PEA
 * Appels directs à l'API Yahoo Finance
 */

class MarketAPI {
    constructor() {
        this.corsProxy = 'https://api.allorigins.win/raw?url=';
    }

    /**
     * Récupère la liste des ETF PEA européens
     */
    async getETFList() {
        // Liste simplifiée : ticker → catégorie
        // Le nom de l'ETF est récupéré automatiquement via l'API Yahoo Finance
        const etfs = {
            'CAC.PA': 'ETF PEA France',
            'ESE.PA': 'ETF PEA Europe',
            'AAEU.PA': 'ETF PEA Europe',
            '500.PA': 'ETF PEA S&P 500',
            'PUST.PA': 'ETF PEA S&P 500',
            'RS2K.PA': 'ETF PEA small caps',
            'PANX.PA': 'ETF PEA sur la tech américaine',
            'CW8.PA': 'ETF PEA MSCI World',
            'PAEEM.PA': 'ETF PEA Emerging Markets',
            'PINR.PA': 'ETF PEA sur l\'Inde',
            'AWAT.PA': 'ETF PEA sur l\'eau',
            'WPEA.PA': 'ETF PEA MSCI World',
            'SPEA.PA': 'ETF PEA S&P 500',
            'SMEA.PA': 'ETF PEA Europe',
            'CSSX5E.PA': 'ETF PEA Europe',
            'BNPE.PA': 'ETF PEA S&P 500',
            'ECN.PA': 'ETF PEA Europe',
            'EMKX.PA': 'ETF PEA Emerging Markets'
        };

        const results = [];
        for (const [symbol, category] of Object.entries(etfs)) {
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

                    // Récupérer le ratio de frais via quoteSummary
                    const expenseRatio = await this.getExpenseRatio(symbol);

                    results.push({
                        symbol: symbol,
                        name: meta.longName || symbol,
                        category: category,
                        price: price,
                        change: change,
                        // Données de trading
                        open: meta.regularMarketOpen || null,
                        high: meta.regularMarketDayHigh || null,
                        low: meta.regularMarketDayLow || null,
                        previousClose: meta.previousClose || null,
                        volume: meta.regularMarketVolume || null,
                        currency: meta.currency || 'EUR',
                        // Performance 52 semaines
                        fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || null,
                        fiftyTwoWeekLow: meta.fiftyTwoWeekLow || null,
                        fiftyDayAverage: meta.fiftyDayAverage || null,
                        twoHundredDayAverage: meta.twoHundredDayAverage || null,
                        // Volume moyen
                        averageVolume: meta.regularMarketVolume || null,
                        averageVolume10days: meta.averageDailyVolume10Day || null,
                        // Indicateurs financiers
                        marketCap: meta.marketCap || null,
                        dividendYield: meta.dividendYield || null,
                        trailingPE: meta.trailingPE || null,
                        forwardPE: meta.forwardPE || null,
                        trailingEps: meta.epsTrailingTwelveMonths || null,
                        bookValue: meta.bookValue || null,
                        priceToBook: meta.priceToBook || null,
                        beta: meta.beta || null,
                        expenseRatio: expenseRatio,
                        // Informations générales
                        longName: meta.longName || symbol,
                        exchange: meta.exchangeName || meta.fullExchangeName || null,
                        quoteType: meta.quoteType || null,
                        marketState: meta.marketState || null,
                        regularMarketTime: meta.regularMarketTime || null,
                        timezone: meta.timezone || null,
                        apiResponse: data // Stocker la réponse brute de l'API
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
     * Récupère le ratio de frais (TER) pour un ETF
     */
    async getExpenseRatio(symbol) {
        try {
            const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}`;
            const params = new URLSearchParams({
                modules: 'fundProfile'
            });

            const response = await fetch(`${this.corsProxy}${encodeURIComponent(url + '?' + params)}`);
            const data = await response.json();

            if (data.quoteSummary?.result?.[0]?.fundProfile) {
                const fundProfile = data.quoteSummary.result[0].fundProfile;

                // Essayer plusieurs sources possibles
                const expenseRatio = fundProfile.feesExpensesInvestment?.annualReportExpenseRatio?.raw ||
                                     fundProfile.feesExpensesInvestment?.annualReportExpenseRatio ||
                                     fundProfile.annualReportExpenseRatio?.raw ||
                                     fundProfile.annualReportExpenseRatio ||
                                     null;

                return expenseRatio;
            }
            return null;
        } catch (error) {
            console.error(`Erreur récupération expense ratio pour ${symbol}:`, error);
            return null;
        }
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

/**
 * Crée une carte ETF individuelle
 */
function createETFCard(etf) {
    const changeClass = etf.change >= 0 ? 'positive' : 'negative';
    const changeSymbol = etf.change >= 0 ? '+' : '';
    const changeIcon = etf.change >= 0 ? '↑' : '↓';

    const card = document.createElement('div');
    card.className = 'etf-card';

    card.innerHTML = `
        <div class="etf-card-header">
            <h3 class="etf-title">${etf.name}</h3>
            <div class="etf-meta">${etf.symbol}</div>
        </div>
        <div class="etf-pricing">
            <div class="etf-price">${etf.price.toFixed(2)} ${etf.currency}</div>
            <div class="etf-change ${changeClass}">
                ${changeIcon} ${changeSymbol}${etf.change.toFixed(2)}%
            </div>
        </div>

        <!-- Données Brutes API -->
        <h4 class="etf-section-title">Données Brutes API</h4>
        <pre class="api-raw-data">${JSON.stringify(etf.apiResponse, null, 2)}</pre>
    `;

    // Ajouter un event listener pour afficher les données de l'API en console
    card.addEventListener('click', () => {
        console.log('📊 Réponse API Yahoo Finance pour', etf.symbol, ':', etf.apiResponse);
    });

    // Ajouter un style pour indiquer que la carte est cliquable
    card.style.cursor = 'pointer';

    return card;
}

/**
 * Affiche les ETF PEA groupés par catégories
 */
function displayETFs(etfs) {
    const container = document.querySelector('#etfAccordion');
    container.innerHTML = '';

    // Grouper les ETF par catégorie
    const groupedByCategory = {};
    etfs.forEach(etf => {
        if (!groupedByCategory[etf.category]) {
            groupedByCategory[etf.category] = [];
        }
        groupedByCategory[etf.category].push(etf);
    });

    // Définir l'ordre des catégories
    const categoryOrder = [
        'ETF PEA France',
        'ETF PEA Europe',
        'ETF PEA S&P 500',
        'ETF PEA small caps',
        'ETF PEA sur la tech américaine',
        'ETF PEA MSCI World',
        'ETF PEA Emerging Markets',
        'ETF PEA sur l\'Inde',
        'ETF PEA sur l\'eau'
    ];

    // Afficher les catégories dans l'ordre
    categoryOrder.forEach(categoryName => {
        if (!groupedByCategory[categoryName]) return;

        // Créer le header de catégorie (H2)
        const categoryHeader = document.createElement('h2');
        categoryHeader.className = 'etf-category-header';
        categoryHeader.textContent = categoryName;
        container.appendChild(categoryHeader);

        // Créer le container pour les ETF de cette catégorie
        const categoryContainer = document.createElement('div');
        categoryContainer.className = 'etf-category-container';

        // Ajouter chaque ETF de la catégorie
        groupedByCategory[categoryName].forEach(etf => {
            const card = createETFCard(etf);
            categoryContainer.appendChild(card);
        });

        container.appendChild(categoryContainer);
    });
}

/**
 * Charge les données initiales (ETF PEA)
 */
async function loadInitialData() {
    try {
        // Charger les ETF PEA européens
        const etfs = await marketAPI.getETFList();
        displayETFs(etfs);
    } catch (error) {
        console.error('Erreur chargement données initiales:', error);
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
    // Charger les données initiales
    await loadInitialData();
});
