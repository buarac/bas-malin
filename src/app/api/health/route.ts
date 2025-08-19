import { APP_NAME, APP_VERSION } from "@/constants"
import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    status: "ok",
    app: APP_NAME,
    version: APP_VERSION,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  })
}