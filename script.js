const SEARCH_QUERIES = [
  "clash free subscription",
  "clash proxy provider free",
  "免费 clash 订阅",
  "clash 节点 订阅",
  "clash yaml subscription",
];

const CACHE_KEY = "clashAtlasSources";
const FAVORITES_KEY = "clashAtlasFavorites";
const THEME_KEY = "clashAtlasTheme";
const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

const seedSources = [
  {
    id: "seed-github-search-clash",
    name: "GitHub Clash 免费订阅搜索",
    category: "搜索入口",
    description: "GitHub 上公开的 Clash 免费订阅相关项目搜索结果。",
    url: "https://github.com/search?q=clash+free+subscription&type=repositories&s=updated&o=desc",
    repoUrl: "https://github.com/search?q=clash+free+subscription&type=repositories&s=updated&o=desc",
    tags: ["GitHub", "搜索", "实时"],
    stars: null,
    updatedAt: new Date().toISOString(),
    source: "内置入口",
  },
  {
    id: "seed-github-search-cn",
    name: "GitHub 中文 Clash 订阅搜索",
    category: "搜索入口",
    description: "按中文关键词搜索公开免费 Clash 订阅项目。",
    url: "https://github.com/search?q=%E5%85%8D%E8%B4%B9+clash+%E8%AE%A2%E9%98%85&type=repositories&s=updated&o=desc",
    repoUrl: "https://github.com/search?q=%E5%85%8D%E8%B4%B9+clash+%E8%AE%A2%E9%98%85&type=repositories&s=updated&o=desc",
    tags: ["中文", "免费", "订阅"],
    stars: null,
    updatedAt: new Date().toISOString(),
    source: "内置入口",
  },
];

const cachedSources = JSON.parse(localStorage.getItem(CACHE_KEY) || "[]");

const state = {
  category: "全部",
  query: "",
  loading: false,
  sources: mergeSources([...seedSources, ...cachedSources]),
  favorites: new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]")),
  lastUpdated: localStorage.getItem("clashAtlasLastUpdated") || "",
};

const sourceGrid = document.querySelector("#sourceGrid");
const categoryFilters = document.querySelector("#categoryFilters");
const searchInput = document.querySelector("#searchInput");
const resultCount = document.querySelector("#resultCount");
const totalCount = document.querySelector("#totalCount");
const favoriteCount = document.querySelector("#favoriteCount");
const lastUpdated = document.querySelector("#lastUpdated");
const collectorStatus = document.querySelector("#collectorStatus");
const refreshButton = document.querySelector("#refreshButton");
const themeToggle = document.querySelector("#themeToggle");

function syncIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function mergeSources(items) {
  const byId = new Map();
  for (const item of items) {
    byId.set(item.id, { ...byId.get(item.id), ...item });
  }
  return [...byId.values()].sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
}

function saveSources() {
  const dynamicSources = state.sources.filter((item) => !item.id.startsWith("seed-")).slice(0, 120);
  localStorage.setItem(CACHE_KEY, JSON.stringify(dynamicSources));
}

function saveFavorites() {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...state.favorites]));
}

function categories() {
  return ["全部", "订阅项目", "搜索入口", "今日更新", "已收藏"];
}

function formatDate(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
}

