tailwind.config = {
    theme: {
        extend: {
            fontFamily: {
                sans: ['Outfit', 'Noto Sans TC', 'sans-serif'],
            },
            colors: {
                space: {
                    950: '#030712',
                }
            }
        }
    }
};

// ==========================================
// 1. API_URL 變數設定
// 請在此處填入您的 Google Apps Script Web App 網址。
// 如果保持為空，系統將會自動啟動「本機 Mock 模擬模式」，依然可流暢進行所有功能！
// ==========================================
const API_URL = "https://script.google.com/macros/s/AKfycbyIIgbnJ4UWQ76FJbxGodXCFR39pozNRj9BqjWfdSDMxk_rdjD3LvI42u3u6WqhsGn5/exec";

// 管理員憑證設定
const ADMIN_USER = "admin";
const ADMIN_PASS = "admin123";

// 預設太空餐點資料（若本機 LocalStorage 無資料，將以此初始化）
const INITIAL_DISHES = [
    {
        id: "101",
        name: "星雲極光燉飯",
        category: "main",
        price: 380,
        description: "以藍蝶花汁液調和星塵松露，在零重力下燉煮，呈現極光般變幻色彩，香氣芬芳。",
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
    },
    {
        id: "102",
        name: "隕石熔岩黑漢堡",
        category: "main",
        price: 350,
        description: "竹炭高纖麵包搭配手打太空和牛，咬下瞬間溢出濃郁起司熔岩，極致衝擊您的味蕾。",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
    },
    {
        id: "103",
        name: "零重力懸浮馬鈴薯泥",
        category: "side",
        price: 180,
        description: "輕盈如太空中漂浮的白色雲朵，搭配特製微重力迷迭香草醬，口感綿密絲滑。",
        image: "https://images.unsplash.com/photo-1518047601542-79f18c655718?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
    },
    {
        id: "104",
        name: "銀河系超新星炸雞",
        category: "side",
        price: 220,
        description: "裹上帶有極星香辛料的金黃外皮，外酥內嫩多汁，如超新星爆發般釋放美味。",
        image: "https://images.unsplash.com/photo-1562967914-608f82629a7e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
    },
    {
        id: "105",
        name: "彗星尾跡氣泡飲",
        category: "drink",
        price: 160,
        description: "漸層藍柑橘與百香果汁氣泡飲，內含食用閃粉，攪拌時宛如清澈的彗星光軌劃過夜空。",
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
    },
    {
        id: "106",
        name: "黑洞漩渦櫻桃奶昔",
        category: "drink",
        price: 190,
        description: "深邃黑巧克力與鮮紅櫻桃果泥旋渦交織，釋放無可抗拒的甜食重力磁場。",
        image: "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
    }
];

// 系統變數初始化
let dishes = [];
let cart = [];
let currentCategory = "all";
let isAdminMode = false;
let adminUsername = "";

