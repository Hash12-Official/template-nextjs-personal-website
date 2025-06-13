'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CreditCard, DollarSign, Smartphone, Plus, Minus, Trash2, Printer, Mail, ArrowLeft, ArrowRight, AlertTriangle, Calculator, FileSpreadsheet, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { AdminDashboard } from './admin-dashboard'
import { SimpleCalculator } from './simple-calculator'
import { FinanceSheet } from './finance-sheet'
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

type MenuItem = {
  id: number
  name: string
  price: number
}

type BillItem = MenuItem & {
  quantity: number
}

type Bill = {
  id: number
  items: BillItem[]
  subtotal: number
  tax: number
  total: number
  paymentMethod: 'cash' | 'card' | 'digital'
  cardType?: 'visa' | 'debit' | 'credit'
  customerName: string
  date: string
  cardDetails?: CardDetails
  isWithdrawn?: boolean
  isPaidOut?: boolean
  paymentIntentId?: string;
}

type CardDetails = {
  cardNumber: string
  expiryDate: string
  cvv: string
  cardType: 'visa' | 'debit' | 'credit'
}

type CardPayment = {
  id: number
  billId: number
  amount: number
  date: string
  isPaidOut: boolean
  cardType: 'visa' | 'debit' | 'credit'
}

type AdminTransaction = {
  id: string;
  type: 'deposit' | 'payout';
  amount: number;
  date: string;
  status: 'completed' | 'pending';
  cardLast4?: string;
}

type AdminCardDetails = {
  cardNumber: string
  expiryDate: string
  cvv: string
}

const menuItems: MenuItem[] = [
  { id: 1, name: 'Espresso', price: 250 },
  { id: 2, name: 'Cappuccino', price: 350 },
  { id: 3, name: 'Latte', price: 400 },
  { id: 4, name: 'Mocha', price: 450 },
  { id: 5, name: 'Croissant', price: 300 },
  { id: 6, name: 'Sandwich', price: 650 },
  { id: 7, name: 'Salad', price: 800 },
  { id: 8, name: 'Cake', price: 500 },
]

