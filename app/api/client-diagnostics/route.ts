import { NextResponse } from "next/server"

type DiagnosticLevel = "info" | "warn" | "error"

const MAX_FIELD_LENGTH = 2000
const MAX_CONTEXT_LENGTH = 8000

function sanitizeString(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback
  return value.slice(0, MAX_FIELD_LENGTH)
}

function sanitizeLevel(value: unknown): DiagnosticLevel {
  return value === "info" || value === "warn" || value === "error" ? value : "info"
}

function sanitizeContext(value: unknown) {
  try {
    return JSON.parse(JSON.stringify(value ?? {}))
  } catch {
    return { serializationError: "Context could not be serialized" }
  }
}

function stringifyContext(value: unknown) {
  try {
    return JSON.stringify(value).slice(0, MAX_CONTEXT_LENGTH)
  } catch {
    return JSON.stringify({ serializationError: "Context could not be stringified" })
  }
}

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    console.error("[client-diagnostics]", {
      level: "error",
      message: "Received malformed client diagnostic payload",
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const data = body && typeof body === "object" ? (body as Record<string, unknown>) : {}
  const level = sanitizeLevel(data.level)
  const diagnostic = {
    level,
    component: sanitizeString(data.component, "unknown"),
    feature: sanitizeString(data.feature, "unknown"),
    message: sanitizeString(data.message, "Client diagnostic"),
    href: sanitizeString(data.href),
    userAgent: sanitizeString(data.userAgent),
    clientTimestamp: sanitizeString(data.timestamp),
    serverTimestamp: new Date().toISOString(),
    context: stringifyContext(sanitizeContext(data.context)),
  }

  const logger = level === "error" ? console.error : level === "warn" ? console.warn : console.info
  logger("[client-diagnostics]", diagnostic)

  return NextResponse.json({ ok: true })
}
