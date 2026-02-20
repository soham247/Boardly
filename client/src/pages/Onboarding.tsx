import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Field,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/store/auth-store"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { onboardingSchema, type OnboardingFormData } from "@/schemas/authSchema"

export default function Onboarding() {
    const { completeOnboarding, isLoading, user } = useAuthStore()
    const navigate = useNavigate()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<OnboardingFormData>({
        resolver: zodResolver(onboardingSchema),
        defaultValues: {
            fullName: user?.fullName || "",
            username: user?.username || "",
            profession: user?.profession || "",
        },
    })

    const onSubmit = async (data: OnboardingFormData) => {
        try {
            await completeOnboarding(data)
            navigate("/workspaces")
        } catch (err) {
            console.log(err)
        }
    }

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className={cn("flex flex-col gap-6")}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Welcome! Let's get to know you.</CardTitle>
                            <CardDescription>
                                Complete your profile to get started.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <FieldGroup>
                                    <Field>
                                        <FieldLabel htmlFor="fullName">Full Name</FieldLabel>
                                        <Input
                                            id="fullName"
                                            placeholder="John Doe"
                                            {...register("fullName")}
                                        />
                                        {errors.fullName && (
                                            <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>
                                        )}
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="username">Username</FieldLabel>
                                        <Input
                                            id="username"
                                            placeholder="johndoe"
                                            {...register("username")}
                                        />
                                        {errors.username && (
                                            <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>
                                        )}
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="profession">Profession</FieldLabel>
                                        <Input
                                            id="profession"
                                            placeholder="Software Engineer"
                                            {...register("profession")}
                                        />
                                        {errors.profession && (
                                            <p className="text-red-500 text-xs mt-1">{errors.profession.message}</p>
                                        )}
                                    </Field>

                                    <FieldGroup className="mt-2">
                                        <Button type="submit" disabled={isLoading} className="w-full">
                                            {isLoading ? "Saving..." : "Complete Setup"}
                                        </Button>
                                    </FieldGroup>
                                </FieldGroup>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
