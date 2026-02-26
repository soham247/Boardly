import { SquarePlus, UserPlus, CheckCircle } from "lucide-react";

export default function INFO() {
  return (
    <section className="bg-background text-center pt-16 pb-20">
      
      <h3 className="text-foreground text-4xl font-extrabold mx-auto">
        HOW IT WORKS
      </h3>

      <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
        Simplify your workflow in 3 easy steps. No complex steps needed.
        Just pure productivity.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-6xl mx-auto px-4">
        
        <div className="p-8 rounded-xl bg-card border border-border shadow-lg text-foreground">
          <SquarePlus className="size-12 text-primary" />
          <h4 className="mt-5 text-xl font-bold text-left">Create Boards</h4>
          <p className="text-muted-foreground mt-3 text-left">
            Simple lists for complex tasks. Drag and drop tasks to organize
            your thoughts instantly.
          </p>
        </div>

        <div className="p-8 rounded-xl bg-card border border-border shadow-lg text-foreground">
          <UserPlus className="size-12 text-primary" />
          <h4 className="mt-5 text-xl font-bold text-left">Invite Team</h4>
          <p className="text-muted-foreground mt-3 text-left">
            Seamless collaboration in real-time. Share boards with a single
            link and start working together.
          </p>
        </div>

        <div className="p-8 rounded-xl bg-card border text-foreground">
          <CheckCircle className="size-12 text-primary" />
          <h4 className="mt-5 text-xl font-bold text-left">Track Progress</h4>
          <p className="text-muted-foreground mt-3 text-left">
            Visual clarity on what's done. See the big picture and the
            details all in one place.
          </p>
        </div>

      </div>
    </section>
  );
}