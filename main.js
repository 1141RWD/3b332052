document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 第一部分：使用者系統 (註冊、登入、登出)
    // ==========================================

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const navLoginBtn = document.querySelector('.nav-login-btn'); 

    // 1. 處理註冊 (新增：初始化 progress 為 0)
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('reg-username').value.trim();
            const pass = document.getElementById('reg-password').value.trim();

            if (!user || !pass) { alert('請輸入帳號與密碼！'); return; }

            let users = JSON.parse(localStorage.getItem('lingoFlow_users') || '[]');

            if (users.find(u => u.username === user)) {
                alert('帳號已存在，請換一個名字！');
                return;
            }

            // ★ 修改點：註冊時，同時建立 progress (學習進度)
            users.push({ 
                username: user, 
                password: pass, 
                progress: 0  // 初始單字量為 0
            });
            
            localStorage.setItem('lingoFlow_users', JSON.stringify(users));

            alert('註冊成功！請登入開始累積單字量。');
            window.location.href = 'login.html';
        });
    }

    // 2. 處理登入
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('username').value.trim();
            const pass = document.getElementById('password').value.trim();

            let users = JSON.parse(localStorage.getItem('lingoFlow_users') || '[]');
            const validUser = users.find(u => u.username === user && u.password === pass);

            if (validUser) {
                localStorage.setItem('lingoUser', user);
                alert(`歡迎回來，${user}！讀取您的學習進度中...`);
                window.location.href = 'h.html';
            } else {
                alert('帳號或密碼錯誤。');
            }
        });
    }

    // 3. 檢查登入狀態並更新導覽列
    const currentUser = localStorage.getItem('lingoUser');
    
    if (currentUser && navLoginBtn) {
        const parentLi = navLoginBtn.parentElement;
        parentLi.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <a href="favorites.html" style="text-decoration:none; font-size:0.9rem; color:var(--primary-blue);">我的收藏 ❤️</a>
                <span style="font-weight:bold; color:#2C3E50;">Hi, ${currentUser} 🐙</span>
                <a href="#" id="logout-btn" class="logout-link">登出</a>
            </div>
        `;
    }

    document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'logout-btn') {
            e.preventDefault();
            if (confirm('確定要登出嗎？')) {
                localStorage.removeItem('lingoUser');
                window.location.href = 'h.html';
            }
        }
    });


    // ==========================================
    // 第二部分：遊戲與頁面邏輯
    // ==========================================

    const vocabulary = {
        easy: [
            {id:1, en:'Apple', zh:'蘋果'}, {id:2, en:'Book', zh:'書本'}, {id:3, en:'Cat', zh:'貓'}, {id:4, en:'Dog', zh:'狗'},
            {id:5, en:'Egg', zh:'蛋'}, {id:6, en:'Fish', zh:'魚'}, {id:7, en:'Sun', zh:'太陽'}, {id:8, en:'Tree', zh:'樹木'},
            {id:9, en:'Milk', zh:'牛奶'}, {id:10, en:'Bird', zh:'鳥'}
        ],
        medium: [
            {id:21, en:'Adventure', zh:'冒險'}, {id:22, en:'Believe', zh:'相信'}, {id:23, en:'Comfort', zh:'舒適'}, {id:24, en:'Danger', zh:'危險'},
            {id:27, en:'Ocean', zh:'海洋'}, {id:28, en:'Planet', zh:'行星'}
        ],
        hard: [
            {id:41, en:'Ambiguous', zh:'模稜兩可'}, {id:42, en:'Benevolent', zh:'仁慈的'}, {id:43, en:'Conundrum', zh:'謎題'}, {id:44, en:'Diligence', zh:'勤勉'}
        ]
    };

    const dailyWordPool = [
        {en: 'Fluorescence', ph: '/ˌflɔːˈresns/', zh: 'n. 螢光；發光', ex: '"The jellyfish emitted a soft fluorescence."' },
        {en: 'Resilience', ph: '/rɪˈzɪliəns/', zh: 'n. 韌性；彈力', ex: '"Marine life shows incredible resilience."' },
        {en: 'Tranquility', ph: '/træŋˈkwɪləti/', zh: 'n. 寧靜；平靜', ex: '"The deep ocean is a place of absolute tranquility."' },
        {en: 'Luminous', ph: '/ˈluːmɪnəs/', zh: 'adj. 發光的；夜光的', ex: '"Luminous organisms light up the midnight zone."' }
    ];

    // --- 氛圍功能 ---
    function createBubbles() {
        const ocean = document.getElementById('ambient-ocean');
        if (!ocean) return;
        for (let i = 0; i < 30; i++) {
            const bubble = document.createElement('div');
            bubble.className = 'bubble';
            const size = Math.random() * 35 + 10 + 'px';
            bubble.style.width = size;
            bubble.style.height = size;
            bubble.style.left = Math.random() * 100 + 'vw';
            bubble.style.animationDuration = Math.random() * 8 + 7 + 's'; 
            bubble.style.animationDelay = Math.random() * 10 + 's';
            ocean.appendChild(bubble);
        }
    }

    // --- 首頁進度與單字 (★ 修改點：讀取特定使用者的進度) ---
    function initHome() {
        const wordTitle = document.getElementById('dw-en');
        if (wordTitle) {
            const word = dailyWordPool[Math.floor(Math.random() * dailyWordPool.length)];
            document.getElementById('dw-en').innerText = word.en;
            document.getElementById('dw-phonetic').innerText = word.ph;
            document.getElementById('dw-zh').innerText = word.zh;
            document.getElementById('dw-example').innerText = word.ex;
        }

        // 1. 取得目前登入者
        const currentUser = localStorage.getItem('lingoUser');
        let count = 0;

        // 2. 如果有登入，從 users 陣列中找出該人的 progress
        if (currentUser) {
            let users = JSON.parse(localStorage.getItem('lingoFlow_users') || '[]');
            let userData = users.find(u => u.username === currentUser);
            if (userData && userData.progress) {
                count = userData.progress;
            }
        }

        // 3. 顯示數據
        const rankDisplay = document.getElementById('rank-display');
        const progressEl = document.getElementById('words-learned');
        
        if (progressEl) progressEl.innerText = count;
        if (rankDisplay) {
            let rank = "浮游生物 👾";
            if (count > 60) rank = "深海霸主 🐳";
            else if (count > 30) rank = "聰明章魚 🐙";
            else if (count > 10) rank = "迷路小魚 🐟";
            
            // 如果沒登入，提示要登入
            if (!currentUser) {
                rankDisplay.innerHTML = `🌊 訪客模式：<strong>${rank}</strong> (請登入以儲存進度)`;
            } else {
                rankDisplay.innerHTML = `🌊 ${currentUser} 的等級：<strong>${rank}</strong> (已探索 ${count} 個單字)`;
            }
        }
    }

    // --- 遊戲核心邏輯 ---
    let gameState = { level: null, mode: null };
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const arena = document.getElementById('game-arena');

    if (step1) {
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.onclick = () => {
                gameState.level = btn.dataset.level;
                step1.classList.add('hidden');
                step2.classList.remove('hidden');
            };
        });

        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.onclick = () => {
                gameState.mode = btn.dataset.mode;
                step2.classList.add('hidden');
                arena.classList.remove('hidden');
                document.getElementById('current-info').innerText = `深度：${gameState.level} | 模式：${gameState.mode}`;
                startEngine();
            };
        });
    }

    function startEngine() {
        const content = document.getElementById('game-content');
        content.innerHTML = '';
        const words = [...vocabulary[gameState.level]].sort(() => Math.random() - 0.5).slice(0, 4);

        if (gameState.mode === 'match') initMatch(words);
        else if (gameState.mode === 'flashcard') initFlashcard(words);
        else if (gameState.mode === 'quiz') initQuiz(words);
    }

    // --- 模式：配對 ---
    function initMatch(words) {
        const board = document.createElement('div');
        board.className = 'match-grid';
        let cards = [];
        words.forEach(w => {
            cards.push({ id: w.id, text: w.en }, { id: w.id, text: w.zh });
        });
        cards.sort(() => Math.random() - 0.5);

        let selected = [];
        let matchedCount = 0;

        cards.forEach(c => {
            const div = document.createElement('div');
            div.className = 'match-card';
            div.innerText = c.text;
            div.onclick = () => {
                if (div.classList.contains('matched') || selected.includes(div)) return;
                div.classList.add('selected');
                selected.push(div);
                if (selected.length === 2) {
                    const t1 = selected[0].innerText;
                    const t2 = selected[1].innerText;
                    const isMatch = words.some(w => (w.en === t1 && w.zh === t2) || (w.zh === t1 && w.en === t2));
                    if (isMatch) {
                        selected.forEach(s => s.classList.add('matched'));
                        matchedCount++;
                        selected = [];
                        if (matchedCount === words.length) setTimeout(showWin, 500);
                    } else {
                        setTimeout(() => {
                            selected.forEach(s => s.classList.remove('selected'));
                            selected = [];
                        }, 500);
                    }
                }
            };
            board.appendChild(div);
        });
        document.getElementById('game-content').appendChild(board);
    }

    // --- 模式：閃卡 ---
    function initFlashcard(words) {
        let index = 0;
        const render = () => {
            document.getElementById('game-content').innerHTML = `
                <div class="flashcard-container">
                    <div class="flashcard" id="card-obj">
                        <div class="card-front">${words[index].en}</div>
                        <div class="card-back">${words[index].zh}</div>
                    </div>
                    <button id="next-card" class="btn-select" style="margin-top:20px">下一個 (${index+1}/${words.length})</button>
                </div>`;
            const card = document.getElementById('card-obj');
            card.onclick = () => card.classList.toggle('flipped');
            document.getElementById('next-card').onclick = () => {
                if (index < words.length - 1) { index++; render(); }
                else showWin();
            };
        };
        render();
    }

    // --- 模式：測驗 ---
    function initQuiz(words) {
        let index = 0;
        const render = () => {
            const current = words[index];
            const others = vocabulary[gameState.level].filter(v => v.id !== current.id);
            const choices = [current.zh, ...others.sort(() => Math.random() - 0.5).slice(0, 3).map(o => o.zh)].sort(() => Math.random() - 0.5);
            document.getElementById('game-content').innerHTML = `
                <div class="quiz-box">
                    <h1 class="quiz-word">${current.en}</h1>
                    <div class="quiz-options">${choices.map(c => `<button class="quiz-opt">${c}</button>`).join('')}</div>
                </div>`;
            document.querySelectorAll('.quiz-opt').forEach(btn => {
                btn.onclick = () => {
                    if (btn.innerText === current.zh) {
                        btn.style.background = '#8FB3B0';
                        setTimeout(() => {
                            if (index < words.length - 1) { index++; render(); }
                            else showWin();
                        }, 300);
                    } else { btn.style.background = '#ffcccb'; }
                };
            });
        };
        render();
    }

    // --- 勝利結算 (★ 修改點：更新特定使用者的進度) ---
    function showWin() {
        // 1. 取得目前使用者
        const currentUser = localStorage.getItem('lingoUser');

        if (currentUser) {
            // 2. 取出所有使用者資料
            let users = JSON.parse(localStorage.getItem('lingoFlow_users') || '[]');
            
            // 3. 找到該使用者並增加分數
            let userObj = users.find(u => u.username === currentUser);
            if (userObj) {
                userObj.progress = (userObj.progress || 0) + 4;
                // 4. 存回資料庫
                localStorage.setItem('lingoFlow_users', JSON.stringify(users));
            }
            
            // 顯示勝利畫面
            document.getElementById('game-content').innerHTML = `
                <div class="win-announcement">
                    <h2>🌊 挑戰完成！</h2>
                    <p>${currentUser} 的知識量 +4！(目前: ${userObj.progress})</p><br>
                    <button onclick="location.reload()" class="btn-select active">返回海面</button>
                </div>`;
        } else {
            // 沒登入的情況 (訪客)
            document.getElementById('game-content').innerHTML = `
                <div class="win-announcement">
                    <h2>🌊 挑戰完成！</h2>
                    <p>您目前是訪客模式，成績不會儲存喔！</p><br>
                    <button onclick="location.href='login.html'" class="btn-select">去登入</button>
                    <button onclick="location.reload()" class="btn-select active">返回海面</button>
                </div>`;
        }
    }

    // --- 啟動 ---
    createBubbles();
    initHome();
    // ==========================================
    // 第三部分：影片過濾功能
    // ==========================================
    const tabBtns = document.querySelectorAll('.tab-btn');
    const videoCards = document.querySelectorAll('.video-card');

    if (tabBtns.length > 0) {
        tabBtns.forEach(btn => {
            btn.onclick = () => {
                // 1. 切換按鈕的 active 樣式
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // 2. 取得目前點擊的類別名稱
                const selectedCategory = btn.innerText.trim();

                // 3. 執行過濾邏輯
                videoCards.forEach(card => {
                    const cardCategory = card.dataset.category;

                    if (selectedCategory === "全部影片") {
                        // 如果點選全部影片，全部顯示
                        card.style.display = 'block';
                        card.style.animation = 'fadeIn 0.5s ease';
                    } else if (cardCategory === selectedCategory) {
                        // 如果類別符合，顯示
                        card.style.display = 'block';
                        card.style.animation = 'fadeIn 0.5s ease';
                    } else {
                        // 否則隱藏
                        card.style.display = 'none';
                    }
                });
            };
        });
    }
    // ==========================================
    // 第四部分：個人收藏系統
    // ==========================================
    
function initFavorites() {
    const favBtns = document.querySelectorAll('.favorite-btn');
    const currentUser = localStorage.getItem('lingoUser');
    
    // 每次呼叫時重新取得最新的 users 列表
    let users = JSON.parse(localStorage.getItem('lingoFlow_users') || '[]');
    let userIndex = users.findIndex(u => u.username === currentUser);
    let userData = users[userIndex];

    favBtns.forEach(btn => {
        const card = btn.closest('.video-card');
        const cardId = card.dataset.id;

        // 1. 初始化頁面：檢查是否已在收藏清單中
        if (userData && userData.favorites && userData.favorites.includes(cardId)) {
            btn.classList.add('active');
        }

        // 2. 點擊邏輯
        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (!currentUser || userIndex === -1) {
                alert('請先登入！');
                window.location.href = 'login.html';
                return;
            }

            // 確保收藏陣列存在
            if (!userData.favorites) userData.favorites = [];
            
            const favIndex = userData.favorites.indexOf(cardId);

            if (favIndex > -1) {
                // --- 取消收藏 ---
                userData.favorites.splice(favIndex, 1);
                btn.classList.remove('active');

                // 如果在「我的收藏」頁面，讓卡片消失
                if (window.location.pathname.includes('favorites.html')) {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.9)';
                    card.style.transition = '0.3s';
                    setTimeout(() => {
                        card.remove();
                        // 檢查是否全空，若空了顯示提示
                        const grid = document.getElementById('favorites-grid');
                        if (grid && grid.querySelectorAll('.video-card').length === 0) {
                            const msg = document.getElementById('empty-message');
                            if (msg) msg.style.display = 'block';
                        }
                    }, 300);
                }
            } else {
                // --- 加入收藏 ---
                userData.favorites.push(cardId);
                btn.classList.add('active');
            }

            // 3. 關鍵：將修改後的物件更新回陣列，並存入 localStorage
            users[userIndex] = userData;
            localStorage.setItem('lingoFlow_users', JSON.stringify(users));
        };
    });
}

    // 在 DOMContentLoaded 最後呼叫
    initFavorites();
});


// --- 高級感水痕尾巴效果 ---
window.addEventListener('mousemove', function(e) {
    const trail = document.createElement('div');
    trail.className = 'mouse-trail';
    
    // 設定生成位置
    trail.style.left = e.pageX + 'px';
    trail.style.top = e.pageY + 'px';
    
    document.body.appendChild(trail);
    
    // 隨機微調大小，讓效果更自然
    const size = Math.random() * 12 + 4; // 4px ~ 16px
    trail.style.width = size + 'px';
    trail.style.height = size + 'px';

    // 動畫結束後自動移除，避免網頁變卡
    setTimeout(() => {
        trail.remove();
    }, 800); 
});
// --- 液態微光質感尾巴 ---
const points = [];
const SEGMENTS = 20; // 尾巴的節點數量

window.addEventListener('mousemove', function(e) {
    // 記錄目前的座標
    points.push({ x: e.pageX, y: e.pageY });
    
    // 產生尾巴元素
    const trail = document.createElement('div');
    trail.className = 'liquid-trail';
    document.body.appendChild(trail);
    
    const size = 20; 
    trail.style.left = e.pageX + 'px';
    trail.style.top = e.pageY + 'px';

    // 隨著時間消失
    setTimeout(() => {
        trail.style.opacity = '0';
        trail.style.transform = 'translate(-50%, -50%) scale(0.5)';
        setTimeout(() => trail.remove(), 500);
    }, 50);
});