function formatTime(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

function isToday(value) {
  const date = new Date(value);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function repoToSource(repo) {
  const homepage = normalizeUrl(repo.homepage);
  const repoUrl = repo.html_url;
  const text = `${repo.name} ${repo.description || ""}`.toLowerCase();
  const tags = ["GitHub", repo.language, repo.license?.spdx_id]
    .filter(Boolean)
    .concat(text.includes("yaml") || text.includes("yml") ? ["YAML"] : [])
    .concat(text.includes("sub") || text.includes("订阅") ? ["订阅"] : [])
    .concat(text.includes("free") || text.includes("免费") ? ["免费"] : []);

  return {
    id: `repo-${repo.full_name.toLowerCase()}`,
    name: repo.full_name,
    category: "订阅项目",
    description: repo.description || "公开 Clash 相关仓库，请进入 README 查看订阅地址、更新时间和使用说明。",
    url: homepage || repoUrl,
    repoUrl,
    tags: [...new Set(tags)].slice(0, 6),
    stars: repo.stargazers_count,
    updatedAt: repo.updated_at,
    source: "GitHub Search",
  };
}

function normalizeUrl(value) {
  if (!value || typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return "";
}

async function searchGithub(query) {
  const params = new URLSearchParams({
    q: query,
    sort: "updated",
    order: "desc",
    per_page: "12",
  });

  const response = await fetch(`https://api.github.com/search/repositories?${params}`, {
    headers: { Accept: "application/vnd.github+json" },
  });

  if (!response.ok) {
    throw new Error(`GitHub 搜索失败：${response.status}`);
  }

  const data = await response.json();
  return (data.items || []).map(repoToSource);
}

async function refreshSources(reason = "auto") {
  if (state.loading) return;

  state.loading = true;
  refreshButton.disabled = true;
  collectorStatus.textContent = reason === "manual" ? "正在从 GitHub 立即更新..." : "正在从 GitHub 自动搜集...";
  syncIcons();

  try {
    const settled = await Promise.allSettled(SEARCH_QUERIES.map(searchGithub));
    const successful = settled.filter((result) => result.status === "fulfilled");
    if (!successful.length) {
      throw new Error("All GitHub searches failed");
    }

    const found = successful.flatMap((result) => result.value);
    const before = state.sources.length;
    state.sources = mergeSources([...state.sources, ...found]);
    state.lastUpdated = new Date().toISOString();
    localStorage.setItem("clashAtlasLastUpdated", state.lastUpdated);
    saveSources();
    render();

    const added = state.sources.length - before;
    collectorStatus.textContent = added
      ? `已新增 ${added} 个公开项目，页面会每 10 分钟自动刷新`
      : "已同步 GitHub，暂时没有新的公开项目";
  } catch (error) {
    collectorStatus.textContent = "GitHub API 暂时不可用或达到限额，稍后会自动重试";
  } finally {
    state.loading = false;
    refreshButton.disabled = false;
    syncIcons();
  }
}

function matchesSource(item) {
  const query = state.query.trim().toLowerCase();
  const categoryMatched =
    state.category === "全部" ||
    item.category === state.category ||
    (state.category === "今日更新" && isToday(item.updatedAt)) ||
    (state.category === "已收藏" && state.favorites.has(item.id));

  const searchable = [item.name, item.category, item.description, item.source, item.url, item.repoUrl, ...item.tags]
    .join(" ")
    .toLowerCase();

  return categoryMatched && (!query || searchable.includes(query));
}

function renderFilters() {
  categoryFilters.innerHTML = categories()
    .map(
      (category) => `
        <button class="filter-chip" type="button" data-category="${category}" aria-pressed="${category === state.category}">
          ${category}
        </button>
      `,
    )
    .join("");
}

function renderSources() {
  const items = state.sources.filter(matchesSource);
  resultCount.textContent = String(items.length);
  totalCount.textContent = String(state.sources.length);
  favoriteCount.textContent = String(state.favorites.size);
  lastUpdated.textContent = formatTime(state.lastUpdated);

  if (!items.length) {
    sourceGrid.innerHTML = '<div class="empty-state">没有找到匹配项目。换个关键词试试，或点击“立即更新”。</div>';
    return;
  }

  sourceGrid.innerHTML = items
    .map((item) => {
      const favorite = state.favorites.has(item.id);
      const stars = Number.isFinite(item.stars) ? `${item.stars.toLocaleString("zh-CN")} stars` : item.source;

      return `
        <article class="source-card">
          <div class="card-head">
            <div>
              <p class="eyebrow">${item.category}</p>
              <h2>${escapeHtml(item.name)}</h2>
            </div>
            <button class="favorite-button ${favorite ? "active" : ""}" type="button" data-favorite="${item.id}" title="收藏">
              <i data-lucide="star"></i>
            </button>
          </div>
          <p class="description">${escapeHtml(item.description)}</p>
          <div class="meta-row">
            <span><i data-lucide="calendar-clock"></i>${formatDate(item.updatedAt)}</span>
            <span><i data-lucide="star"></i>${stars}</span>
          </div>
          <div class="tag-row">
            ${item.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
          </div>
          <div class="card-actions">
            <a class="action-button primary" href="${escapeAttribute(item.url)}" target="_blank" rel="noreferrer">
              <i data-lucide="external-link"></i>
              <span>打开入口</span>
            </a>
            <a class="action-button" href="${escapeAttribute(item.repoUrl)}" target="_blank" rel="noreferrer">
              <i data-lucide="github"></i>
              <span>查看仓库</span>
            </a>
            <button class="action-button" type="button" data-copy="${escapeAttribute(item.url)}">
              <i data-lucide="copy"></i>
              <span>复制链接</span>
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

function render() {
  renderFilters();
  renderSources();
  syncIcons();
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return map[char];
  });
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

async function copyText(value) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const input = document.createElement("input");
  input.value = value;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.append(input);
  input.select();
  document.execCommand("copy");
  input.remove();
}

categoryFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  state.category = button.dataset.category;
  render();
});

sourceGrid.addEventListener("click", async (event) => {
  const favoriteButton = event.target.closest("[data-favorite]");
  const copyButton = event.target.closest("[data-copy]");

  if (favoriteButton) {
    const id = favoriteButton.dataset.favorite;
    if (state.favorites.has(id)) {
      state.favorites.delete(id);
    } else {
      state.favorites.add(id);
    }
    saveFavorites();
    render();
  }

  if (copyButton) {
    await copyText(copyButton.dataset.copy);
    copyButton.querySelector("span").textContent = "已复制";
    setTimeout(() => {
      copyButton.querySelector("span").textContent = "复制链接";
    }, 1300);
  }
});

searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderSources();
  syncIcons();
});

refreshButton.addEventListener("click", () => refreshSources("manual"));

themeToggle.addEventListener("click", () => {
  const root = document.documentElement;
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  localStorage.setItem(THEME_KEY, next);
  themeToggle.innerHTML = `<i data-lucide="${next === "dark" ? "sun" : "moon"}"></i>`;
  syncIcons();
});

document.documentElement.dataset.theme = localStorage.getItem(THEME_KEY) || "light";
themeToggle.innerHTML = `<i data-lucide="${document.documentElement.dataset.theme === "dark" ? "sun" : "moon"}"></i>`;

render();
collectorStatus.textContent = state.lastUpdated
  ? `已加载缓存，最近更新于 ${formatTime(state.lastUpdated)}`
  : "正在从 GitHub 搜集公开项目...";

refreshSources("auto");
setInterval(() => refreshSources("auto"), REFRESH_INTERVAL_MS);
