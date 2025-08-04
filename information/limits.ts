export const limits = {
	form: {
		create: {
			title: {
				minLength: 3,
				maxLength: 32,
			},
			description: {
				minLength: 0,
				maxLength: 2048,
				allowedTags: ["b", "i", "u", "a", "strike", "br"],
				allowedAttrs: ["href"],
			},
			prize: {
				minLength: 0,
				maxLength: 16,
			},
			fee: {
				min: 0,
				max: 1_000,
			},
		},
		participate: {
			link: {
				minLength: 3,
				maxLength: 64,
			},
			description: {
				minLength: 0,
				maxLength: 1024,
				allowedTags: ["b", "i", "u", "a", "strike", "br"],
				allowedAttrs: ["href"],
			},
		},
	},
};
