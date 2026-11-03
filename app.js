// Standard Street Tea Stand Preset Products
const DEFAULT_TRADA_PRODUCTS = [
    { id: 't1', name: 'Trà Đá', price: 5000, icon: 'fa-mug-hot' },
    { id: 't2', name: 'Nhân Trần', price: 5000, icon: 'fa-mug-hot' },
    { id: 't3', name: 'Trà Chanh', price: 15000, icon: 'fa-glass-water' },
    { id: 't4', name: 'Trà Quất', price: 15000, icon: 'fa-glass-water' },
    { id: 't5', name: 'Hướng Dương', price: 15000, icon: 'fa-seedling' },
    { id: 't6', name: 'Thuốc Lá (Điếu)', price: 3000, icon: 'fa-smoking' },
    { id: 't7', name: 'Thuốc Lá (Bao)', price: 25000, icon: 'fa-smoking' },
    { id: 't8', name: 'Thuốc Lào (Cối)', price: 5000, icon: 'fa-smoking' },
    { id: 't9', name: 'Kẹo Lạc', price: 5000, icon: 'fa-cookie-bite' },
    { id: 't10', name: 'Bánh Mì', price: 15000, icon: 'fa-bread-slice' },
    { id: 't11', name: 'Nước Ngọt Lon', price: 15000, icon: 'fa-glass-water' },
    { id: 't12', name: 'Bò Hổ / Redbull', price: 20000, icon: 'fa-glass-water' }
];

// Application States
let products = JSON.parse(localStorage.getItem('trada_pos_products')) || DEFAULT_TRADA_PRODUCTS;
let invoices = JSON.parse(localStorage.getItem('trada_pos_invoices')) || [];
let cart = []; // Array of { product, quantity }
let editingInvoiceId = null;
let rawPaidValue = 0;
let invoiceFilter = 'ALL';

// Live Clock Header
setInterval(() => {
    const d = new Date();
    const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
    const liveTimeEl = document.getElementById('live-time');
    if (liveTimeEl) liveTimeEl.innerText = timeStr;
}, 1000);

// Currency Formatter
function formatVND(amt) {
    return new Intl.NumberFormat('vi-VN').format(amt || 0) + 'đ';
}

// Date Time Formatter
function formatDateTime(dStr) {
    const d = dStr ? new Date(dStr) : new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

// Save LocalStorage State
function saveState() {
    localStorage.setItem('trada_pos_products', JSON.stringify(products));
    localStorage.setItem('trada_pos_invoices', JSON.stringify(invoices));
    updatePendingBadge();
    renderStats();
}

// TAB SWITCHING LOGIC
function switchTab(tab) {
    document.getElementById('view-pos').classList.add('hidden');
    document.getElementById('view-invoices').classList.add('hidden');
    document.getElementById('view-products').classList.add('hidden');
    document.getElementById('view-stats').classList.add('hidden');

    ['nav-pos', 'nav-invoices', 'nav-products', 'nav-stats'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.className = "flex flex-col items-center justify-center flex-1 py-1 text-gray-400 font-bold transition relative";
    });

    if (tab === 'pos') {
        document.getElementById('view-pos').classList.remove('hidden');
        document.getElementById('nav-pos').className = "flex flex-col items-center justify-center flex-1 py-1 text-trada-700 font-extrabold transition relative";
        renderPosProducts();
    } else if (tab === 'invoices') {
        document.getElementById('view-invoices').classList.remove('hidden');
        document.getElementById('nav-invoices').className = "flex flex-col items-center justify-center flex-1 py-1 text-trada-700 font-extrabold transition relative";
        renderInvoices();
    } else if (tab === 'products') {
        document.getElementById('view-products').classList.remove('hidden');
        document.getElementById('nav-products').className = "flex flex-col items-center justify-center flex-1 py-1 text-trada-700 font-extrabold transition relative";
        renderManageProducts();
    } else if (tab === 'stats') {
        document.getElementById('view-stats').classList.remove('hidden');
        document.getElementById('nav-stats').className = "flex flex-col items-center justify-center flex-1 py-1 text-trada-700 font-extrabold transition relative";
        renderStats();
    }
}


/* ================= 1. FAST POS TAP-TO-ADD LOGIC ================= */

