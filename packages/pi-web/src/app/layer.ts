import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Layer } from "effect";

import { ExaWebProviderLive } from "../providers/exa/layer.ts";
import { ParallelWebProviderLive } from "../providers/parallel/layer.ts";
import { UrlSafetyService } from "../services/url-safety.ts";
import { WebConfigService } from "../services/config.ts";
import { WebService } from "../services/web.ts";

export type AppServices = WebConfigService | WebService;

const InfrastructureLive = Layer.mergeAll(UrlSafetyService.Default, WebConfigService.Default);

const ProviderLive = Layer.provideMerge(
  Layer.mergeAll(ExaWebProviderLive, ParallelWebProviderLive),
  InfrastructureLive,
);

export const makeAppLayer = (pi: ExtensionAPI): Layer.Layer<AppServices> =>
  Layer.provideMerge(WebService.Default, ProviderLive);
