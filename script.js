// 核心配置
const GITHUB_USER = '25eqsg3f08-stack'; // 你的GitHub用户名
const SEARCH_PLACEHOLDER = '搜索仓库/搜索关键词...';
const AUTO_REFRESH_INTERVAL = 30000; // 自动刷新间隔（30秒，单位：毫秒）
const GITHUB_IO_DOMAIN = `${GITHUB_USER}.github.io`; // 静态页域名

// DOM元素
const dom = {
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    jumpToHtml: document.getElementById('jump-to-html'),
    repoList: document.getElementById('repo-list'),
    loading: document.getElementById('loading'),
    error: document.getElementById('error')
};

// 初始化事件监听
function initEventListeners() {
    dom.searchBtn.addEventListener('click', searchRepos);
    dom.searchInput.addEventListener('keypress', e => e.key === 'Enter' && searchRepos());
    dom.jumpToHtml.addEventListener('change', () => {
        // 勾选状态变化时，重新渲染链接（无需刷新页面）
        const searchTerm = dom.searchInput.value.trim().toLowerCase();
        fetchAllRepos().then(() => searchTerm && searchRepos());
    });
}

// 自动刷新逻辑
function startAutoRefresh() {
    setInterval(() => {
        console.log('自动刷新仓库数据...');
        const searchTerm = dom.searchInput.value.trim().toLowerCase();
        fetchAllRepos().then(() => searchTerm && searchRepos());
    }, AUTO_REFRESH_INTERVAL);
}

// 拉取所有仓库
async function fetchAllRepos() {
    dom.repoList.innerHTML = '';
    dom.loading.style.display = 'block';
    dom.error.style.display = 'none';
    dom.searchInput.placeholder = SEARCH_PLACEHOLDER;

    try {
        const response = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100`);
        if (!response.ok) throw new Error('获取仓库失败');

        const allRepos = await response.json();
        localStorage.setItem('allRepos', JSON.stringify(allRepos)); // 缓存仓库数据

        if (allRepos.length === 0) {
            dom.repoList.innerHTML = '<li>暂无仓库</li>';
            return;
        }

        // 初始渲染所有仓库（根据勾选状态生成对应链接）
        renderRepos(allRepos, '');
    } catch (err) {
        dom.error.textContent = `错误：${err.message}`;
        dom.error.style.display = 'block';
    } finally {
        dom.loading.style.display = 'none';
    }
}

// 渲染仓库列表（支持高亮+双跳转模式）
function renderRepos(repos, searchTerm) {
    dom.repoList.innerHTML = '';
    repos.forEach(repo => {
        const li = document.createElement('li');
        const fullText = `${repo.name} ${repo.description || ''}`;
        
        // 关键词高亮（黄色背景）
        let nameHtml = repo.name;
        let descHtml = repo.description || '';
        if (searchTerm) {
            const regex = new RegExp(`(${searchTerm})`, 'gi');
            nameHtml = repo.name.replace(regex, '<mark style="background: #fff3cd; color: #333;">$1</mark>');
            descHtml = repo.description ? repo.description.replace(regex, '<mark style="background: #fff3cd; color: #333;">$1</mark>') : '';
        }

        // 生成跳转链接：勾选则跳index.html，否则跳仓库主页
        const jumpUrl = dom.jumpToHtml.checked 
            ? `https://${GITHUB_IO_DOMAIN}/${repo.name}/index.html` 
            : repo.html_url;

        li.innerHTML = `
            <a href="${jumpUrl}" target="_blank">${nameHtml}</a>
            ${descHtml ? `- ${descHtml}` : ''}
            （更新于: ${new Date(repo.updated_at).toLocaleDateString()}）
        `;
        dom.repoList.appendChild(li);
    });
}

// 搜索+高亮功能
function searchRepos() {
    const searchTerm = dom.searchInput.value.trim().toLowerCase();
    if (!searchTerm) {
        const allRepos = JSON.parse(localStorage.getItem('allRepos') || '[]');
        renderRepos(allRepos, '');
        return;
    }

    const allRepos = JSON.parse(localStorage.getItem('allRepos') || '[]');
    const filteredRepos = allRepos.filter(repo => 
        `${repo.name} ${repo.description || ''}`.toLowerCase().includes(searchTerm)
    );

    if (filteredRepos.length === 0) {
        dom.repoList.innerHTML = `<li>未找到包含"${searchTerm}"的仓库</li>`;
        return;
    }

    renderRepos(filteredRepos, searchTerm);
}

// 初始化
function init() {
    initEventListeners();
    fetchAllRepos();
    startAutoRefresh(); // 启动自动刷新
}

init();
