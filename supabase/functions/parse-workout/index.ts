import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const workoutSchema = {
  type: "object",
  additionalProperties: false,
  required: ["workoutName", "exercises", "ignoredLines"],
  properties: {
    workoutName: { type: "string" },
    exercises: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "sets", "repsMin", "repsMax", "equipment", "note", "confidence"],
        properties: {
          name: { type: "string" },
          sets: { type: "integer", minimum: 0, maximum: 20 },
          repsMin: { type: "string" },
          repsMax: { type: "string" },
          equipment: { type: "string", enum: ["barbell", "dumbbell", "machine", "cable", "bodyweight", "band", "cardio", "other", "unknown"] },
          note: { type: "string" },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
      },
    },
    ignoredLines: { type: "array", items: { type: "string" } },
  },
};

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return respond({ error: "Method not allowed" }, 405);

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return respond({ error: "OPENAI_API_KEY is not configured" }, 500);

    const body = await request.json();
    const text = String(body?.text || "").trim();
    if (!text) return respond({ error: "Workout text is required" }, 400);
    if (text.length > 20000) return respond({ error: "Workout text is too long" }, 413);

    const localResult = body?.localResult || { exercises: [], ignoredLines: [] };
    const completion = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: Deno.env.get("OPENAI_WORKOUT_MODEL") || "gpt-4.1-mini",
        instructions: "You convert messy workout text into structured workout data. Understand formats such as 4x8, 4 x 6-8, 4 sets of 8, CSV, headings, and exercise names followed by sets/reps on the next line. Never invent missing values. Use sets 0 and blank reps when absent and mark confidence low. Preserve AMRAP, failure, timed work, tempo, rest and weight in note where useful.",
        input: JSON.stringify({ workoutText: text, localParserResult: localResult }),
        text: {
          format: {
            type: "json_schema",
            name: "trackfit_workout_import",
            strict: true,
            schema: workoutSchema,
          },
        },
      }),
    });

    const payload = await completion.json();
    if (!completion.ok) return respond({ error: payload?.error?.message || "AI request failed" }, completion.status);

    const outputText = payload?.output?.flatMap((item: any) => item?.content || []).find((item: any) => item?.type === "output_text")?.text;
    if (!outputText) return respond({ error: "AI returned no workout data" }, 502);

    return respond(JSON.parse(outputText));
  } catch (error) {
    return respond({ error: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
});
