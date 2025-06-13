// Menu Item Types
export interface MenuItem {
  id: number
  name: string
  price: number
}

export interface BillItem extends MenuItem {
  quantity: number
}

// Card Types
export type CardType = "visa" | "debit" | "credit"

export interface CardDetails {
  cardNumber: string
  expiryDate: string
  cvv: string
  cardType: CardType
}

export interface AdminCardDetails extends CardDetails {
  last4?: string
  brand?: string
}

// Bill Types
export interface Bill {
  id: number
  items: BillItem[]
  subtotal: number
  tax: number
  total: number
  paymentMethod: "cash" | "card" | "digital"
  customerName: string
  date: string
  cardDetails?: CardDetails
  cardType?: CardType
  paymentIntentId?: string
  isWithdrawn?: boolean
  isPaidOut?: boolean
}

// Transaction Types
export interface Transaction {
  id: string
  type: "deposit" | "payout"
  amount: number
  date: string
  status: "completed" | "pending" | "failed"
  cardLast4?: string
}

// Admin State
export interface AdminState {
  cardBalance: number
  transactions: Transaction[]
  totalPayouts: number
  pendingPayments: number
}

// Validation Errors
export interface CardValidationErrors {
  cardNumber?: string
  expiryDate?: string
  cvv?: string
  cardType?: string
  general?: string
}

// Finance Entry
export interface FinanceEntry {
  id: number
  date: string
  description: string
  amount: number
  type: "income" | "expense"
}

// Utility Functions
export function validateCardNumber(cardNumber: string): boolean {
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

export function formatCardNumber(cardNumber: string): string {
  return cardNumber.replace(/(\d{4})/g, "$1 ").trim()
}

export function maskCardNumber(cardNumber: string): string {
  return cardNumber.slice(-4).padStart(cardNumber.length, "*")
}

export function validateExpiryDate(expiryDate: string): boolean {
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate)) return false

  const [month, year] = expiryDate.split("/")
  const expiry = new Date(2000 + Number.parseInt(year), Number.parseInt(month) - 1)
  const today = new Date()

  return expiry > today
}

export function validateCVV(cvv: string): boolean {
  return /^\d{3}$/.test(cvv)
}
