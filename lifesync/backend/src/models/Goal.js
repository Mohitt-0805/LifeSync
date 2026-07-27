import { SupabaseModel } from "./SupabaseModel.js";

export const Goal = new SupabaseModel("goals", "goals");
export const Milestone = new SupabaseModel("goal_milestones", "goals");
