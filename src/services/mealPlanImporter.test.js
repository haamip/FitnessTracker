import { describe, expect, it } from "vitest";
import { parseMealPlanText } from "./mealPlanImporter";
describe("meal plan import",()=>{
  it("extracts prescribed macros without guessing",()=>{
    const data=parseMealPlanText("Breakfast: Oats and banana | 480 kcal | P 35g | C 61g | F 11g\nLunch: Chicken rice | 660 kcal | Protein 51g | Carbs 70g | Fat 19g");
    expect(data.meals).toHaveLength(2);
    expect(data.meals[0]).toMatchObject({name:"Oats and banana",type:"Breakfast",calories:"480",protein:"35",carbs:"61",fats:"11"});
    expect(data.meals[1].protein).toBe("51");
    expect(data.reviewCount).toBe(0);
  });
  it("leaves unknown nutritional values blank and flagged",()=>{
    const data=parseMealPlanText("Dinner: Beef stew\nSnack: Protein shake | 160 kcal | P 25g");
    expect(data.meals).toHaveLength(2);
    expect(data.meals[0]).toMatchObject({name:"Beef stew",calories:"",protein:""});
    expect(data.reviewCount).toBe(1);
  });
  it("does not import document headings as meals",()=>{
    expect(parseMealPlanText("Meal Plan\nMonday\nTotals\n  \nBreakfast\n").meals).toHaveLength(0);
  });
});