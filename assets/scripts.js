/**
 * Loon Scripts - Plugin Subscription Page
 * Dynamically loads plugins from plugins.json
 */

// Configuration
const CONFIG = {
    // Base URL - will be auto-detected for Cloudflare Pages
    baseUrl: '',
    pluginsJsonPath: 'plugins.json'
};

// State
let allPlugins = [];
let categories = [];
let currentCategory = 'all';

// Icons mapping
const ICONS = {
    'message-circle': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>`,
    'tool': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>`,
    'shield': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
    'default': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg>`
};

/**
 * Get the base URL for the site
 */
function getBaseUrl() {
    // For Cloudflare Pages or any hosted environment
    const url = new URL(window.location.href);
    return url.origin + url.pathname.replace(/\/[^\/]*$/, '');
}

/**
 * Get the full URL for a plugin file
 */
function getPluginUrl(path) {
    const base = getBaseUrl();
    return `${base}/${path}`;
}

/**
 * Load plugins from JSON file
 */
async function loadPlugins() {
    try {
        const response = await fetch(CONFIG.pluginsJsonPath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        categories = data.categories || [];
        allPlugins = data.plugins || [];

        renderCategoryNav();
        renderPlugins();
        hideLoading();
    } catch (error) {
        console.error('Failed to load plugins:', error);
        showError('加载插件失败，请刷新页面重试');
    }
}

/**
 * Render category navigation
 */
function renderCategoryNav() {
    const nav = document.getElementById('categoryNav');

    // Keep the "All" button, add category buttons
    categories.forEach(category => {
        const btn = document.createElement('button');
        btn.className = 'category-btn';
        btn.dataset.category = category.id;
        btn.innerHTML = `
            ${ICONS[category.icon] || ICONS.default}
            ${category.name}
        `;
        btn.addEventListener('click', () => filterByCategory(category.id));
        nav.appendChild(btn);
    });

    // Add click handler for "All" button
    document.querySelector('[data-category="all"]').addEventListener('click', () => filterByCategory('all'));
}

/**
 * Filter plugins by category
 */
function filterByCategory(categoryId) {
    currentCategory = categoryId;

    // Update active state
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === categoryId);
    });

    renderPlugins();
}

/**
 * Render plugins grid
 */
function renderPlugins() {
    const grid = document.getElementById('scriptsGrid');
    grid.innerHTML = '';

    const filteredPlugins = currentCategory === 'all'
        ? allPlugins
        : allPlugins.filter(p => p.category === currentCategory);

    if (filteredPlugins.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <h3>暂无插件</h3>
                <p>该分类下暂无插件</p>
            </div>
        `;
        return;
    }

    filteredPlugins.forEach((plugin, index) => {
        const card = createPluginCard(plugin, index);
        grid.appendChild(card);
    });
}

/**
 * Create a plugin card element
 */
function createPluginCard(plugin, index) {
    const card = document.createElement('div');
    card.className = 'script-card';
    card.style.animationDelay = `${index * 0.08}s`;

    const url = getPluginUrl(plugin.path);
    card.dataset.url = url;

    const category = categories.find(c => c.id === plugin.category);
    const categoryName = category ? category.name : '其他';

    card.innerHTML = `
        <div class="card-header">
            <div class="card-icon">
                ${plugin.icon
            ? `<img src="${plugin.icon}" alt="${plugin.name}" loading="lazy" onerror="this.style.display='none'">`
            : ICONS.tool
        }
            </div>
            <div class="card-title-group">
                <h3 class="card-title">${escapeHtml(plugin.name)}</h3>
                <div class="card-author">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    ${escapeHtml(plugin.author)}
                </div>
            </div>
        </div>
        <p class="card-description">${escapeHtml(plugin.description)}</p>
        <div class="card-footer">
            <div class="card-meta">
                <span class="meta-tag category-tag">
                    ${ICONS[category?.icon] || ICONS.default}
                    ${categoryName}
                </span>
                ${plugin.version ? `
                    <span class="meta-tag version-tag">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                            <line x1="7" y1="7" x2="7.01" y2="7"></line>
                        </svg>
                        v${escapeHtml(plugin.version)}
                    </span>
                ` : ''}
            </div>
            <div class="copy-hint">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                点击复制
            </div>
        </div>
    `;

    card.addEventListener('click', () => copyToClipboard(url));

    return card;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('已复制到剪贴板');
    } catch (err) {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            showToast('已复制到剪贴板');
        } catch (e) {
            showToast('复制失败，请手动复制', 'error');
        }
        document.body.removeChild(textarea);
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

/**
 * Hide loading state
 */
function hideLoading() {
    const loading = document.getElementById('loading');
    loading.style.display = 'none';
}

/**
 * Show error message
 */
function showError(message) {
    const loading = document.getElementById('loading');
    loading.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px; color: #ef4444;">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p style="color: #ef4444; margin-top: 16px;">${message}</p>
        <button onclick="location.reload()" style="margin-top: 16px; padding: 8px 16px; background: var(--color-accent); color: white; border: none; border-radius: 8px; cursor: pointer;">
            刷新页面
        </button>
    `;
}

/**
 * Initialize the page
 */
function init() {
    CONFIG.baseUrl = getBaseUrl();
    loadPlugins();

    // Add keyboard shortcut
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const toast = document.getElementById('toast');
            toast.classList.remove('show');
        }
    });
}

// Run on page load
document.addEventListener('DOMContentLoaded', init);