// ==========================================
// 2. 背景 Twinkling Star Canvas 動畫
// ==========================================
function initStarfield() {
    const canvas = document.getElementById('starfield');
    const ctx = canvas.getContext('2d');
    let stars = [];

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        createStars();
    }

    class Star {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 1.5 + 0.3;
            this.alpha = Math.random();
            this.speed = Math.random() * 0.015 + 0.005;
        }
        draw() {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
        update() {
            this.alpha += this.speed;
            if (this.alpha > 1 || this.alpha < 0) {
                this.speed = -this.speed;
            }
        }
    }

    function createStars() {
        stars = [];
        const count = Math.floor((canvas.width * canvas.height) / 7000);
        for (let i = 0; i < count; i++) {
            stars.push(new Star());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        stars.forEach(star => {
            star.update();
            star.draw();
        });
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animate();
}

// ==========================================
// 3. 圖片載入錯誤處理：提供精緻內聯 SVG 預設圖
// ==========================================
function handleImageError(imgElement, category) {
    const container = imgElement.parentElement;
    imgElement.style.display = "none";

    let svgContent = "";
    if (category === "main") {
        svgContent = `
            <svg class="w-16 h-16 text-emerald-400/60" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M15 70 C15 50, 85 50, 85 70 Z" fill="rgba(16, 185, 129, 0.05)"/>
                <circle cx="50" cy="40" r="6" fill="currentColor"/>
                <path d="M20 76 L80 76"/>
                <ellipse cx="50" cy="76" rx="40" ry="8"/>
                <path d="M10 50 Q50 30 90 50" stroke-dasharray="4 4" opacity="0.5"/>
                <path d="M10 50 Q50 70 90 50" stroke-dasharray="4 4" opacity="0.5"/>
            </svg>`;
    } else if (category === "side") {
        svgContent = `
            <svg class="w-16 h-16 text-blue-400/60" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M25 45 C25 65, 75 65, 75 45 Z" fill="rgba(59, 130, 246, 0.05)"/>
                <ellipse cx="50" cy="45" rx="25" ry="5"/>
                <circle cx="40" cy="25" r="4" fill="currentColor"/>
                <circle cx="60" cy="30" r="3" fill="currentColor"/>
                <circle cx="50" cy="20" r="2" fill="currentColor"/>
                <path d="M50 70 L52 75 L57 75 L53 78 L55 83 L50 80 L45 83 L47 78 L43 75 L48 75 Z" fill="currentColor" opacity="0.7"/>
            </svg>`;
    } else {
        svgContent = `
            <svg class="w-16 h-16 text-teal-400/60" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M35 30 L43 65 A8 8 0 0 0 51 72 L65 72" />
                <path d="M30 25 L70 25 M35 32 L65 32" />
                <line x1="45" y1="40" x2="68" y2="12" />
                <circle cx="50" cy="48" r="4" fill="currentColor" opacity="0.8"/>
                <circle cx="58" cy="58" r="3" fill="currentColor" opacity="0.8"/>
                <ellipse cx="50" cy="65" rx="30" ry="10" stroke-dasharray="3 3" />
            </svg>`;
    }

    const fallbackDiv = document.createElement("div");
    fallbackDiv.className = "w-full h-full bg-slate-900/60 flex items-center justify-center flex-col gap-2 relative border-b border-white/5";
    fallbackDiv.innerHTML = `
        ${svgContent}
        <span class="text-[10px] text-slate-500 tracking-wider">星際影像連結失效</span>
    `;
    container.appendChild(fallbackDiv);
}

// ==========================================
// 4. 初始化載入與本機 LocalStorage 儲存
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    initStarfield();

    const storedDishes = localStorage.getItem('antigravity_dishes');
    if (storedDishes) {
        dishes = JSON.parse(storedDishes);
        if (dishes.some(d => d.id && String(d.id).startsWith("dish-"))) {
            localStorage.removeItem('antigravity_dishes');
            dishes = [...INITIAL_DISHES];
            localStorage.setItem('antigravity_dishes', JSON.stringify(dishes));
        }
    } else {
        dishes = [...INITIAL_DISHES];
        localStorage.setItem('antigravity_dishes', JSON.stringify(dishes));
    }

    const storedCart = localStorage.getItem('antigravity_cart');
    if (storedCart) {
        cart = JSON.parse(storedCart);
    }

    renderMenu();
    renderCart();

    if (API_URL) {
        fetchDishes();
    }
});

function saveDishesLocal() {
    localStorage.setItem('antigravity_dishes', JSON.stringify(dishes));
}

function saveCartLocal() {
    localStorage.setItem('antigravity_cart', JSON.stringify(cart));
}

