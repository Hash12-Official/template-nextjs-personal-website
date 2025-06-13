import { NextResponse } from "next/server"
import { z } from "zod"

// Define validation schema for payment request
const PaymentSchema = z.object({
  amount: z.number().positive("Amount must be greater than zero"),
  cardDetails: z.object({
    cardNumber: z.string().regex(/^\d{16}$/, "Card number must be 16 digits"),
    expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, "Invalid expiry date format (MM/YY)"),
    cvv: z.string().regex(/^\d{3}$/, "CVV must be 3 digits"),
    cardType: z.enum(["visa", "debit", "credit"], { errorMap: () => ({ message: "Invalid card type" }) }),
  }),
  customerName: z.string().min(1, "Customer name is required"),
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

    const { amount, cardDetails, customerName } = validationResult.data

    // Validate card expiry date
    const [month, year] = cardDetails.expiryDate.split("/")
    const expiryDate = new Date(2000 + Number.parseInt(year), Number.parseInt(month) - 1)
    if (expiryDate < new Date()) {
      return NextResponse.json({ success: false, error: "Card has expired" }, { status: 400 })
    }

    // Simulate card validation with Luhn algorithm
    if (!validateCardNumber(cardDetails.cardNumber)) {
      return NextResponse.json({ success: false, error: "Invalid card number" }, { status: 400 })
    }

    // In a real application, you would integrate with a payment processor like Stripe here
    // For this demo, we'll simulate a successful payment
    const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return NextResponse.json({
      success: true,
      paymentIntentId,
      status: "succeeded",
      cardLast4: cardDetails.cardNumber.slice(-4),
      amount,
      customerName,
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

// Luhn algorithm for card number validation
function validateCardNumber(cardNumber: string): boolean {
  // Remove spaces and dashes
  cardNumber = cardNumber.replace(/[\s-]/g, "")

  if (!/^\d{16}$/.test(cardNumber)) return false

  let sum = 0
  let shouldDouble = false

  // Loop through values starting from the rightmost digit
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = Number.parseInt(cardNumber.charAt(i))

    if (shouldDouble) {
      digit *= 2
      if (digit > 9) digit -= 9
    }

    sum += digit
    shouldDouble = !shouldDouble
  }

  return sum % 10 === 0
}
