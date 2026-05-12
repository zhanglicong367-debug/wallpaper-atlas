const seedWallpapers = [
  {
    id: "seed-alpine-light",
    title: "晨光雪岭",
    category: "自然",
    resolution: "5120 x 2880",
    tone: "冷调",
    source: "精选",
    author: "Unsplash",
    tags: ["山川", "雪", "5K"],
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2400&q=85",
    pageUrl: "https://unsplash.com/",
  },
  {
    id: "seed-neon-city",
    title: "霓虹雨夜",
    category: "城市",
    resolution: "3840 x 2160",
    tone: "高对比",
    source: "精选",
    author: "Unsplash",
    tags: ["夜景", "街道", "4K"],
    url: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=2400&q=85",
    pageUrl: "https://unsplash.com/",
  },
  {
    id: "seed-soft-minimal",
    title: "柔光几何",
    category: "极简",
    resolution: "3840 x 2400",
    tone: "暖调",
    source: "精选",
    author: "Unsplash",
    tags: ["留白", "桌面", "4K"],
    url: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&w=2400&q=85",
    pageUrl: "https://unsplash.com/",
  },
];

const collectorTopics = [
  { category: "自然", query: "landscape wallpaper mountains forest lake", tags: ["自然", "山川", "森林"] },
  { category: "城市", query: "city skyline night architecture wallpaper", tags: ["城市", "建筑", "夜景"] },
  { category: "天空", query: "aurora stars clouds sky wallpaper", tags: ["天空", "星空", "极光"] },
  { category: "海洋", query: "ocean coast wave beach wallpaper", tags: ["海洋", "海岸", "波浪"] },
  { category: "极简", query: "minimal abstract gradient texture wallpaper", tags: ["极简", "抽象", "纹理"] },
  { category: "工作区", query: "desk setup workspace computer wallpaper", tags: ["工作区", "桌面", "效率"] },
];

const state = {
  category: "全部",
  query: "",
  page: Number(localStorage.getItem("wallpaperCollectorPage") || "1"),
  loading: false,
  wallpapers: [...seedWallpapers],
  favorites: new Set(JSON.parse(localStorage.getItem("wallpaperFavorites") || "[]")),
};

const gallery = document.querySelector("#gallery");
const categoryFilters = document.querySelector("#categoryFilters");
const searchInput = document.querySelector("#searchInput");
const resultCount = document.querySelector("#resultCount");
const totalCount = document.querySelector("#totalCount");
const favoriteCount = document.querySelector("#favoriteCount");
const collectorStatus = document.querySelector("#collectorStatus");
const collectMore = document.querySelector("#collectMore");
const previewDialog = document.querySelector("#previewDialog");
const previewImage = document.querySelector("#previewImage");
const previewTitle = document.querySelector("#previewTitle");
const previewCategory = document.querySelector("#previewCategory");
const previewMeta = document.querySelector("#previewMeta");
const openSource = document.querySelector("#openSource");
const copyLink = document.querySelector("#copyLink");
const closePreview = document.querySelector("#closePreview");
const themeToggle = document.querySelector("#themeToggle");

function syncIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function saveFavorites() {
  localStorage.setItem("wallpaperFavorites", JSON.stringify([...state.favorites]));
}

function categories() {
  return ["全部", ...new Set(state.wallpapers.map((item) => item.category)), "收藏"];
}

function cleanTitle(text, fallback) {
  return (text || fallback)
    .replace(/\.(jpg|jpeg|png|webp|tif|tiff)$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 48);
}

function wallpaperTone(width, height) {
  const ratio = width / Math.max(height, 1);
  if (ratio >= 1.7) return "宽屏";
  if (ratio >= 1.45) return "桌面";
  return "竖图裁切";
}

function upsertWallpapers(items) {
  const existing = new Set(state.wallpapers.map((item) => item.id));
  const fresh = items.filter((item) => !existing.has(item.id));
  state.wallpapers = [...state.wallpapers, ...fresh];
  return fresh.length;
}

