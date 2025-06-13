"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  CreditCard,
  DollarSign,
  Smartphone,
  Plus,
  Minus,
  Trash2,
  Printer,
  Mail,
  ArrowLeft,
  ArrowRight,
  Calculator,
  FileSpreadsheet,
  Loader2,
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminDashboard } from "./admin-dashboard"
import { SimpleCalculator } from "./simple-calculator"
import { FinanceSheet } from "./finance-sheet"
import {
  type Bill,
  type MenuItem,
  type CardDetails,
  type AdminCardDetails,
  type AdminState,
  validateCardNumber,
  validateExpiryDate,
  validateCVV,
} from "@/types"
import { InvoicePreview } from "./components/invoice-preview"

const menuItems: MenuItem[] = [
  { id: 1, name: "Espresso", price: 250 },
  { id: 2, name: "Cappuccino", price: 350 },
  { id: 3, name: "Latte", price: 400 },
  { id: 4, name: "Mocha", price: 450 },
  { id: 5, name: "Croissant", price: 300 },
  { id: 6, name: "Sandwich", price: 650 },
  { id: 7, name: "Salad", price: 800 },
  { id: 8, name: "Cake", price: 500 },
]

export default function BillingSystem() {
  const [showAdminDashboard, setShowAdminDashboard] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [showFinanceSheet, setShowFinanceSheet] = useState(false)
  const [currentBill, setCurrentBill] = useState<Bill>({
    id: 1,
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
    paymentMethod: "cash",
    customerName: "",
    date: new Date().toISOString().split("T")[0],
  })
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardType: "visa",
  })
  const [cardErrors, setCardErrors] = useState<{ [key: string]: string }>({})
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isCardPaymentDialogOpen, setIsCardPaymentDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false)
  const [isPayoutDialogOpen, setIsPayoutDialogOpen] = useState(false)
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false)
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [adminState, setAdminState] = useState<AdminState>({
    cardBalance: 0,
    transactions: [],
    totalPayouts: 0,
    pendingPayments: 0,
  })
  const [integratedAdminCard, setIntegratedAdminCard] = useState<AdminCardDetails | null>(null)
  const [confirmedBills, setConfirmedBills] = useState<Bill[]>([])

  // Load data from localStorage on component mount
  useEffect(() => {
    try {
      const savedBills = localStorage.getItem("confirmedBills")
      if (savedBills) {
        setConfirmedBills(JSON.parse(savedBills))
      }

      const savedAdminState = localStorage.getItem("adminState")
      if (savedAdminState) {
        setAdminState(JSON.parse(savedAdminState))
      }

      const savedAdminCard = localStorage.getItem("integratedAdminCard")
      if (savedAdminCard) {
        setIntegratedAdminCard(JSON.parse(savedAdminCard))
      }
    } catch (error) {
      console.error("Error loading data from localStorage:", error)
    }
  }, [])

  // Save data to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem("confirmedBills", JSON.stringify(confirmedBills))
    } catch (error) {
      console.error("Error saving bills to localStorage:", error)
    }
  }, [confirmedBills])

  useEffect(() => {
    try {
      localStorage.setItem("adminState", JSON.stringify(adminState))
    } catch (error) {
      console.error("Error saving admin state to localStorage:", error)
    }
  }, [adminState])

  useEffect(() => {
    if (integratedAdminCard) {
      try {
        localStorage.setItem("integratedAdminCard", JSON.stringify(integratedAdminCard))
      } catch (error) {
        console.error("Error saving admin card to localStorage:", error)
      }
    }
  }, [integratedAdminCard])

  // Update pending payments when confirmed bills change
  useEffect(() => {
    const pendingAmount = confirmedBills
      .filter((bill) => bill.isWithdrawn && !bill.isPaidOut)
      .reduce((sum, bill) => sum + bill.total, 0)

    setAdminState((prev) => ({ ...prev, pendingPayments: pendingAmount }))
  }, [confirmedBills])

  const addItemToBill = (item: MenuItem) => {
    const existingItem = currentBill.items.find((i) => i.id === item.id)
    if (existingItem) {
      updateItemQuantity(item.id, existingItem.quantity + 1)
    } else {
      setCurrentBill((prev) => ({
        ...prev,
        items: [...prev.items, { ...item, quantity: 1 }],
      }))
    }
  }

  const updateItemQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItemFromBill(itemId)
      return
    }
    setCurrentBill((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === itemId ? { ...item, quantity } : item)),
    }))
  }

  const removeItemFromBill = (itemId: number) => {
    setCurrentBill((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId),
    }))
  }

  const calculateBill = () => {
    if (currentBill.items.length === 0) {
      toast({
        title: "No items in bill",
        description: "Please add items to the bill before calculating.",
        variant: "destructive",
      })
      return
    }

    const subtotal = currentBill.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const tax = subtotal * 0.17
    const total = subtotal + tax
    setCurrentBill((prev) => ({ ...prev, subtotal, tax, total }))

    toast({
      title: "Bill Calculated",
      description: `Total: Rs. ${total.toFixed(2)}`,
    })
  }

  const validateCardDetails = (): boolean => {
    const errors: { [key: string]: string } = {}

    if (!validateCardNumber(cardDetails.cardNumber)) {
      errors.cardNumber = "Invalid card number"
    }

    if (!validateExpiryDate(cardDetails.expiryDate)) {
      errors.expiryDate = "Invalid or expired date"
    }

    if (!validateCVV(cardDetails.cvv)) {
      errors.cvv = "CVV must be 3 digits"
    }

    setCardErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCardPayment = async () => {
    if (!validateCardDetails()) {
      return
    }

    await processPayment()
  }

  const processPayment = async () => {
    if (currentBill.items.length === 0) {
      toast({
        title: "No items in bill",
        description: "Please add items to the bill before processing payment.",
        variant: "destructive",
      })
      return
    }

    if (!currentBill.customerName) {
      toast({
        title: "Customer name required",
        description: "Please enter a customer name before processing payment.",
        variant: "destructive",
      })
      return
    }

    if (currentBill.total <= 0) {
      toast({
        title: "Invalid bill amount",
        description: "Please calculate the bill before processing payment.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      let paymentResult
      if (currentBill.paymentMethod === "card") {
        const response = await fetch("/api/customer/process-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: currentBill.total,
            cardDetails: cardDetails,
            customerName: currentBill.customerName,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Payment processing failed")
        }

        paymentResult = await response.json()
      } else {
        // Simulate successful payment for cash or digital
        paymentResult = {
          success: true,
          paymentIntentId: `pi_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
          status: "succeeded",
        }
      }

      const confirmedBill = {
        ...currentBill,
        id: confirmedBills.length + 1,
        cardDetails: currentBill.paymentMethod === "card" ? cardDetails : undefined,
        cardType: currentBill.paymentMethod === "card" ? cardDetails.cardType : undefined,
        paymentIntentId: paymentResult.paymentIntentId,
      }

      setConfirmedBills((prev) => [...prev, confirmedBill])
      setSelectedBill(confirmedBill)

      if (confirmedBill.paymentMethod === "card") {
        setAdminState((prev) => ({
          ...prev,
          cardBalance: prev.cardBalance + confirmedBill.total,
          transactions: [
            {
              id: paymentResult.paymentIntentId,
              type: "deposit",
              amount: confirmedBill.total,
              date: new Date().toISOString(),
              status: paymentResult.status === "succeeded" ? "completed" : "pending",
              cardLast4: cardDetails.cardNumber.slice(-4),
            },
            ...prev.transactions,
          ],
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
      console.error("Payment processing error:", error)
      toast({
        title: "Payment Failed",
        description: error.message || "An error occurred while processing the payment.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleWithdraw = async (billId: number) => {
    setIsProcessing(true)
    try {
      const billToWithdraw = confirmedBills.find((bill) => bill.id === billId)
      if (!billToWithdraw) {
        throw new Error("Bill not found")
      }

      if (billToWithdraw.paymentMethod !== "card") {
        throw new Error("Only card payments can be withdrawn")
      }

      const updatedBills = confirmedBills.map((bill) => (bill.id === billId ? { ...bill, isWithdrawn: true } : bill))
      setConfirmedBills(updatedBills)
      setSelectedBill(updatedBills.find((bill) => bill.id === billId) || null)
      setIsWithdrawDialogOpen(false)

      // Update admin state
      setAdminState((prev) => ({
        ...prev,
        cardBalance: prev.cardBalance - billToWithdraw.total,
        pendingPayments: prev.pendingPayments + billToWithdraw.total,
        transactions: [
          {
            id: `withdraw-${billId}-${Date.now()}`,
            type: "payout",
            amount: billToWithdraw.total,
            date: new Date().toISOString(),
            status: "completed",
            cardLast4: billToWithdraw.cardDetails?.cardNumber.slice(-4),
          },
          ...prev.transactions,
        ],
      }))

      toast({
        title: "Withdrawal Confirmed",
        description: `Bill #${billId} marked as withdrawn.`,
      })
    } catch (error: any) {
      console.error("Withdrawal failed:", error)
      toast({
        title: "Withdrawal Failed",
        description: error.message || "An error occurred during withdrawal.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePayout = async (billId: number) => {
    setIsProcessing(true)
    try {
      const billToPayout = confirmedBills.find((bill) => bill.id === billId)
      if (!billToPayout) {
        throw new Error("Bill not found")
      }

      if (!billToPayout.isWithdrawn) {
        throw new Error("Bill must be withdrawn before payout")
      }

      if (billToPayout.isPaidOut) {
        throw new Error("Bill has already been paid out")
      }

      const updatedBills = confirmedBills.map((bill) => (bill.id === billId ? { ...bill, isPaidOut: true } : bill))
      setConfirmedBills(updatedBills)
      setSelectedBill(updatedBills.find((bill) => bill.id === billId) || null)
      setIsPayoutDialogOpen(false)

      // Update admin state
      setAdminState((prev) => ({
        ...prev,
        totalPayouts: prev.totalPayouts + billToPayout.total,
        pendingPayments: prev.pendingPayments - billToPayout.total,
        transactions: [
          {
            id: `payout-${billId}-${Date.now()}`,
            type: "payout",
            amount: billToPayout.total,
            date: new Date().toISOString(),
            status: "completed",
          },
          ...prev.transactions,
        ],
      }))

      toast({
        title: "Payout Confirmed",
        description: `Bill #${billId} payout processed.`,
      })
    } catch (error: any) {
      console.error("Payout failed:", error)
      toast({
        title: "Payout Failed",
        description: error.message || "An error occurred during payout.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const resetBill = () => {
    setCurrentBill({
      id: confirmedBills.length + 2,
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      paymentMethod: "cash",
      customerName: "",
      date: new Date().toISOString().split("T")[0],
    })
    setCardDetails({
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      cardType: "visa",
    })
    setCardErrors({})
  }

  const handlePayment = async () => {
    if (currentBill.items.length === 0) {
      toast({
        title: "No items in bill",
        description: "Please add items to the bill before processing payment.",
        variant: "destructive",
      })
      return
    }

    if (currentBill.total <= 0) {
      toast({
        title: "Invalid bill amount",
        description: "Please calculate the bill before processing payment.",
        variant: "destructive",
      })
      return
    }

    if (currentBill.paymentMethod === "card") {
      setIsCardPaymentDialogOpen(true)
    } else {
      await processPayment()
    }
  }

  const formatBillForPrint = (bill: Bill): string => {
    let billText = `Sky Lounge\n\n`
    billText += `Bill #${bill.id}\n`
    billText += `Date: ${bill.date}\n`
    billText += `Customer: ${bill.customerName}\n\n`
    billText += `Items:\n`
    billText += `${"─".repeat(40)}\n`
    billText += `Item                  Qty    Price      Total\n`
    billText += `${"─".repeat(40)}\n`

    bill.items.forEach((item) => {
      const name = item.name.padEnd(20, " ").substring(0, 20)
      const qty = item.quantity.toString().padStart(3, " ")
      const price = `Rs. ${item.price.toFixed(2)}`.padStart(10, " ")
      const total = `Rs. ${(item.price * item.quantity).toFixed(2)}`.padStart(10, " ")
      billText += `${name} ${qty} ${price} ${total}\n`
    })

    billText += `${"─".repeat(40)}\n`
    billText += `Subtotal:${" ".repeat(30)}Rs. ${bill.subtotal.toFixed(2)}\n`
    billText += `Tax (17%):${" ".repeat(28)}Rs. ${bill.tax.toFixed(2)}\n`
    billText += `${"─".repeat(40)}\n`
    billText += `Total:${" ".repeat(33)}Rs. ${bill.total.toFixed(2)}\n\n`
    billText += `Payment Method: ${bill.paymentMethod}`

    if (bill.cardType) {
      billText += ` (${bill.cardType})`
    }

    if (bill.isWithdrawn) {
      billText += `\n\nNOTE: This payment has been withdrawn.`
    }

    if (bill.isPaidOut) {
      billText += `\nNOTE: This payment has been paid out.`
    }

    billText += `\n\nThank you for your business!`
    return billText
  }

  const handlePrint = () => {
    if (!selectedBill) {
      toast({
        title: "Error",
        description: "Please select a bill to print.",
        variant: "destructive",
      })
      return
    }
    setIsPrintDialogOpen(true)
  }

  const printBill = () => {
    if (!selectedBill) return

    // Create a new window for printing
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Unable to open print window. Please check your browser settings.",
        variant: "destructive",
      })
      return
    }

    // Format date for display
    const formatDate = (dateString: string) => {
      try {
        const date = new Date(dateString)
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      } catch (e) {
        return dateString
      }
    }

    // Generate the HTML content for the invoice
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice #${selectedBill.id} - Sky Lounge</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .invoice-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
          }
          .company-info {
            flex: 1;
          }
          .invoice-info {
            text-align: right;
            flex: 1;
          }
          .customer-info {
            margin-bottom: 30px;
          }
          h1 {
            color: #2c3e50;
            margin: 0 0 10px 0;
          }
          h2 {
            color: #3498db;
            margin: 0 0 15px 0;
          }
          h3 {
            color: #2c3e50;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
            margin-top: 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th, td {
            padding: 12px 15px;
            border: 1px solid #ddd;
          }
          th {
            background-color: #f8f9fa;
            text-align: left;
          }
          tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          .totals {
            width: 300px;
            margin-left: auto;
          }
          .totals div {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
          }
          .total-row {
            font-weight: bold;
            border-top: 2px solid #ddd;
            padding-top: 12px !important;
          }
          .status-alert {
            background-color: #fff3cd;
            color: #856404;
            padding: 15px;
            border-radius: 4px;
            border-left: 5px solid #ffeeba;
            margin-bottom: 30px;
          }
          .footer {
            text-align: center;
            margin-top: 50px;
            color: #7f8c8d;
            font-size: 14px;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
          @media print {
            body {
              padding: 0;
              font-size: 12pt;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">
            Print Invoice
          </button>
        </div>
        
        <div class="invoice-header">
          <div class="company-info">
            <h1>Sky Lounge</h1>
            <p>123 Main Street, City</p>
            <p>Phone: (123) 456-7890</p>
            <p>Email: info@skylounge.com</p>
          </div>
          <div class="invoice-info">
            <h2>Invoice #${selectedBill.id}</h2>
            <p>Date: ${formatDate(selectedBill.date)}</p>
            <p>Payment Method: ${selectedBill.paymentMethod.toUpperCase()}</p>
            ${selectedBill.cardType ? `<p>Card Type: ${selectedBill.cardType.toUpperCase()}</p>` : ""}
          </div>
        </div>
        
        <div class="customer-info">
          <h3>Customer Information</h3>
          <p>Name: ${selectedBill.customerName}</p>
        </div>
        
        <h3>Order Details</h3>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align: right;">Price</th>
              <th style="text-align: right;">Quantity</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${selectedBill.items
              .map(
                (item) => `
              <tr>
                <td>${item.name}</td>
                <td style="text-align: right;">Rs. ${item.price.toFixed(2)}</td>
                <td style="text-align: right;">${item.quantity}</td>
                <td style="text-align: right;">Rs. ${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
        
        <div class="totals">
          <div>
            <span>Subtotal:</span>
            <span>Rs. ${selectedBill.subtotal.toFixed(2)}</span>
          </div>
          <div>
            <span>Tax (17%):</span>
            <span>Rs. ${selectedBill.tax.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>Total:</span>
            <span>Rs. ${selectedBill.total.toFixed(2)}</span>
          </div>
        </div>
        
        ${
          selectedBill.isWithdrawn || selectedBill.isPaidOut
            ? `
          <div class="status-alert">
            <strong>Payment Status:</strong>
            ${selectedBill.isWithdrawn ? "<p>This payment has been withdrawn.</p>" : ""}
            ${selectedBill.isPaidOut ? "<p>This payment has been paid out.</p>" : ""}
          </div>
        `
            : ""
        }
        
        <div class="footer">
          <p>Thank you for your business!</p>
          <p>For questions or concerns, please contact us at support@skylounge.com</p>
        </div>
      </body>
      </html>
    `)

    printWindow.document.close()

    // Give the browser a moment to render the content before printing
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  const handleEmail = async () => {
    if (!selectedBill) {
      toast({
        title: "Error",
        description: "Please select a bill to email.",
        variant: "destructive",
      })
      return
    }

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      const billText = formatBillForPrint(selectedBill)
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: email,
          subject: `Bill #${selectedBill.id} from Sky Lounge`,
          text: billText,
          html: `<pre>${billText}</pre>`,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to send email")
      }

      const data = await response.json()

      toast({
        title: "Email Sent",
        description: `Bill has been emailed to ${email}`,
      })
      setEmail("")
      setIsEmailDialogOpen(false)
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
    return (
      <FinanceSheet onBack={() => setShowFinanceSheet(false)} adminState={adminState} setAdminState={setAdminState} />
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl font-bold mb-4 sm:mb-0">Sky Lounge Billing System</h1>
        <div className="flex flex-wrap gap-2">
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

      <Tabs defaultValue="billing" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="confirmed-payments">Confirmed Payments</TabsTrigger>
        </TabsList>
        <TabsContent value="billing">
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
                      onChange={(e) => setCurrentBill((prev) => ({ ...prev, customerName: e.target.value }))}
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
                        {currentBill.items.length > 0 ? (
                          currentBill.items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.name}</TableCell>
                              <TableCell>Rs. {item.price.toFixed(2)}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>Rs. {(item.price * item.quantity).toFixed(2)}</TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <Button variant="outline" size="icon" onClick={() => removeItemFromBill(item.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                              No items added to bill yet
                            </TableCell>
                          </TableRow>
                        )}
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
                      onValueChange={(value: "cash" | "card" | "digital") =>
                        setCurrentBill((prev) => ({ ...prev, paymentMethod: value }))
                      }
                    >
                      <SelectTrigger id="paymentMethod">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">
                          <DollarSign className="inline-block mr-2" size={18} />
                          Cash
                        </SelectItem>
                        <SelectItem value="card">
                          <CreditCard className="inline-block mr-2" size={18} />
                          Card
                        </SelectItem>
                        <SelectItem value="digital">
                          <Smartphone className="inline-block mr-2" size={18} />
                          Digital Wallet
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={calculateBill} className="w-full">
                    Calculate Bill
                  </Button>
                  <Button onClick={() => setIsPaymentDialogOpen(true)} className="w-full">
                    Process Payment
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Menu Items</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="grid grid-cols-2 gap-4">
                    {menuItems.map((item) => (
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
          </div>
        </TabsContent>
        <TabsContent value="confirmed-payments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Confirmed Payments</CardTitle>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handlePrint} disabled={!selectedBill}>
                  <Printer className="mr-2 h-4 w-4" /> Print Bill
                </Button>
                <Button variant="outline" onClick={() => setIsEmailDialogOpen(true)} disabled={!selectedBill}>
                  <Mail className="mr-2 h-4 w-4" /> Email Bill
                </Button>
              </div>
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
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {confirmedBills.length > 0 ? (
                      confirmedBills.map((bill) => (
                        <TableRow key={bill.id} className={selectedBill?.id === bill.id ? "bg-muted/50" : ""}>
                          <TableCell>{bill.id}</TableCell>
                          <TableCell>{bill.customerName}</TableCell>
                          <TableCell>Rs. {bill.total.toFixed(2)}</TableCell>
                          <TableCell>{bill.date}</TableCell>
                          <TableCell>
                            {bill.isPaidOut ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Paid Out
                              </span>
                            ) : bill.isWithdrawn ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Withdrawn
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Completed
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant={selectedBill?.id === bill.id ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedBill(bill)}
                              >
                                Select
                              </Button>
                              {bill.paymentMethod === "card" && !bill.isWithdrawn && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedBill(bill)
                                    setIsWithdrawDialogOpen(true)
                                  }}
                                >
                                  <ArrowLeft className="mr-2 h-4 w-4" /> Withdraw
                                </Button>
                              )}
                              {bill.isWithdrawn && !bill.isPaidOut && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedBill(bill)
                                    setIsPayoutDialogOpen(true)
                                  }}
                                >
                                  <ArrowRight className="mr-2 h-4 w-4" /> Payout
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                          No confirmed bills yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>Please confirm the payment details for the current bill.</DialogDescription>
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
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Confirm Payment"
            )}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Card Payment Dialog */}
      <Dialog open={isCardPaymentDialogOpen} onOpenChange={setIsCardPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Card Payment</DialogTitle>
            <DialogDescription>Please enter your card details to complete the payment.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                value={cardDetails.cardNumber}
                onChange={(e) =>
                  setCardDetails((prev) => ({
                    ...prev,
                    cardNumber: e.target.value.replace(/\D/g, "").substring(0, 16),
                  }))
                }
                placeholder="1234 5678 9012 3456"
                className={cardErrors.cardNumber ? "border-red-500" : ""}
              />
              {cardErrors.cardNumber && <p className="text-sm text-red-500 mt-1">{cardErrors.cardNumber}</p>}
            </div>
            <div>
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                value={cardDetails.expiryDate}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "")
                  if (value.length <= 4) {
                    const formattedValue = value.length > 2 ? value.slice(0, 2) + "/" + value.slice(2) : value
                    setCardDetails((prev) => ({ ...prev, expiryDate: formattedValue }))
                  }
                }}
                placeholder="MM/YY"
                className={cardErrors.expiryDate ? "border-red-500" : ""}
              />
              {cardErrors.expiryDate && <p className="text-sm text-red-500 mt-1">{cardErrors.expiryDate}</p>}
            </div>
            <div>
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                value={cardDetails.cvv}
                onChange={(e) =>
                  setCardDetails((prev) => ({ ...prev, cvv: e.target.value.replace(/\D/g, "").substring(0, 3) }))
                }
                placeholder="123"
                className={cardErrors.cvv ? "border-red-500" : ""}
              />
              {cardErrors.cvv && <p className="text-sm text-red-500 mt-1">{cardErrors.cvv}</p>}
            </div>
            <div>
              <Label htmlFor="cardType">Card Type</Label>
              <Select
                value={cardDetails.cardType}
                onValueChange={(value: "visa" | "debit" | "credit") =>
                  setCardDetails((prev) => ({ ...prev, cardType: value }))
                }
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
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Process Card Payment"
            )}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Other dialogs */}
      <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Card Payment</DialogTitle>
            <DialogDescription>Are you sure you want to withdraw this card payment?</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span>Bill ID:</span>
              <span>{selectedBill?.id}</span>
            </div>
            <div className="flex justify-between">
              <span>Customer:</span>
              <span>{selectedBill?.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Amount:</span>
              <span>Rs. {selectedBill?.total.toFixed(2)}</span>
            </div>
          </div>
          <Button
            onClick={() => selectedBill && handleWithdraw(selectedBill.id)}
            className="w-full mt-4"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Confirm Withdrawal"
            )}
          </Button>
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
              <span>Customer:</span>
              <span>{selectedBill?.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Amount:</span>
              <span>Rs. {selectedBill?.total.toFixed(2)}</span>
            </div>
          </div>
          <Button
            onClick={() => selectedBill && handlePayout(selectedBill.id)}
            className="w-full mt-4"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Confirm Payout"
            )}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
            <DialogDescription>Preview, print, or email the selected invoice.</DialogDescription>
          </DialogHeader>
          {selectedBill && (
            <InvoicePreview
              bill={selectedBill}
              onPrint={printBill}
              onEmail={() => {
                setIsPrintDialogOpen(false)
                setIsEmailDialogOpen(true)
              }}
              onClose={() => setIsPrintDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email Bill</DialogTitle>
            <DialogDescription>Enter the email address to send the bill to.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="customer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleEmail} className="w-full" disabled={!email || isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" /> Send Email
              </>
            )}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
