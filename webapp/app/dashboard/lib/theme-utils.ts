import type { DashboardSettings, ProfileCardTheme } from "../types";
import { profileCardThemes, uiThemes } from "../data/theme-presets";

export function getProfileCard(settings: DashboardSettings): ProfileCardTheme {
  return profileCardThemes.find((t) => t.id === settings.profileCardTheme) ?? profileCardThemes[0];
}

export function getTheme(settings: DashboardSettings) {
  const ui = uiThemes[settings.uiTheme] ?? uiThemes[0];
  return {
    pageBg: settings.pageBg,
    cardBg: ui.cardBg,
    cardRing: ui.cardRing,
    textMuted: ui.textMuted,
    glow: settings.glowEffects,
  };
}

export function resolveWelcomeText(
  template: string,
  vars: { firstName: string; username: string }
) {
  return template
    .replace(/\{\{first_name\}\}/g, vars.firstName)
    .replace(/\{\{username\}\}/g, vars.username);
}
