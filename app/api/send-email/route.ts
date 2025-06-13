import { NextResponse } from "next/server"
import { z } from "zod"

// Define validation schema for email request
const EmailSchema = z.object({
  to: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required"),
  text: z.string().min(1, "Email body is required"),
  html: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    // Parse and validate request body
    const body = await req.json()
    const validationResult = EmailSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error.errors.map((e) => e.message).join(", "),
        },
        { status: 400 },
      )
    }

    const { to, subject, text, html } = validationResult.data

    // In a real application, you would integrate with an email service like SendGrid, Mailgun, etc.
    // For this demo, we'll simulate a successful email send
    console.log("Sending email to:", to)
    console.log("Subject:", subject)
    console.log("Body:", text)

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return NextResponse.json({
      success: true,
      messageId: `email_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      to,
      subject,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Email sending error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unexpected error occurred while sending the email",
      },
      { status: 500 },
    )
  }
}

