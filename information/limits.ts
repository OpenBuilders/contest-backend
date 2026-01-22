export const limits = {
	form: {
		create: {
			title: {
				minLength: 3,
				maxLength: 32,
			},
			description: {
				minLength: 0,
				maxLength: 4096,
				allowedTags: ["b", "i", "u", "a", "strike", "br"],
				allowedAttrs: ["href"],
			},
			instruction: {
				minLength: 0,
				maxLength: 1024,
			},
			prize: {
				minLength: 0,
				maxLength: 20,
			},
			fee: {
				min: 1,
				max: 1_000,
			},
		},
		placement: {
			name: {
				minLength: 1,
				maxLength: 16,
			},
			prize: {
				minLength: 0,
				maxLength: 16,
			},
		},
		participate: {
			description: {
				minLength: 0,
				maxLength: 1024,
				allowedTags: ["b", "i", "u", "a", "strike", "br"],
				allowedAttrs: ["href"],
			},
		},
	},
};
