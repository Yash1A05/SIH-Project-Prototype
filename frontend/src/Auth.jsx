import { useState } from "react"
import { supabase } from "./supabaseClient"

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND
// ─────────────────────────────────────────────────────────────────────────────

const OCEAN_BG =
  "https://images.unsplash.com/photo-1545605114-7b82dad7b990?w=1200&h=900&fit=crop&auto=format"

// ─────────────────────────────────────────────────────────────────────────────
// LOGO
// ─────────────────────────────────────────────────────────────────────────────

function Logo({ size = "md" } ) {
  const iconSize = size === "sm" ? 32 : size === "lg" ? 52 : 40

  const textSize =
    size === "sm"
      ? "text-lg"
      : size === "lg"
        ? "text-3xl"
        : "text-2xl"

  return (
    <div className="flex items-center gap-3">
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle
          cx="20"
          cy="20"
          r="19"
          stroke="url(#logo-grad)"
          strokeWidth="1.5"
        />

        <path
          d="M20 30 L20 18 M20 18 L16 13 M20 18 L24 13 M16 13 L13 9 M16 13 L19 9 M24 13 L21 9 M24 13 L27 9"
          stroke="#00D9FF"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M14 30 Q20 26 26 30"
          stroke="#1769FF"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        <defs>
          <linearGradient
            id="logo-grad"
            x1="0"
            y1="0"
            x2="40"
            y2="40"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#00D9FF" />
            <stop offset="1" stopColor="#1769FF" />
          </linearGradient>
        </defs>
      </svg>

      <span className={`font-bold tracking-tight ${textSize}`}>
        <span style={{ color: "#F5FAFF" }}>BlueCarbon</span>
        <span style={{ color: "#00D9FF" }}>X</span>
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE ICONS
// ─────────────────────────────────────────────────────────────────────────────

const featureIcons = {
  transparent: (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="4"
        width="14"
        height="14"
        rx="2"
        stroke="#00D9FF"
        strokeWidth="1.5"
      />

      <path
        d="M8 11h6M11 8v6"
        stroke="#00D9FF"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      <path
        d="M2 7V4a2 2 0 012-2h3M15 2h3a2 2 0 012 2v3M20 15v3a2 2 0 01-2 2h-3M7 20H4a2 2 0 01-2-2v-3"
        stroke="#1769FF"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  ),

  secure: (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M11 2L4 5v5c0 4.418 2.987 8.545 7 9.95C15.013 18.545 18 14.418 18 10V5l-7-3z"
        stroke="#00D9FF"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      <path
        d="M8 11l2 2 4-4"
        stroke="#1769FF"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),

  verifiable: (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden="true"
    >
      <rect x="3" y="14" width="3" height="5" rx="1" fill="#1769FF" />
      <rect x="8" y="10" width="3" height="9" rx="1" fill="#1769FF" />
      <rect x="13" y="6" width="3" height="13" rx="1" fill="#00D9FF" />

      <path
        d="M4 9l4-4 4 4 5-6"
        stroke="#00D9FF"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),

  traceable: (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="5" cy="17" r="2" stroke="#1769FF" strokeWidth="1.5" />
      <circle cx="11" cy="5" r="2" stroke="#00D9FF" strokeWidth="1.5" />
      <circle cx="17" cy="17" r="2" stroke="#00D9FF" strokeWidth="1.5" />

      <path
        d="M7 15.5L9.5 7M12.5 7L15 15.5M5 15h12"
        stroke="#00D9FF"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  ),
}

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE ITEM
// ─────────────────────────────────────────────────────────────────────────────


function FeatureItem({
  icon,
  title,
  description,
  last,
}) {
  return (
    <div
      className="bcx-feature"
      style={{
        paddingBottom: last ? 0 : 20,
        marginBottom: last ? 0 : 20,
        borderBottom: last ? "none" : "1px solid #173752",
        display: "flex",
        gap: 16,
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          minWidth: 44,
          background: "rgba(0,217,255,0.07)",
          border: "1px solid #173752",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {featureIcons[icon]}
      </div>

      <div>
        <p
          style={{
            fontWeight: 600,
            fontSize: 14,
            color: "#F5FAFF",
            margin: "0 0 3px",
          }}
        >
          {title}
        </p>

        <p
          style={{
            fontSize: 12,
            lineHeight: 1.6,
            color: "#A9B8C8",
            margin: 0,
          }}
        >
          {description}
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// INPUT ICONS
// ─────────────────────────────────────────────────────────────────────────────

function EmailIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="1"
        y="3"
        width="14"
        height="10"
        rx="2"
        stroke="#718297"
        strokeWidth="1.3"
      />

      <path
        d="M1 5.5l7 4.5 7-4.5"
        stroke="#718297"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="7"
        width="10"
        height="7"
        rx="2"
        stroke="#718297"
        strokeWidth="1.3"
      />

      <path
        d="M5 7V5a3 3 0 016 0v2"
        stroke="#718297"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  )
}

function EyeIcon({ crossed } ) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"
        stroke="#718297"
        strokeWidth="1.3"
      />

      <circle
        cx="8"
        cy="8"
        r="2"
        stroke="#718297"
        strokeWidth="1.3"
      />

      {crossed && (
        <line
          x1="2"
          y1="2"
          x2="14"
          y2="14"
          stroke="#718297"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}

function UserIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="8"
        cy="6"
        r="3"
        stroke="#718297"
        strokeWidth="1.3"
      />

      <path
        d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6"
        stroke="#718297"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  )
}

function UserPlusIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="10"
        r="5"
        stroke="#00D9FF"
        strokeWidth="1.5"
      />

      <path
        d="M3 24c0-4.97 4.03-9 9-9s9 4.03 9 9"
        stroke="#00D9FF"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      <path
        d="M22 8v6M19 11h6"
        stroke="#00D9FF"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SOCIAL ICONS
// ─────────────────────────────────────────────────────────────────────────────

async function handleGoogleLogin() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
    },
  })

  if (error) {
    console.error("Google login error:", error.message)
    alert(`Google login failed: ${error.message}`)
  }
}

function GoogleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z"
        fill="#4285F4"
      />

      <path
        d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0010 20z"
        fill="#34A853"
      />

      <path
        d="M4.405 11.9A6.01 6.01 0 014.09 10c0-.663.114-1.308.315-1.9V5.51H1.064A9.996 9.996 0 000 10c0 1.614.386 3.14 1.064 4.49L4.405 11.9z"
        fill="#FBBC05"
      />

      <path
        d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.959.99 12.695 0 10 0A9.996 9.996 0 001.064 5.51L4.405 7.9C5.19 5.736 7.395 3.977 10 3.977z"
        fill="#EA4335"
      />
    </svg>
  )
}

function MicrosoftIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <rect x="0" y="0" width="9.5" height="9.5" fill="#F25022" />
      <rect x="10.5" y="0" width="9.5" height="9.5" fill="#7FBA00" />
      <rect x="0" y="10.5" width="9.5" height="9.5" fill="#00A4EF" />
      <rect
        x="10.5"
        y="10.5"
        width="9.5"
        height="9.5"
        fill="#FFB900"
      />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMON INPUT
// ─────────────────────────────────────────────────────────────────────────────


function InputField({
  id,
  label,
  type,
  placeholder,
  value,
  onChange,
  error,
  leftIcon,
  rightAction,
  autoComplete,
}) {
  const [focused, setFocused] = useState(false)

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 5,
      }}
    >
      {label && (
        <label
          htmlFor={id}
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "#A9B8C8",
          }}
        >
          {label}
        </label>
      )}

      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
        }}
      >
        <span
          style={{
            position: "absolute",
            left: 14,
            display: "flex",
            alignItems: "center",
            pointerEvents: "none",
          }}
        >
          {leftIcon}
        </span>

        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={!!error}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            paddingLeft: 42,
            paddingRight: rightAction ? 44 : 14,
            paddingTop: 13,
            paddingBottom: 13,
            background: "rgba(255,255,255,0.04)",
            border: error
              ? "1px solid #ff4d6a"
              : focused
                ? "1px solid #00D9FF"
                : "1px solid #173752",
            borderRadius: 10,
            color: "#F5FAFF",
            fontSize: 14,
            outline: "none",
            transition: "border-color 0.2s",
            fontFamily: "inherit",
          }}
        />

        {rightAction && (
          <span
            style={{
              position: "absolute",
              right: 14,
              display: "flex",
              alignItems: "center",
            }}
          >
            {rightAction}
          </span>
        )}
      </div>

      {error && (
        <p
          id={`${id}-error`}
          style={{
            fontSize: 11,
            color: "#ff4d6a",
            margin: 0,
          }}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN FORM
// ─────────────────────────────────────────────────────────────────────────────

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function LoginForm({
  onRegister,
  onAuthenticated,
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")

  const [formState, setFormState] =
    useState("idle")

  function validate() {
    let valid = true

    if (!email.trim()) {
      setEmailError("Please enter your email address.")
      valid = false
    } else if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address.")
      valid = false
    } else {
      setEmailError("")
    }

    if (!password) {
      setPasswordError("Please enter your password.")
      valid = false
    } else if (password.length < 6) {
      setPasswordError(
        "Password must be at least 6 characters.",
      )
      valid = false
    } else {
      setPasswordError("")
    }

    return valid
  }

  async function handleLogin(e) {
    e.preventDefault()

    if (!validate()) return

    setFormState("loading")

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setFormState("idle")
      setPasswordError(error.message)
      return
    }

    setPasswordError("")
    setFormState("success")
    setTimeout(() => {
      if (onAuthenticated) onAuthenticated()
    }, 500)

    // Authentication succeeded; let the parent show the existing dashboard.
    setTimeout(() => {
      if (onAuthenticated) onAuthenticated()
    }, 500)
  }

  if (formState === "success") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          textAlign: "center",
          padding: "16px 0",
        }}
      >
        <svg
          width="56"
          height="56"
          viewBox="0 0 56 56"
          fill="none"
          aria-label="Success"
        >
          <circle
            cx="28"
            cy="28"
            r="27"
            stroke="#00D9FF"
            strokeWidth="1.5"
          />

          <path
            d="M18 28l8 8 14-14"
            stroke="#00D9FF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <p
          style={{
            fontWeight: 700,
            fontSize: 20,
            color: "#F5FAFF",
            margin: 0,
          }}
        >
          Login Successful
        </p>

        <p
          style={{
            fontSize: 14,
            color: "#A9B8C8",
            margin: 0,
          }}
        >
          Redirecting to your dashboard…
        </p>
      </div>
    )
  }

  const isLoading = formState === "loading"

  return (
    <form
      onSubmit={handleLogin}
      noValidate
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        width: "100%",
      }}
    >
      <InputField
        id="login-email"
        label="Email address"
        type="email"
        placeholder="Enter your email address"
        value={email}
        onChange={(value) => {
          setEmail(value)

          if (emailError) {
            setEmailError("")
          }
        }}
        error={emailError}
        leftIcon={<EmailIcon />}
        autoComplete="email"
      />

      <InputField
        id="login-password"
        label="Password"
        type={showPassword ? "text" : "password"}
        placeholder="Enter your password"
        value={password}
        onChange={(value) => {
          setPassword(value)

          if (passwordError) {
            setPasswordError("")
          }
        }}
        error={passwordError}
        leftIcon={<LockIcon />}
        autoComplete="current-password"
        rightAction={
          <button
            type="button"
            aria-label={
              showPassword
                ? "Hide password"
                : "Show password"
            }
            onClick={() =>
              setShowPassword((state) => !state)
            }
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              display: "flex",
            }}
          >
            <EyeIcon crossed={showPassword} />
          </button>
        }
      />

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <button
          type="button"
          onClick={() =>
            alert(
              "Password reset flow — coming soon.",
            )
          }
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#00D9FF",
            fontSize: 12,
            fontWeight: 500,
            padding: 0,
            fontFamily: "inherit",
          }}
        >
          Forgot password?
        </button>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: 50,
          background: isLoading
            ? "rgba(0,217,255,0.25)"
            : "linear-gradient(90deg,#00D9FF 0%,#1769FF 100%)",
          border: "none",
          color: isLoading
            ? "#A9B8C8"
            : "#020B18",
          fontWeight: 600,
          fontSize: 15,
          cursor: isLoading
            ? "not-allowed"
            : "pointer",
          letterSpacing: "0.02em",
          transition:
            "opacity 0.2s, transform 0.1s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          fontFamily: "inherit",
        }}
      >
        {isLoading ? "Authenticating…" : "Login →"}
      </button>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            flex: 1,
            height: 1,
            background: "#173752",
          }}
        />

        <span
          style={{
            fontSize: 11,
            color: "#718297",
          }}
        >
          OR
        </span>

        <div
          style={{
            flex: 1,
            height: 1,
            background: "#173752",
          }}
        />
      </div>

      {/* Social Login */}
      <div
        style={{
          display: "flex",
          gap: 9,
        }}
      >
        <button
          type="button"
          aria-label="Continue with Google"
          onClick={handleGoogleLogin}
          style={{
            flex: 1,
            padding: "10px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "background 0.2s, border-color 0.2s, transform 0.2s",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0,217,255,0.08)"
            e.currentTarget.style.borderColor = "rgba(0,217,255,0.3)"
            e.currentTarget.style.transform = "translateY(-2px)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.04)"
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"
            e.currentTarget.style.transform = "translateY(0)"
          }}
        >
          <GoogleIcon />
        </button>

        <button
          type="button"
          aria-label="Continue with Microsoft"
          onClick={() =>
            alert("Continue with Microsoft — authentication coming soon.")
          }
          style={{
            flex: 1,
            padding: "10px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "background 0.2s, border-color 0.2s, transform 0.2s",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0,217,255,0.08)"
            e.currentTarget.style.borderColor = "rgba(0,217,255,0.3)"
            e.currentTarget.style.transform = "translateY(-2px)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.04)"
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"
            e.currentTarget.style.transform = "translateY(0)"
          }}
        >
          <MicrosoftIcon />
        </button>
      </div>

      <p
        style={{
          textAlign: "center",
          fontSize: 13,
          color: "#A9B8C8",
          margin: 0,
        }}
      >
        Don't have an account?
      </p>

      <button
        type="button"
        onClick={onRegister}
        style={{
          width: "100%",
          padding: "13px",
          borderRadius: 50,
          background: "transparent",
          border: "1.5px solid #00D9FF",
          color: "#00D9FF",
          fontWeight: 600,
          fontSize: 15,
          cursor: "pointer",
          letterSpacing: "0.02em",
          transition:
            "background 0.2s, transform 0.2s",
          fontFamily: "inherit",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background =
            "rgba(0,217,255,0.08)"
          e.currentTarget.style.transform =
            "translateY(-1px)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background =
            "transparent"
          e.currentTarget.style.transform =
            "translateY(0)"
        }}
      >
        Register Now →
      </button>
    </form>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRATION INPUT
