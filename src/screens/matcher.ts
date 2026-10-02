import fs from 'node:fs';
import path from 'node:path';
import { ScreenDefinition, DesktopScreenMap, loadScreenMap } from './screen-map.js';

export interface WindowMatchCriteria {
  title: string;
  formName?: string;
  className?: string;
}

export function matchScreen(
  window: WindowMatchCriteria | string,
  screens: ScreenDefinition[]
): ScreenDefinition | null {
  const windowTitle = typeof window === 'string' ? window : window.title;
  const formName = typeof window === 'string' ? undefined : window.formName;

  for (const screen of screens) {
    let titleMatches = false;

    try {
      const regex = new RegExp(screen.titlePattern, 'i');
      titleMatches = regex.test(windowTitle);
    } catch {
      titleMatches = windowTitle.toLowerCase().includes(screen.titlePattern.toLowerCase());
    }

    if (!titleMatches) {
      continue;
    }

    // If screen specifies a formName, check if it matches
    if (screen.formName && formName) {
      if (screen.formName.toLowerCase() !== formName.toLowerCase()) {
        continue;
      }
    }

    return screen;
  }

  return null;
}

export function findScreenMapForProcess(
  processName: string,
  screensDir: string = path.resolve(process.cwd(), 'screens')
): { filePath: string; screenMap: DesktopScreenMap } | null {
  if (!fs.existsSync(screensDir)) {
    return null;
  }

  const files = fs.readdirSync(screensDir).filter((f) => f.endsWith('.screens.json'));
  const normalizedProc = processName.toLowerCase().replace(/\.exe$/, '');

  for (const file of files) {
    const fullPath = path.join(screensDir, file);
    try {
      const map = loadScreenMap(fullPath);
      const appProc = map.app.processName.toLowerCase().replace(/\.exe$/, '');
      if (appProc === normalizedProc) {
        return { filePath: fullPath, screenMap: map };
      }
    } catch {
      // Continue checking other files if one fails to load
    }
  }

  return null;
}
