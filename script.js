const wallpapers = [
  {
    id: "alpine-light",
    title: "晨光雪岭",
    category: "自然",
    resolution: "5120 x 2880",
    tone: "冷调",
    tags: ["山川", "雪", "5K"],
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2400&q=85",
  },
  {
    id: "neon-city",
    title: "霓虹雨夜",
    category: "城市",
    resolution: "3840 x 2160",
    tone: "高对比",
    tags: ["夜景", "街道", "4K"],
    url: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=2400&q=85",
  },
  {
    id: "soft-minimal",
    title: "柔光几何",
    category: "极简",
    resolution: "3840 x 2400",
    tone: "暖调",
    tags: ["留白", "桌面", "4K"],
    url: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&w=2400&q=85",
  },
  {
    id: "forest-fog",
    title: "雾中森林",
    category: "自然",
    resolution: "4096 x 2304",
    tone: "暗绿",
    tags: ["森林", "雾", "4K"],
    url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=2400&q=85",
  },
  {
    id: "desk-setup",
    title: "安静工作台",
    category: "工作区",
    resolution: "3840 x 2160",
    tone: "中性",
    tags: ["桌面", "效率", "4K"],
    url: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=2400&q=85",
  },
  {
    id: "desert-dunes",
    title: "沙丘曲线",
    category: "自然",
    resolution: "5120 x 2880",
    tone: "暖调",
    tags: ["沙漠", "纹理", "5K"],
    url: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=2400&q=85",
  },
  {
    id: "architecture-lines",
    title: "建筑线条",
    category: "城市",
    resolution: "3840 x 2160",
    tone: "灰阶",
    tags: ["建筑", "结构", "4K"],
    url: "https://images.unsplash.com/photo-1486718448742-163732cd1544?auto=format&fit=crop&w=2400&q=85",
  },
  {
    id: "aurora-night",
    title: "极光之夜",
    category: "天空",
    resolution: "5120 x 2880",
    tone: "冷调",
    tags: ["极光", "夜空", "5K"],
    url: "https://images.unsplash.com/photo-1483347756197-71ef80e95f73?auto=format&fit=crop&w=2400&q=85",
  },
  {
    id: "abstract-glass",
    title: "玻璃流影",
    category: "抽象",
    resolution: "3840 x 2160",
    tone: "彩色",
    tags: ["抽象", "纹理", "4K"],
    url: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&w=2400&q=85",
  },
];

const state = {
  category: "全部",
  query: "",
  favorites: new Set(JSON.parse(localStorage.getItem("wallpaperFavorites") || "[]")),
};

const gallery = document.querySelector("#gallery");
const categoryFilters = document.querySelector("#categoryFilters");
const searchInput = document.querySelector("#searchInput");
const resultCount = document.querySelector("#resultCount");
const favoriteCount = document.querySelector("#favoriteCount");
const previewDialog = document.querySelector("#previewDialog");
const previewImage = document.querySelector("#previewImage");
const previewTitle = document.querySelector("#previewTitle");
const previewCategory = document.querySelector("#previewCategory");
const previewMeta = document.querySelector("#previewMeta");
const openSource = document.querySelector("#openSource");
const copyLink = document.querySelector("#copyLink");
const closePreview = document.querySelector("#closePreview");
const themeToggle = document.querySelector("#themeToggle");

function categories() {
  return ["全部", ...new Set(wallpapers.map((item) => item.category)), "收藏"];
}

function syncIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function saveFavorites() {
  localStorage.setItem("wallpaperFavorites", JSON.stringify([...state.favorites]));
}

function matchesWallpaper(item) {
  const query = state.query.trim().toLowerCase();
  const inCategory =
    state.category === "全部" ||
    item.category === state.category ||
    (state.category === "收藏" && state.favorites.has(item.id));
  const searchable = [item.title, item.category, item.resolution, item.tone, ...item.tags]
    .join(" ")
    .toLowerCase();

  return inCategory && (!query || searchable.includes(query));
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

function renderGallery() {
  const items = wallpapers.filter(matchesWallpaper);
  resultCount.textContent = String(items.length);
  favoriteCount.textContent = String(state.favorites.size);

  if (!items.length) {
    gallery.innerHTML = '<div class="empty-state">没有找到匹配的壁纸，换个关键词试试。</div>';
    return;
  }

  gallery.innerHTML = items
    .map((item) => {
      const favorite = state.favorites.has(item.id);
      return `
        <article class="wallpaper-card">
          <img src="${item.url}" alt="${item.title}" loading="lazy" />
          <div class="card-body">
            <div class="card-title-row">
              <div>
                <h2>${item.title}</h2>
                <p class="card-meta">${item.category} · ${item.resolution} · ${item.tone}</p>
              </div>
            </div>
            <div class="tag-row">
              ${item.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
            </div>
            <div class="card-actions">
              <button class="favorite-button ${favorite ? "active" : ""}" type="button" data-favorite="${item.id}" title="收藏">
                <i data-lucide="star"></i>
              </button>
              <button class="preview-button" type="button" data-preview="${item.id}">
                <i data-lucide="maximize-2"></i>
                <span>预览</span>
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  syncIcons();
}

function openPreview(id) {
  const item = wallpapers.find((wallpaper) => wallpaper.id === id);
  if (!item) return;

  previewImage.src = item.url;
  previewImage.alt = item.title;
  previewTitle.textContent = item.title;
  previewCategory.textContent = item.category;
  previewMeta.textContent = `${item.resolution} · ${item.tone} · ${item.tags.join(" / ")}`;
  openSource.href = item.url;
  copyLink.dataset.url = item.url;
  previewDialog.showModal();
  syncIcons();
}

categoryFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  state.category = button.dataset.category;
  renderFilters();
  renderGallery();
});

gallery.addEventListener("click", (event) => {
  const favoriteButton = event.target.closest("[data-favorite]");
  const previewButton = event.target.closest("[data-preview]");

  if (favoriteButton) {
    const id = favoriteButton.dataset.favorite;
    if (state.favorites.has(id)) {
      state.favorites.delete(id);
    } else {
      state.favorites.add(id);
    }
    saveFavorites();
    renderGallery();
  }

  if (previewButton) {
    openPreview(previewButton.dataset.preview);
  }
});

searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderGallery();
});

closePreview.addEventListener("click", () => previewDialog.close());

previewDialog.addEventListener("click", (event) => {
  if (event.target === previewDialog) {
    previewDialog.close();
  }
});

async function copyWallpaperUrl(url) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(url);
    return;
  }

  const input = document.createElement("input");
  input.value = url;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.append(input);
  input.select();
  document.execCommand("copy");
  input.remove();
}

copyLink.addEventListener("click", async () => {
  await copyWallpaperUrl(copyLink.dataset.url);
  copyLink.querySelector("span").textContent = "已复制";
  setTimeout(() => {
    copyLink.querySelector("span").textContent = "复制链接";
  }, 1400);
});

themeToggle.addEventListener("click", () => {
  const root = document.documentElement;
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  localStorage.setItem("wallpaperTheme", next);
  themeToggle.innerHTML = `<i data-lucide="${next === "dark" ? "sun" : "moon"}"></i>`;
  syncIcons();
});

document.documentElement.dataset.theme = localStorage.getItem("wallpaperTheme") || "light";
themeToggle.innerHTML = `<i data-lucide="${document.documentElement.dataset.theme === "dark" ? "sun" : "moon"}"></i>`;
renderFilters();
renderGallery();
syncIcons();
