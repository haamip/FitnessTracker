export const MACRO_KEYS=["calories","protein","carbs","fats"];
export function macroTotals(rows=[]) {
  return Object.fromEntries(MACRO_KEYS.map(key=>{
    let total=0;
    for(const row of rows){
      const value=row?.[key];
      if(value==null||String(value).trim()==="") return [key,null];
      const n=Number(value);
      if(!Number.isFinite(n)||n<0)return [key,null];
      total+=n;
    }
    return [key,Math.round(total*10)/10];
  }));
}
export function macroComparison(plannedMeals=[],loggedMeals=[]) {
  const planned=macroTotals(plannedMeals),actual=macroTotals(loggedMeals);
  const delta=Object.fromEntries(MACRO_KEYS.map(key=>[key,
    planned[key]==null||actual[key]==null?null:Math.round((actual[key]-planned[key])*10)/10]));
  return {planned,actual,delta,loggedCount:loggedMeals.length,plannedCount:plannedMeals.length};
}
export function validateMealPlan({name,meals}) {
  if(typeof name!=="string"||!name.trim()||name.trim().length>120)throw new Error("Name your meal plan (up to 120 characters).");
  if(!Array.isArray(meals)||meals.length<1||meals.length>20)throw new Error("Add between 1 and 20 planned meals.");
  return meals.map((row,index)=>{
    const title=String(row?.name||"").trim();
    if(!title||title.length>120)throw new Error(`Meal ${index+1} needs a food name.`);
    const get=(key,required)=>{
      const v=row?.[key];
      if(v===null||v===undefined||String(v).trim()===""){
        if(required)throw new Error(`Meal ${index+1} needs a ${key} amount.`);
        return null;
      }
      const value=Number(v);
      if(!Number.isFinite(value)||value<0||value>20000)throw new Error(`Meal ${index+1} has an invalid ${key} amount.`);
      return Math.round(value*10)/10;
    };
    return {
      id:typeof row.id==="string"&&row.id?row.id:crypto.randomUUID(),
      name:title,
      type:String(row?.type||"Meal").slice(0,40),
      calories:get("calories",true),
      protein:get("protein",true),
      carbs:get("carbs",false),
      fats:get("fats",false),
    };
  });
}
