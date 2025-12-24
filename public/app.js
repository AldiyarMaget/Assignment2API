const btn = document.getElementById('btn');
const result = document.getElementById('result');

btn.addEventListener('click', async () => {
  result.innerHTML = '<p class="small">Загружаю данные...</p>';
  try {
    const res = await fetch('/api/user-full');
    const payload = await res.json();
    if (!payload.success) throw new Error(payload.message || 'Ошибка');
    renderAll(payload.data);
  } catch (err) {
    result.innerHTML = '<p class="small">Ошибка при получении данных: ' + err.message + '</p>';
  }
});

function renderAll(data) {
  const u = data.user;
  const c = data.country;
  const ex = data.exchange;
  const news = data.news || [];

  let html = '';

  html += `<div class="card">
    <img src="${u.picture}" alt="avatar" />
    <div class="meta">
      <div class="section-title">Пользователь</div>
      <div><strong>${u.firstName} ${u.lastName}</strong> — ${u.gender}</div>
      <div class="small">Возраст: ${u.age} (родился: ${new Date(u.dob).toLocaleDateString()})</div>
      <div class="small">Город: ${u.city}, Страна: ${u.country}</div>
      <div class="small">Адрес: ${u.street}</div>
    </div>
  </div>`;

  if (c) {
    html += `<div class="card">
      <img src="${c.flag}" alt="flag" />
      <div class="meta">
        <div class="section-title">Страна: ${c.name}</div>
        <div class="small">Столица: ${c.capital || '—'}</div>
        <div class="small">Языки: ${c.languages.length ? c.languages.join(', ') : '—'}</div>
        <div class="small">Валюта: ${data.currency.code || '—'} ${data.currency.name ? ' — ' + data.currency.name : ''}</div>
      </div>
    </div>`;
  } else {
    html += `<div class="card"><div class="meta"><div class="section-title">Информация о стране недоступна</div></div></div>`;
  }

  html += `<div class="card"><div class="meta"><div class="section-title">Курсы обмена</div>`;
  if (ex && ex.base) {
    html += `<div class="small">${ex.toUSD || '—'}</div><div class="small">${ex.toKZT || '—'}</div>`;
  } else {
    html += `<div class="small">Курсы недоступны (проверьте EXCHANGE_API_KEY)</div>`;
  }
  html += `</div></div>`;

  html += `<div><div class="section-title">Новости (заголовки, содержащие название страны)</div>`;
  if (news.length === 0) {
    html += `<div class="card"><div class="meta small">Новостей не найдено (или NEWS_API_KEY не задан)</div></div>`;
  } else {
    html += `<div class="news-grid">`;
    news.forEach(n => {
      html += `<div class="card news-card" style="flex-direction:column; align-items:stretch;">
        ${n.image ? `<img src="${n.image}" alt="thumb" />` : ''}
        <div class="meta">
          <div><strong>${n.title}</strong></div>
          <div class="small">${n.description || ''}</div>
          <div class="small">Источник: <a href="${n.url}" target="_blank">${n.source}</a></div>
        </div>
      </div>`;
    });
    html += `</div>`;
  }
  html += `</div>`;

  result.innerHTML = html;
}
