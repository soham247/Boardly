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
  FieldDescription
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Link } from "react-router-dom"
import { Github, Eye, EyeOff } from "lucide-react" //for password visibility toggle

import { useAuthStore } from "@/store/auth-store"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema, type LoginFormData } from "@/schemas/authSchema"
import { useState } from "react"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {

  const { login, isLoading, error: serverError } = useAuthStore()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })
  const [showPassword, setShowPassword] = useState(false)


  const onSubmit = async (data: LoginFormData) => {
    try {
      const { email, password } = data
      await login({ email, password })
      // checkAuth already populated user; read state directly
      const { user } = useAuthStore.getState()
      if (user && !user.isOnboarded) {
        navigate("/onboarding")
      } else {
        navigate("/workspaces")
      }
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Link
                    to="/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    {...register("password")}
                    aria-describedby="password-visibility"
                  />
                  <span id="password-visibility" className="sr-only">
                    {showPassword ? "Hide password" : "Show password"}
                  </span>
                  <button
                    type="button"
                    aria-label="Toggle password visibility"
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((s: boolean) => !s)}
                    className="absolute inset-y-0 right-2 flex items-center p-1 text-slate-500 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
                  >
                    {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                )}

              </Field>

              {/* Display server-side errors from Zustand */}
              {serverError && <div className="text-red-500 text-sm font-medium">{serverError}</div>}

              <FieldGroup className="mt-2">
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  onClick={() => {
                    window.location.href = `${import.meta.env.VITE_API_URL}/oauth/github`;
                  }}
                >
                  <Github />
                  <span>Login with Github</span>
                </Button>

                <FieldDescription className="text-center">
                  Don&apos;t have an account? <Link to="/signup" className="underline">Sign up</Link>
                </FieldDescription>
              </FieldGroup>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div >
  )
}