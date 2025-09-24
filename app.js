/* Expense Tracker v2
   - category, filters, Chart.js, export CSV, edit/delete
*/
const form = document.getElementById('expense-form');
const descInput = document.getElementById('desc');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const expenseList = document.getElementById('expense-list');
const totalEl = document.getElementById('total');
const clearBtn = document.getElementById('clear-btn');
const filterCategory = document.getElementById('filter-category');
const filterTimeframe = document.getElementById('filter-timeframe');
const exportBtn = document.getElementById('export-csv');

const STORAGE_KEY = 'expense_trk_v2';

let expenses = loadExpenses();
let chart = null;
const COLORS = ['#3B82F6','#F97316','#EF4444','#10B981','#8B5CF6','#F59E0B'];

function loadExpenses(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){
    console.error('Error reading storage', e);
    return [];
  }
}
function saveExpenses(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

function formatVND(n){
  return new Intl.NumberFormat('vi-VN').format(n) + ' ₫';
}

function isSameDay(d1, d2){
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

function applyFilters(){
  const cat = filterCategory.value;
  const tf = filterTimeframe.value;
  const now = new Date();

  return expenses.filter(e => {
    let okCat = (cat === 'all') ? true : (e.category === cat);
    if(!okCat) return false;

    if(tf === 'all') return true;
    const d = new Date(e.createdAt);
    if(tf === 'today') return isSameDay(d, now);
    if(tf === 'month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    return true;
  });
}

function renderExpenses(){
  const filtered = applyFilters();
  expenseList.innerHTML = '';
  let total = 0;
  if(filtered.length === 0){
    const empty = document.createElement('p');
    empty.className='card';
    empty.textContent = 'Chưa có chi tiêu theo bộ lọc hiện tại.';
    expenseList.appendChild(empty);
    totalEl.textContent = formatVND(0);
    renderChart([]); // clear
    return;
  }

  filtered.slice().reverse().forEach(item=>{
    total += item.amount;
    const li = document.createElement('li');

    const left = document.createElement('div');
    left.className = 'item-left';
    const desc = document.createElement('div');
    desc.className = 'item-desc';
    desc.textContent = `${item.desc} — (${item.category})`;
    const meta = document.createElement('div');
    meta.className = 'item-meta';
    meta.textContent = new Date(item.createdAt).toLocaleString();
    left.appendChild(desc);
    left.appendChild(meta);

    const right = document.createElement('div');
    right.style.display = 'flex';
    right.style.gap = '8px';
    right.style.alignItems = 'center';

    const amt = document.createElement('div');
    amt.textContent = formatVND(item.amount);
    amt.style.fontWeight = '700';

    const edit = document.createElement('button');
    edit.className = 'edit-btn';
    edit.textContent = 'Sửa';
    edit.title = 'Sửa';
    edit.addEventListener('click', ()=> editExpense(item.id));

    const del = document.createElement('button');
    del.className = 'delete-btn';
    del.textContent = 'X';
    del.title = 'Xóa';
    del.addEventListener('click', ()=> {
      if(confirm('Bạn có chắc muốn xóa khoản này?')) deleteExpense(item.id);
    });

    right.appendChild(amt);
    right.appendChild(edit);
    right.appendChild(del);

    li.appendChild(left);
    li.appendChild(right);
    expenseList.appendChild(li);
  });

  totalEl.textContent = formatVND(total);
  renderChartFromFiltered(filtered);
}

function addExpense(desc, amount, category){
  const item = {
    id: Date.now().toString(),
    desc,
    amount,
    category,
    createdAt: new Date().toISOString()
  };
  expenses.push(item);
  saveExpenses();
  renderExpenses();
}

function deleteExpense(id){
  expenses = expenses.filter(e => e.id !== id);
  saveExpenses();
  renderExpenses();
}

function editExpense(id){
  const item = expenses.find(e => e.id === id);
  if(!item) return;
  const newDesc = prompt('Mô tả', item.desc);
  if(newDesc === null) return; // cancel
  let newAmount = prompt('Số tiền (VNĐ)', item.amount);
  if(newAmount === null) return;
  newAmount = parseInt(newAmount, 10);
  if(Number.isNaN(newAmount) || newAmount < 0){ alert('Số tiền không hợp lệ'); return; }
  const newCategory = prompt('Loại (Ăn uống, Đi lại, Giải trí, Học tập, Khác)', item.category) || item.category;

  item.desc = newDesc.trim();
  item.amount = newAmount;
  item.category = newCategory;
  saveExpenses();
  renderExpenses();
}

form.addEventListener('submit', (e)=>{
  e.preventDefault();
  const desc = descInput.value.trim();
  const amount = parseInt(amountInput.value, 10);
  const category = categoryInput.value;
  if(!desc || Number.isNaN(amount) || amount < 0){
    alert('Vui lòng nhập mô tả và số tiền hợp lệ.');
    return;
  }
  addExpense(desc, amount, category);
  descInput.value = '';
  amountInput.value = '';
  descInput.focus();
});

clearBtn.addEventListener('click', ()=>{
  if(!confirm('Xóa toàn bộ chi tiêu?')) return;
  expenses = [];
  saveExpenses();
  renderExpenses();
});

filterCategory.addEventListener('change', renderExpenses);
filterTimeframe.addEventListener('change', renderExpenses);

function renderChartFromFiltered(filtered){
  // aggregate per category
  const map = {};
  filtered.forEach(it => {
    map[it.category] = (map[it.category] || 0) + it.amount;
  });
  const labels = Object.keys(map);
  const data = labels.map(l => map[l]);

  renderChart({labels, data});
}

function renderChart(payload){
  const ctx = document.getElementById('chart').getContext('2d');
  if(!payload || !payload.labels || payload.labels.length === 0){
    // destroy existing or show empty
    if(chart){ chart.destroy(); chart = null; }
    // draw empty pie with placeholder
    ctx.clearRect(0,0,ctx.canvas.width, ctx.canvas.height);
    ctx.font = "14px Arial";
    ctx.fillStyle = "#666";
    ctx.textAlign = "center";
    ctx.fillText("Không có dữ liệu để hiển thị", ctx.canvas.width/2, ctx.canvas.height/2);
    return;
  }

  const bg = payload.labels.map((_,i) => COLORS[i % COLORS.length]);
  if(chart){
    chart.data.labels = payload.labels;
    chart.data.datasets[0].data = payload.data;
    chart.data.datasets[0].backgroundColor = bg;
    chart.update();
    return;
  }

  chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: payload.labels,
      datasets: [{
        data: payload.data,
        backgroundColor: bg
      }]
    },
    options: {
      plugins: {
        legend: { position: 'bottom' }
      },
      maintainAspectRatio: false
    }
  });
}

exportBtn.addEventListener('click', ()=> {
  if(!expenses.length){ alert('Không có dữ liệu để export'); return; }
  // export currently filtered data
  const filtered = applyFilters();
  const headers = ['id','desc','amount','category','createdAt'];
  const rows = filtered.map(e => [e.id, `"${e.desc.replace(/"/g,'""')}"`, e.amount, e.category, e.createdAt]);
  let csv = headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'expenses.csv';
  a.click();
  URL.revokeObjectURL(url);
});

// initial render
renderExpenses();