export default function BillingSystem() {
  const [confirmedBills, setConfirmedBills] = useState<Bill[]>([])
  const [currentBill, setCurrentBill] = useState<Bill>({
    id: 1,
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
    paymentMethod: 'cash',
    customerName: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isCardPaymentDialogOpen, setIsCardPaymentDialogOpen] = useState(false)
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false)
  const [isPayoutDialogOpen, setIsPayoutDialogOpen] = useState(false)
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardType: 'visa'
  })
  const [email, setEmail] = useState("")
  const [showAdminDashboard, setShowAdminDashboard] = useState(false)
  const [adminState, setAdminState] = useState({
    cardBalance: 0,
    transactions: [],
    totalPayouts: 0,
    pendingPayments: 0
  })
  const [cardPayments, setCardPayments] = useState<CardPayment[]>([])
  const [adminCardDetails, setAdminCardDetails] = useState<AdminCardDetails>({
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  })
  const [isAdminCardDialogOpen, setIsAdminCardDialogOpen] = useState(false)
  const [isEmptyCardBalanceDialogOpen, setIsEmptyCardBalanceDialogOpen] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [showFinanceSheet, setShowFinanceSheet] = useState(false)
  const [integratedAdminCard, setIntegratedAdminCard] = useState<AdminCardDetails | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    const payments = confirmedBills
      .filter(bill => bill.paymentMethod === 'card' && !bill.isPaidOut)
      .map(bill => ({
        id: bill.id,
        billId: bill.id,
        amount: bill.total,
        date: bill.date,
        isPaidOut: false,
        cardType: bill.cardType || 'visa'
      }))
    setCardPayments(payments)
    const pendingAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    setAdminState(prev => ({...prev, pendingPayments: pendingAmount}))
  }, [confirmedBills])

  const addItemToBill = (item: MenuItem) => {
    const existingItem = currentBill.items.find(i => i.id === item.id)
    if (existingItem) {
      updateItemQuantity(item.id, existingItem.quantity + 1)
    } else {
      setCurrentBill(prev => ({
        ...prev,
        items: [...prev.items, { ...item, quantity: 1 }]
      }))
    }
  }

  const updateItemQuantity = (itemId: number, newQuantity: number) => {
    setCurrentBill(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? { ...item, quantity: Math.max(0, newQuantity) } : item
      ).filter(item => item.quantity > 0)
    }))
  }

  const removeItemFromBill = (itemId: number) => {
    setCurrentBill(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }))
  }

  const calculateBill = () => {
    const subtotal = currentBill.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const tax = subtotal * 0.17
    const total = subtotal + tax

    setCurrentBill(prev => ({
      ...prev,
      subtotal,
      tax,
      total
    }))
  }

  const handlePayment = async () => {
    if (currentBill.paymentMethod === 'card') {
      setIsCardPaymentDialogOpen(true)
    } else {
      await processPayment()
    }
  }

  const processPayment = async () => {
    setIsProcessing(true)
    try {
      let paymentResult;
      if (currentBill.paymentMethod === 'card') {
        const response = await fetch('/api/customer/process-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: currentBill.total,
            cardDetails: cardDetails,
            customerName: currentBill.customerName,
          }),
        })
        paymentResult = await response.json()
        if (!paymentResult.success) {
          throw new Error(paymentResult.error || 'Payment processing failed')
        }
      }

      const confirmedBill = {
        ...currentBill,
        id: confirmedBills.length + 1,
        cardDetails: currentBill.paymentMethod === 'card' ? cardDetails : undefined,
        cardType: currentBill.paymentMethod === 'card' ? cardDetails.cardType : undefined,
        paymentIntentId: paymentResult?.paymentIntentId,
      }
      setConfirmedBills(prev => [...prev, confirmedBill])
      setSelectedBill(confirmedBill)
      
      if (confirmedBill.paymentMethod === 'card') {
        setAdminState(prev => ({
          ...prev,
          cardBalance: prev.cardBalance + confirmedBill.total,
          transactions: [...prev.transactions, { 
            id: paymentResult.paymentIntentId,
            type: 'deposit', 
            amount: confirmedBill.total, 
            date: new Date().toISOString(),
            status: paymentResult.status === 'succeeded' ? 'completed' : 'pending',
            cardLast4: cardDetails.cardNumber.slice(-4)
          }]
        }))
      }
      
      toast({
        title: "Payment Processed",
        description: `Payment of Rs. ${confirmedBill.total.toFixed(2)} processed successfully.`,
      })
      setIsPaymentDialogOpen(false)
      setIsCardPaymentDialogOpen(false)
      resetBill()
    } catch (error: any) {
      console.error('Payment processing error:', error)
      toast({
        title: "Payment Failed",
        description: error.message || "An error occurred while processing the payment.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCardPayment = () => {
    processPayment()
  }

  const handleWithdraw = (billId: number) => {
    setConfirmedBills(prev => prev.map(bill =>
      bill.id === billId ? { ...bill, isWithdrawn: true } : bill
    ))
    toast({
      title: "Payment Withdrawn",
      description: `Payment for Bill #${billId} has been withdrawn.`,
    })
    setIsWithdrawDialogOpen(false)
  }

  const handlePayout = async (billId: number) => {
    const bill = confirmedBills.find(b => b.id === billId)
    if (bill && adminState.cardBalance >= bill.total) {
      setIsProcessing(true)
      try {
        const response = await fetch('/api/admin/card/process-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: bill.total,
            cardDetails: integratedAdminCard,
          }),
        })

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Failed to process payout')
        }

        setAdminState(prev => ({
          ...prev,
          cardBalance: prev.cardBalance - bill.total,
          totalPayouts: prev.totalPayouts + bill.total,
          transactions: [...prev.transactions, { 
            id: data.paymentIntentId,
            type: 'payout', 
            amount: bill.total, 
            date: new Date().toISOString(),
            status: data.status === 'succeeded' ? 'completed' : 'pending',
            cardLast4: integratedAdminCard?.last4
          }]
        }))
        setConfirmedBills(prev => prev.map(b =>
          b.id === billId ? { ...b, isPaidOut: true } : b
        ))
        setCardPayments(prev => prev.filter(p => p.billId !== billId))
        toast({
          title: "Payout Processed",
          description: `Payout of Rs. ${bill.total.toFixed(2)} for Bill #${billId} has been processed.`,
        })
      } catch (error: any) {
        toast({
          title: "Payout Failed",
          description: error.message || "An error occurred while processing the payout.",
          variant: "destructive",
        })
      } finally {
        setIsProcessing(false)
        setIsPayoutDialogOpen(false)
      }
    } else {
      toast({
        title: "Insufficient Balance",
        description: "The admin card does not have sufficient balance for this payout.",
        variant: "destructive",
      })
    }
  }

  const resetBill = () => {
    setCurrentBill({
      id: confirmedBills.length + 2,
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      paymentMethod: 'cash',
      customerName: '',
      date: new Date().toISOString().split('T')[0]
    })
    setCardDetails({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardType: 'visa'
    })
  }

  const formatBillForPrint = (bill: Bill): string => {
    let billText = `Sky Lounge\n\n`
    billText += `Bill #${bill.id}\n`
    billText += `Date: ${bill.date}\n`
    billText += `Customer: ${bill.customerName}\n\n`
    billText += `Items:\n`
    bill.items.forEach(item => {
      billText += `${item.name} x${item.quantity} - Rs. ${(item.price * item.quantity).toFixed(2)}\n`
    })
    billText += `\nSubtotal: Rs. ${bill.subtotal.toFixed(2)}`
    billText += `\nTax: Rs. ${bill.tax.toFixed(2)}`
    billText += `\nTotal: Rs. ${bill.total.toFixed(2)}`
    billText += `\nPayment Method: ${bill.paymentMethod}`
    if (bill.cardType) {
      billText += ` (${bill.cardType})`
    }
    if (bill.isWithdrawn) {
      billText += `\n\nNOTE: This payment has been withdrawn.`
    }
    if (bill.isPaidOut) {
      billText += `\nNOTE: This payment has been paid out.`
    }
    return billText
  }

  const handlePrint = () => {
    if (!selectedBill) {
      toast({
        title: "Error",
        description: "Please select a confirmed bill to print.",
        variant: "destructive",
      })
      return
    }
    const billText = formatBillForPrint(selectedBill)
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Bill</title>
          </head>
          <body>
            <pre>${billText}</pre>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    } else {
      toast({
        title: "Error",
        description: "Unable to open print window. Please check your browser settings.",
        variant: "destructive",
      })
    }
  }

  const handleEmail = async () => {
    if (!selectedBill) {
      toast({
        title: "Error",
        description: "Please select a confirmed bill to email.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      const billText = formatBillForPrint(selectedBill)
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject: `Bill #${selectedBill.id} from Sky Lounge`,
          text: billText,
          html: `<pre>${billText}</pre>`,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to send email')
      }

      toast({
        title: "Email Sent",
        description: `Bill has been emailed to ${email}`,
      })
      setEmail("")
    } catch (error: any) {
      toast({
        title: "Email Sending Failed",
        description: error.message || "An error occurred while sending the email.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleEmail = async () => {
    if (!selectedBill) {
      toast({
        title: "Error",
        description: "Please select a confirmed bill to email.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      const billText = formatBillForPrint(selectedBill)
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject: `Bill #${selectedBill.id} from Sky Lounge`,
          text: billText,
          html: `<pre>${billText}</pre>`,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to send email')
      }

      toast({
        title: "Email Sent",
        description: `Bill has been emailed to ${email}`,
      })
      setEmail("")
    } catch (error: any) {
      toast({
        title: "Email Sending Failed",
        description: error.message || "An error occurred while sending the email.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (showAdminDashboard) {
    return (
      <AdminDashboard 
        onBack={() => setShowAdminDashboard(false)} 
        adminState={adminState} 
        setAdminState={setAdminState}
        integratedAdminCard={integratedAdminCard}
        setIntegratedAdminCard={setIntegratedAdminCard}
      />
    )
  }

  if (showCalculator) {
    return <SimpleCalculator onBack={() => setShowCalculator(false)} />
  }

  if (showFinanceSheet) {
    return <FinanceSheet onBack={() => setShowFinanceSheet(false)} adminState={adminState} setAdminState={setAdminState} />
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Sky Lounge Billing System</h1>
        <div className="flex space-x-4">
          <Button onClick={() => setShowAdminDashboard(true)}>
            <CreditCard className="mr-2 h-4 w-4" /> Admin Dashboard
          </Button>
          <Button onClick={() => setShowCalculator(true)}>
            <Calculator className="mr-2 h-4 w-4" /> Calculator
          </Button>
          <Button onClick={() => setShowFinanceSheet(true)}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Finance Sheet
          </Button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Bill</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  value={currentBill.customerName}
                  onChange={(e) => setCurrentBill(prev => ({ ...prev, customerName: e.target.value }))}
                  placeholder="Enter customer name"
                />
              </div>
              <ScrollArea className="h-[300px] rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentBill.items.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>Rs. {item.price.toFixed(2)}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>Rs. {(item.price * item.quantity).toFixed(2)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => updateItemQuantity(item.id, item.quantity + 1)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => updateItemQuantity(item.id, item.quantity - 1)}>
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => removeItemFromBill(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>Rs. {currentBill.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (17%):</span>
                  <span>Rs. {currentBill.tax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>Rs. {currentBill.total.toFixed(2)}</span>
                </div>
              </div>
              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={currentBill.paymentMethod}
                  onValueChange={(value: 'cash' | 'card' | 'digital') => setCurrentBill(prev => ({ ...prev, paymentMethod: value }))}
                >
                  <SelectTrigger id="paymentMethod">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash"><DollarSign className="inline-block mr-2" size={18} />Cash</SelectItem>
                    <SelectItem value="card"><CreditCard className="inline-block mr-2" size={18} />Card</SelectItem>
                    <SelectItem value="digital"><Smartphone className="inline-block mr-2" size={18} />Digital Wallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={calculateBill} className="w-full">Calculate Bill</Button>
              <Button onClick={() => setIsPaymentDialogOpen(true)} className="w-full">Process Payment</Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Menu Items</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="grid grid-cols-2 gap-4">
                  {menuItems.map(item => (
                    <Button key={item.id} onClick={() => addItemToBill(item)} className="h-auto py-4 px-4">
                      <div className="text-left">
                        <div>{item.name}</div>
                        <div className="text-sm text-muted-foreground">Rs. {item.price.toFixed(2)}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bill Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handlePrint} className="w-full" disabled={!selectedBill}>
                <Printer className="mr-2 h-4 w-4" /> Print Bill
              </Button>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="customer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button onClick={handleEmail} className="w-full" disabled={!selectedBill || !email || isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Email...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" /> Email Bill
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Confirmed Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {confirmedBills.map(bill => (
                    <TableRow key={bill.id}>
                      <TableCell>{bill.id}</TableCell>
                      <TableCell>{bill.customerName}</TableCell>
                      <TableCell>Rs. {bill.total.toFixed(2)}</TableCell>
                      <TableCell>{bill.date}</TableCell>
                      <TableCell>
                        <Button variant="ghost" onClick={() => setSelectedBill(bill)}>
                          Select
                        </Button>
                        {bill.paymentMethod === 'card' && !bill.isWithdrawn && (
                          <Button variant="ghost" onClick={() => {
                            setSelectedBill(bill)
                            setIsWithdrawDialogOpen(true)
                          }}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Withdraw
                          </Button>
                        )}
                        {bill.isWithdrawn && !bill.isPaidOut && (
                          <Button variant="ghost" onClick={() => {
                            setSelectedBill(bill)
                            setIsPayoutDialogOpen(true)
                          }}>
                            <ArrowRight className="mr-2 h-4 w-4" /> Payout
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Keep all existing dialogs here */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              Please confirm the payment details for the current bill.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span>Total Amount:</span>
              <span>Rs. {currentBill.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment Method:</span>
              <span>{currentBill.paymentMethod}</span>
            </div>
          </div>
          <Button onClick={handlePayment} className="w-full mt-4" disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Confirm Payment'}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={isCardPaymentDialogOpen} onOpenChange={setIsCardPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Card Payment</DialogTitle>
            <DialogDescription>
              Please enter your card details to complete the payment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                value={cardDetails.cardNumber}
                onChange={(e) => setCardDetails(prev => ({ ...prev, cardNumber: e.target.value }))}
                placeholder="1234 5678 9012 3456"
              />
            </div>
            <div>
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                value={cardDetails.expiryDate}
                onChange={(e) => setCardDetails(prev => ({ ...prev, expiryDate: e.target.value }))}
                placeholder="MM/YY"
              />
            </div>
            <div>
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                value={cardDetails.cvv}
                onChange={(e) => setCardDetails(prev => ({ ...prev, cvv: e.target.value }))}
                placeholder="123"
              />
            </div>
            <div>
              <Label htmlFor="cardType">Card Type</Label>
              <Select
                value={cardDetails.cardType}
                onValueChange={(value: 'visa' | 'debit' | 'credit') => setCardDetails(prev => ({ ...prev, cardType: value }))}
              >
                <SelectTrigger id="cardType">
                  <SelectValue placeholder="Select card type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visa">Visa</SelectItem>
                  <SelectItem value="debit">Debit</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleCardPayment} className="w-full mt-4" disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Process Card Payment'}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Card Payment</DialogTitle>
            <DialogDescription>
              Are you sure you want to withdraw this card payment?
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span>Bill ID:</span>
              <span>{selectedBill?.id}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Amount:</span>
              <span>Rs. {selectedBill?.total.toFixed(2)}</span>
            </div>
          </div>
          <Button onClick={() => selectedBill && handleWithdraw(selectedBill.id)} className="w-full mt-4">Confirm Withdrawal</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={isPayoutDialogOpen} onOpenChange={setIsPayoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payout</DialogTitle>
            <DialogDescription>
              Are you sure you want to process the payout for this withdrawn payment?
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span>Bill ID:</span>
              <span>{selectedBill?.id}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Amount:</span>
              <span>Rs. {selectedBill?.total.toFixed(2)}</span>
            </div>
          </div>
          <Button onClick={() => selectedBill && handlePayout(selectedBill.id)} className="w-full mt-4" disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Confirm Payout'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}

