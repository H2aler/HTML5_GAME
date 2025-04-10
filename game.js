// 게임 상태
let capital = 10000000; // 초기 자본 1000만원
let portfolio = {}; // 보유 주식 {name: {count: 수량, avgPrice: 평단가, shortCount: 공매도 수량, shortAvgPrice: 공매도 평단가}}
let stocks = {}; // 주식 정보
let selectedStock = null; // 선택된 주식
let stockCharts = {}; // 주식별 차트 데이터
let orderBooks = {}; // 주식별 호가창 데이터
let currentChart = null; // 현재 표시된 차트
let savedGames = []; // 저장된 게임 목록

// 주식 데이터 초기화
function initializeStocks() {
    stocks = {
        '삼성전자': { price: 70000, volatility: 0.02 },
        'SK하이닉스': { price: 120000, volatility: 0.03 },
        'LG전자': { price: 85000, volatility: 0.025 },
        '현대차': { price: 180000, volatility: 0.015 },
        '카카오': { price: 45000, volatility: 0.04 },
        '네이버': { price: 350000, volatility: 0.02 },
        '셀트리온': { price: 150000, volatility: 0.035 },
        'LG화학': { price: 450000, volatility: 0.025 }
    };

    // 각 주식별 차트 데이터 초기화
    for (const name of Object.keys(stocks)) {
        stockCharts[name] = {
            day: generateChartData(30, stocks[name].price),
            week: generateChartData(12, stocks[name].price),
            month: generateChartData(6, stocks[name].price)
        };
        orderBooks[name] = generateOrderBook(stocks[name].price);
    }
}

// 차트 데이터 생성
function generateChartData(count, basePrice) {
    const data = [];
    let currentPrice = basePrice;
    
    for (let i = 0; i < count; i++) {
        const change = (Math.random() * 2 - 1) * 0.02;
        currentPrice = Math.max(1000, Math.floor(currentPrice * (1 + change)));
        const open = currentPrice * (1 + (Math.random() * 0.01 - 0.005));
        const high = Math.max(open, currentPrice) * (1 + Math.random() * 0.01);
        const low = Math.min(open, currentPrice) * (1 - Math.random() * 0.01);
        const close = currentPrice;
        
        data.push({
            t: new Date(Date.now() - (count - i) * 24 * 60 * 60 * 1000),
            o: open,
            h: high,
            l: low,
            c: close
        });
    }
    
    return data;
}

// 호가창 데이터 생성
function generateOrderBook(price) {
    const orderBook = {
        asks: [],
        bids: []
    };
    
    for (let i = 0; i < 5; i++) {
        orderBook.asks.push({
            price: Math.floor(price * (1 + (i + 1) * 0.01)),
            quantity: Math.floor(Math.random() * 100) + 1
        });
        orderBook.bids.push({
            price: Math.floor(price * (1 - (i + 1) * 0.01)),
            quantity: Math.floor(Math.random() * 100) + 1
        });
    }
    
    return orderBook;
}

