import { Schema } from "effect";

export const RenderSettings = Schema.Struct({
  maxCodePreviewLines: Schema.Number,
  maxLogLines: Schema.Number,
  maxJsonBytes: Schema.Number,
});

export type RenderSettings = typeof RenderSettings.Type;

export const ExecutorSettings = Schema.Struct({
  render: RenderSettings,
});

export type ExecutorSettings = typeof ExecutorSettings.Type;

export const DefaultExecutorSettings: ExecutorSettings = {
  render: {
    maxCodePreviewLines: 80,
    maxJsonBytes: 40_000,
    maxLogLines: 200,
  },
};
