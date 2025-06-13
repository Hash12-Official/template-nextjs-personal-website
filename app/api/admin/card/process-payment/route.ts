import { NextResponse } from "next/server"
import { z } from "zod"

// Define validation schema for admin payment
const PaymentSchema = z.object({
  amount: z.number().positive("Amount must be greater than zero"),
  cardDetails: z
    .object({
      cardNumber: z
        .string()
        .regex(/^\d{16}$/, "Card number must be 16 digits")
        .optional(),
      expiryDate: z
        .string()
        .regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, "Invalid expiry date format (MM/YY)")
        .optional(),
      cvv: z
        .string()
        .regex(/^\d{3}$/, "CVV must be 3 digits")
        .optional(),
      cardType: z.enum(["visa", "debit", "credit"], { errorMap: () => ({ message: "Invalid card type" }) }).optional(),
      last4: z.string().optional(),
      brand: z.string().optional(),
    })
    .optional(),
})

export async function POST(req: Request) {
  try {
    // Parse and validate request body
    const body = await req.json()
    const validationResult = PaymentSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error.errors.map((e) => e.message).join(", "),
        },
        { status: 400 },
      )
    }

    const { amount, cardDetails } = validationResult.data

    // In a real application, you would integrate with a payment processor API
    // For this demo, we'll simulate a successful payment
    const paymentIntentId = `pi_admin_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return NextResponse.json({
      success: true,
      paymentIntentId,
      status: "succeeded",
      cardLast4: cardDetails?.last4 || cardDetails?.cardNumber?.slice(-4),
      amount,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Payment processing error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unexpected error occurred during payment processing",
      },
      { status: 500 },
    )
  }
}
