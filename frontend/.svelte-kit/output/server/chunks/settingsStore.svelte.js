import "./server.js";
import { C as taskModuleStore } from "./taskModuleStore.svelte.js";
//#region src/lib/settingsStore.svelte.js
var STORAGE_KEY = "edm-fe-settings-v1";
function defaultProfile(personaId = "", name = "") {
	const slug = (name || personaId || "user").toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "");
	return {
		displayName: name || "",
		email: slug ? `${slug}@edm.local` : "user@edm.local",
		phone: "",
		unit: "EDM Core",
		bio: "",
		avatarDataUrl: ""
	};
}
/** @returns {PreferencesSettings} */
function defaultPreferences() {
	return {
		language: "id",
		notifications: {
			inApp: true,
			email: false,
			taskUpdates: true,
			approvals: true,
			comments: true
		}
	};
}
/** @param {string} personaId @param {string} [name] @returns {PersonaSettings} */
function defaultPersonaSettings(personaId, name = "") {
	return {
		profile: defaultProfile(personaId, name),
		preferences: defaultPreferences()
	};
}
/** @returns {Record<string, PersonaSettings>} */
function loadAll() {
	if (typeof localStorage === "undefined") return {};
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return {};
		const parsed = JSON.parse(raw);
		if (!parsed || typeof parsed !== "object") return {};
		for (const key of Object.keys(parsed)) {
			const row = parsed[key];
			const dn = row?.profile?.displayName;
			if (dn === "Raka Wibowo" || dn === "FARRAS AL RISYAD") row.profile.displayName = "Farras Al-Risyad";
			if (row?.profile?.email === "raka.wibowo@edm.local" || row?.profile?.email === "farras.al.risyad@edm.local") row.profile.email = "farras.al-risyad@edm.local";
		}
		return parsed;
	} catch {
		return {};
	}
}
var settingsStore = { 
/** @type {Record<string, PersonaSettings>} */
byPersona: loadAll() };
/** @param {string} personaId @param {string} [name] */
function ensurePersona(personaId, name = "") {
	if (!personaId) return defaultPersonaSettings("", name);
	const existing = settingsStore.byPersona[personaId];
	if (existing) return existing;
	return defaultPersonaSettings(personaId, name);
}
function activePersonaId() {
	taskModuleStore.session;
	return taskModuleStore.session?.id || "";
}
function activePersonaName() {
	taskModuleStore.session;
	return taskModuleStore.session?.name || "";
}
/** @returns {PersonaSettings} */
function currentSettings() {
	return ensurePersona(activePersonaId(), activePersonaName());
}
/** @returns {ProfileSettings} */
function currentProfile() {
	const s = currentSettings();
	settingsStore.byPersona;
	return s.profile;
}
/** Display name for chrome (falls back to session name). */
function displayName() {
	const profile = currentProfile();
	const sessionName = activePersonaName();
	return profile.displayName?.trim() || sessionName;
}
/** Avatar URL for chrome (empty = use default asset). */
function avatarUrl() {
	return currentProfile().avatarDataUrl || "";
}
//#endregion
export { settingsStore as i, currentProfile as n, displayName as r, avatarUrl as t };

//# sourceMappingURL=settingsStore.svelte.js.map