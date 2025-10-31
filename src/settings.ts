import { App, PluginSettingTab, Setting } from "obsidian";
import type InkGlowPlugin from "./main";


export interface InkGlowSettings {
	transitionDuration: number;
	glowIntensity: number;
}

export const DEFAULT_SETTINGS: InkGlowSettings = {
	transitionDuration: 2.5,
	glowIntensity: 0.1,
};

export class InkGlowSettingTab extends PluginSettingTab {
	plugin: InkGlowPlugin;

	constructor(app: App, plugin: InkGlowPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// glow intensity
		new Setting(containerEl)
			.setName("Glow intensity")
			.setDesc("Controls how bright the glow starts.")
			.addSlider((slider) =>
				slider
					.setLimits(0.01, 0.5, 0.01)
					.setValue(this.plugin.settings.glowIntensity)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.glowIntensity = value;
						await this.plugin.saveSettings();
					})
			);

		// transition duration
		new Setting(containerEl)
			.setName("Transition duration")
			.setDesc("How long the glow takes to fade (seconds).")
			.addSlider((slider) =>
				slider
					.setLimits(0.2, 5.0, 0.1)
					.setValue(this.plugin.settings.transitionDuration)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.transitionDuration = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
