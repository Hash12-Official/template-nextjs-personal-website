"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/components/ui/use-toast"
import type { AdminState, FinanceEntry } from "@/types"

interface FinanceSheetProps {
  onBack: () => void
  adminState: AdminState
  setAdminState: React.Dispatch<React.SetStateAction<AdminState>>
}

export function FinanceSheet({ onBack, adminState, setAdminState }: FinanceSheetProps) {
  const [entries, setEntries] = useState<FinanceEntry[]>([])
  const [newEntry, setNewEntry] = useState<Omit<FinanceEntry, "id">>({
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: 0,
    type: "income",
  })
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [profit, setProfit] = useState(0)

  // Load entries from localStorage
  useEffect(() => {
    try {
      const savedEntries = localStorage.getItem("financeEntries")
      if (savedEntries) {
        setEntries(JSON.parse(savedEntries))
      }
    } catch (error) {
      console.error("Error loading finance entries:", error)
    }
  }, [])

  // Save entries to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("financeEntries", JSON.stringify(entries))
    } catch (error) {
      console.error("Error saving finance entries:", error)
    }
  }, [entries])

  // Calculate totals
  useEffect(() => {
    const income = entries.filter((entry) => entry.type === "income").reduce((sum, entry) => sum + entry.amount, 0)
    const expenses = entries.filter((entry) => entry.type === "expense").reduce((sum, entry) => sum + entry.amount, 0)

    setTotalIncome(income)
    setTotalExpenses(expenses)
    setProfit(income - expenses)
  }, [entries])

  const addEntry = () => {
    if (!newEntry.description) {
      toast({
        title: "Missing Description",
        description: "Please enter a description for the entry.",
        variant: "destructive",
      })
      return
    }

    if (newEntry.amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter an amount greater than zero.",
        variant: "destructive",
      })
      return
    }

    const entry: FinanceEntry = {
      ...newEntry,
      id: Date.now(),
    }

    setEntries((prev) => [entry, ...prev])

    setNewEntry({
      date: new Date().toISOString().split("T")[0],
      description: "",
      amount: 0,
      type: "income",
    })

    toast({
      title: "Entry Added",
      description: `${entry.type === "income" ? "Income" : "Expense"} of Rs. ${entry.amount.toFixed(2)} added.`,
    })
  }

  const removeEntry = (id: number) => {
    setEntries(entries.filter((entry) => entry.id !== id))
    toast({
      title: "Entry Removed",
      description: "Finance entry has been removed.",
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Finance Sheet</h1>
        <Button onClick={onBack} variant="outline">
          Back to Billing System
        </Button>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Add New Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Input
                type="date"
                value={newEntry.date}
                onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <Input
                placeholder="Description"
                value={newEntry.description}
                onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
              />
            </div>
            <div>
              <Input
                type="number"
                placeholder="Amount"
                value={newEntry.amount || ""}
                onChange={(e) => setNewEntry({ ...newEntry, amount: Number.parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Select
                value={newEntry.type}
                onValueChange={(value: "income" | "expense") => setNewEntry({ ...newEntry, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Button onClick={addEntry} className="w-full">
                <Plus className="mr-2 h-4 w-4" /> Add Entry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Finance Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length > 0 ? (
                  entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell>Rs. {entry.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            entry.type === "income" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {entry.type === "income" ? "Income" : "Expense"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => removeEntry(entry.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      No finance entries yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="rounded-lg border p-4 text-center">
              <div className="text-sm text-muted-foreground">Total Income</div>
              <div className="text-2xl font-bold text-green-600">Rs. {totalIncome.toFixed(2)}</div>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <div className="text-sm text-muted-foreground">Total Expenses</div>
              <div className="text-2xl font-bold text-red-600">Rs. {totalExpenses.toFixed(2)}</div>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <div className="text-sm text-muted-foreground">Net Profit</div>
              <div className={`text-2xl font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                Rs. {profit.toFixed(2)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
