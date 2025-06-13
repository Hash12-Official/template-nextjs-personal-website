"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Printer, Download, Mail } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Bill } from "@/types"

interface InvoicePreviewProps {
  bill: Bill
  onPrint: () => void
  onEmail: () => void
  onClose: () => void
}

export function InvoicePreview({ bill, onPrint, onEmail, onClose }: InvoicePreviewProps) {
  const [view, setView] = useState<"preview" | "raw">("preview")

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 2,
    })
      .format(amount)
      .replace("PKR", "Rs.")
  }

  const downloadAsPDF = () => {
    // In a real app, you would use a library like jsPDF to generate a PDF
    // For now, we'll just trigger the print dialog which can save as PDF
    onPrint()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Invoice #{bill.id}</h2>
        <div className="flex space-x-2">
          <Tabs value={view} onValueChange={(v) => setView(v as "preview" | "raw")} className="w-[200px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="raw">Raw</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <ScrollArea className="flex-1 rounded-md border">
        <Tabs value={view} className="w-full">
          <TabsContent value="preview" className="mt-0">
            <div className="p-6 bg-white min-h-[500px]">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">Sky Lounge</h1>
                  <p className="text-gray-600">123 Main Street, City</p>
                  <p className="text-gray-600">Phone: (123) 456-7890</p>
                  <p className="text-gray-600">Email: info@skylounge.com</p>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-semibold text-gray-800">Invoice #{bill.id}</h2>
                  <p className="text-gray-600">Date: {formatDate(bill.date)}</p>
                  <p className="text-gray-600">Payment Method: {bill.paymentMethod.toUpperCase()}</p>
                  {bill.cardType && <p className="text-gray-600">Card Type: {bill.cardType.toUpperCase()}</p>}
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Customer Information</h3>
                <p className="text-gray-700">Name: {bill.customerName}</p>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Order Details</h3>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">Item</th>
                      <th className="border p-2 text-right">Price</th>
                      <th className="border p-2 text-right">Quantity</th>
                      <th className="border p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bill.items.map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="border p-2">{item.name}</td>
                        <td className="border p-2 text-right">{formatCurrency(item.price)}</td>
                        <td className="border p-2 text-right">{item.quantity}</td>
                        <td className="border p-2 text-right">{formatCurrency(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end mb-8">
                <div className="w-64">
                  <div className="flex justify-between py-2">
                    <span className="font-medium">Subtotal:</span>
                    <span>{formatCurrency(bill.subtotal)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="font-medium">Tax (17%):</span>
                    <span>{formatCurrency(bill.tax)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t border-gray-300 font-bold">
                    <span>Total:</span>
                    <span>{formatCurrency(bill.total)}</span>
                  </div>
                </div>
              </div>

              {(bill.isWithdrawn || bill.isPaidOut) && (
                <div className="mb-8 p-4 border border-yellow-300 bg-yellow-50 rounded-md">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">Payment Status</h3>
                  {bill.isWithdrawn && <p className="text-yellow-800">This payment has been withdrawn.</p>}
                  {bill.isPaidOut && <p className="text-yellow-800">This payment has been paid out.</p>}
                </div>
              )}

              <div className="text-center text-gray-600 mt-12">
                <p>Thank you for your business!</p>
                <p className="mt-2">For questions or concerns, please contact us at support@skylounge.com</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="raw" className="mt-0">
            <pre className="p-6 font-mono text-sm whitespace-pre-wrap">{formatRawBill(bill)}</pre>
          </TabsContent>
        </Tabs>
      </ScrollArea>

      <div className="flex justify-between items-center mt-4">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onEmail}>
            <Mail className="mr-2 h-4 w-4" /> Email
          </Button>
          <Button variant="outline" onClick={downloadAsPDF}>
            <Download className="mr-2 h-4 w-4" /> Download
          </Button>
          <Button onClick={onPrint}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
        </div>
      </div>
    </div>
  )
}

function formatRawBill(bill: Bill): string {
  let billText = `Sky Lounge

`
  billText += `Invoice #${bill.id}
`
  billText += `Date: ${bill.date}
`
  billText += `Customer: ${bill.customerName}

`
  billText += `Items:
`
  billText += `${"─".repeat(40)}
`
  billText += `Item                  Qty    Price      Total
`
  billText += `${"─".repeat(40)}
`

  bill.items.forEach((item) => {
    const name = item.name.padEnd(20, " ").substring(0, 20)
    const qty = item.quantity.toString().padStart(3, " ")
    const price = `Rs. ${item.price.toFixed(2)}`.padStart(10, " ")
    const total = `Rs. ${(item.price * item.quantity).toFixed(2)}`.padStart(10, " ")
    billText += `${name} ${qty} ${price} ${total}
`
  })

  billText += `${"─".repeat(40)}
`
  billText += `Subtotal:${" ".repeat(30)}Rs. ${bill.subtotal.toFixed(2)}
`
  billText += `Tax (17%):${" ".repeat(28)}Rs. ${bill.tax.toFixed(2)}
`
  billText += `${"─".repeat(40)}
`
  billText += `Total:${" ".repeat(33)}Rs. ${bill.total.toFixed(2)}

`
  billText += `Payment Method: ${bill.paymentMethod}`

  if (bill.cardType) {
    billText += ` (${bill.cardType})`
  }

  if (bill.isWithdrawn) {
    billText += `

NOTE: This payment has been withdrawn.`
  }

  if (bill.isPaidOut) {
    billText += `
NOTE: This payment has been paid out.`
  }

  billText += `

Thank you for your business!`
  return billText
}

