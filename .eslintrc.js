module.exports = {
	root: true,
	env: {
        node: true,
        browser: true,
	},
	extends: ["standard"],
	rules: {
	},
	overrides: [
		{
			files: ["**/__tests__/*.js", "**/tests/unit/**/*.spec.js"],
			env: {
				jest: true
			}
		}
	],
	parserOptions: {
		parser: "babel-eslint"
	},
	overrides: [
		{
			files: ["**/__tests__/*.js", "**/tests/unit/**/*.spec.js"],
			env: {
				jest: true
			}
		}
	]
};
