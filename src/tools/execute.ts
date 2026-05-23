import { Type } from "@earendil-works/pi-ai";
import {
  defineTool,
  type ExtensionContext,
  type ToolDefinition,
} from "@earendil-works/pi-coding-agent";
import { Effect, type ManagedRuntime } from "effect";

import { ExecuteInput, type ExecuteDetails } from "../schemas/execute.ts";
import type { AppServices } from "../app/layer.ts";
import { ExecutionService } from "../services/execution.ts";
import { renderExecuteCall, renderExecuteResult } from "../services/render.ts";

const formatToolError = (cause: unknown): string =>
  cause instanceof Error ? cause.message : String(cause);

export const makeExecuteTool = (
  runtime: ManagedRuntime.ManagedRuntime<AppServices, never>,
): ToolDefinition<typeof ExecuteInput, ExecuteDetails> =>
  defineTool({
    name: "executor_execute",
    label: "Executor",
    description:
      "Execute Executor TypeScript code against tools configured for the current project.",
    promptSnippet: "Run Executor TypeScript code with access to configured API tools.",
    parameters: Type.Object({
      code: ExecuteInput.properties.code,
    }),
    promptGuidelines: [
      "Use executor_execute for Executor TypeScript snippets that need configured Executor tools, sources, secrets, or policies.",
      "Keep snippets focused and return structured JSON when the result will be inspected by Pi.",
    ],
    async execute(toolCallId, params, signal, onUpdate, ctx: ExtensionContext) {
      try {
        const result = await runtime.runPromise(
          Effect.flatMap(ExecutionService.asEffect(), (execution) =>
            execution.execute({
              input: params,
              ctx,
            }),
          ),
        );

        return {
          content: [{ type: "text", text: result.text }],
          details: result.details,
          isError: result.isError,
        };
      } catch (cause) {
        return {
          content: [{ type: "text", text: formatToolError(cause) }],
          details: { status: "error", error: formatToolError(cause), logs: [] },
          isError: true,
        };
      }
    },
    renderCall(args, theme, context) {
      return renderExecuteCall(args, theme);
    },
    renderResult(result, options, theme, context) {
      const content = result.content[0];
      const text = content?.type === "text" ? content.text : "";

      return renderExecuteResult(result.details, text, options, theme);
    },
  });
