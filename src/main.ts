import { Plugin } from "obsidian";
import { EditorView, ViewPlugin, ViewUpdate, Decoration, DecorationSet } from "@codemirror/view";
import { RangeSetBuilder, Extension } from "@codemirror/state";
import { InkGlowSettingTab, InkGlowSettings, DEFAULT_SETTINGS } from "./settings";

interface InkGlowRange {
	from: number;
	to: number;
	timestamp: number; // used to track glow time
}

class InkGlowViewPlugin {
	decorations: DecorationSet;
	glowRanges: InkGlowRange[];
	settings: InkGlowSettings;

	constructor(view: EditorView, settings: InkGlowSettings) {
		this.decorations = Decoration.none;
		this.glowRanges = [];
		this.settings = settings;
	}

	// logs each changed text segment with timestamp & rebuilds decorationSet
	update(update: ViewUpdate) {
		const now = Date.now();

		if (update.docChanged) {
			update.changes.iterChanges((_, __, fromB, toB) => {
				if (toB > fromB) {
					this.glowRanges.push({ from: fromB, to: toB, timestamp: now });
				}
			});
		}

		this.decorations = this.buildDecorations(update.view, now);
	}

	buildDecorations(view: EditorView, now: number): DecorationSet {
		const builder = new RangeSetBuilder<Decoration>();
		const totalDuration = this.settings.transitionDuration * 1000; // s to ms

		this.glowRanges = this.glowRanges.filter((range) => {
			const age = now - range.timestamp;
			if (age > totalDuration) return false;

			const progress = Math.min(age / totalDuration, 1);
			const mark = this.createGlowMark(progress);
			try {
				builder.add(range.from, range.to, mark);
			} catch {
				return false;
			}
			return true;
		});

		return builder.finish();
	}

	createGlowMark(progress: number): Decoration {
		const durMs = this.settings.transitionDuration * 1000;
		const intensity = this.settings.glowIntensity;

		return Decoration.mark({
			class: "inkglow-text",
			attributes: {
				style: `
					--inkglow-dur: ${durMs}ms;
					--inkglow-intensity: ${intensity};
				`,
			},
		});
	}
}

/* ---------- Main Plugin Class ---------- */
export default class InkGlowPlugin extends Plugin {
	settings: InkGlowSettings;
	private editorExtension: Extension;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new InkGlowSettingTab(this.app, this));
		this.registerEditorExtensions();
	}

	registerEditorExtensions() {
		const settings = this.settings;
		this.editorExtension = ViewPlugin.fromClass(
			class extends InkGlowViewPlugin {
				constructor(view: EditorView) {
					super(view, settings);
				}
			},
			{ decorations: (v) => v.decorations }
		);

		this.registerEditorExtension([this.editorExtension]);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.app.workspace.updateOptions();
	}
}
