import { CardType, AdminCardDetails, CardValidationErrors } from '@/types/admin'

export async function validateCard(cardDetails: AdminCardDetails): Promise<CardValidationErrors> {
  const errors: CardValidationErrors = {}

  // Card number validation (Luhn algorithm)
  if (!isValidCardNumber(cardDetails.cardNumber)) {
    errors.cardNumber = 'Invalid card number'
  }

  // Expiry date validation
  if (!isValidExpiryDate(cardDetails.expiryDate)) {
    errors.expiryDate = 'Card has expired or invalid date format'
  }

  // CVV validation
  if (!isValidCVV(cardDetails.cvv)) {
    errors.cvv = 'Invalid CVV'
  }

  // Card type validation
  if (!isValidCardType(cardDetails.cardNumber, cardDetails.cardType)) {
    errors.cardType = 'Card number does not match selected card type'
  }

  return errors
}

function isValidCardNumber(cardNumber: string): boolean {
  // Remove spaces and dashes
  cardNumber = cardNumber.replace(/[\s-]/g, '')
  
  if (!/^\d{16}$/.test(cardNumber)) return false
  
  // Luhn algorithm implementation
  let sum = 0
  let isEven = false
  
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i])
    
    if (isEven) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    
    sum += digit
    isEven = !isEven
  }
  
  return sum % 10 === 0
}

function isValidExpiryDate(expiryDate: string): boolean {
  const [month, year] = expiryDate.split('/')
  if (!month || !year) return false
  
  const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1)
  const today = new Date()
  
  return expiry > today
}

function isValidCVV(cvv: string): boolean {
  return /^\d{3}$/.test(cvv)
}

function isValidCardType(cardNumber: string, cardType: CardType): boolean {
  // First digit of card number
  const firstDigit = cardNumber.charAt(0)
  
  switch (cardType) {
    case 'visa':
      return firstDigit === '4'
    case 'credit':
      return ['5', '6'].includes(firstDigit)
    case 'debit':
      return ['2', '3'].includes(firstDigit)
    default:
      return false
  }
}

export async function processCardPayment(amount: number, cardDetails: AdminCardDetails) {
  try {
    const response = await fetch('/api/admin/card/process-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        cardDetails,
      }),
    })

    if (!response.ok) {
      throw new Error('Payment processing failed')
    }

    return await response.json()
  } catch (error) {
    throw new Error('Payment processing failed')
  }
}