function renderPosProducts() {
    const grid = document.getElementById('pos-product-grid');
    const q = document.getElementById('pos-search').value.toLowerCase();
    grid.innerHTML = '';

    const filtered = products.filter(p => p.name.toLowerCase().includes(q));

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-2 sm:col-span-3 text-center py-10 text-gray-400 text-xs font-bold">Không tìm thấy món</div>`;
        return;
    }

    filtered.forEach(p => {
        const inCart = cart.find(c => c.product.id === p.id);
        const qty = inCart ? inCart.quantity : 0;

        const card = document.createElement('div');
        card.className = "bg-white p-3 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-between active:scale-95 transition relative cursor-pointer";
        card.onclick = () => addToCart(p);
        card.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="w-9 h-9 rounded-xl bg-emerald-100/70 text-trada-700 flex items-center justify-center">
                    <i class="fa-solid ${p.icon || 'fa-mug-hot'} text-base"></i>
                </div>
                ${qty > 0 ? `<span class="bg-red-500 text-white text-[11px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-md animate-bounce">${qty}</span>` : ''}
            </div>
            <div class="mt-2">
                <p class="font-extrabold text-xs text-gray-800 line-clamp-1">${p.name}</p>
                <p class="text-xs font-black text-trada-700">${formatVND(p.price)}</p>
            </div>
            <div class="mt-2 pt-1 border-t border-gray-100 flex justify-between items-center text-[10px] text-gray-400 font-bold">
                <span>Chạm để +1</span>
                <i class="fa-solid fa-plus text-trada-600 text-xs"></i>
            </div>
        `;
        grid.appendChild(card);
    });

    updateCartQuickSummary();
}

function addToCart(p) {
    const item = cart.find(c => c.product.id === p.id);
    if (item) {
        item.quantity++;
    } else {
        cart.push({ product: p, quantity: 1 });
    }
    renderPosProducts();
    renderCartDrawerItems();
}

function updateCartQty(pId, delta) {
    const item = cart.find(c => c.product.id === pId);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            cart = cart.filter(c => c.product.id !== pId);
        }
    }
    renderPosProducts();
    renderCartDrawerItems();
}

function clearCart() {
    cart = [];
    rawPaidValue = 0;
    document.getElementById('drawer-paid-input').value = '';
    document.getElementById('table-note-input').value = '';
    document.getElementById('drawer-table-note').value = '';
    renderPosProducts();
    renderCartDrawerItems();
}

function getCartTotal() {
    return cart.reduce((sum, i) => sum + (i.product.price * i.quantity), 0);
}

function updateCartQuickSummary() {
    const totalCount = cart.reduce((sum, i) => sum + i.quantity, 0);
    const totalPrice = getCartTotal();

    document.getElementById('cart-total-count').innerText = totalCount;
    document.getElementById('cart-quick-total').innerText = formatVND(totalPrice);
}

function toggleCartDrawer(show) {
    const drawer = document.getElementById('cart-drawer');
    if (show) {
        const topNote = document.getElementById('table-note-input').value;
        if (topNote) document.getElementById('drawer-table-note').value = topNote;
        
        renderCartDrawerItems();
        drawer.classList.remove('hidden');
    } else {
        drawer.classList.add('hidden');
    }
}

function renderCartDrawerItems() {
    const container = document.getElementById('cart-drawer-items');
    container.innerHTML = '';

    if (cart.length === 0) {
        container.innerHTML = `<p class="text-center py-6 text-xs font-bold text-gray-400">Giỏ hàng trống. Chạm vào món để chọn!</p>`;
    } else {
        cart.forEach(c => {
            const div = document.createElement('div');
            div.className = "flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-xs";
            div.innerHTML = `
                <div class="flex-1 pr-2">
                    <p class="font-extrabold text-gray-800">${c.product.name}</p>
                    <p class="text-[11px] text-gray-500 font-medium">${formatVND(c.product.price)} x ${c.quantity}</p>
                </div>
                <div class="flex items-center space-x-2">
                    <div class="flex items-center border border-gray-300 rounded-lg bg-white">
                        <button onclick="updateCartQty('${c.product.id}', -1)" class="w-7 h-7 font-black text-gray-700 active:bg-gray-100 rounded-l-lg">-</button>
                        <span class="w-6 text-center font-extrabold text-trada-800 text-xs">${c.quantity}</span>
                        <button onclick="updateCartQty('${c.product.id}', 1)" class="w-7 h-7 font-black text-gray-700 active:bg-gray-100 rounded-r-lg">+</button>
                    </div>
                    <span class="font-black text-trada-700 w-16 text-right">${formatVND(c.product.price * c.quantity)}</span>
                </div>
            `;
            container.appendChild(div);
        });
    }

    updateCalculations();
}


/* ================= 2. SMART MONEY & QUICK CASH ================= */

function handlePaidInput(val) {
    let clean = val.replace(/[^0-9kK]/g, '').toLowerCase();
    if (!clean) {
        rawPaidValue = 0;
        updateCalculations();
        return;
    }

    let num = parseFloat(clean);
    if (isNaN(num)) {
        rawPaidValue = 0;
    } else if (num < 1000 && !clean.includes('k')) {
        // Short typing: 5 -> 5.000 VNĐ, 20 -> 20.000 VNĐ
        rawPaidValue = num * 1000;
    } else if (clean.includes('k')) {
        rawPaidValue = parseFloat(clean.replace('k', '')) * 1000;
    } else {
        rawPaidValue = num;
    }

    updateCalculations();
}

function setQuickCash(kAmount) {
    rawPaidValue = kAmount * 1000;
    document.getElementById('drawer-paid-input').value = new Intl.NumberFormat('vi-VN').format(rawPaidValue);
    updateCalculations();
}

function setExactCash() {
    rawPaidValue = getCartTotal();
    document.getElementById('drawer-paid-input').value = new Intl.NumberFormat('vi-VN').format(rawPaidValue);
    updateCalculations();
}

function updateCalculations() {
    const total = getCartTotal();
    const change = rawPaidValue - total;

    document.getElementById('drawer-total-display').innerText = formatVND(total);

    const changeEl = document.getElementById('drawer-change-display');
    if (rawPaidValue > 0 && change >= 0) {
        changeEl.innerText = formatVND(change);
        changeEl.className = "font-black text-xl text-trada-700";
    } else if (rawPaidValue > 0 && change < 0) {
        changeEl.innerText = "Thiếu " + formatVND(Math.abs(change));
        changeEl.className = "font-bold text-xs text-red-600";
    } else {
        changeEl.innerText = "0đ";
        changeEl.className = "font-black text-xl text-trada-700";
    }

    const btnSubmit = document.getElementById('btn-submit-invoice');
    const btnPending = document.getElementById('btn-save-pending');
    btnSubmit.disabled = cart.length === 0;
    btnPending.disabled = cart.length === 0;
}


/* ================= 3. INVOICE CREATION, PENDING & EDITING ================= */

function quickSavePendingInvoice() {
    if (cart.length === 0) {
        alert('Giỏ hàng chưa có món nào!');
        return;
    }
    savePendingInvoiceAction();
}

function savePendingInvoiceAction() {
    if (cart.length === 0) return;

    const total = getCartTotal();
    const tableNote = document.getElementById('drawer-table-note').value.trim() 
                     || document.getElementById('table-note-input').value.trim() 
                     || 'Khách lẻ / Bàn chưa tên';

    if (editingInvoiceId) {
        const inv = invoices.find(i => i.id === editingInvoiceId);
        if (inv) {
            inv.items = JSON.parse(JSON.stringify(cart));
            inv.total = total;
            inv.tableNote = tableNote;
            inv.customerPaid = rawPaidValue;
            inv.change = Math.max(0, rawPaidValue - total);
            alert(`Đã cập nhật xong hóa đơn: ${inv.tableNote} (${inv.id})!`);
        }
        cancelEditingInvoice();
    } else {
        const newInv = {
            id: 'TD' + String(Date.now()).slice(-6),
            tableNote: tableNote,
            createdAt: new Date().toISOString(),
            paidAt: null,
            items: JSON.parse(JSON.stringify(cart)),
            total: total,
            customerPaid: rawPaidValue,
            change: Math.max(0, rawPaidValue - total),
            status: 'PENDING'
        };
        invoices.unshift(newInv);
        alert(`Đã lưu đơn chờ cho: ${newInv.tableNote}`);
    }

    saveState();
    clearCart();
    toggleCartDrawer(false);
    switchTab('invoices');
}

function submitInvoiceAction() {
    if (cart.length === 0) return;

    const total = getCartTotal();
    const customerPaid = rawPaidValue || total;
    const change = Math.max(0, customerPaid - total);
    const tableNote = document.getElementById('drawer-table-note').value.trim() 
                     || document.getElementById('table-note-input').value.trim() 
                     || 'Khách lẻ';

    if (editingInvoiceId) {
        const inv = invoices.find(i => i.id === editingInvoiceId);
        if (inv) {
            inv.items = JSON.parse(JSON.stringify(cart));
            inv.total = total;
            inv.tableNote = tableNote;
            inv.customerPaid = customerPaid;
            inv.change = change;
            inv.status = 'PAID';
            inv.paidAt = new Date().toISOString();
            alert(`Đã hoàn tất thanh toán hóa đơn ${inv.id}!`);
        }
        cancelEditingInvoice();
    } else {
        const newInv = {
            id: 'TD' + String(Date.now()).slice(-6),
            tableNote: tableNote,
            createdAt: new Date().toISOString(),
            paidAt: new Date().toISOString(),
            items: JSON.parse(JSON.stringify(cart)),
            total: total,
            customerPaid: customerPaid,
            change: change,
            status: 'PAID'
        };
        invoices.unshift(newInv);
        alert(`Thanh toán thành công đơn ${newInv.id}!`);
    }

    saveState();
    clearCart();
    toggleCartDrawer(false);
    switchTab('invoices');
}

function startEditingInvoice(invId) {
    const inv = invoices.find(i => i.id === invId);
    if (!inv) return;

    if (inv.status === 'PAID') {
        alert('Hóa đơn đã thanh toán xong không thể chỉnh sửa!');
        return;
    }

    editingInvoiceId = inv.id;
    cart = JSON.parse(JSON.stringify(inv.items));
    rawPaidValue = inv.customerPaid || 0;

    document.getElementById('editing-banner').classList.remove('hidden');
    document.getElementById('editing-invoice-id').innerText = `${inv.tableNote} (${inv.id})`;
    document.getElementById('table-note-input').value = inv.tableNote || '';
    document.getElementById('drawer-table-note').value = inv.tableNote || '';
    
    if (rawPaidValue > 0) {
        document.getElementById('drawer-paid-input').value = new Intl.NumberFormat('vi-VN').format(rawPaidValue);
    } else {
        document.getElementById('drawer-paid-input').value = '';
    }

    switchTab('pos');
    toggleCartDrawer(true);
}

function cancelEditingInvoice() {
    editingInvoiceId = null;
    document.getElementById('editing-banner').classList.add('hidden');
    document.getElementById('drawer-title').innerText = 'Chi Tiết Đơn Hàng';
    clearCart();
}

function markAsPaid(invId) {
    const inv = invoices.find(i => i.id === invId);
    if (inv) {
        inv.status = 'PAID';
        inv.paidAt = new Date().toISOString();
        if (!inv.customerPaid || inv.customerPaid < inv.total) {
            inv.customerPaid = inv.total;
            inv.change = 0;
        }
        saveState();
        renderInvoices();
    }
}

function filterInvoices(status) {
    invoiceFilter = status;
    ['all', 'pending', 'paid'].forEach(key => {
        const btn = document.getElementById(`filter-${key}`);
        if (btn) {
            if (key.toUpperCase() === status) {
                btn.className = "py-1.5 rounded-lg bg-white text-trada-700 shadow-sm transition font-extrabold";
            } else {
                btn.className = "py-1.5 rounded-lg text-gray-600 transition font-bold";
            }
        }
    });
    renderInvoices();
}

function renderInvoices() {
    const container = document.getElementById('invoice-list-container');
    container.innerHTML = '';

    let list = invoices;
    if (invoiceFilter !== 'ALL') {
        list = list.filter(i => i.status === invoiceFilter);
    }

    document.getElementById('invoice-count-tag').innerText = `${list.length} đơn`;

    if (list.length === 0) {
        container.innerHTML = `<div class="text-center py-12 text-gray-400 text-xs font-bold">Chưa có hóa đơn nào</div>`;
        return;
    }

    list.forEach(inv => {
        const card = document.createElement('div');
        card.className = "bg-white rounded-2xl p-3 border border-emerald-100 shadow-sm space-y-2.5";

        const isPaid = inv.status === 'PAID';
        const statusHtml = isPaid
            ? `<span class="px-2 py-0.5 text-[10px] font-black rounded-full bg-emerald-100 text-trada-800"><i class="fa-solid fa-check"></i> Đã thanh toán</span>`
            : `<span class="px-2 py-0.5 text-[10px] font-black rounded-full bg-amber-100 text-amber-800"><i class="fa-solid fa-clock"></i> Chờ TT</span>`;

        const itemsListHtml = inv.items.map(i => `
            <div class="flex justify-between text-xs py-0.5 border-b border-gray-100/60">
                <span class="text-gray-800 font-bold">${i.product.name} <b class="text-trada-700">x${i.quantity}</b></span>
                <span class="text-gray-600 font-mono font-bold">${formatVND(i.product.price * i.quantity)}</span>
            </div>
        `).join('');

        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <span class="font-extrabold text-amber-800 text-sm bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 inline-block mb-1">
                        <i class="fa-solid fa-chair text-amber-600"></i> ${inv.tableNote || 'Khách lẻ'}
                    </span>
                    <p class="text-[10px] text-gray-400 font-mono">Mã: ${inv.id} | Tạo: ${formatDateTime(inv.createdAt)}</p>
                    ${inv.paidAt ? `<p class="text-[10px] text-trada-700 font-mono">TT lúc: ${formatDateTime(inv.paidAt)}</p>` : ''}
                </div>
                ${statusHtml}
            </div>

            <div class="bg-emerald-50/40 p-2 rounded-xl border border-emerald-100">
                <p class="text-[10px] uppercase font-extrabold text-gray-500 mb-1">Danh sách món (${inv.items.length}):</p>
                ${itemsListHtml}
            </div>

            <div class="flex justify-between items-center text-xs pt-1">
                <div>
                    <span class="text-gray-500 text-[11px] font-bold">TỔNG TIỀN:</span>
                    <span class="font-black text-base text-trada-700 block">${formatVND(inv.total)}</span>
                </div>
                <div class="text-right text-[11px] text-gray-500 font-medium">
                    <p>Đã đưa: <b>${formatVND(inv.customerPaid)}</b></p>
                    <p>Tiền thừa: <b class="text-trada-700">${formatVND(inv.change)}</b></p>
                </div>
            </div>

            <div class="flex gap-2 pt-1 border-t border-gray-100">
                ${!isPaid ? `
                    <button onclick="markAsPaid('${inv.id}')" class="flex-1 py-1.5 bg-trada-600 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm">
                        <i class="fa-solid fa-circle-check"></i> Thu Tiền
                    </button>
                    <button onclick="startEditingInvoice('${inv.id}')" class="px-3.5 py-1.5 bg-amber-500 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm">
                        <i class="fa-solid fa-pen-to-square"></i> Sửa Đơn
                    </button>
                ` : ''}
                <button onclick="openInvoiceModal('${inv.id}')" class="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold">
                    <i class="fa-solid fa-receipt"></i> Xem & In
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function updatePendingBadge() {
    const count = invoices.filter(i => i.status === 'PENDING').length;
    const badge = document.getElementById('nav-pending-badge');
    if (badge) {
        if (count > 0) {
            badge.innerText = count;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
}


/* ================= 4. PRODUCT CRUD & STATS ================= */

function openInvoiceModal(invId) {
    const inv = invoices.find(i => i.id === invId);
    if (!inv) return;

    document.getElementById('modal-inv-id').innerText = 'Mã đơn: ' + inv.id;
    document.getElementById('modal-inv-table-note').innerText = 'Vị trí: ' + (inv.tableNote || 'Khách lẻ');
    document.getElementById('modal-inv-created').innerText = formatDateTime(inv.createdAt);
    document.getElementById('modal-inv-paid').innerText = inv.paidAt ? formatDateTime(inv.paidAt) : 'Chưa TT';
    
    const statusEl = document.getElementById('modal-inv-status');
    statusEl.innerText = inv.status === 'PAID' ? 'ĐÃ THANH TOÁN' : 'CHỜ THANH TOÁN';
    statusEl.className = inv.status === 'PAID' ? 'font-bold text-trada-700' : 'font-bold text-amber-600';

    const itemsContainer = document.getElementById('modal-inv-items');
    itemsContainer.innerHTML = '';
    inv.items.forEach(i => {
        const row = document.createElement('div');
        row.className = "flex text-[11px] py-1 border-b border-gray-100";
        row.innerHTML = `
            <span class="flex-1 font-bold">${i.product.name}</span>
            <span class="w-8 text-center font-bold">${i.quantity}</span>
            <span class="w-14 text-right">${formatVND(i.product.price)}</span>
            <span class="w-16 text-right font-bold">${formatVND(i.product.price * i.quantity)}</span>
        `;
        itemsContainer.appendChild(row);
    });

    document.getElementById('modal-inv-total').innerText = formatVND(inv.total);
    document.getElementById('modal-inv-paid-amt').innerText = formatVND(inv.customerPaid);
    document.getElementById('modal-inv-change').innerText = formatVND(inv.change);

    document.getElementById('invoice-modal').classList.remove('hidden');
}

function closeInvoiceModal() {
    document.getElementById('invoice-modal').classList.add('hidden');
}

function renderManageProducts() {
    const container = document.getElementById('manage-products-list');
    container.innerHTML = '';

    products.forEach(p => {
        const card = document.createElement('div');
        card.className = "bg-white p-3 rounded-xl border border-gray-200 flex justify-between items-center text-xs shadow-sm";
        card.innerHTML = `
            <div class="flex items-center space-x-2.5">
                <div class="w-9 h-9 rounded-xl bg-emerald-100/70 text-trada-700 flex items-center justify-center">
                    <i class="fa-solid ${p.icon || 'fa-mug-hot'} text-base"></i>
                </div>
                <div>
                    <p class="font-extrabold text-gray-800">${p.name}</p>
                    <p class="text-trada-700 font-black">${formatVND(p.price)}</p>
                </div>
            </div>
            <div class="flex space-x-1.5">
                <button onclick="editProduct('${p.id}')" class="p-2 bg-amber-50 text-amber-600 rounded-lg font-bold"><i class="fa-solid fa-pen"></i> Sửa</button>
                <button onclick="deleteProduct('${p.id}')" class="p-2 bg-red-50 text-red-600 rounded-lg font-bold"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        container.appendChild(card);
    });
}