async function collectFromCommons(topic, page) {
  const params = new URLSearchParams({
    origin: "*",
    action: "query",
    format: "json",
    generator: "search",
    gsrnamespace: "6",
    gsrlimit: "12",
    gsroffset: String((page - 1) * 12),
    gsrsearch: topic.query,
    prop: "imageinfo",
    iiprop: "url|size|mime|extmetadata",
    iiurlwidth: "1400",
  });

  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`);
  if (!response.ok) throw new Error("Commons request failed");
  const data = await response.json();
  const pages = Object.values(data.query?.pages || {});

  return pages
    .map((pageInfo) => {
      const image = pageInfo.imageinfo?.[0];
      if (!image || !image.mime?.startsWith("image/")) return null;
      if (image.width < 1400 || image.height < 800) return null;

      const meta = image.extmetadata || {};
      const title = cleanTitle(meta.ObjectName?.value || pageInfo.title.replace(/^File:/, ""), topic.category);
      const author = cleanTitle(meta.Artist?.value?.replace(/<[^>]+>/g, ""), "Wikimedia Commons");

      return {
        id: `commons-${pageInfo.pageid}`,
        title,
        category: topic.category,
        resolution: `${image.width} x ${image.height}`,
        tone: wallpaperTone(image.width, image.height),
        source: "Wikimedia Commons",
        author,
        tags: [...topic.tags, "开放图片"],
        url: image.thumburl || image.url,
        pageUrl: image.descriptionurl,
      };
    })
    .filter(Boolean);
}

async function collectFromPicsum(page) {
  const response = await fetch(`https://picsum.photos/v2/list?page=${page}&limit=24`);
  if (!response.ok) throw new Error("Picsum request failed");
  const items = await response.json();

  return items
    .filter((item) => Number(item.width) >= 1400 && Number(item.height) >= 800)
    .map((item) => ({
      id: `picsum-${item.id}`,
      title: `摄影壁纸 ${item.id}`,
      category: "摄影",
      resolution: `${item.width} x ${item.height}`,
      tone: wallpaperTone(Number(item.width), Number(item.height)),
      source: "Picsum",
      author: item.author,
      tags: ["摄影", "随机", "高清"],
      url: `https://picsum.photos/id/${item.id}/2400/1350`,
      pageUrl: item.url,
    }));
}

async function collectWallpapers() {
  if (state.loading) return;

  state.loading = true;
  collectMore.disabled = true;
  collectorStatus.textContent = "正在自动搜集壁纸...";

  try {
    const page = state.page;
    const topicRequests = collectorTopics.map((topic) => collectFromCommons(topic, page));
    const results = await Promise.allSettled([...topicRequests, collectFromPicsum(page)]);
    const items = results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
    const added = upsertWallpapers(items);

    state.page += 1;
    localStorage.setItem("wallpaperCollectorPage", String(state.page));
    collectorStatus.textContent = added ? `新搜集 ${added} 张壁纸` : "这批没有新图，继续试试";
    renderFilters();
    renderGallery();
  } catch (error) {
    collectorStatus.textContent = "搜集失败，稍后再试";
  } finally {
    state.loading = false;
    collectMore.disabled = false;
    syncIcons();
  }
}

function matchesWallpaper(item) {
  const query = state.query.trim().toLowerCase();
  const inCategory =
    state.category === "全部" ||
    item.category === state.category ||
    (state.category === "收藏" && state.favorites.has(item.id));
  const searchable = [item.title, item.category, item.resolution, item.tone, item.source, item.author, ...item.tags]
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
  syncIcons();
}

function renderGallery() {
  const items = state.wallpapers.filter(matchesWallpaper);
  resultCount.textContent = String(items.length);
  totalCount.textContent = String(state.wallpapers.length);
  favoriteCount.textContent = String(state.favorites.size);

  if (!items.length) {
    gallery.innerHTML = '<div class="empty-state">没有找到匹配的壁纸，换个关键词或点“继续搜集”。</div>';
    return;
  }

  gallery.innerHTML = items
    .map((item) => {
      const favorite = state.favorites.has(item.id);
      return `
        <article class="wallpaper-card">
          <img src="${item.url}" alt="${item.title}" loading="lazy" referrerpolicy="no-referrer" />
          <div class="card-body">
            <div class="card-title-row">
              <div>
                <h2>${item.title}</h2>
                <p class="card-meta">${item.category} · ${item.resolution} · ${item.source}</p>
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
  const item = state.wallpapers.find((wallpaper) => wallpaper.id === id);
  if (!item) return;

  previewImage.src = item.url;
  previewImage.alt = item.title;
  previewTitle.textContent = item.title;
  previewCategory.textContent = item.category;
  previewMeta.textContent = `${item.resolution} · ${item.tone} · ${item.author}`;
  openSource.href = item.pageUrl || item.url;
  copyLink.dataset.url = item.url;
  previewDialog.showModal();
  syncIcons();
}

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

collectMore.addEventListener("click", collectWallpapers);
closePreview.addEventListener("click", () => previewDialog.close());

previewDialog.addEventListener("click", (event) => {
  if (event.target === previewDialog) {
    previewDialog.close();
  }
});

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
collectWallpapers();
