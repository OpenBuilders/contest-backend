export function objectsToCSVBlob<T extends Record<string, any>>(
	data: T[],
): Blob {
	if (!data || data.length === 0) {
		throw new Error("No data provided");
	}

	// Collect all unique headers
	const headers = Array.from(new Set(data.flatMap((obj) => Object.keys(obj))));

	// Escape each CSV value safely
	const escapeCSV = (val: any): string => {
		if (val == null) return "";
		const str = String(val);
		// Enclose in quotes if it contains special chars
		if (/[",\n\r]/.test(str)) {
			return `"${str.replace(/"/g, '""')}"`;
		}
		return str;
	};

	// Construct rows
	const rows = [
		headers.join(","), // header row
		...data.map((obj) => headers.map((h) => escapeCSV(obj[h])).join(",")),
	];

	// Join rows with CRLF for CSV standard
	const csvString = rows.join("\r\n");

	// Create a UTF-8 Blob
	return new Blob([csvString], { type: "text/csv;charset=utf-8;" });
}
