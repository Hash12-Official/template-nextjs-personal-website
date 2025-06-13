'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export function SimpleCalculator({ onBack }: { onBack: () => void }) {
  const [display, setDisplay] = useState('0')
  const [firstOperand, setFirstOperand] = useState<number | null>(null)
  const [operator, setOperator] = useState<string | null>(null)
  const [waitingForSecondOperand, setWaitingForSecondOperand] = useState(false)

  const inputDigit = (digit: string) => {
    if (waitingForSecondOperand) {
      setDisplay(digit)
      setWaitingForSecondOperand(false)
    } else {
      setDisplay(display === '0' ? digit : display + digit)
    }
  }

  const inputDecimal = () => {
    if (waitingForSecondOperand) {
      setDisplay('0.')
      setWaitingForSecondOperand(false)
      return
    }

    if (!display.includes('.')) {
      setDisplay(display + '.')
    }
  }

  const clear = () => {
    setDisplay('0')
    setFirstOperand(null)
    setOperator(null)
    setWaitingForSecondOperand(false)
  }

  const performOperation = (nextOperator: string) => {
    const inputValue = parseFloat(display)

    if (firstOperand === null) {
      setFirstOperand(inputValue)
    } else if (operator) {
      const result = calculate(firstOperand, inputValue, operator)
      setDisplay(String(result))
      setFirstOperand(result)
    }

    setWaitingForSecondOperand(true)
    setOperator(nextOperator)
  }

  const calculate = (firstOperand: number, secondOperand: number, operator: string) => {
    switch (operator) {
      case '+':
        return firstOperand + secondOperand
      case '-':
        return firstOperand - secondOperand
      case '*':
        return firstOperand * secondOperand
      case '/':
        return firstOperand / secondOperand
      default:
        return secondOperand
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Simple Calculator</h1>
        <Button onClick={onBack} variant="outline">Back to Billing System</Button>
      </header>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <Input value={display} readOnly className="text-right text-2xl mb-4" />
          <div className="grid grid-cols-4 gap-2">
            {['7', '8', '9', '/'].map((btn) => (
              <Button key={btn} onClick={() => btn === '/' ? performOperation(btn) : inputDigit(btn)}>{btn}</Button>
            ))}
            {['4', '5', '6', '*'].map((btn) => (
              <Button key={btn} onClick={() => btn === '*' ? performOperation(btn) : inputDigit(btn)}>{btn}</Button>
            ))}
            {['1', '2', '3', '-'].map((btn) => (
              <Button key={btn} onClick={() => btn === '-' ? performOperation(btn) : inputDigit(btn)}>{btn}</Button>
            ))}
            {['0', '.', '=', '+'].map((btn) => (
              <Button key={btn} onClick={() => {
                if (btn === '0') inputDigit(btn)
                else if (btn === '.') inputDecimal()
                else if (btn === '=') performOperation('=')
                else performOperation(btn)
              }}>{btn}</Button>
            ))}
            <Button onClick={clear} className="col-span-4">Clear</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
