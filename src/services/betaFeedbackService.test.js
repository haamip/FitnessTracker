import { describe, it, expect } from "vitest";
import { validateFeedback } from "./betaFeedbackService";

describe("beta feedback validation",()=>{
  it("requires a useful description",()=>{
    expect(()=>validateFeedback({category:"Bug",description:"no"})).toThrow(/10/);
    expect(validateFeedback({category:"Suggestion",description:"It would help to see my saved meal plans."})).toMatchObject({category:"Suggestion"});
  });
  it("limits screenshot quantity and file types",()=>{
    const image={type:"image/png",size:1024};
    expect(()=>validateFeedback({category:"Bug",description:"Button cannot be tapped",files:[image,image,image,image]})).toThrow(/three/);
    expect(()=>validateFeedback({category:"Bug",description:"Button cannot be tapped",files:[{type:"text/html",size:200}]})).toThrow(/Screenshots/);
  });
});