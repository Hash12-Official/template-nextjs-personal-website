'use client'

import { useState, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { CreditCard, AlertTriangle, Loader2, Calendar, Lock, CreditCardIcon } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AdminCardDetails, AdminState, Transaction, CardValidationErrors } from '@/types/admin'
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

interface AdminDashboardProps {
  onBack: () => void
  adminState: AdminState
  setAdminState: React.Dispatch<React.SetStateAction<AdminState>>
  integratedAdminCard: AdminCardDetails | null
  setIntegratedAdminCard: React.Dispatch<React.SetStateAction<AdminCardDetails | null>>
}

export function AdminDashboard({ 
  onBack, 
  adminState, 
  setAdminState, 
  integratedAdminCard, 
  setIntegratedAdminCard 
}: AdminDashboardProps) {
  const [adminCardDetails, setAdminCardDetails] = useState<AdminCardDetails>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardType: 'visa'
  })
  const [isAdminCardDialogOpen, setIsAdminCardDialogOpen] = useState(false)
  const [isEmptyCardBalanceDialogOpen, setIsEmptyCardBalanceDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errors, setErrors] = useState<CardValidationErrors>({})
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    if (value.length <= 16) {
      setAdminCardDetails(prev => ({ 
        ...prev, 
        cardNumber: value.replace(/(\d{4})/g, '$1 ').trim()
      }))
    }
  }

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    if (value.length <= 4) {
      const formattedValue = value.length > 2 
        ? value.slice(0, 2) + '/' + value.slice(2)
        : value
      setAdminCardDetails(prev => ({ ...prev, expiryDate: formattedValue }))
    }
  }

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    if (value.length <= 3) {
      setAdminCardDetails(prev => ({ ...prev, cvv: value }))
    }
  }

  const handleAdminCardIntegration = async () => {
    setIsProcessing(true)
    setErrors({})

    try {
      const response = await fetch('/api/admin/card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adminCardDetails),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to integrate card')
      }

      setIntegratedAdminCard({
        ...adminCardDetails,
        last4: data.cardDetails.last4,
        brand: data.cardDetails.brand,
      })

      toast({
        title: "Admin Card Integrated",
        description: `${adminCardDetails.cardType.toUpperCase()} card ending in ${data.cardDetails.last4} has been successfully integrated.`,
      })

      setIsAdminCardDialogOpen(false)
    } catch (error: any) {
      console.error('Admin card integration error:', error)
      toast({
        title: "Integration Failed",
        description: error.message || "Failed to integrate admin card. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleEmptyCardBalance = async () => {
    if (!integratedAdminCard || adminState.cardBalance <= 0) return

    setIsProcessing(true)
    try {
      const response = await fetch('/api/admin/card/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: adminState.cardBalance,
          cardDetails: integratedAdminCard,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to process payment')
      }

      const transaction: Transaction = {
        id: data.paymentIntentId,
        type: 'payout',
        amount: adminState.cardBalance,
        date: new Date().toISOString(),
        status: data.status === 'succeeded' ? 'completed' : 'pending',
        cardLast4: integratedAdminCard.last4
      }

      setAdminState(prev => ({
        ...prev,
        cardBalance: 0,
        transactions: [transaction, ...prev.transactions],
        totalPayouts: prev.totalPayouts + adminState.cardBalance
      }))

      toast({
        title: "Transfer Successful",
        description: `Rs. ${adminState.cardBalance.toFixed(2)} has been transferred to your admin card.`,
      })
    } catch (error: any) {
      console.error('Card balance transfer error:', error)
      toast({
        title: "Transfer Failed",
        description: error.message || "Failed to transfer balance. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setIsEmptyCardBalanceDialogOpen(false)
    }
  }

  const formatCardNumber = (number: string) => {
    return `**** **** **** ${number.slice(-4)}`
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button onClick={onBack} variant="outline">
          Back to Billing System
        </Button>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="relative overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCardIcon className="h-5 w-5" />
              Admin Card Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-4">
              Rs. {adminState.cardBalance.toFixed(2)}
            </div>
            <div className="space-y-4">
              {integratedAdminCard ? (
                <div className="bg-card p-4 rounded-lg border shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Integrated Admin Card</h3>
                    <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                      {integratedAdminCard.cardType.toUpperCase()}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span>{formatCardNumber(integratedAdminCard.cardNumber)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Expires: {integratedAdminCard.expiryDate}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <Button 
                  onClick={() => setIsAdminCardDialogOpen(true)} 
                  className="w-full"
                  variant="outline"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Integrate Admin Card
                </Button>
              )}
              {integratedAdminCard && adminState.cardBalance > 0 && (
                <Button 
                  onClick={() => setIsEmptyCardBalanceDialogOpen(true)} 
                  className="w-full"
                  variant="destructive"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Transfer Balance to Admin Card
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
                <span>Total Payouts</span>
                <span className="font-semibold">Rs. {adminState.totalPayouts.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
                <span>Pending Payments</span>
                <span className="font-semibold">Rs. {adminState.pendingPayments.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Transaction History</CardTitle>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="all" value="all">All Transactions</SelectItem>
                <SelectItem key="deposit" value="deposit">Deposits Only</SelectItem>
                <SelectItem key="payout" value="payout">Payouts Only</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Card</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminState.transactions.length > 0 ? (
                    adminState.transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium capitalize">
                          {transaction.type}
                        </TableCell>
                        <TableCell>Rs. {transaction.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.status === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : transaction.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {transaction.cardLast4 
                            ? `**** ${transaction.cardLast4}`
                            : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          {new Date(transaction.date).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAdminCardDialogOpen} onOpenChange={setIsAdminCardDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Integrate Admin Card</DialogTitle>
            <DialogDescription>
              Enter your admin card details to integrate it with the system.
              All card information is encrypted and secure.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cardType">Card Type</Label>
              <Select
                value={adminCardDetails.cardType}
                onValueChange={(value: 'visa' | 'debit' | 'credit') => 
                  setAdminCardDetails(prev => ({ ...prev, cardType: value }))
                }
              >
                <SelectTrigger id="cardType" className={errors.cardType ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select card type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="visa" value="visa">Visa</SelectItem>
                  <SelectItem key="debit" value="debit">Debit</SelectItem>
                  <SelectItem key="credit" value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
              {errors.cardType && (
                <p className="text-sm text-red-500">{errors.cardType}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <div className="relative">
                <Input
                  id="cardNumber"
                  value={adminCardDetails.cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="1234 5678 9012 3456"
                  className={errors.cardNumber ? "border-red-500" : ""}
                />
                <CreditCard className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              </div>
              {errors.cardNumber && (
                <p className="text-sm text-red-500">{errors.cardNumber}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <div className="relative">
                  <Input
                    id="expiryDate"
                    value={adminCardDetails.expiryDate}
                    onChange={handleExpiryDateChange}
                    placeholder="MM/YY"
                    className={errors.expiryDate ? "border-red-500" : ""}
                  />
                  <Calendar className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                </div>
                {errors.expiryDate && (
                  <p className="text-sm text-red-500">{errors.expiryDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <div className="relative">
                  <Input
                    id="cvv"
                    value={adminCardDetails.cvv}
                    onChange={handleCvvChange}
                    placeholder="123"
                    className={errors.cvv ? "border-red-500" : ""}
                  />
                  <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                </div>
                {errors.cvv && (
                  <p className="text-sm text-red-500">{errors.cvv}</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleAdminCardIntegration}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying Card...
                </>
              ) : (
                'Integrate Card'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isEmptyCardBalanceDialogOpen} onOpenChange={setIsEmptyCardBalanceDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Balance Transfer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to transfer the entire card balance to your admin card?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Current Balance:</span>
                <span className="font-semibold">Rs. {adminState.cardBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Destination Card:</span>
                <span className="font-semibold">
                  {integratedAdminCard?.cardType.toUpperCase()} **** {integratedAdminCard?.last4}
                </span>
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEmptyCardBalance}
              disabled={isProcessing}
              className="bg-red-500 hover:bg-red-600"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm Transfer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

