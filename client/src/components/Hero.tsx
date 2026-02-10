import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Hero() {
    return (
        <section className="relative flex flex-col items-center justify-center min-h-[90vh] px-4 text-center overflow-hidden bg-background">
            {/* Background Gradients */}
            <div className="absolute inset-0 -z-10 h-full w-full bg-background [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#63e_100%)] dark:[background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)] opacity-20"></div>
            <div className="absolute top-0 w-full h-px bg-linear-to-r from-transparent via-primary/20 to-transparent"></div>

            <div className="max-w-5xl space-y-8 pt-20 pb-16">
                {/* Pill Badge */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary backdrop-blur-sm">
                        <Sparkles className="mr-2 h-3.5 w-3.5" />
                        <span className="bg-linear-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                            v1.0 is now live
                        </span>
                    </span>
                </div>

                {/* Main Heading */}
                <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
                    <span className="block text-foreground drop-shadow-sm">Streamline your</span>
                    <span className="block bg-linear-to-r from-primary via-purple-500 to-blue-600 bg-clip-text text-transparent pb-4 text-5xl sm:text-7xl md:text-8xl">
                        Workflow with Boarda
                    </span>
                </h1>

                {/* Subheading */}
                <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl md:text-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                    The open board for modern teams.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center pt-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                    <Button size="lg" className="rounded-full h-12 px-8 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-105" asChild>
                        <Link to="/signup">
                            Get Started
                        </Link>
                    </Button>
                    <Button variant="outline" size="lg" className="rounded-full h-12 px-8 text-base backdrop-blur-sm bg-background/50 hover:bg-accent/50 transition-all hover:scale-105 group">
                        Learn More
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                </div>

                {/* Mockup/Visual Element (Optional placeholder for now) */}
                <div className="mt-16 relative mx-auto max-w-5xl w-full aspect-[16/9] rounded-xl border border-border/50 bg-card/50 shadow-2xl backdrop-blur-sm overflow-hidden animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500 hidden sm:block">
                    <div className="absolute inset-0 bg-linear-to-tr from-primary/5 via-transparent to-transparent"></div>
                    <div className="flex items-center justify-center h-full text-muted-foreground/30 font-medium text-2xl">
                        App Dashboard Preview
                    </div>
                </div>
            </div>
        </section>
    );
}
