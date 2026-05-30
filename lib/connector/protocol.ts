/**
 * qquark Connector Protocol — TypeScript Definition
 *
 * This is the executable, validated version of docs/connector-protocol.md.
 * The AI (via the relay) will speak this language.
 *
 * We use Zod for runtime validation because we do not cheap out on safety
 * when external agents are mutating user data.
 */

import { z } from "zod";

/* ========================================================================== */
/* SCHEMAS                                                                    */
/* ========================================================================== */

export const OperationSchema = z.discriminatedUnion("op", [
  z.object({
    op: z.literal("add_text"),
    id: z.string().optional(),
    x: z.number(),
    y: z.number(),
    text: z.string(),
    style: z.record(z.string(), z.any()).optional(),
  }),
  z.object({
    op: z.literal("add_shape"),
    id: z.string().optional(),
    type: z.enum(["rect", "ellipse", "diamond", "note"]),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    style: z.record(z.string(), z.any()).optional(),
  }),
  z.object({
    op: z.literal("add_arrow"),
    id: z.string().optional(),
    fromId: z.string().optional(),
    toId: z.string().optional(),
    x: z.number().optional(),
    y: z.number().optional(),
    label: z.string().optional(),
  }),
  z.object({
    op: z.literal("move"),
    ids: z.array(z.string()),
    dx: z.number(),
    dy: z.number(),
  }),
  z.object({
    op: z.literal("delete"),
    ids: z.array(z.string()),
  }),
  z.object({
    op: z.literal("update_text"),
    id: z.string(),
    text: z.string(),
  }),
  // Add more operations over time with the same care
]);

export const ScreenshotRequestSchema = z.object({
  rect: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }),
  scale: z.number().min(0.5).max(4).default(2),
  reason: z.string().optional(),
});

export type Operation = z.infer<typeof OperationSchema>;
export type ScreenshotRequest = z.infer<typeof ScreenshotRequestSchema>;

/**
 * The shape the relay will send to connected clients when an AI wants something.
 */
export type ConnectorCommand =
  | { type: "apply_operations"; operations: Operation[] }
  | { type: "capture_region"; request: ScreenshotRequest }
  | { type: "get_state"; includeIds?: string[] };

/**
 * Response the browser sends back through the relay.
 */
export type ConnectorResponse = {
  success: boolean;
  data?: unknown;
  error?: string;
};
