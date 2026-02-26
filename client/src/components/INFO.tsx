import { SquarePlus } from "lucide-react";
import { UserPlus } from "lucide-react";
import { CheckCircle } from "lucide-react";

export default function INFO() {

    return (
        <section className='bg-white text-center pt-16 pb-20'>
            <h3 className='text-black text-4xl font-extrabold mx-auto'>
                HOW IT WORKS
            </h3>
            <p className='text-gray-600 mt-4'>
                Simplify your workflow in 3 easy steps.No complex steps needed.Just pure productivity.
            </p>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-5 mt-20'>
                <div className='p-8 rounded-xl bg-card shadow-lg border w-80 mx-auto'>
                    <SquarePlus className='size-12'/>
                    <h4 className='mt-5'>Create Boards</h4>
                    <p className=''>Simple lists for complex tasks. Drag and drop tasks to organize your thoughts instantly</p>
                </div>
                <div className='p-8 rounded-xl bg-card shadow-lg border w-80 mx-auto'>
                    <UserPlus className='size-12'/>
                    <h4 className='mt-5'>Invite Team</h4>
                    <p className=''>Seamless collaboration in real-time. Share boards with a single link and start working together.</p>
                </div>
                <div className='p-8 rounded-xl bg-card shadow-lg border w-80 mx-auto'>
                    <CheckCircle className='size-12'/>
                    <h4 className='mt-5'>Track Progress</h4>
                    <p className=''>Visual clarity on what's done. See the big picture and the any details all in one place.</p>
                </div>
            </div>
        </section>
    )
}