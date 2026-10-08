/**
 * Telegram Mini App integration.
 * Safe no-op when not inside Telegram.
 */
export const TelegramManager = {
  tg: null,
  isTelegram: false,

  init() {
    try {
      this.tg = window.Telegram?.WebApp;
      if (!this.tg) return false;
      this.isTelegram = true;
      this.tg.ready();
      this.tg.expand();
      this.applyTheme();
      this.tg.onEvent?.('fullscreenChanged', () => this._onFs());
      this.tg.onEvent?.('fullscreenFailed', (e) => console.warn('[TG] fullscreenFailed', e));
      this.tg.onEvent?.('viewportChanged', () => this._onViewport());
      // Safe area CSS vars
      this._applySafeArea();
      return true;
    } catch (e) {
      console.warn('[TG] init failed', e);
      return false;
    }
  },

  applyTheme() {
    if (!this.tg) return;
    const p = this.tg.themeParams || {};
    const root = document.documentElement;
    if (p.bg_color) root.style.setProperty('--tg-bg', p.bg_color);
    if (p.text_color) root.style.setProperty('--tg-text', p.text_color);
    if (p.button_color) root.style.setProperty('--tg-button', p.button_color);
    if (p.secondary_bg_color) root.style.setProperty('--tg-secondary', p.secondary_bg_color);
    try {
      this.tg.setHeaderColor?.(p.bg_color || '#0d1117');
      this.tg.setBackgroundColor?.(p.bg_color || '#0d1117');
    } catch {}
  },

  _applySafeArea() {
    if (!this.tg) return;
    const sa = this.tg.safeAreaInset || {};
    const csa = this.tg.contentSafeAreaInset || {};
    const root = document.documentElement;
    root.style.setProperty('--safe-top', (sa.top || csa.top || 0) + 'px');
    root.style.setProperty('--safe-bottom', (sa.bottom || csa.bottom || 0) + 'px');
    root.style.setProperty('--safe-left', (sa.left || csa.left || 0) + 'px');
    root.style.setProperty('--safe-right', (sa.right || csa.right || 0) + 'px');
  },

  _onFs() {
    document.body.classList.toggle('tg-fullscreen', !!this.tg?.isFullscreen);
  },

  _onViewport() {
    this._applySafeArea();
    window.dispatchEvent(new Event('resize'));
  },

  async requestFullscreen() {
    if (this.tg?.requestFullscreen) {
      try {
        await this.tg.requestFullscreen();
        return true;
      } catch (e) {
        console.warn('[TG] requestFullscreen failed', e);
      }
    }
    // Browser fallback
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (req) {
      try {
        await req.call(el);
        return true;
      } catch {}
    }
    return false;
  },

  async exitFullscreen() {
    if (this.tg?.exitFullscreen) {
      try {
        await this.tg.exitFullscreen();
        return;
      } catch {}
    }
    if (document.fullscreenElement) {
      const ex = document.exitFullscreen || document.webkitExitFullscreen;
      if (ex) try { await ex.call(document); } catch {}
    }
  },

  lockLandscape() {
    try {
      this.tg?.lockOrientation?.('landscape');
    } catch {}
  },

  unlockOrientation() {
    try {
      this.tg?.unlockOrientation?.();
    } catch {}
  },

  getUser() {
    return this.tg?.initDataUnsafe?.user || null;
  },
};
