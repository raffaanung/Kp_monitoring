//#region src/lib/format.js
function formatDate(value) {
	if (!value) return "—";
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return value;
	return d.toLocaleDateString("id-ID", {
		day: "2-digit",
		month: "short",
		year: "numeric"
	});
}
/** Contoh: 10 Sep, 18.59 */
function formatDateTime(value) {
	if (!value) return "—";
	const raw = String(value).trim();
	const d = new Date(raw.includes("T") ? raw : raw.replace(" ", "T"));
	if (Number.isNaN(d.getTime())) return raw;
	return `${d.getDate()} ${[
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"Mei",
		"Jun",
		"Jul",
		"Agu",
		"Sep",
		"Okt",
		"Nov",
		"Des"
	][d.getMonth()]}, ${String(d.getHours()).padStart(2, "0")}.${String(d.getMinutes()).padStart(2, "0")}`;
}
//#endregion
export { formatDateTime as n, formatDate as t };

//# sourceMappingURL=format.js.map