// 차트 업데이트
function updateChart() {
    if (!selectedStock) return;
    
    const ctx = document.getElementById('stockChart').getContext('2d');
    const activeTab = document.querySelector('.tab.active');
    const period = activeTab.dataset.tab;
    const data = stockCharts[selectedStock][period];
    
    // 기존 차트 제거
    if (currentChart) {
        currentChart.destroy();
    }
    
    // 새로운 차트 생성
    currentChart = new Chart(ctx, {
        type: 'candlestick',
        data: {
            datasets: [{
                label: selectedStock,
                data: data,
                color: {
                    up: '#ff0000',
                    down: '#0000ff',
                    unchanged: '#000000'
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                zoom: {
                    zoom: {
                        wheel: {
                            enabled: true,
                            speed: 0.1
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'x',
                    },
                    pan: {
                        enabled: true,
                        mode: 'x'
                    }
                },
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const data = context.raw;
                            return [
                                `시가: ${data.o.toLocaleString()}원`,
                                `고가: ${data.h.toLocaleString()}원`,
                                `저가: ${data.l.toLocaleString()}원`,
                                `종가: ${data.c.toLocaleString()}원`,
                                `등락률: ${((data.c - data.o) / data.o * 100).toFixed(2)}%`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: period === 'day' ? 'day' : period === 'week' ? 'week' : 'month',
                        displayFormats: {
                            day: 'MM/dd',
                            week: 'MM/dd',
                            month: 'yyyy/MM'
                        }
                    },
                    title: {
                        display: true,
                        text: '날짜'
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: '가격 (원)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString() + '원';
                        }
                    },
                    grid: {
                        color: '#f0f0f0'
                    }
                }
            }
        }
    });
}

// 호가창 업데이트
function updateOrderBook() {
    if (!selectedStock) return;
    
    const orderBook = orderBooks[selectedStock];
    const tbody = document.getElementById('orderBookBody');
    tbody.innerHTML = '';
    
    // 매도 호가 (내림차순)
    for (let i = 4; i >= 0; i--) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${orderBook.asks[i].quantity}</td>
            <td class="ask">${orderBook.asks[i].price.toLocaleString()}</td>
            <td class="bid">${orderBook.bids[i].price.toLocaleString()}</td>
            <td>${orderBook.bids[i].quantity}</td>
            <td class="order-actions">
                <button class="buy-btn" onclick="buyAtPrice('${selectedStock}', ${orderBook.asks[i].price})">매수</button>
                <button class="sell-btn" onclick="sellAtPrice('${selectedStock}', ${orderBook.bids[i].price})">매도</button>
            </td>
        `;
        tbody.appendChild(row);
    }
}

// 주식 카드 생성
function createStockCard(name, data) {
    const card = document.createElement('div');
    card.className = 'stock-card';
    
    const owned = portfolio[name] ? portfolio[name].count : 0;
    const shorted = portfolio[name] ? portfolio[name].shortCount : 0;
    const value = owned * data.price;
    const shortValue = shorted * data.price;
    const profit = owned > 0 ? (data.price - portfolio[name].avgPrice) * owned : 0;
    const shortProfit = shorted > 0 ? (portfolio[name].shortAvgPrice - data.price) * shorted : 0;
    const profitRate = owned > 0 ? ((data.price - portfolio[name].avgPrice) / portfolio[name].avgPrice * 100).toFixed(2) : 0;
    const shortProfitRate = shorted > 0 ? ((portfolio[name].shortAvgPrice - data.price) / portfolio[name].shortAvgPrice * 100).toFixed(2) : 0;
    
    card.innerHTML = `
        <div class="stock-name">${name}</div>
        <div class="stock-price">${data.price.toLocaleString()}원</div>
        <div class="stock-actions">
            <div class="quantity-input">
                <input type="number" id="quantity-${name}" min="1" value="1" class="quantity-input-field">
                <button class="buy-btn" onclick="buyStockWithQuantity('${name}')">매수</button>
                <button class="sell-btn" onclick="sellStockWithQuantity('${name}')">매도</button>
            </div>
            <div class="quick-actions">
                <button class="buy-btn" onclick="buyStock('${name}')">1주 매수</button>
                <button class="sell-btn" onclick="sellStock('${name}')">1주 매도</button>
            </div>
            <div class="short-actions">
                <button class="short-btn" onclick="shortStock('${name}')">공매도</button>
                <button class="cover-btn" onclick="coverStock('${name}')">공매도청산</button>
            </div>
        </div>
        ${owned > 0 ? `
            <div>보유: ${owned}주</div>
            <div>평단가: ${portfolio[name].avgPrice.toLocaleString()}원</div>
            <div>평가금액: ${value.toLocaleString()}원</div>
            <div class="${profit >= 0 ? 'profit' : 'loss'}">
                ${profit >= 0 ? '수익' : '손실'}: ${Math.abs(profit).toLocaleString()}원 (${profitRate}%)
            </div>
        ` : ''}
        ${shorted > 0 ? `
            <div>공매도: ${shorted}주</div>
            <div>공매도평단가: ${portfolio[name].shortAvgPrice.toLocaleString()}원</div>
            <div>평가금액: ${shortValue.toLocaleString()}원</div>
            <div class="${shortProfit >= 0 ? 'profit' : 'loss'}">
                ${shortProfit >= 0 ? '수익' : '손실'}: ${Math.abs(shortProfit).toLocaleString()}원 (${shortProfitRate}%)
            </div>
        ` : ''}
    `;
    
    card.addEventListener('click', () => {
        selectedStock = name;
        updateChart();
        updateOrderBook();
    });
    
    return card;
}

// 포트폴리오 카드 생성
function createPortfolioCard(name, data) {
    const owned = portfolio[name] ? portfolio[name].count : 0;
    if (owned === 0) return null;
    
    const value = owned * data.price;
    const profit = (data.price - portfolio[name].avgPrice) * owned;
    const profitRate = ((data.price - portfolio[name].avgPrice) / portfolio[name].avgPrice * 100).toFixed(2);
    
    const card = document.createElement('div');
    card.className = 'stock-card';
    card.innerHTML = `
        <div class="stock-name">${name}</div>
        <div class="stock-price">${data.price.toLocaleString()}원</div>
        <div>보유: ${owned}주</div>
        <div>평단가: ${portfolio[name].avgPrice.toLocaleString()}원</div>
        <div>평가금액: ${value.toLocaleString()}원</div>
        <div class="${profit >= 0 ? 'profit' : 'loss'}">
            ${profit >= 0 ? '수익' : '손실'}: ${Math.abs(profit).toLocaleString()}원 (${profitRate}%)
        </div>
        <div class="stock-actions">
            <button class="buy-btn" onclick="buyStock('${name}')">매수</button>
            <button class="sell-btn" onclick="sellStock('${name}')">매도</button>
        </div>
    `;
    
    card.addEventListener('click', () => {
        selectedStock = name;
        updateChart();
        updateOrderBook();
    });
    
    return card;
}

// UI 업데이트
function updateUI() {
    // 자본 업데이트
    document.getElementById('capital').textContent = `${capital.toLocaleString()}원`;
    
    // 총 자산 계산
    let totalAssets = capital;
    for (const [name, data] of Object.entries(portfolio)) {
        if (data.count > 0) {
            totalAssets += data.count * stocks[name].price;
        }
        if (data.shortCount > 0) {
            totalAssets += data.shortCount * stocks[name].price;
        }
    }
    document.getElementById('totalAssets').textContent = `${totalAssets.toLocaleString()}원`;
    
    // 주식 목록 업데이트
    const stockList = document.getElementById('stockList');
    stockList.innerHTML = '';
    for (const [name, data] of Object.entries(stocks)) {
        stockList.appendChild(createStockCard(name, data));
    }
    
    // 포트폴리오 업데이트
    const portfolioList = document.getElementById('portfolioList');
    portfolioList.innerHTML = '';
    for (const [name, data] of Object.entries(stocks)) {
        const card = createPortfolioCard(name, data);
        if (card) portfolioList.appendChild(card);
    }
    
    // 선택된 주식이 있다면 차트와 호가창 업데이트
    if (selectedStock) {
        updateChart();
        updateOrderBook();
    }
    
    // 저장된 게임 목록 업데이트
    updateSavedGamesList();
}

// 수량 입력으로 매수
function buyStockWithQuantity(name) {
    const stock = stocks[name];
    const quantityInput = document.getElementById(`quantity-${name}`);
    const quantity = parseInt(quantityInput.value);
    
    if (isNaN(quantity) || quantity <= 0) {
        alert('올바른 수량을 입력하세요!');
        return;
    }
    
    const totalPrice = stock.price * quantity;
    if (capital >= totalPrice) {
        capital -= totalPrice;
        
        // 포트폴리오 업데이트
        if (!portfolio[name]) {
            portfolio[name] = {
                count: 0,
                avgPrice: 0,
                shortCount: 0,
                shortAvgPrice: 0
            };
        }
        
        const currentCount = portfolio[name].count;
        const currentAvgPrice = portfolio[name].avgPrice;
        
        // 평단가 계산
        portfolio[name].avgPrice = Math.floor(
            ((currentCount * currentAvgPrice) + totalPrice) / (currentCount + quantity)
        );
        portfolio[name].count += quantity;
        
        updateUI();
    } else {
        alert('자본이 부족합니다!');
    }
}

// 수량 입력으로 매도
function sellStockWithQuantity(name) {
    if (portfolio[name] && portfolio[name].count > 0) {
        const stock = stocks[name];
        const quantityInput = document.getElementById(`quantity-${name}`);
        const quantity = parseInt(quantityInput.value);
        const maxQuantity = portfolio[name].count;
        
        if (isNaN(quantity) || quantity <= 0 || quantity > maxQuantity) {
            alert('올바른 수량을 입력하세요!');
            return;
        }
        
        capital += stock.price * quantity;
        portfolio[name].count -= quantity;
        
        if (portfolio[name].count === 0) {
            delete portfolio[name];
        }
        
        updateUI();
    } else {
        alert('보유한 주식이 없습니다!');
    }
}

// 1주 매수
function buyStock(name) {
    const stock = stocks[name];
    if (capital >= stock.price) {
        capital -= stock.price;
        
        // 포트폴리오 업데이트
        if (!portfolio[name]) {
            portfolio[name] = {
                count: 0,
                avgPrice: 0,
                shortCount: 0,
                shortAvgPrice: 0
            };
        }
        
        const currentCount = portfolio[name].count;
        const currentAvgPrice = portfolio[name].avgPrice;
        
        // 평단가 계산
        portfolio[name].avgPrice = Math.floor(
            ((currentCount * currentAvgPrice) + stock.price) / (currentCount + 1)
        );
        portfolio[name].count++;
        
        updateUI();
    } else {
        alert('자본이 부족합니다!');
    }
}

// 1주 매도
function sellStock(name) {
    if (portfolio[name] && portfolio[name].count > 0) {
        const stock = stocks[name];
        capital += stock.price;
        portfolio[name].count--;
        
        if (portfolio[name].count === 0) {
            delete portfolio[name];
        }
        
        updateUI();
    } else {
        alert('보유한 주식이 없습니다!');
    }
}

// 공매도
function shortStock(name) {
    const stock = stocks[name];
    const quantity = parseInt(prompt('공매도할 수량을 입력하세요:', '1'));
    
    if (isNaN(quantity) || quantity <= 0) {
        alert('올바른 수량을 입력하세요!');
        return;
    }
    
    const totalPrice = stock.price * quantity;
    if (capital >= totalPrice) {
        capital -= totalPrice;
        
        // 포트폴리오 업데이트
        if (!portfolio[name]) {
            portfolio[name] = {
                count: 0,
                avgPrice: 0,
                shortCount: 0,
                shortAvgPrice: 0
            };
        }
        
        const currentShortCount = portfolio[name].shortCount;
        const currentShortAvgPrice = portfolio[name].shortAvgPrice;
        
        // 공매도 평단가 계산
        portfolio[name].shortAvgPrice = Math.floor(
            ((currentShortCount * currentShortAvgPrice) + totalPrice) / (currentShortCount + quantity)
        );
        portfolio[name].shortCount += quantity;
        
        updateUI();
    } else {
        alert('자본이 부족합니다!');
    }
}

// 공매도 청산
function coverStock(name) {
    if (portfolio[name] && portfolio[name].shortCount > 0) {
        const stock = stocks[name];
        const maxQuantity = portfolio[name].shortCount;
        const quantity = parseInt(prompt(`청산할 수량을 입력하세요 (최대 ${maxQuantity}주):`, '1'));
        
        if (isNaN(quantity) || quantity <= 0 || quantity > maxQuantity) {
            alert('올바른 수량을 입력하세요!');
            return;
        }
        
        const profit = (portfolio[name].shortAvgPrice - stock.price) * quantity;
        capital += stock.price * quantity + profit;
        portfolio[name].shortCount -= quantity;
        
        if (portfolio[name].shortCount === 0) {
            portfolio[name].shortAvgPrice = 0;
        }
        
        updateUI();
    } else {
        alert('공매도한 주식이 없습니다!');
    }
}

// 지정가 매수
function buyAtPrice(name, price) {
    const stock = stocks[name];
    const quantity = parseInt(prompt(`매수할 수량을 입력하세요 (가격: ${price.toLocaleString()}원):`, '1'));
    
    if (isNaN(quantity) || quantity <= 0) {
        alert('올바른 수량을 입력하세요!');
        return;
    }
    
    const totalPrice = price * quantity;
    if (capital >= totalPrice) {
        capital -= totalPrice;
        
        // 포트폴리오 업데이트
        if (!portfolio[name]) {
            portfolio[name] = {
                count: 0,
                avgPrice: 0,
                shortCount: 0,
                shortAvgPrice: 0
            };
        }
        
        const currentCount = portfolio[name].count;
        const currentAvgPrice = portfolio[name].avgPrice;
        
        // 평단가 계산
        portfolio[name].avgPrice = Math.floor(
            ((currentCount * currentAvgPrice) + totalPrice) / (currentCount + quantity)
        );
        portfolio[name].count += quantity;
        
        updateUI();
    } else {
        alert('자본이 부족합니다!');
    }
}

// 지정가 매도
function sellAtPrice(name, price) {
    if (portfolio[name] && portfolio[name].count > 0) {
        const maxQuantity = portfolio[name].count;
        const quantity = parseInt(prompt(`매도할 수량을 입력하세요 (가격: ${price.toLocaleString()}원, 최대 ${maxQuantity}주):`, '1'));
        
        if (isNaN(quantity) || quantity <= 0 || quantity > maxQuantity) {
            alert('올바른 수량을 입력하세요!');
            return;
        }
        
        capital += price * quantity;
        portfolio[name].count -= quantity;
        
        if (portfolio[name].count === 0) {
            delete portfolio[name];
        }
        
        updateUI();
    } else {
        alert('보유한 주식이 없습니다!');
    }
}

// 게임 루프
function gameLoop() {
    updateStockPrices();
    updateUI();
}

// 주식 가격 업데이트
function updateStockPrices() {
    for (const [name, data] of Object.entries(stocks)) {
        const change = (Math.random() * 2 - 1) * data.volatility;
        data.price = Math.max(1000, Math.floor(data.price * (1 + change)));
        
        // 차트 데이터 업데이트
        const open = data.price * (1 + (Math.random() * 0.01 - 0.005));
        const high = Math.max(open, data.price) * (1 + Math.random() * 0.01);
        const low = Math.min(open, data.price) * (1 - Math.random() * 0.01);
        const close = data.price;
        
        // 일봉 데이터 업데이트
        stockCharts[name].day.push({
            t: new Date(),
            o: open,
            h: high,
            l: low,
            c: close
        });
        stockCharts[name].day.shift();
        
        // 주봉 데이터 업데이트 (매주 마지막 거래일)
        if (new Date().getDay() === 5) { // 금요일
            stockCharts[name].week.push({
                t: new Date(),
                o: open,
                h: high,
                l: low,
                c: close
            });
            stockCharts[name].week.shift();
        }
        
        // 월봉 데이터 업데이트 (매월 마지막 거래일)
        const today = new Date();
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        if (today.getDate() === lastDay.getDate()) {
            stockCharts[name].month.push({
                t: new Date(),
                o: open,
                h: high,
                l: low,
                c: close
            });
            stockCharts[name].month.shift();
        }
        
        // 호가창 데이터 업데이트
        orderBooks[name] = generateOrderBook(data.price);
    }
}

// 탭 이벤트 처리
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        updateChart();
    });
});

// 게임 저장
function saveGame() {
    const gameName = prompt('저장할 게임의 이름을 입력하세요:');
    if (!gameName) return;
    
    const gameData = {
        name: gameName,
        date: new Date().toLocaleString(),
        capital: capital,
        portfolio: portfolio,
        stocks: stocks
    };
    
    // 로컬 스토리지에서 기존 저장 목록 가져오기
    const existingGames = JSON.parse(localStorage.getItem('savedGames') || '[]');
    
    // 같은 이름의 게임이 있으면 덮어쓰기
    const existingIndex = existingGames.findIndex(game => game.name === gameName);
    if (existingIndex !== -1) {
        existingGames[existingIndex] = gameData;
    } else {
        existingGames.push(gameData);
    }
    
    // 로컬 스토리지에 저장
    localStorage.setItem('savedGames', JSON.stringify(existingGames));
    updateSavedGamesList();
    alert('게임이 저장되었습니다!');
}

// 게임 불러오기
function loadGame(gameName) {
    const savedGames = JSON.parse(localStorage.getItem('savedGames') || '[]');
    const gameData = savedGames.find(game => game.name === gameName);
    
    if (gameData) {
        capital = gameData.capital;
        portfolio = gameData.portfolio;
        stocks = gameData.stocks;
        
        // 차트 데이터 재생성
        for (const name of Object.keys(stocks)) {
            stockCharts[name] = {
                day: generateChartData(30, stocks[name].price),
                week: generateChartData(12, stocks[name].price),
                month: generateChartData(6, stocks[name].price)
            };
            orderBooks[name] = generateOrderBook(stocks[name].price);
        }
        
        // 총 자산 계산
        let totalAssets = capital;
        for (const [name, data] of Object.entries(portfolio)) {
            if (data.count > 0) {
                totalAssets += data.count * stocks[name].price;
            }
            if (data.shortCount > 0) {
                totalAssets += data.shortCount * stocks[name].price;
            }
        }
        
        updateUI();
        alert('게임을 불러왔습니다!');
    }
}

// 저장된 게임 삭제
function deleteGame(gameName) {
    if (confirm(`${gameName} 게임을 삭제하시겠습니까?`)) {
        const savedGames = JSON.parse(localStorage.getItem('savedGames') || '[]');
        const filteredGames = savedGames.filter(game => game.name !== gameName);
        localStorage.setItem('savedGames', JSON.stringify(filteredGames));
        updateSavedGamesList();
    }
}

// 저장된 게임 목록 업데이트
function updateSavedGamesList() {
    const savedGamesList = document.getElementById('savedGamesList');
    savedGamesList.innerHTML = '';
    
    const savedGames = JSON.parse(localStorage.getItem('savedGames') || '[]');
    
    savedGames.forEach(game => {
        const gameItem = document.createElement('div');
        gameItem.className = 'saved-game-item';
        gameItem.innerHTML = `
            <div class="game-info">
                <div class="game-name">${game.name}</div>
                <div class="game-date">${game.date}</div>
                <div class="game-capital">자본: ${game.capital.toLocaleString()}원</div>
            </div>
            <div class="game-actions">
                <button class="load-btn" onclick="loadGame('${game.name}')">불러오기</button>
                <button class="delete-btn" onclick="deleteGame('${game.name}')">삭제</button>
            </div>
        `;
        savedGamesList.appendChild(gameItem);
    });
}

// 게임 초기화
function initializeGame() {
    initializeStocks();
    updateUI();
    setInterval(gameLoop, 3000); // 3초마다 주식 가격 업데이트
}

// 게임 시작
initializeGame();

// 줌 컨트롤 버튼 추가
function addZoomControls() {
    const chartContainer = document.querySelector('.chart-container');
    const zoomControls = document.createElement('div');
    zoomControls.className = 'zoom-controls';
    zoomControls.style.position = 'absolute';
    zoomControls.style.top = '10px';
    zoomControls.style.right = '10px';
    zoomControls.style.zIndex = '1000';
    zoomControls.style.display = 'flex';
    zoomControls.style.gap = '5px';
    
    zoomControls.innerHTML = `
        <button class="zoom-btn" onclick="zoomChart(1.2)">+</button>
        <button class="zoom-btn" onclick="zoomChart(0.8)">-</button>
        <button class="reset-btn" onclick="resetZoom()">초기화</button>
    `;
    
    chartContainer.appendChild(zoomControls);
}

// 줌 기능 구현
function zoomChart(factor) {
    if (currentChart) {
        const { min, max } = currentChart.scales.x;
        const range = max - min;
        const center = (min + max) / 2;
        const newRange = range * factor;
        
        currentChart.scales.x.min = center - newRange / 2;
        currentChart.scales.x.max = center + newRange / 2;
        currentChart.update();
    }
}

// 줌 초기화
function resetZoom() {
    if (currentChart) {
        currentChart.resetZoom();
    }
}

// 초기화 시 줌 컨트롤 추가
document.addEventListener('DOMContentLoaded', () => {
    addZoomControls();
}); 