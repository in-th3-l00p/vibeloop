import type { DashboardSettings, ProfileCardTheme, CssVarTheme } from "../types";
import { profileCardThemes, uiThemes } from "../data/theme-presets";

export function getProfileCard(settings: DashboardSettings): ProfileCardTheme {
  return profileCardThemes.find((t) => t.id === settings.profileCardTheme) ?? profileCardThemes[0];
}

export function getActiveTheme(settings: DashboardSettings): CssVarTheme {
  return uiThemes[settings.uiTheme] ?? uiThemes[0];
}

export function resolveWelcomeText(
  template: string,
  vars: { firstName: string; username: string }
) {
  return template
    .replace(/\{\{first_name\}\}/g, vars.firstName)
    .replace(/\{\{username\}\}/g, vars.username);
}
