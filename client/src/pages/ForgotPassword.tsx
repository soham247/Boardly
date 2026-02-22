import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuthStore } from "@/store/auth-store"
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
    FieldLabel
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export default function ForgotPassword() {
    const [email, setEmail] = useState("")
    const { forgotPassword, isLoading, error } = useAuthStore()
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await forgotPassword(email)
            navigate(`/reset-password?email=${encodeURIComponent(email)}`)
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">
                <Card>
                    <CardHeader>
                        <CardTitle>Forgot Password</CardTitle>
                        <CardDescription>
                            Enter your email to receive a 6-digit OTP
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit}>
                            <FieldGroup>
                                <Field>
                                    <FieldLabel htmlFor="email">Email</FieldLabel>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="m@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </Field>

                                {error && (
                                    <p className="text-red-500 text-sm mt-2">{error}</p>
                                )}

                                <Button type="submit" disabled={isLoading} className="w-full mt-4">
                                    {isLoading ? "Sending OTP..." : "Send OTP"}
                                </Button>

                                <div className="text-center mt-4 text-sm">
                                    Remember your password?{" "}
                                    <Link to="/signin" className="underline underline-offset-4">
                                        Sign in
                                    </Link>
                                </div>
                            </FieldGroup>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
