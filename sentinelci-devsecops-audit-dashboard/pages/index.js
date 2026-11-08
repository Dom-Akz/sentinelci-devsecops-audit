import React, { useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loggingIn, setLoggingIn] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoggingIn(true)
    setError("")

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || "Invalid credentials")
        setLoggingIn(false)
        return
      }

      localStorage.setItem("token", data.token)

      window.location.href = "/dashboard"
    } catch (err) {
      setError("Server error. Please try again.")
      setLoggingIn(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Ambient green glow behind card */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/[0.07] rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] bg-emerald-600/[0.05] rounded-full blur-[120px] pointer-events-none" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm bg-[#0A0A0A] border border-white/[0.07] rounded-2xl px-8 pt-10 pb-8 shadow-[0_0_80px_rgba(16,185,129,0.09),0_25px_50px_-12px_rgba(0,0,0,0.8)]">
        {/* Glow line on top edge */}
        <div className="absolute -top-px left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-emerald-500/70 to-transparent" />
        <div className="absolute -bottom-px left-1/3 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

        {/* Logo */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-green-600 flex items-center justify-center shadow-[0_0_35px_rgba(16,185,129,0.55)]">
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white">
              <path d="M12 2L4 5.5v6.1c0 4.9 3.4 8.4 8 10.4 4.6-2 8-5.5 8-10.4V5.5L12 2zm-1.2 13.6l-3.2-3.2 1.4-1.4 1.8 1.8 4.6-4.6 1.4 1.4-6 6z"/>
            </svg>
          </div>
          <h1 className="mt-4 text-[22px] font-semibold text-white tracking-tight">
            SentinelCI
          </h1>
          <p className="mt-1 text-[13px] font-medium text-gray-300">
            Welcome Back
          </p>
          <p className="mt-1 text-[11px] text-gray-500">
            Please enter your details to access dashboard
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-5 bg-red-950/60 border border-red-500/30 rounded-lg px-3 py-2.5">
            <p className="text-red-400 text-[11px]">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="mt-7 space-y-4">
          <div>
            <label htmlFor="email" className="block text-[11px] font-medium text-gray-400 mb-1.5">
              Username or E-mail
            </label>
            <input
              id="email"
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter Email ID"
              className="w-full bg-[#101210] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-[13px] text-gray-200 placeholder-gray-600 transition-all duration-200 focus:outline-none focus:border-emerald-500/60 focus:bg-[#0E1512] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.08),0_0_20px_rgba(16,185,129,0.12)]"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-[11px] font-medium text-gray-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Password"
                className="w-full bg-[#101210] border border-white/[0.08] rounded-lg px-3.5 py-2.5 pr-10 text-[13px] text-gray-200 placeholder-gray-600 transition-all duration-200 focus:outline-none focus:border-emerald-500/60 focus:bg-[#0E1512] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.08),0_0_20px_rgba(16,185,129,0.12)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Sign In button */}
          <button
            type="submit"
            disabled={loggingIn}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[13px] font-semibold rounded-lg py-2.5 transition-all duration-200 shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:shadow-[0_0_35px_rgba(16,185,129,0.5)] mt-1"
          >
            {loggingIn ? "Signing in..." : (
              <>
                Sign In
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
                </svg>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}