// ─────────────────────────────────────────────────────────────────────────────


function RegisterInput({
  id,
  type,
  placeholder,
  value,
  onChange,
  error,
  leftIcon,
  rightAction,
  autoComplete,
}) {
  const [focused, setFocused] = useState(false)

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
        }}
      >
        <span
          style={{
            position: "absolute",
            left: 14,
            display: "flex",
            alignItems: "center",
            pointerEvents: "none",
          }}
        >
          {leftIcon}
        </span>

        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
          autoComplete={autoComplete}
          aria-describedby={
            error ? `${id}-error` : undefined
          }
          aria-invalid={!!error}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            paddingLeft: 44,
            paddingRight: rightAction ? 44 : 16,
            paddingTop: 14,
            paddingBottom: 14,
            background: "rgba(255,255,255,0.05)",
            border: error
              ? "1px solid #ff4d6a"
              : focused
                ? "1px solid rgba(0,217,255,0.6)"
                : "1px solid rgba(255,255,255,0.12)",
            borderRadius: 10,
            color: "#F5FAFF",
            fontSize: 14,
            outline: "none",
            transition: "border-color 0.2s",
            fontFamily: "inherit",
          }}
        />

        {rightAction && (
          <span
            style={{
              position: "absolute",
              right: 14,
              display: "flex",
              alignItems: "center",
            }}
          >
            {rightAction}
          </span>
        )}
      </div>

      {error && (
        <p
          id={`${id}-error`}
          style={{
            fontSize: 11,
            color: "#ff4d6a",
            margin: 0,
          }}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRATION PANEL
// ─────────────────────────────────────────────────────────────────────────────

function RegisterPanel({
  onLogin,
} ) {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] =
    useState("")

  const [showPassword, setShowPassword] =
    useState(false)

  const [showConfirm, setShowConfirm] =
    useState(false)

  const [agreed, setAgreed] = useState(false)

  const [errors, setErrors] =
    useState({})

  const [submitted, setSubmitted] =
    useState(false)

  function validate() {
    const newErrors = {}

    if (!fullName.trim()) {
      newErrors.fullName =
        "Please enter your full name."
    }

    if (!email.trim()) {
      newErrors.email =
        "Please enter your email address."
    } else if (!validateEmail(email)) {
      newErrors.email =
        "Please enter a valid email address."
    }

    if (!password) {
      newErrors.password =
        "Please enter a password."
    } else if (password.length < 6) {
      newErrors.password =
        "Password must be at least 6 characters."
    }

    if (!confirmPassword) {
      newErrors.confirmPassword =
        "Please confirm your password."
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword =
        "Passwords do not match."
    }

    if (!agreed) {
      newErrors.agreed =
        "You must agree to the Terms of Service and Privacy Policy."
    }

    return newErrors
  }

  async function handleRegister(
    e,
  ) {
    e.preventDefault()

    const newErrors = validate()

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
      },
    })

    if (error) {
      setErrors({
        email: error.message,
      })
      return
    }

    // Registration succeeded. Move directly to the Login screen.
    setSubmitted(false)
    onLogin()
  }

  const eyeButton = (
    show,
    toggle,
    label,
  ) => (
    <button
      type="button"
      aria-label={label}
      onClick={toggle}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
        display: "flex",
      }}
    >
      <EyeIcon crossed={show} />
    </button>
  )

  if (submitted) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          textAlign: "center",
          padding: "16px 0",
        }}
      >
        <svg
          width="56"
          height="56"
          viewBox="0 0 56 56"
          fill="none"
        >
          <circle
            cx="28"
            cy="28"
            r="27"
            stroke="#00D9FF"
            strokeWidth="1.5"
          />

          <path
            d="M18 28l8 8 14-14"
            stroke="#00D9FF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <p
          style={{
            fontWeight: 700,
            fontSize: 20,
            color: "#F5FAFF",
            margin: 0,
          }}
        >
          Account Created!
        </p>

        <p
          style={{
            fontSize: 14,
            color: "#A9B8C8",
            margin: 0,
          }}
        >
          Welcome to BlueCarbonX. Please check
          your email to verify your account.
        </p>

        <button
          type="button"
          onClick={onLogin}
          style={{
            padding: "11px 28px",
            borderRadius: 50,
            background:
              "linear-gradient(90deg,#00D9FF,#1769FF)",
            border: "none",
            color: "#020B18",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Go to Login
        </button>
      </div>
    )
  }

  return (
    <div
      className="bcx-register-content"
      style={{
        width: "100%",
        boxSizing: "border-box",

        /*
         * IMPORTANT:
         * There is NO maxHeight here.
         * There is NO overflowY here.
         *
         * This is the main fix for your scrolling problem.
         */
      }}
    >
      <div
        style={{
          width: "100%",
          background: "rgba(6,23,42,0.58)",
          border:
            "1px solid rgba(0,217,255,0.22)",
          borderRadius: 16,
          boxShadow:
            "0 0 45px rgba(0,217,255,0.07), inset 0 0 0 1px rgba(0,217,255,0.04)",
          padding: "24px 26px 22px",
          boxSizing: "border-box",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 14,
          }}
        >
          <Logo size="md" />
        </div>

        {/* User Plus */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 10,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background:
                "rgba(0,217,255,0.07)",
              border:
                "1.5px solid rgba(0,217,255,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <UserPlusIcon />
          </div>
        </div>

        {/* Heading */}
        <h2
          style={{
            fontSize: 23,
            fontWeight: 700,
            color: "#F5FAFF",
            textAlign: "center",
            margin: "0 0 5px",
          }}
        >
          Create Account
        </h2>

        <p
          style={{
            fontSize: 12.5,
            color: "#A9B8C8",
            textAlign: "center",
            margin: "0 0 17px",
            lineHeight: 1.45,
          }}
        >
          Be part of the movement for transparent
          <br />
          blue carbon data.
        </p>

        <form
          onSubmit={handleRegister}
          noValidate
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 9,
          }}
        >
          {/* Full Name */}
          <RegisterInput
            id="register-name"
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(value) => {
              setFullName(value)

              if (errors.fullName) {
                setErrors((current) => ({
                  ...current,
                  fullName: "",
                }))
              }
            }}
            error={errors.fullName}
            leftIcon={<UserIcon />}
            autoComplete="name"
          />

          {/* Email */}
          <RegisterInput
            id="register-email"
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(value) => {
              setEmail(value)

              if (errors.email) {
                setErrors((current) => ({
                  ...current,
                  email: "",
                }))
              }
            }}
            error={errors.email}
            leftIcon={<EmailIcon />}
            autoComplete="email"
          />

          {/* Password */}
          <RegisterInput
            id="register-password"
            type={
              showPassword
                ? "text"
                : "password"
            }
            placeholder="Password"
            value={password}
            onChange={(value) => {
              setPassword(value)

              if (errors.password) {
                setErrors((current) => ({
                  ...current,
                  password: "",
                }))
              }
            }}
            error={errors.password}
            leftIcon={<LockIcon />}
            autoComplete="new-password"
            rightAction={eyeButton(
              showPassword,
              () =>
                setShowPassword(
                  (state) => !state,
                ),
              showPassword
                ? "Hide password"
                : "Show password",
            )}
          />

          {/* Confirm Password */}
          <RegisterInput
            id="register-confirm-password"
            type={
              showConfirm
                ? "text"
                : "password"
            }
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(value) => {
              setConfirmPassword(value)

              if (errors.confirmPassword) {
                setErrors((current) => ({
                  ...current,
                  confirmPassword: "",
                }))
              }
            }}
            error={errors.confirmPassword}
            leftIcon={<LockIcon />}
            autoComplete="new-password"
            rightAction={eyeButton(
              showConfirm,
              () =>
                setShowConfirm(
                  (state) => !state,
                ),
              showConfirm
                ? "Hide confirm password"
                : "Show confirm password",
            )}
          />

          {/* Terms */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 9,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => {
                  setAgreed(
                    e.target.checked,
                  )

                  if (errors.agreed) {
                    setErrors((current) => ({
                      ...current,
                      agreed: "",
                    }))
                  }
                }}
                style={{
                  marginTop: 2,
                  accentColor: "#00D9FF",
                  width: 14,
                  height: 14,
                  flexShrink: 0,
                }}
                aria-describedby={
                  errors.agreed
                    ? "register-terms-error"
                    : undefined
                }
              />

              <span
                style={{
                  fontSize: 11.5,
                  color: "#A9B8C8",
                  lineHeight: 1.45,
                }}
              >
                I agree to the{" "}
                <button
                  type="button"
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    color: "#00D9FF",
                    cursor: "pointer",
                    fontSize: 11.5,
                    fontFamily: "inherit",
                  }}
                >
                  Terms of Service
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    color: "#00D9FF",
                    cursor: "pointer",
                    fontSize: 11.5,
                    fontFamily: "inherit",
                  }}
                >
                  Privacy Policy
                </button>
              </span>
            </label>

            {errors.agreed && (
              <p
                id="register-terms-error"
                style={{
                  fontSize: 10.5,
                  color: "#ff4d6a",
                  margin: 0,
                }}
                role="alert"
              >
                {errors.agreed}
              </p>
            )}
          </div>

          {/* Register Button */}
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 50,
              background:
                "linear-gradient(90deg,#1769FF 0%,#00D9FF 100%)",
              border: "none",
              color: "#F5FAFF",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              letterSpacing: "0.02em",
              transition:
                "opacity 0.2s, transform 0.1s, box-shadow 0.2s",
              boxShadow:
                "0 0 20px rgba(0,217,255,0.16)",
              fontFamily: "inherit",
              marginTop: 2,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity =
                "0.88"

              e.currentTarget.style.boxShadow =
                "0 0 26px rgba(0,217,255,0.28)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity =
                "1"

              e.currentTarget.style.boxShadow =
                "0 0 20px rgba(0,217,255,0.16)"
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform =
                "scale(0.98)"
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform =
                "scale(1)"
            }}
          >
            Register →
          </button>

          {/* OR */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              margin: "2px 0",
            }}
          >
            <div
              style={{
                flex: 1,
                height: 1,
                background: "#173752",
              }}
            />

            <span
              style={{
                fontSize: 10.5,
                color: "#718297",
              }}
            >
              OR
            </span>

            <div
              style={{
                flex: 1,
                height: 1,
                background: "#173752",
              }}
            />
          </div>

          {/* Social Buttons */}
          <div
            style={{
              display: "flex",
              gap: 9,
            }}
          >
            {[
              {
                icon: <GoogleIcon />,
                label: "Continue with Google",
              },
              {
                icon: <MicrosoftIcon />,
                label:
                  "Continue with Microsoft",
              },
            ].map(({ icon, label }) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                onClick={() => {
                  if (label === "Continue with Google") {
                    void handleGoogleLogin()
                  } else {
                    alert(
                      `${label} — authentication coming soon.`,
                    )
                  }
                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  background:
                    "rgba(255,255,255,0.04)",
                  border:
                    "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition:
                    "background 0.2s, border-color 0.2s, transform 0.2s",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    "rgba(0,217,255,0.08)"

                  e.currentTarget.style.borderColor =
                    "rgba(0,217,255,0.3)"

                  e.currentTarget.style.transform =
                    "translateY(-2px)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    "rgba(255,255,255,0.04)"

                  e.currentTarget.style.borderColor =
                    "rgba(255,255,255,0.12)"

                  e.currentTarget.style.transform =
                    "translateY(0)"
                }}
              >
                {icon}
              </button>
            ))}
          </div>

          {/* Login */}
          <p
            style={{
              textAlign: "center",
              fontSize: 11.5,
              color: "#A9B8C8",
              margin: "1px 0 0",
            }}
          >
            Already have an account?{" "}
            <button
              type="button"
              onClick={onLogin}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: "#00D9FF",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: 11.5,
                fontFamily: "inherit",
              }}
            >
              Login
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────




