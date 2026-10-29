import {describe,expect,it} from "vitest";
import {macroTotals,macroComparison,validateMealPlan} from "./mealPlanMath";
describe("daily planned vs actual macros",()=>{
  it("compares the entire shift day and preserves negatives",()=>{
    const result=macroComparison(
      [{calories:500,protein:40,carbs:52,fats:17},{calories:700,protein:50,carbs:65,fats:23}],
      [{calories:1150,protein:80,carbs:110,fats:39}]
    );
    expect(result.planned).toEqual({calories:1200,protein:90,carbs:117,fats:40});
    expect(result.delta).toEqual({calories:-50,protein:-10,carbs:-7,fats:-1});
  });
  it("does not claim unknown carbs or fats are zero",()=>{
    expect(macroTotals([{calories:300,protein:25,carbs:null,fats:10}])).toMatchObject({calories:300,protein:25,carbs:null});
  });
  it("requires real meal names and calories/protein without inventing values",()=>{
    expect(()=>validateMealPlan({name:"Cut",meals:[{name:"Breakfast",calories:"",protein:20}]})).toThrow(/calories/);
    expect(()=>validateMealPlan({name:"Cut",meals:[{name:"",calories:400,protein:20}]})).toThrow(/food name/);
  });
});
