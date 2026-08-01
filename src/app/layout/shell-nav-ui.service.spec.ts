import { describe, expect, it } from 'vitest';

import { ShellNavUiService } from './shell-nav-ui.service';

describe('ShellNavUiService', () => {
  it('abre, cierra y alterna el menú móvil', () => {
    const nav = new ShellNavUiService();
    expect(nav.mobileNavOpen()).toBe(false);

    nav.openNav();
    expect(nav.mobileNavOpen()).toBe(true);

    nav.closeNav();
    expect(nav.mobileNavOpen()).toBe(false);

    nav.toggleNav();
    expect(nav.mobileNavOpen()).toBe(true);

    nav.toggleNav();
    expect(nav.mobileNavOpen()).toBe(false);
  });
});
