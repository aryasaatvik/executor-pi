import { join } from "node:path";

import { getAgentDir } from "@earendil-works/pi-coding-agent";

export const PI_WEB_CONFIG_FILE = "pi-web.json";

export const globalPiWebConfigPath = (): string => join(getAgentDir(), PI_WEB_CONFIG_FILE);

export const projectPiWebConfigPath = (cwd: string): string => join(cwd, ".pi", PI_WEB_CONFIG_FILE);
