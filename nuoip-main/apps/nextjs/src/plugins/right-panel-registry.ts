import type { PanelPlugin } from './panel-plugin'

const panelPlugins = new Map<string, PanelPlugin<any>>()

export const registerRightPanelPlugin = <TContext>(plugin: PanelPlugin<TContext>): void => {
  panelPlugins.set(plugin.id, plugin as PanelPlugin<any>)
}

export const getRightPanelPlugins = <TContext>(): PanelPlugin<TContext>[] => {
  return Array.from(panelPlugins.values()) as PanelPlugin<TContext>[]
}

export const clearRightPanelPlugins = (): void => {
  panelPlugins.clear()
}