// ==========================================
// 5. 渲染餐點菜單 (支援顧客與管理員模式)
// ==========================================
function renderMenu() {
    const grid = document.getElementById('menu-grid');
    grid.innerHTML = "";

    const filteredDishes = dishes.filter(dish => currentCategory === "all" || dish.category === currentCategory);

    if (filteredDishes.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-16 flex flex-col items-center justify-center text-slate-500 gap-3 glass-panel rounded-2xl">
                <i class="fa-solid fa-ghost text-4xl animate-bounce"></i>
                <p class="text-sm">此星區目前無任何餐點供應</p>
            </div>`;
        return;
    }

    const floatClasses = ["animate-float-1", "animate-float-2", "animate-float-3"];

    filteredDishes.forEach((dish, idx) => {
        const floatClass = floatClasses[idx % floatClasses.length];
        const card = document.createElement('div');
        const hoverStyleClass = (dish.category === "drink") ? "glass-card-blue" : "glass-card";

        card.className = `${hoverStyleClass} ${floatClass} rounded-2xl overflow-hidden flex flex-col relative group h-full shadow-lg shadow-black/10`;
        card.dataset.id = dish.id;

        let catLabel = "主食";
        let catColor = "from-emerald-500/20 to-emerald-400/10 border-emerald-500/30 text-emerald-400";
        if (dish.category === "side") {
            catLabel = "副食";
            catColor = "from-teal-500/20 to-teal-400/10 border-teal-500/30 text-teal-400";
        } else if (dish.category === "drink") {
            catLabel = "飲料";
            catColor = "from-blue-500/20 to-blue-400/10 border-blue-500/30 text-blue-400";
        }

        const imageHTML = dish.image
            ? `<img src="${dish.image}" onerror="handleImageError(this, '${dish.category}')" class="w-full h-44 object-cover border-b border-white/5 group-hover:scale-105 transition-transform duration-700" alt="${dish.name}">`
            : `<div class="w-full h-44 bg-slate-900/60 border-b border-white/5 flex items-center justify-center" ref-cat="${dish.category}"></div>`;

        const deleteBtnHTML = isAdminMode
            ? `<button onclick="handleDeleteDish('${dish.id}')" class="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-500/80 hover:bg-red-500 border border-white/10 hover:border-red-400 text-white flex items-center justify-center shadow-lg hover:shadow-red-500/30 transition-all duration-300 z-20">
                    <i class="fa-solid fa-trash-can text-sm"></i>
               </button>`
            : "";

        card.innerHTML = `
            <div class="h-44 overflow-hidden relative">
                ${imageHTML}
                ${deleteBtnHTML}
            </div>
            <div class="p-5 flex flex-col flex-grow gap-3">
                <div class="flex items-center justify-between">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-gradient-to-r ${catColor}">
                        ${catLabel}
                    </span>
                    <span class="font-mono text-lg font-bold text-white tracking-wide">
                        TWD ${dish.price}
                    </span>
                </div>
                <div>
                    <h3 class="text-base font-bold tracking-wide text-white group-hover:text-emerald-400 transition-colors duration-300">
                        ${dish.name}
                    </h3>
                    <p class="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-3">
                        ${dish.description}
                    </p>
                </div>
                <button onclick="addToCart('${dish.id}')" class="mt-auto w-full py-2.5 rounded-xl bg-white/5 hover:bg-gradient-to-r hover:from-blue-500 hover:to-emerald-500 border border-white/10 hover:border-transparent text-slate-300 hover:text-white text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5">
                    <i class="fa-solid fa-circle-plus"></i> 加入點餐單
                </button>
            </div>
        `;

        if (!dish.image) {
            const fallbackImgDiv = card.querySelector("[ref-cat]");
            handleImageError(fallbackImgDiv, dish.category);
        }

        grid.appendChild(card);
    });
}

function setCategory(category) {
    currentCategory = category;

    const tabs = ['all', 'main', 'side', 'drink'];
    tabs.forEach(tab => {
        const btn = document.getElementById(`tab-${tab}`);
        if (tab === category) {
            btn.className = "px-4 py-1.5 text-xs font-semibold rounded-full bg-white/10 text-white transition-all";
        } else {
            btn.className = "px-4 py-1.5 text-xs font-semibold rounded-full text-slate-400 hover:text-white transition-all";
        }
    });

    renderMenu();
}

// ==========================================
// 6. 購物車邏輯實作 (加入、加減、算總額)
// ==========================================
function renderCart() {
    const emptyState = document.getElementById('cart-empty');
    const cartList = document.getElementById('cart-list');
    const cartFooter = document.getElementById('cart-footer');
    const badge = document.getElementById('cart-count-badge');

    let totalCount = 0;
    let subtotal = 0;

    cartList.innerHTML = "";

    if (cart.length === 0) {
        emptyState.style.display = "flex";
        cartList.classList.add('hidden');
        cartFooter.classList.add('hidden');
        badge.innerText = "0 個品項";
        return;
    }

    emptyState.style.display = "none";
    cartList.classList.remove('hidden');
    cartFooter.classList.remove('hidden');

    cart.forEach(item => {
        const dish = dishes.find(d => d.id === item.dishId);
        if (!dish) return;

        totalCount += item.quantity;
        const itemTotal = dish.price * item.quantity;
        subtotal += itemTotal;

        const itemRow = document.createElement('div');
        itemRow.className = "flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all";
        itemRow.innerHTML = `
            <div class="flex flex-col max-w-[55%]">
                <span class="text-sm font-semibold text-white truncate">${dish.name}</span>
                <span class="text-[10px] text-slate-400 font-mono">TWD ${dish.price} x ${item.quantity}</span>
            </div>
            <div class="flex items-center gap-3">
                <div class="flex items-center gap-1 bg-black/30 rounded-lg p-0.5 border border-white/5">
                    <button onclick="updateCartQty('${dish.id}', -1)" class="w-6 h-6 rounded-md hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors text-xs">
                        <i class="fa-solid fa-minus"></i>
                    </button>
                    <span class="w-6 text-center text-xs font-mono font-bold text-white">${item.quantity}</span>
                    <button onclick="updateCartQty('${dish.id}', 1)" class="w-6 h-6 rounded-md hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors text-xs">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                </div>
                <span class="text-xs font-bold text-blue-400 font-mono w-16 text-right">TWD ${itemTotal}</span>
            </div>
        `;
        cartList.appendChild(itemRow);
    });

    badge.innerText = `${totalCount} 個品項`;
    document.getElementById('cart-subtotal').innerText = `TWD ${subtotal}`;
    document.getElementById('cart-total').innerText = `TWD ${subtotal}`;
}

function addToCart(dishId) {
    const existing = cart.find(item => item.dishId === dishId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ dishId: dishId, quantity: 1 });
    }
    saveCartLocal();
    renderCart();
}

function updateCartQty(dishId, delta) {
    const index = cart.findIndex(item => item.dishId === dishId);
    if (index === -1) return;

    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    saveCartLocal();
    renderCart();
}

function clearCart() {
    cart = [];
    saveCartLocal();
    renderCart();
    document.getElementById('customer-name').value = "";
}

// ==========================================
// 7. 管理員模式切換與憑證登入
// ==========================================
function toggleAdminMode() {
    const btn = document.getElementById('btn-toggle-admin');
    const formContainer = document.getElementById('admin-form-container');

    if (isAdminMode) {
        isAdminMode = false;
        adminUsername = "";

        const badge = document.getElementById('admin-user-badge');
        if (badge) badge.classList.add('hidden');

        btn.innerHTML = `<i class="fa-solid fa-user-gear"></i> <span>切換為管理員模式</span>`;
        btn.classList.remove('border-emerald-500/50', 'bg-emerald-500/10', 'text-emerald-400');
        formContainer.style.maxHeight = "0px";
        renderMenu();
        showModal("登出成功", "您已成功登出管理員模式，回到一般顧客選單。");
    } else {
        openLoginModal();
    }
}

function openLoginModal() {
    const modal = document.getElementById('admin-login-modal');
    const box = document.getElementById('login-modal-box');

    document.getElementById('login-username').value = "";
    document.getElementById('login-password').value = "";
    document.getElementById('login-error-msg').classList.add('hidden');
    box.classList.remove('animate-shake');

    modal.classList.remove('pointer-events-none');
    modal.style.opacity = "1";
    box.classList.remove('scale-95');
    box.classList.add('scale-100');

    setTimeout(() => {
        document.getElementById('login-username').focus();
    }, 100);
}

function closeLoginModal() {
    const modal = document.getElementById('admin-login-modal');
    const box = document.getElementById('login-modal-box');

    modal.classList.add('pointer-events-none');
    modal.style.opacity = "0";
    box.classList.remove('scale-100');
    box.classList.add('scale-95');
}

async function submitAdminLogin() {
    const user = document.getElementById('login-username').value.trim();
    const pass = document.getElementById('login-password').value.trim();
    const box = document.getElementById('login-modal-box');
    const errMsg = document.getElementById('login-error-msg');

    if (!user || !pass) {
        const errorSpan = errMsg.querySelector('span') || errMsg;
        errorSpan.innerText = "請輸入完整帳號與密碼！";
        errMsg.classList.remove('hidden');
        return;
    }

    showLoading("正在向星際伺服器驗證憑證...");

    if (!API_URL) {
        setTimeout(() => {
            hideLoading();
            if (user === ADMIN_USER && pass === ADMIN_PASS) {
                handleLoginSuccess();
            } else {
                handleLoginFail("帳號或密碼錯誤（本機模擬）");
            }
        }, 1000);
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                action: 'login',
                username: user,
                password: pass
            })
        });

        if (!response.ok) throw new Error("星際傳輸異常 (HTTP 錯誤)");

        const responseText = await response.text();
        console.log("登入驗證回傳資料:", responseText);

        let result = {};
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            throw new Error("伺服器回傳格式不正確 (預期為 JSON)");
        }

        hideLoading();

        if (result.status === "success") {
            handleLoginSuccess();
        } else {
            handleLoginFail(result.message || "帳號或密碼錯誤");
        }
    } catch (err) {
        hideLoading();
        handleLoginFail("連線伺服器驗證失敗: " + err.message);
    }

    function handleLoginSuccess() {
        isAdminMode = true;
        adminUsername = user;
        closeLoginModal();

        const badge = document.getElementById('admin-user-badge');
        const displayName = document.getElementById('admin-username-display');
        if (badge && displayName) {
            displayName.innerText = adminUsername;
            badge.classList.remove('hidden');
        }

        const btn = document.getElementById('btn-toggle-admin');
        const formContainer = document.getElementById('admin-form-container');

        btn.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> <span>切換為顧客模式</span>`;
        btn.classList.add('border-emerald-500/50', 'bg-emerald-500/10', 'text-emerald-400');
        formContainer.style.maxHeight = formContainer.scrollHeight + "px";

        renderMenu();
        showModal("驗證成功", "管理員憑證驗證成功！管理面板已解鎖。");
    }

    function handleLoginFail(message) {
        document.getElementById('login-password').value = "";
        const errorSpan = errMsg.querySelector('span') || errMsg;
        errorSpan.innerText = message;
        errMsg.classList.remove('hidden');

        box.classList.add('animate-shake');
        setTimeout(() => {
            box.classList.remove('animate-shake');
        }, 300);
    }
}

