import { z } from "zod";

export const updateOrderStatusSchema = z.object({
  status: z.enum(["preparing", "ready_for_pickup", "out_for_delivery", "completed"]),
  note: z.string().max(240).optional().or(z.literal("")),
});
