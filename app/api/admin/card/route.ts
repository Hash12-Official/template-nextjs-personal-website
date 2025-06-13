import { NextResponse } from "next/server"
import { z } from "zod"

// Define validation schema for admin card
const CardSchema = z.object({
  cardNumber: z.string().regex(/^\d{16}$/, "Card number must be 16 digits"),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, "Invalid expiry date format (MM/YY)"),
  cvv: z.string().regex(/^\d{3}$/, "CVV must be 3 digits"),
  cardType: z.enum(["visa", "debit", "credit"], { errorMap: () => ({ message: "Invalid card type" }) }),
})

export async function POST(req: Request) {
  try {
    // Parse and validate request body
    const body = await req.json()
    const validationResult = CardSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error.errors.map((e) => e.message).join(", "),
        },
        { status: 400 },
      )
    }

    const cardDetails = validationResult.data

    // Validate card expiry date
    const [month, year] = cardDetails.expiryDate.split("/")
    const expiryDate = new Date(2000 + Number.parseInt(year), Number.parseInt(month) - 1)
    if (expiryDate < new Date()) {
      return NextResponse.json({ success: false, error: "Card has expired" }, { status: 400 })
    }

    // Validate card number with Luhn algorithm
    if (!validateCardNumber(cardDetails.cardNumber)) {
      return NextResponse.json({ success: false, error: "Invalid card number" }, { status: 400 })
    }

    // In a real application, you would integrate with a payment processor API
    // For this demo, we'll simulate a successful card integration

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return NextResponse.json({
      success: true,
      cardDetails: {
        last4: cardDetails.cardNumber.slice(-4),
        brand: getBrandFromCardNumber(cardDetails.cardNumber),
        expiryDate: cardDetails.expiryDate,
        cardType: cardDetails.cardType,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Card processing error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unexpected error occurred during card processing",
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

// Determine card brand from card number
function getBrandFromCardNumber(cardNumber: string): string {
  // First digit of card number
  const firstDigit = cardNumber.charAt(0)

  switch (firstDigit) {
    case "4":
      return "visa"
    case "5":
      return "mastercard"
    case "3":
      return "amex"
    case "6":
      return "discover"
    default:
      return "unknown"
  }
}