// ==========================================
// 8. 介面互動與 API 載入控制防呆
// ==========================================
function showLoading(message) {
    const overlay = document.getElementById('loading-overlay');
    const text = document.getElementById('loading-text');
    text.innerText = message;
    overlay.classList.remove('pointer-events-none');
    overlay.style.opacity = "1";
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.add('pointer-events-none');
    overlay.style.opacity = "0";
}

function showModal(title, message, isSuccess = true) {
    const container = document.getElementById('modal-container');
    const icon = document.getElementById('modal-icon');
    const titleElem = document.getElementById('modal-title');
    const msgElem = document.getElementById('modal-message');

    titleElem.innerText = title;
    msgElem.innerHTML = message;

    if (isSuccess) {
        icon.className = "w-16 h-16 rounded-full flex items-center justify-center mb-4 text-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse";
        icon.innerHTML = `<i class="fa-solid fa-circle-check"></i>`;
    } else {
        icon.className = "w-16 h-16 rounded-full flex items-center justify-center mb-4 text-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-bounce";
        icon.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i>`;
    }

    container.classList.remove('pointer-events-none');
    container.style.opacity = "1";
}

window.closeModal = function () {
    const container = document.getElementById('modal-container');
    container.classList.add('pointer-events-none');
    container.style.opacity = "0";
}

// ==========================================
// 9. API 串接與 Fetch POST (order / add / delete)
// ==========================================

async function fetchDishes() {
    if (!API_URL) return;

    showLoading("正在從星際伺服器同步選單數據...");

    try {
        const syncUrl = API_URL.includes("?") ? `${API_URL}&action=read` : `${API_URL}?action=read`;
        const response = await fetch(syncUrl);
        if (!response.ok) throw new Error("星際傳輸異常 (GET 失敗)");

        const data = await response.json();
        console.log("GET 同步原始回傳資料:", data);

        let fetchedList = null;
        let parsedData = data;

        if (typeof data === 'string') {
            try {
                parsedData = JSON.parse(data);
            } catch (e) {
                console.warn("嘗試解析字串為 JSON 失敗，維持原資料處理");
            }
        }

        if (Array.isArray(parsedData)) {
            fetchedList = parsedData;
        } else if (parsedData && Array.isArray(parsedData.dishes)) {
            fetchedList = parsedData.dishes;
        } else if (parsedData && parsedData.status === "success" && Array.isArray(parsedData.data)) {
            fetchedList = parsedData.data;
        } else if (parsedData && Array.isArray(parsedData.data)) {
            fetchedList = parsedData.data;
        }

        if (fetchedList !== null) {
            const categoryMap = {
                "主食": "main",
                "副食": "side",
                "飲料": "drink",
                "main": "main",
                "side": "side",
                "drink": "drink"
            };

            dishes = fetchedList.map(dish => {
                return {
                    id: String(dish.id || ""),
                    name: dish.name || "未命名餐點",
                    category: categoryMap[dish.category] || "main",
                    price: Number(dish.price) || 0,
                    description: dish.description || "",
                    image: dish.image || dish.imageUrl || ""
                };
            });

            saveDishesLocal();
            renderMenu();
            hideLoading();
            showModal("同步成功", `已成功同步最新的星際餐點選單！（共 ${dishes.length} 項）`);
            return;
        }
        throw new Error("無法識別回傳的資料結構。收到的內容為: " + JSON.stringify(data).substring(0, 150));
    } catch (err) {
        console.error("選單同步失敗:", err);
        hideLoading();
        showModal("同步失敗", "無法從星際資料庫載入最新數據，將使用快取資料。<br><span class='text-xs text-rose-300'>錯誤原因: " + err.message + "</span>", false);
    }
}

async function submitOrder() {
    const nameInput = document.getElementById('customer-name');
    const customerName = nameInput.value.trim();

    if (!customerName) {
        showModal("星際識別錯誤", "請先輸入您的顧客姓名以供機艙辨識。", false);
        nameInput.focus();
        return;
    }

    const totalAmount = cart.reduce((sum, item) => {
        const d = dishes.find(dish => dish.id === item.dishId);
        return sum + (d ? d.price * item.quantity : 0);
    }, 0);

    const orderData = {
        customerName: customerName,
        items: cart.map(item => {
            const d = dishes.find(dish => dish.id === item.dishId);
            return {
                id: item.dishId,
                name: d ? d.name : "未知品項",
                price: d ? d.price : 0,
                quantity: item.quantity
            };
        }),
        total: totalAmount
    };

    showLoading("正在將點餐清單發送至星際廚房...");

    if (!API_URL) {
        setTimeout(() => {
            hideLoading();
            showModal("點餐成功！", `歡迎您，${customerName}。您的餐點已加入排程，廚房正在以反重力技術精心準備中！`);
            clearCart();
        }, 1200);
        return;
    }

    const itemsText = cart.map(item => {
        const d = dishes.find(dish => dish.id === item.dishId);
        return `${d ? d.name : "未知品項"} x ${item.quantity}`;
    }).join(', ');

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                action: 'order',
                customerName: customerName,
                items: orderData.items,
                itemsText: itemsText,
                total: totalAmount,
                totalPrice: totalAmount,
                data: JSON.stringify(orderData)
            })
        });

        if (!response.ok) throw new Error("星際傳輸異常 (HTTP 狀態碼錯誤)");

        const responseText = await response.text();
        console.log("下單原始回傳資料:", responseText);

        let result = {};
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            result = { status: "success", message: responseText };
        }

        if (result.status === "error" || result.status === "fail") {
            throw new Error(result.message || "星際廚房拒絕了此訂單");
        }

        hideLoading();
        showModal("點餐成功！", `感謝您的光臨，${customerName}。您的訂單已順利存入星際雲端，廚房處理中。`);
        clearCart();
    } catch (err) {
        hideLoading();
        showModal("傳輸失敗", `無法連線至星際資料庫：${err.message}。<br><span class='text-xs text-rose-300'>提示: 請檢查主控台以獲取詳細連線紀錄。</span>`, false);
    }
}

async function handleAddDish(event) {
    event.preventDefault();

    const name = document.getElementById('form-name').value.trim();
    const category = document.getElementById('form-category').value;
    const price = parseInt(document.getElementById('form-price').value);
    const image = document.getElementById('form-image').value.trim();
    const description = document.getElementById('form-description').value.trim();

    let nextId = 101;
    if (dishes && dishes.length > 0) {
        const numericIds = dishes.map(d => parseInt(d.id)).filter(id => !isNaN(id));
        if (numericIds.length > 0) {
            const maxExistingId = Math.max(...numericIds);
            nextId = maxExistingId + 1;
        }
    }

    const newDish = {
        id: String(nextId),
        name: name,
        category: category,
        price: price,
        image: image,
        description: description,
        status: "上架"
    };

    const reverseCategoryMap = {
        "main": "主食",
        "side": "副食",
        "drink": "飲料"
    };
    const apiCategory = reverseCategoryMap[newDish.category] || newDish.category;

    showLoading("正在將新餐點上傳至星際網路...");

    if (!API_URL) {
        setTimeout(() => {
            dishes.unshift(newDish);
            saveDishesLocal();
            hideLoading();
            showModal("餐點新增成功", `【${name}】已成功加入您的菜單！`);
            document.getElementById('add-dish-form').reset();
            renderMenu();
        }, 1000);
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                action: 'add',
                id: newDish.id,
                name: newDish.name,
                category: apiCategory,
                price: newDish.price,
                imageUrl: newDish.image,
                image: newDish.image,
                description: newDish.description,
                status: "上架",
                data: JSON.stringify(newDish)
            })
        });

        if (!response.ok) throw new Error("星際傳輸異常 (HTTP 狀態碼錯誤)");

        const responseText = await response.text();
        console.log("新增餐點原始回傳資料:", responseText);

        let result = {};
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            result = { status: "success", message: responseText };
        }

        if (result.status === "error" || result.status === "fail") {
            throw new Error(result.message || "星際資料庫拒絕新增此品項");
        }

        hideLoading();
        dishes.unshift(newDish);
        saveDishesLocal();
        showModal("新增成功", `餐點已寫入 Google 試算表與本機選單。`);
        document.getElementById('add-dish-form').reset();
        renderMenu();
    } catch (err) {
        hideLoading();
        showModal("新增失敗", `連線至星際網路發生錯誤：${err.message}`, false);
    }
}

async function handleDeleteDish(dishId) {
    const dish = dishes.find(d => d.id === dishId);
    if (!dish) return;

    if (!confirm(`確定要將【${dish.name}】從星際選單中永久抹除嗎？`)) {
        return;
    }

    showLoading(`正在從星際資料庫抹除【${dish.name}】...`);

    if (!API_URL) {
        setTimeout(() => {
            dishes = dishes.filter(d => d.id !== dishId);
            saveDishesLocal();
            cart = cart.filter(item => item.dishId !== dishId);
            saveCartLocal();

            hideLoading();
            showModal("抹除成功", `【${dish.name}】已從星際選單及本機快取中移除。`);
            renderMenu();
            renderCart();
        }, 1000);
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                action: 'delete',
                id: dishId
            })
        });

        if (!response.ok) throw new Error("星際傳輸異常 (HTTP 狀態碼錯誤)");

        const responseText = await response.text();
        console.log("刪除餐點原始回傳資料:", responseText);

        let result = {};
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            result = { status: "success", message: responseText };
        }

        if (result.status === "error" || result.status === "fail") {
            throw new Error(result.message || "星際資料庫拒絕刪除此品項");
        }

        dishes = dishes.filter(d => d.id !== dishId);
        saveDishesLocal();
        cart = cart.filter(item => item.dishId !== dishId);
        saveCartLocal();

        hideLoading();
        showModal("抹除成功", `餐點已成功從 Google 試算表中刪除。`);
        renderMenu();
        renderCart();
    } catch (err) {
        hideLoading();
        showModal("刪除失敗", `抹除餐點時發生錯誤：${err.message}`, false);
    }
}
