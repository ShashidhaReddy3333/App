"use client";

import { Check } from "lucide-react";

interface StepperProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

export function OnboardingStepper({ currentStep, totalSteps, labels }: StepperProps) {
  return (
    <div className="mb-10">
      <div className="flex items-center justify-center">
        {labels.map((label, index) => (
          <div key={index} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ${
                  index < currentStep
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                    : index === currentStep
                    ? "border-2 border-primary bg-primary/10 text-primary shadow-md shadow-primary/15"
                    : "border border-border bg-muted/50 text-muted-foreground"
                }`}
              >
                {index < currentStep ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`text-xs transition-colors ${
                  index === currentStep
                    ? "font-semibold text-foreground"
                    : index < currentStep
                    ? "font-medium text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>
            {index < totalSteps - 1 && (
              <div
                className={`mx-3 mb-5 h-0.5 w-12 rounded-full transition-colors sm:w-20 ${
                  index < currentStep ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-sm text-muted-foreground">
        Step {currentStep + 1} of {totalSteps}
      </p>
    </div>
  );
}
