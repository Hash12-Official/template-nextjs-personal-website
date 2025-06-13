import { NextResponse } from "next/server"
import { z } from "zod"

// Define validation schema for bill withdrawal
const WithdrawSchema = z.object({
  billId: z.number().int().positive("Bill ID must be a positive integer"),
  amount: z.number().positive("Amount must be greater than zero"),
  cardLast4: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    // Parse and validate request body
    const body = await req.json()
    const validationResult = WithdrawSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error.errors.map((e) => e.message).join(", "),
        },
        { status: 400 },
      )
    }

    const { billId, amount, cardLast4 } = validationResult.data

    // In a real application, you would update a database record
    // For this demo, we'll simulate a successful withdrawal

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return NextResponse.json({
      success: true,
      billId,
      amount,
      status: "withdrawn",
      transactionId: `withdraw_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      cardLast4,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Bill withdrawal error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unexpected error occurred during bill withdrawal",
      },
      { status: 500 },
    )
  }
}