function AuthLayout({ view, setView, onAuthenticated }) {

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────────────
          ANIMATIONS + RESPONSIVE STYLES
      ───────────────────────────────────────────────────────────────────── */}

      <style>{`
        @keyframes bcx-spin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        .bcx-spin {
          animation: bcx-spin 0.9s linear infinite;
        }

        /* Login enters from the right */
        @keyframes bcx-login-enter {
          0% {
            opacity: 0;
            transform:
              translateX(34px)
              scale(0.985);
            filter: blur(5px);
          }

          55% {
            opacity: 0.75;
            transform:
              translateX(8px)
              scale(0.995);
            filter: blur(1px);
          }

          100% {
            opacity: 1;
            transform:
              translateX(0)
              scale(1);
            filter: blur(0);
          }
        }

        /* Registration enters from the left */
        @keyframes bcx-register-enter {
          0% {
            opacity: 0;
            transform:
              translateX(-34px)
              scale(0.985);
            filter: blur(5px);
          }

          55% {
            opacity: 0.75;
            transform:
              translateX(-8px)
              scale(0.995);
            filter: blur(1px);
          }

          100% {
            opacity: 1;
            transform:
              translateX(0)
              scale(1);
            filter: blur(0);
          }
        }

        .bcx-panel-enter-login {
          animation:
            bcx-login-enter
            520ms
            cubic-bezier(.22,.8,.25,1)
            both;
        }

        .bcx-panel-enter-register {
          animation:
            bcx-register-enter
            520ms
            cubic-bezier(.22,.8,.25,1)
            both;
        }

        /* =============================================================
           SMOOTH UI POLISH
           ============================================================= */

        @keyframes bcx-ocean-drift {
          0%, 100% {
            transform: scale(1.02) translate3d(0, 0, 0);
          }

          50% {
            transform: scale(1.045) translate3d(-6px, -4px, 0);
          }
        }

        @keyframes bcx-hero-reveal {
          from {
            opacity: 0;
            transform: translateY(12px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .bcx-ocean-bg {
          animation: bcx-ocean-drift 18s ease-in-out infinite;
          transform-origin: center center;
          will-change: transform;
        }

        .bcx-hero-content {
          animation:
            bcx-hero-reveal
            850ms
            cubic-bezier(.22,.8,.25,1)
            120ms both;
        }

        .bcx-center::before {
          content: "";
          position: absolute;
          width: 320px;
          height: 320px;
          top: -180px;
          right: -160px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(0,217,255,0.06) 0%,
            rgba(0,217,255,0) 70%
          );
          pointer-events: none;
        }

        .bcx-feature {
          position: relative;
          border-radius: 14px;
          transition:
            transform 260ms cubic-bezier(.22,.8,.25,1),
            background-color 260ms ease;
        }

        .bcx-feature:hover {
          transform: translateX(4px);
          background-color: rgba(0,217,255,0.022);
        }

        .bcx-feature > div:first-child {
          transition:
            transform 260ms cubic-bezier(.22,.8,.25,1),
            border-color 260ms ease,
            background-color 260ms ease,
            box-shadow 260ms ease;
        }

        .bcx-feature:hover > div:first-child {
          transform: translateY(-2px) scale(1.035);
          border-color: rgba(0,217,255,0.38) !important;
          background-color: rgba(0,217,255,0.10) !important;
          box-shadow: 0 0 18px rgba(0,217,255,0.11);
        }

        .bcx-right input {
          transition:
            border-color 220ms ease,
            background-color 220ms ease,
            box-shadow 220ms ease;
        }

        .bcx-right input:hover {
          background-color: rgba(255,255,255,0.055) !important;
          border-color: rgba(0,217,255,0.28) !important;
        }

        .bcx-right input:focus {
          box-shadow:
            0 0 0 3px rgba(0,217,255,0.055),
            0 0 18px rgba(0,217,255,0.045);
        }

        .bcx-right button {
          transition:
            transform 180ms ease,
            box-shadow 220ms ease,
            background-color 220ms ease,
            border-color 220ms ease,
            opacity 220ms ease;
        }

        .bcx-right button:not(:disabled):hover {
          transform: translateY(-1px);
        }

        .bcx-right button:not(:disabled):active {
          transform: translateY(0) scale(0.985);
        }

        .bcx-right button:not(:disabled):focus-visible,
        .bcx-center button:focus-visible {
          outline: 2px solid rgba(0,217,255,0.55);
          outline-offset: 3px;
        }

        .bcx-panel-enter-login,
        .bcx-panel-enter-register {
          will-change: transform, opacity, filter;
        }

        /*
         * IMPORTANT PAGE SCROLL FIX
         *
         * The previous version had overflow:hidden on the
         * complete layout and overflow:auto inside registration.
         *
         * We intentionally allow the DOCUMENT to scroll instead.
         */
        html,
        body,
        #root {
          width: 100%;
          min-height: 100%;
        }

        html {
          overflow-x: hidden !important;
          overflow-y: auto !important;
        }

        body {
          height: auto !important;
          overflow-x: hidden !important;
          overflow-y: auto !important;
        }

        .bcx-layout {
          overflow: visible !important;
          min-height: 100vh;
          height: auto !important;
          align-items: stretch;
        }

        .bcx-right {
          overflow: visible !important;
          height: auto !important;
          min-height: 100vh;
        }

        .bcx-register-content {
          width: 100%;
          max-height: none !important;
          overflow: visible !important;
        }

        @media (prefers-reduced-motion: reduce) {
          .bcx-panel-enter-login,
          .bcx-panel-enter-register,
          .bcx-ocean-bg,
          .bcx-hero-content {
            animation: none !important;
          }

          .bcx-feature,
          .bcx-feature > div:first-child,
          .bcx-right button,
          .bcx-right input {
            transition: none !important;
          }
        }

        @media (max-width: 900px) {
          .bcx-layout {
            flex-direction: column !important;
          }

          .bcx-left {
            width: 100% !important;
            min-height: 420px !important;
          }

          .bcx-center {
            width: 100% !important;
            min-height: auto !important;
          }

          .bcx-right {
            width: 100% !important;
            min-height: 100vh !important;
            height: auto !important;
            overflow: visible !important;
            padding: 36px 24px !important;
          }

          .bcx-layout {
            overflow: visible !important;
          }

          .bcx-divider {
            display: none !important;
          }

          .bcx-hero-text h1 {
            font-size: 36px !important;
          }
        }
      `}</style>

      {/* ─────────────────────────────────────────────────────────────────────
          COMPLETE THREE-COLUMN LAYOUT
      ───────────────────────────────────────────────────────────────────── */}

      <div
        className="bcx-layout"
        style={{
          display: "flex",
          width: "100%",
          minHeight: "100vh",
          fontFamily: "'Inter', sans-serif",
          background: "#020B18",

          /*
           * DO NOT USE overflow:hidden HERE.
           *
           * The document needs to grow when the registration
           * panel is taller than the viewport.
           */
          overflow: "visible",
          alignItems: "stretch",
        }}
      >
        {/* ═══════════════════════════════════════════════════════════════════
            LEFT COMPARTMENT
            ═══════════════════════════════════════════════════════════════════ */}

        <section
          aria-label="Ocean hero"
          className="bcx-left"
          style={{
            position: "relative",
            width: "40%",
            minHeight: "100vh",
            flexShrink: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Ocean background */}
          <div
            className="bcx-ocean-bg"
            style={{
              position: "absolute",
              inset: "-2%",
              backgroundImage: `url("${OCEAN_BG}")`,
              backgroundSize: "cover",
              backgroundPosition: "center top",
              backgroundRepeat: "no-repeat",
            }}
            role="img"
            aria-label="Underwater ocean scene with coral reef and sunlight rays"
          />

          {/* Dark overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(2,11,24,0.5) 0%, rgba(2,11,24,0.25) 35%, rgba(2,11,24,0.6) 75%, rgba(2,11,24,0.9) 100%)",
            }}
          />

          {/* Right edge gradient */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: 90,
              background:
                "linear-gradient(90deg, transparent, rgba(6,23,42,0.95))",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              flexDirection: "column",
              height: "100%",
              padding: "42px 40px",
              boxSizing: "border-box",
            }}
          >
            <Logo size="md" />

            <div style={{ flex: 1 }} />

            <div
              className="bcx-hero-text bcx-hero-content"
              style={{
                paddingBottom: 56,
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 2,
                  background:
                    "linear-gradient(90deg,#00D9FF,#1769FF)",
                  borderRadius: 2,
                  marginBottom: 20,
                }}
              />

              <h1
                style={{
                  fontSize:
                    "clamp(38px,3.8vw,54px)",
                  fontWeight: 800,
                  lineHeight: 1.1,
                  margin: "0 0 20px",
                  color: "#F5FAFF",
                }}
              >
                Verify.
                <br />
                Track.
                <br />

                <span
                  style={{
                    background:
                      "linear-gradient(90deg,#00D9FF,#1769FF)",
                    WebkitBackgroundClip:
                      "text",
                    WebkitTextFillColor:
                      "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Protect.
                </span>
              </h1>

              <p
                style={{
                  fontSize: 16,
                  lineHeight: 1.65,
                  color: "#A9B8C8",
                  maxWidth: 320,
                  margin: "0 0 28px",
                }}
              >
                A blockchain-powered platform
                for monitoring, reporting, and
                verifying{" "}
                <span
                  style={{
                    color: "#00D9FF",
                  }}
                >
                  blue carbon
                </span>{" "}
                ecosystem data.
              </p>

              <button
                type="button"
                aria-label="Learn more about BlueCarbonX"
                style={{
                  padding: "10px 22px",
                  borderRadius: 18,
                  background: "transparent",
                  border:
                    "1px solid #00D9FF",
                  color: "#00D9FF",
                  fontWeight: 500,
                  fontSize: 14,
                  cursor: "pointer",
                  transition:
                    "box-shadow .2s, background .2s",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 0 14px rgba(0,217,255,0.3)"

                  e.currentTarget.style.background =
                    "rgba(0,217,255,0.07)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow =
                    "none"

                  e.currentTarget.style.background =
                    "transparent"
                }}
              >
                Learn More →
              </button>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            CENTER COMPARTMENT
            ═══════════════════════════════════════════════════════════════════ */}

        <section
          aria-label="About BlueCarbonX"
          className="bcx-center"
          style={{
            width: "29%",
            minHeight: "100vh",
            flexShrink: 0,
            background: "#06172A",
            display: "flex",
            flexDirection: "column",
            padding: "56px 36px 48px",
            position: "relative",
            zIndex: 1,
            boxSizing: "border-box",
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.15em",
              color: "#00D9FF",
              marginBottom: 8,
              textTransform: "uppercase",
            }}
          >
            About
          </p>

          <h2
            style={{
              fontSize: 30,
              fontWeight: 700,
              color: "#F5FAFF",
              margin: "0 0 12px",
            }}
          >
            BlueCarbon
            <span style={{ color: "#00D9FF" }}>
              X
            </span>
          </h2>

          <div
            style={{
              width: 36,
              height: 2,
              background:
                "linear-gradient(90deg,#00D9FF,#1769FF)",
              borderRadius: 2,
              marginBottom: 20,
            }}
          />

          <p
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: "#A9B8C8",
              marginBottom: 36,
            }}
          >
            A blockchain-based registry for
            monitoring, reporting, and verifying
            blue carbon ecosystem data with
            transparent and immutable records.
          </p>

          <div
  style={{
    flex: 1,
    textAlign: "left",
  }}
