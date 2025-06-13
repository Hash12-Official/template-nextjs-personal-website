'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"

type FinanceEntry = {
  id: number
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
}

export function FinanceSheet({ onBack }: { onBack: () => void }) {
  const [entries, setEntries] = useState<FinanceEntry[]>([])
  const [newEntry, setNewEntry] = useState<Omit<FinanceEntry, 'id'>>({
    date: '',
    description: '',
    amount: 0,
    type: 'income'
  })
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [profit, setProfit] = useState(0)

  useEffect(() => {
    calculateTotals()
  }, [entries])

  const addEntry = () => {
    setEntries([...entries, { ...newEntry, id: Date.now() }])
    setNewEntry({ date: '', description: '', amount: 0, type: 'income' })
  }

  const removeEntry = (id: number) => {
    setEntries(entries.filter(entry => entry.id !== id))
  }

  const calculateTotals = () => {
    const income = entries
      .filter(entry => entry.type === 'income')
      .reduce((sum, entry) => sum + entry.amount, 0)
    const expenses = entries
      .filter(entry => entry.type === 'expense')
      .reduce((sum, entry) => sum + entry.amount, 0)
    
    setTotalIncome(income)
    setTotalExpenses(expenses)
    setProfit(income - expenses)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Finance Sheet</h1>
        <Button onClick={onBack} variant="outline">Back to Billing System</Button>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Finance Sheet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Input
                type="date"
                value={newEntry.date}
                onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
              />
              <Input
                placeholder="Description"
                value={newEntry.description}
                onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Amount"
                value={newEntry.amount}
                onChange={(e) => setNewEntry({ ...newEntry, amount: parseFloat(e.target.value) || 0 })}
              />
              <Select
                value={newEntry.type}
                onValueChange={(value: 'income' | 'expense') => setNewEntry({ ...newEntry, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={addEntry}>
                <Plus className="h-4 w-4 mr-2" /> Add
              </Button>
            </div>
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
                  {entries.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell>Rs. {entry.amount.toFixed(2)}</TableCell>
                      <TableCell>{entry.type}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => removeEntry(entry.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
            <div className="flex justify-between font-bold">
              <span>Total Income: Rs. {totalIncome.toFixed(2)}</span>
              <span>Total Expenses: Rs. {totalExpenses.toFixed(2)}</span>
              <span>Profit: Rs. {profit.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
