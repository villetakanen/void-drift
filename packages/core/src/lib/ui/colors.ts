/**
 * Canvas mirror of the CSS colour roles in styles/tokens.css.
 * Canvas cannot read custom properties, so the values are duplicated here and
 * kept equal to the resolved tokens by scripts/check-contracts.mjs.
 */
export const COLOR = {
	countdown: "lch(78.31% 65.02 151.48)",
	brand: "lch(96.42% 84.18 104.87)",
	action: "lch(96.42% 84.18 104.87)",
	selected: "lch(96.42% 84.18 104.87)",
	onBrand: "lch(1.57% 4.76 285.25)",
	text: "lch(99.7% 7.45 104.72)",
	textMuted: "lch(56.7% 0 0)",
	border: "lch(100% 0 0 / 0.141)",
	borderSubtle: "lch(100% 0 0 / 0.094)",
	borderFaint: "lch(100% 0 0 / 0.051)",
	grid: "lch(45.22% 12.57 223.2)",
	void: "lch(1.57% 4.76 285.25)",
	elev1: "lch(5.5% 10 290)",
	elev2: "lch(11% 15 290)",
	elev3: "lch(16.5% 20 290)",
	glass: "lch(1.57% 4.76 285.25 / 0.91)",
	backdrop: "lch(0% 0 0 / 0.11)",
	resourceHull: "lch(74.49% 48.47 234.45)",
	resourcePower: "lch(96.42% 84.18 104.87)",
	resourceWarning: "lch(76.72% 83.63 72.58)",
	resourceDanger: "lch(56.91% 91.12 35.03)",
} as const;

/** The CSS custom property each canvas colour mirrors. */
export const COLOR_TOKEN: Record<keyof typeof COLOR, string> = {
	countdown: "--color-android-green",
	brand: "--color-brand",
	action: "--color-action",
	selected: "--color-selected",
	onBrand: "--color-on-brand",
	text: "--color-text",
	textMuted: "--color-text-muted",
	border: "--color-border",
	borderSubtle: "--color-border-subtle",
	borderFaint: "--color-border-faint",
	grid: "--color-grid",
	void: "--color-void",
	elev1: "--color-elev-1",
	elev2: "--color-elev-2",
	elev3: "--color-elev-3",
	glass: "--color-glass",
	backdrop: "--color-backdrop",
	resourceHull: "--color-resource-hull",
	resourcePower: "--color-resource-power",
	resourceWarning: "--color-resource-warning",
	resourceDanger: "--color-resource-danger",
};
