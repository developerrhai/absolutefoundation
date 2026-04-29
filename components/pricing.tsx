"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Basic",
    price: "₹999",
    period: "/mo",
    features: [
      "Up to 100 students",
      "Basic reporting",
      "Email support",
      "Fee management",
    ],
  },
  {
    name: "Pro",
    price: "₹1999",
    period: "/mo",
    popular: true,
    features: [
      "Up to 500 students",
      "Advanced reporting",
      "Priority support",
      "All Basic features",
      "Staff management",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    features: [
      "Unlimited students",
      "Custom integrations",
      "Dedicated support",
      "All Pro features",
      "White-labeling",
    ],
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Pricing
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`bg-card/50 border-border relative ${
                plan.popular ? "border-primary ring-2 ring-primary/20" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
                  Popular
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-primary">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                >
                  {plan.name === "Enterprise" ? "Contact Us" : "Select"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