function openProductModal() {
    document.getElementById('product-form').reset();
    document.getElementById('prod-id').value = '';
    document.getElementById('product-modal-title').innerText = 'Thêm Món Mới';
    document.getElementById('product-modal').classList.remove('hidden');
}

function closeProductModal() {
    document.getElementById('product-modal').classList.add('hidden');
}

function saveProduct(e) {
    e.preventDefault();
    const id = document.getElementById('prod-id').value;
    const name = document.getElementById('prod-name').value.trim();
    const price = parseFloat(document.getElementById('prod-price').value);
    const icon = document.getElementById('prod-icon').value;

    if (id) {
        const idx = products.findIndex(p => p.id === id);
        if (idx !== -1) products[idx] = { ...products[idx], name, price, icon };
    } else {
        products.push({ id: 't_' + Date.now(), name, price, icon });
    }

    saveState();
    closeProductModal();
    renderManageProducts();
    renderPosProducts();
}

function editProduct(id) {
    const p = products.find(prod => prod.id === id);
    if (!p) return;

    document.getElementById('prod-id').value = p.id;
    document.getElementById('prod-name').value = p.name;
    document.getElementById('prod-price').value = p.price;
    document.getElementById('prod-icon').value = p.icon || 'fa-mug-hot';
    document.getElementById('product-modal-title').innerText = 'Chỉnh Sửa Món';
    document.getElementById('product-modal').classList.remove('hidden');
}

