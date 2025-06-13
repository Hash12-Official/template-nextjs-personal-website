import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Sky Lounge Billing System",
  description: "Advanced billing system for Sky Lounge",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-background text-foreground antialiased`}>
        <main className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
        </main>
        <Toaster />
      </body>
    </html>
  )
}
