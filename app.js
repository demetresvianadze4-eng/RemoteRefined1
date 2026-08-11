const reviews = [
  { category: 'chairs', title: 'Atlas Mesh Pro', score: '9.2', art: '↟', copy: 'A deeply adjustable task chair that makes long, focused days feel lighter.' },
  { category: 'chairs', title: 'Northline Task Chair', score: '8.7', art: '◒', copy: 'The rare compact chair that still gets lumbar support and movement right.' },
  { category: 'chairs', title: 'Form Work Lounge', score: '8.5', art: '⌁', copy: 'A relaxed, design-forward seat for the hybrid office corner.' },
  { category: 'desks', title: 'Field Standing Desk', score: '9.0', art: '—', copy: 'An exceptionally steady sit-stand desk with a quiet, unfussy control system.' },
  { category: 'desks', title: 'Oakline Lift', score: '8.8', art: '⌑', copy: 'Warm solid-wood character without compromising on everyday cable management.' },
  { category: 'desks', title: 'Frame Mini', score: '8.2', art: '⌐', copy: 'The strongest small-space standing desk for an apartment setup.' },
  { category: 'video', title: 'Frame One Webcam', score: '8.8', art: '◉', copy: 'Natural color, low-light composure, and zero friction on a busy Monday.' },
  { category: 'video', title: 'Studio Light Bar', score: '8.6', art: '◒', copy: 'Soft, flattering light that disappears into your monitor setup.' },
  { category: 'video', title: 'Soundboard Mini', score: '8.4', art: '◌', copy: 'Small desktop audio with remarkable voice clarity for calls.' },
  { category: 'software', title: 'Orbit Focus', score: '9.1', art: '◐', copy: 'The calmest way we have found to shape a week around meaningful work.' },
  { category: 'software', title: 'Papertrail Notes', score: '8.9', art: '▱', copy: 'A thoughtful note system that gets out of your way at exactly the right time.' },
  { category: 'software', title: 'Pulse Planner', score: '8.3', art: '✦', copy: 'A less anxious approach to project planning for small, remote teams.' },
];

const categoryDetails = {
  chairs: { name: 'Ergonomic chairs', lead: 'Chairs that support the work you do — and the life you live around it.', accent: '#e2e2df' },
  desks: { name: 'Standing desks', lead: 'Thoughtful desks that help your workspace move with the rhythm of your day.', accent: '#dfb48e' },
  video: { name: 'Cameras & calls', lead: 'The small things that make distance feel more personal, polished, and present.', accent: '#abd4d1' },
  software: { name: 'Productivity software', lead: 'Digital tools that protect your focus instead of competing for it.', accent: '#c7c0ff' },
};

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[char]);
}

function reviewRow(review) {
  return `<a class="review-row" href="search.html?q=${encodeURIComponent(review.title)}"><span class="review-art" style="--art:${categoryDetails[review.category].accent}">${escapeHtml(review.art)}</span><span><h3>${escapeHtml(review.title)}</h3><p>${escapeHtml(review.copy)}</p></span><span class="review-score"><b>${review.score}</b>Score</span><span class="row-arrow">↗</span></a>`;
}

function setupEmailForms() {
  document.querySelectorAll('[data-subscribe]').forEach(form => {
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const feedback = form.querySelector('.form-feedback');
      const button = form.querySelector('button');
      feedback.className = 'form-feedback';
      feedback.textContent = 'Sending your hello…';
      button.disabled = true;
      try {
        const response = await fetch('/api/subscribe', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email:input.value, source:form.dataset.subscribe }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Something went wrong.');
        feedback.classList.add('success');
        feedback.textContent = result.message;
        input.value = '';
      } catch (error) {
        feedback.classList.add('error');
        feedback.textContent = error.message;
      } finally { button.disabled = false; }
    });
  });
}

function setupMobileMenu() {
  const button = document.querySelector('.mobile-toggle');
  const links = document.querySelector('.nav-links');
  if (!button || !links) return;
  button.addEventListener('click', () => { const open = links.classList.toggle('open'); button.setAttribute('aria-expanded', String(open)); });
}

function setupReveals() {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); }), { threshold:.1 });
  document.querySelectorAll('.reveal').forEach(item => observer.observe(item));
}

function setupCategoryPage() {
  const category = document.body.dataset.category;
  if (!category || !categoryDetails[category]) return;
  const detail = categoryDetails[category];
  document.title = `${detail.name} — RemoteRefined`;
  document.querySelector('[data-category-name]').textContent = detail.name;
  document.querySelector('[data-category-lead]').textContent = detail.lead;
  document.querySelector('#reviewList').innerHTML = reviews.filter(review => review.category === category).map(reviewRow).join('');
}

function setupSearchPage() {
  const results = document.querySelector('#searchResults');
  if (!results) return;
  const params = new URLSearchParams(location.search);
  const query = (params.get('q') || '').trim();
  const input = document.querySelector('#searchInput');
  input.value = query;
  const matches = query ? reviews.filter(item => `${item.title} ${item.category} ${item.copy}`.toLowerCase().includes(query.toLowerCase())) : reviews;
  document.querySelector('#resultLabel').textContent = query ? `${matches.length} result${matches.length === 1 ? '' : 's'} for “${query}”` : 'Start with a category or a product name';
  results.innerHTML = matches.length ? matches.map(reviewRow).join('') : `<div class="review-row"><span class="review-art">?</span><span><h3>No exact match yet.</h3><p>Try “chair”, “desk”, “camera”, or “software”.</p></span><span></span><span></span></div>`;
}

setupEmailForms();
setupMobileMenu();
setupReveals();
setupCategoryPage();
setupSearchPage();