function deleteProduct(id) {
    if (confirm('Bạn có chắc muốn xóa món này khỏi thực đơn?')) {
        products = products.filter(p => p.id !== id);
        saveState();
        renderManageProducts();
        renderPosProducts();
    }
}

function renderStats() {
    const paidInvoices = invoices.filter(i => i.status === 'PAID');
    const pendingInvoices = invoices.filter(i => i.status === 'PENDING');

    const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.total, 0);
    const pendingRevenue = pendingInvoices.reduce((sum, i) => sum + i.total, 0);

    document.getElementById('stat-today-revenue').innerText = formatVND(totalRevenue);
    document.getElementById('stat-pending-revenue').innerText = formatVND(pendingRevenue);
    document.getElementById('stat-paid-count').innerText = `${paidInvoices.length} đơn`;
    document.getElementById('stat-pending-count').innerText = `${pendingInvoices.length} đơn`;
    document.getElementById('stat-product-count').innerText = `${products.length} món`;
}

function resetDataToDefault() {
    if (confirm('Bạn có chắc muốn xóa toàn bộ dữ liệu và khôi phục về danh sách mẫu ban đầu?')) {
        localStorage.removeItem('trada_pos_products');
        localStorage.removeItem('trada_pos_invoices');
        products = [...DEFAULT_TRADA_PRODUCTS];
        invoices = [];
        cart = [];
        saveState();
        renderPosProducts();
        renderInvoices();
        renderManageProducts();
        renderStats();
        alert('Đã khôi phục dữ liệu ban đầu!');
    }
}

// App OnLoad Initialization
window.onload = function() {
    renderPosProducts();
    updatePendingBadge();
};