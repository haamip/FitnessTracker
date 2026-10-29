import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Dumbbell, FileUp, History, Plus, Sparkles } from "lucide-react";
import { AIPlanRepository, HistoryRepository, SavedWorkoutRepository } from "../services/repositories/trackfitDataLayer";
import { STARTER_WORKOUTS } from "../services/starterWorkouts";
import "./TrackFitScreens.css";
import "./TrainHome.css";

export default function TrainHome() {
  const plan = AIPlanRepository.getPlan();
  const templates = SavedWorkoutRepository.getAll();
  const recent = HistoryRepository.getRecent(2);
  const next = plan[0] || templates[0] || STARTER_WORKOUTS[0];
  return (
    <main className="screen tf-train-home" data-testid="trackfit-train-home">
      <section className="v4-workout-hero"><div><p className="eyebrow">Train</p><h1>Ready to move?</h1>
        <p>Your next session and your training tools. No endless scrolling.</p></div></section>
      <section className="tf-train-feature">
        <span className="eyebrow">Up next</span>
        <h2>{next?.name || "Start a workout"}</h2>
        <p>{plan.length ? `From your ${plan.length}-day training plan` : templates.length ? "From your saved workouts" : "A simple workout to get started"}</p>
        <Link to={`/workouts/${encodeURIComponent(next?.id || "workout-1")}`}>Start this workout <ArrowRight size={18} /></Link>
      </section>
      <section className="tf-train-links" aria-label="Training tools">
        {[
          {to:"/plan",name:"My training plan",detail:plan.length ? `${plan.length} days saved · view or delete` : "Build your weekly split",Icon:CalendarDays},
          {to:"/workouts/library",name:"My workouts",detail:`${templates.length} saved · edit, duplicate or delete`,Icon:Dumbbell},
          {to:"/workouts/history",name:"Workout history",detail:"Completed sessions and sync status",Icon:History},
          {to:"/workouts/create",name:"Build workout",detail:"Create a new session",Icon:Plus},
          {to:"/workouts/import",name:"Import workout",detail:"Paste a plan or read a PDF",Icon:FileUp},
          {to:"/workouts/builder",name:"Workout builder",detail:"Generate your training split",Icon:Sparkles},
        ].map(({to,name,detail,Icon})=>(
          <Link to={to} className="tf-train-link" key={to}><span className="tf-train-link-icon"><Icon size={22}/></span><span><strong>{name}</strong><small>{detail}</small></span><ArrowRight size={19}/></Link>
        ))}
      </section>
      {recent.length > 0 && (
        <section className="tf-train-recent">
          <div className="tf-train-recent-head"><h2>Recently completed</h2><Link to="/workouts/history">View all <ArrowRight size={16}/></Link></div>
          {recent.map(item=><Link key={item.id} to={`/workouts/history/${encodeURIComponent(item.id)}`} className="tf-train-recent-row">
            <strong>{item.title || "Completed workout"}</strong><small>{item.completedAt ? new Date(item.completedAt).toLocaleDateString("en-AU",{day:"numeric",month:"short"}) : "Saved workout"}</small><ArrowRight size={17}/>
          </Link>)}
        </section>
      )}
    </main>
  );
}
