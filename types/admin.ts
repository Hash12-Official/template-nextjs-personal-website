export type CardType = 'visa' | 'debit' | 'credit'

export interface AdminCardDetails {
  cardNumber: string
  expiryDate: string
  cvv: string
  cardType: CardType
  last4?: string
  brand?: string
}

export interface AdminState {
  cardBalance: number
  transactions: Transaction[]
  totalPayouts: number
  pendingPayments: number
}

export interface Transaction {
  id: string
  type: 'deposit' | 'payout'
  amount: number
  date: string
  status: 'pending' | 'completed' | 'failed'
  cardLast4?: string
}

export interface CardValidationErrors {
  cardNumber?: string
  expiryDate?: string
  cvv?: string
  cardType?: string
  general?: string
}

export function validateCardDetails(cardDetails: AdminCardDetails): CardValidationErrors {
  const errors: CardValidationErrors = {}

  if (!/^\d{16}$/.test(cardDetails.cardNumber)) {
    errors.cardNumber = 'Card number must be 16 digits'
  }

  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardDetails.expiryDate)) {
    errors.expiryDate = 'Expiry date must be in MM/YY format'
  } else {
    const [month, year] = cardDetails.expiryDate.split('/')
    const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1)
    if (expiryDate < new Date()) {
      errors.expiryDate = 'Card has expired'
    }
  }

  if (!/^\d{3}$/.test(cardDetails.cvv)) {
    errors.cvv = 'CVV must be 3 digits'
  }

  if (!['visa', 'debit', 'credit'].includes(cardDetails.cardType)) {
    errors.cardType = 'Invalid card type'
  }

  return errors
}

export function formatCardNumber(cardNumber: string): string {
  return cardNumber.replace(/(\d{4})/g, '$1 ').trim()
}

export function maskCardNumber(cardNumber: string): string {
  return cardNumber.slice(-4).padStart(cardNumber.length, '*')
}

