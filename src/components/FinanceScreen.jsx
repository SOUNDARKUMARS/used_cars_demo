import React, { useState } from 'react'
import { Calculator, CheckCircle2, ArrowRight } from 'lucide-react'

export default function FinanceScreen({ onBack, onBookTestDrive }) {
  const [carPrice, setCarPrice] = useState(1150000)
  const [downPayment, setDownPayment] = useState(250000)
  const [tenureYears, setTenureYears] = useState(5)
  const [interestRate, setInterestRate] = useState(8.75)

  // Calculate EMI: [P * R * (1+R)^N] / [(1+R)^N - 1]
  const principal = Math.max(0, carPrice - downPayment)
  const monthlyRate = interestRate / 12 / 100
  const months = tenureYears * 12
  const emi = Math.round(
    (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1) || 0
  )
  const totalPayable = emi * months
  const totalInterest = Math.max(0, totalPayable - principal)

  return (
    <div className="w-full bg-[#f8fafc] text-slate-900 min-h-screen pb-28 md:pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 space-y-6">
        <div>
          <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Nova Auto Finance & EMI Calculator
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Instant online paperless pre-approvals with customized tenures and zero prepayment penalty
          </p>
        </div>

        {/* EMI Result Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-950 text-white shadow-2xl relative overflow-hidden border border-slate-800">
          <div className="relative z-10">
            <span className="text-[11px] sm:text-xs uppercase tracking-wider text-slate-400 font-bold">
              Estimated Monthly Installment (EMI)
            </span>
            <div className="text-3xl sm:text-5xl font-extrabold tracking-tight mt-1 mb-3 font-mono">
              ₹ {emi.toLocaleString('en-IN')}{' '}
              <span className="text-sm sm:text-base font-sans font-normal text-slate-400">/ month</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800 text-xs sm:text-sm text-slate-300">
              <div>
                <p className="text-[10px] sm:text-xs text-slate-400">Net Loan Amount</p>
                <p className="font-bold text-white mt-0.5 font-mono">
                  ₹ {principal.toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-slate-400">Total Interest</p>
                <p className="font-bold text-white mt-0.5 font-mono">
                  ₹ {totalInterest.toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-slate-400">Total Payable</p>
                <p className="font-bold text-slate-200 mt-0.5 font-mono">
                  ₹ {totalPayable.toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-slate-400">Tenure</p>
                <p className="font-bold text-white mt-0.5 font-mono">{months} Months</p>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Sliders */}
        <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          {/* Car Price */}
          <div>
            <div className="flex justify-between text-xs sm:text-sm font-semibold mb-2">
              <span className="text-slate-700">Vehicle Cost</span>
              <span className="text-slate-900 font-mono font-bold text-base">
                ₹ {carPrice.toLocaleString('en-IN')}
              </span>
            </div>
            <input
              type="range"
              min="300000"
              max="5000000"
              step="25000"
              value={carPrice}
              onChange={(e) => setCarPrice(Number(e.target.value))}
              className="w-full accent-slate-900 cursor-pointer h-2 bg-slate-100 rounded-lg"
            />
          </div>

          {/* Down Payment */}
          <div>
            <div className="flex justify-between text-xs sm:text-sm font-semibold mb-2">
              <span className="text-slate-700">Down Payment (Minimum 10%)</span>
              <span className="text-slate-900 font-mono font-bold text-base">
                ₹ {downPayment.toLocaleString('en-IN')}
              </span>
            </div>
            <input
              type="range"
              min="50000"
              max={carPrice}
              step="10000"
              value={downPayment}
              onChange={(e) => setDownPayment(Number(e.target.value))}
              className="w-full accent-slate-900 cursor-pointer h-2 bg-slate-100 rounded-lg"
            />
          </div>

          {/* Tenure */}
          <div>
            <div className="flex justify-between text-xs sm:text-sm font-semibold mb-2">
              <span className="text-slate-700">Loan Tenure</span>
              <span className="text-slate-900 font-mono font-bold text-base">{tenureYears} Years</span>
            </div>
            <div className="grid grid-cols-6 gap-2 mt-2">
              {[1, 2, 3, 4, 5, 7].map((yr) => (
                <button
                  key={yr}
                  onClick={() => setTenureYears(yr)}
                  className={`py-2 rounded-xl text-xs sm:text-sm font-semibold border transition active:scale-95 ${
                    tenureYears === yr
                      ? 'bg-slate-950 text-white border-slate-950 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {yr} yr
                </button>
              ))}
            </div>
          </div>

          {/* Interest Rate */}
          <div>
            <div className="flex justify-between text-xs sm:text-sm font-semibold mb-2">
              <span className="text-slate-700">Interest Rate (Annual)</span>
              <span className="text-slate-900 font-mono font-bold text-base">{interestRate}%</span>
            </div>
            <input
              type="range"
              min="7.5"
              max="15.0"
              step="0.25"
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="w-full accent-slate-900 cursor-pointer h-2 bg-slate-100 rounded-lg"
            />
          </div>
        </div>

        {/* Banking Partners */}
        <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Financing Partners</h3>
          <p className="text-xs text-slate-500 mb-4">
            Instant paperless approvals with 100% funding on on-road price through verified banking partners.
          </p>
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
            {['HDFC Bank', 'ICICI Bank', 'SBI Auto Loans', 'Axis Bank', 'Kotak Mahindra Prime', 'Bank of Baroda'].map((b) => (
              <span key={b} className="px-3.5 py-2 bg-slate-50 rounded-xl border border-slate-200 shadow-2xs">
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