>
            <FeatureItem
              icon="transparent"
              title="Transparent"
              description="Immutable blockchain records for complete transparency."
            />

            <FeatureItem
              icon="secure"
              title="Secure"
              description="End-to-end data protection and integrity."
            />

            <FeatureItem
              icon="verifiable"
              title="Verifiable"
              description="Reliable monitoring and verification you can trust."
            />

            <FeatureItem
              icon="traceable"
              title="Traceable"
              description="Track ecosystem data and carbon records throughout its lifecycle."
              last
            />
          </div>

          <p
            style={{
              fontSize: 11,
              color: "#718297",
              marginTop: 40,
            }}
          >
            © 2026 BlueCarbonX · Blockchain MRV
            Platform
          </p>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            RIGHT COMPARTMENT
            ONLY THIS SECTION CHANGES BETWEEN LOGIN & REGISTER
            ═══════════════════════════════════════════════════════════════════ */}

        <section
          aria-label={
            view === "login"
              ? "Login"
              : "Registration"
          }
          className="bcx-right"
          style={{
            flex: 1,
            minHeight: "100vh",
            background: "#020B18",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent:
              view === "register"
                ? "flex-start"
                : "center",
            padding:
              view === "register"
                ? "28px 28px 40px"
                : "48px 36px",
            position: "relative",

            /*
             * IMPORTANT:
             * The right compartment itself does NOT scroll.
             * The browser/document scrolls instead.
             */
            overflow: "visible",
            boxSizing: "border-box",
          }}
        >
          {/* Curved divider */}
          <svg
            aria-hidden="true"
            className="bcx-divider"
            style={{
              position: "absolute",
              left: -1,
              top: 0,
              height: "100%",
              width: 30,
              pointerEvents: "none",
              zIndex: 3,
            }}
            viewBox="0 0 30 900"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient
                id="div-grad"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="transparent"
                />

                <stop
                  offset="15%"
                  stopColor="#00D9FF"
                  stopOpacity="0.5"
                />

                <stop
                  offset="85%"
                  stopColor="#1769FF"
                  stopOpacity="0.5"
                />

                <stop
                  offset="100%"
                  stopColor="transparent"
                />
              </linearGradient>
            </defs>

            <path
              d="M28 0 Q6 225 28 450 Q50 675 28 900"
              fill="none"
              stroke="url(#div-grad)"
              strokeWidth="1.2"
            />
          </svg>

          {/* 
            key={view} forces React to create the new panel,
            which allows the Login/Register animation to play
            every time the user changes view.
          */}
          <div
            key={view}
            className={
              view === "login"
                ? "bcx-panel-enter-login"
                : "bcx-panel-enter-register"
            }
            style={{
              width: "100%",
              maxWidth:
                view === "register"
                  ? 430
                  : 360,
              position: "relative",
              zIndex: 2,
              transformOrigin:
                "center center",
            }}
          >
            {view === "login" ? (
              <>
                {/* Login Logo Icon */}
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "center",
                    marginBottom: 24,
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      background:
                        "rgba(0,217,255,0.07)",
                      border:
                        "1.5px solid rgba(0,217,255,0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 32 32"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        cx="16"
                        cy="16"
                        r="15"
                        stroke="url(#icon-g)"
                        strokeWidth="1.2"
                      />

                      <path
                        d="M16 24 L16 14 M16 14 L13 10 M16 14 L19 10 M13 10 L11 7 M13 10 L15 7 M19 10 L17 7 M19 10 L21 7"
                        stroke="#00D9FF"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      <path
                        d="M11 24 Q16 21 21 24"
                        stroke="#1769FF"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                      />

                      <defs>
                        <linearGradient
                          id="icon-g"
                          x1="0"
                          y1="0"
                          x2="32"
                          y2="32"
                          gradientUnits="userSpaceOnUse"
                        >
                          <stop stopColor="#00D9FF" />
                          <stop
                            offset="1"
                            stopColor="#1769FF"
                          />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>

                <h2
                  style={{
                    fontSize: 26,
                    fontWeight: 700,
                    color: "#F5FAFF",
                    textAlign: "center",
                    margin: "0 0 6px",
                  }}
                >
                  Welcome Back
                </h2>

                <p
                  style={{
                    fontSize: 14,
                    color: "#A9B8C8",
                    textAlign: "center",
                    marginBottom: 28,
                  }}
                >
                  Login to your account
                </p>

                <LoginForm
                  onAuthenticated={onAuthenticated}
                  onRegister={() =>
                    setView("register")
                  }
                />
              </>
            ) : (
              <RegisterPanel
                onLogin={() =>
                  setView("login")
                }
              />
            )}
          </div>
        </section>
      </div>
    </>
  )
}

// Authentication screen only. The existing dashboard remains outside this component.
export default function Auth({ onAuthenticated }) {
  const [view, setView] = useState("login")

  return (
    <>
      <style>{`
        @keyframes bcx-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .bcx-spin { animation: bcx-spin 0.9s linear infinite; }
      `}</style>
      <div className="bcx-auth-wrapper">
        {/* Reuse the complete contribution UI below through the original layout component. */}
        <AuthLayout view={view} setView={setView} onAuthenticated={onAuthenticated} />
      </div>
    </>
  )
}
