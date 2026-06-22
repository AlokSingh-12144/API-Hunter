const modeToggle = document.getElementById('mode-toggle');
const themeToggle = document.getElementById('theme-toggle');
const searchForm = document.getElementById('search-form');
const username1Input = document.getElementById('username-1');
const group2 = document.getElementById('group-2');
const username2Input = document.getElementById('username-2');
const label1 = document.getElementById('label-1');
const submitBtn = document.getElementById('submit-btn');
const loader = document.getElementById('loader');
const resultsSection = document.getElementById('results');

let isBattleMode = false;

if (localStorage.getItem('theme') === 'light') {
  document.body.classList.add('light-mode');
  themeToggle.querySelector('i').className = 'fas fa-sun';
}

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
  const isLight = document.body.classList.contains('light-mode');
  themeToggle.querySelector('i').className = isLight ? 'fas fa-sun' : 'fas fa-moon';
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
});

modeToggle.addEventListener('click', () => {
  isBattleMode = !isBattleMode;
  modeToggle.setAttribute('aria-pressed', isBattleMode);
  if (isBattleMode) {
    modeToggle.textContent = 'Switch to Single Mode';
    label1.textContent = 'Player 1 Username';
    group2.classList.remove('hidden');
    username2Input.required = true;
    submitBtn.textContent = 'Battle!';
  } else {
    modeToggle.textContent = 'Switch to Battle Mode';
    label1.textContent = 'GitHub Username';
    group2.classList.add('hidden');
    username2Input.required = false;
    username2Input.value = '';
    submitBtn.textContent = 'Search Profile';
  }
});

function formatDate(isoString) {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

async function fetchUserData(username) {
  const userRes = await fetch(`https://api.github.com/users/${username}`);
  if (!userRes.ok) {
    throw new Error(userRes.status === 404 ? `User "${username}" Not Found` : `API Error: ${userRes.statusText}`);
  }
  const user = await userRes.json();
  const reposRes = await fetch(user.repos_url);
  if (!reposRes.ok) {
    throw new Error(`Failed to load repositories for "${username}"`);
  }
  const repos = await reposRes.json();
  return { user: user, repos: repos };
}

function renderProfileCard(playerData, roleClass = '', badgeText = '', totalStars = null) {
  const user = playerData.user;
  const repos = playerData.repos;
  const sortedRepos = [...repos].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
  const reposListHTML = sortedRepos.map(repo => `
    <li class="repo-item">
      <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">${repo.name}</a>
    </li>
  `).join('');

  return `
    <article class="profile-card ${roleClass}">
      ${badgeText ? `<div class="battle-badge">${badgeText}</div>` : ''}
      <div class="profile-header">
        <img src="${user.avatar_url}" alt="${user.name || user.login}'s avatar" class="avatar" width="80" height="80">
        <div class="profile-meta">
          <h2>${user.name || user.login}</h2>
          <span class="join-date">Joined ${formatDate(user.created_at)}</span>
        </div>
      </div>
      <p class="bio">${user.bio || 'This profile has no bio.'}</p>
      <a href="${user.blog || user.html_url}" class="portfolio-link" target="_blank" rel="noopener noreferrer">${user.blog || 'Visit Portfolio'}</a>
      ${totalStars !== null ? `
        <div class="stats-container">
          <div class="stat-item">
            <span class="stat-label">Total Stars</span>
            <span class="stat-val">${totalStars}</span>
          </div>
        </div>
      ` : ''}
      <div class="repos-section">
        <h3>Latest Repositories</h3>
        <ul class="repos-list">
          ${reposListHTML || '<li class="repo-item">No public repositories found.</li>'}
        </ul>
      </div>
    </article>
  `;
}

searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  resultsSection.innerHTML = '';
  loader.classList.remove('hidden');
  const u1 = username1Input.value.trim();
  const u2 = username2Input.value.trim();
  try {
    if (isBattleMode) {
      const players = await Promise.all([fetchUserData(u1), fetchUserData(u2)]);
      const player1 = players[0];
      const player2 = players[1];
      const stars1 = player1.repos.reduce((acc, repo) => acc + (repo.stargazers_count || 0), 0);
      const stars2 = player2.repos.reduce((acc, repo) => acc + (repo.stargazers_count || 0), 0);
      let badge1 = 'Tie', badge2 = 'Tie', class1 = '', class2 = '';
      if (stars1 > stars2) {
        badge1 = 'Winner'; badge2 = 'Loser'; class1 = 'winner'; class2 = 'loser';
      } else if (stars2 > stars1) {
        badge1 = 'Loser'; badge2 = 'Winner'; class1 = 'loser'; class2 = 'winner';
      }
      resultsSection.innerHTML = renderProfileCard(player1, class1, badge1, stars1) + renderProfileCard(player2, class2, badge2, stars2);
    } else {
      const playerData = await fetchUserData(u1);
      resultsSection.innerHTML = renderProfileCard(playerData);
    }
  } catch (error) {
    resultsSection.innerHTML = `<div class="error-message" role="alert">${error.message.includes('Not Found') ? 'User Not Found' : error.message}</div>`;
  } finally {
    loader.classList.add('hidden');
  }
});
