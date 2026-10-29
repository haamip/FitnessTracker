import { supabase } from "./supabase";
import { validateMealPlan } from "./mealPlanMath";

async function currentUser(){
  if(!supabase)throw new Error("TrackFit account is unavailable.");
  const {data,error}=await supabase.auth.getUser();
  if(error||!data?.user||data.user.is_anonymous)throw new Error("Sign into TrackFit to manage your meal plan.");
  return data.user.id;
}

export const MealPlanRepository={
  async load(){
    const userId=await currentUser();
    const {data,error}=await supabase.from("meal_plan_templates")
      .select("name,meals,updated_at")
      .eq("user_id",userId).maybeSingle();
    if(error)throw error;
    if(await currentUser()!==userId)throw new Error("Your account changed. Reopen Meal Plans.");
    return data?{name:data.name,meals:data.meals||[],updatedAt:data.updated_at}:null;
  },
  async save({name,meals}){
    const valid=validateMealPlan({name,meals});
    const userId=await currentUser();
    const {data,error}=await supabase.from("meal_plan_templates").upsert({
      user_id:userId,name:name.trim(),meals:valid,updated_at:new Date().toISOString(),
    },{onConflict:"user_id"}).select("name,meals,updated_at").single();
    if(error)throw error;
    if(await currentUser()!==userId)throw new Error("Your account changed during saving. Reload Meal Plans.");
    return {name:data.name,meals:data.meals||[],updatedAt:data.updated_at};
  },
  async remove(){
    const userId=await currentUser();
    const {error}=await supabase.from("meal_plan_templates").delete().eq("user_id",userId);
    if(error)throw error;
    if(await currentUser()!==userId)throw new Error("Your account changed while deleting. Reload Meal Plans.");
  },
};
