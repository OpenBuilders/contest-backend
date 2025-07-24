export const limits = {
	form: {
		create: {
			title: {
				minLength: 3,
				maxLength: 64,
			},
			description: {
				minLength: 0,
				maxLength: 2048,
			},
			prize: {
				minLength: 0,
				maxLength: 32,
			},
			fee: {
				min: 0,
				max: 1_000,
			},
		},
	},
};
