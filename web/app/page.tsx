import Link from "next/link";
import { ArrowRight, BarChart3, ShieldAlert } from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="text-center py-16 px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
          National Airfare Price Index <span className="text-blue-500">(VAYU-CPI)</span>
        </h1>
        <p className="max-w-2xl mx-auto text-xl text-slate-400 mb-10">
          A Real-Time analytical engine tracking airfare inflation and surge pricing across domestic corridors in India.
        </p>
      </section>

      <section className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Link href="/mospi" className="group block">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 hover:border-blue-500/50 transition-all hover:bg-slate-800/50">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
              <h2 className="text-2xl font-semibold">MoSPI Portal</h2>
            </div>
            <p className="text-slate-400 mb-6">
              Macro-economic view of airfare inflation. Tracks the Composite Airfare CPI, advance vs. spot index, and supports integration with the national CPI basket.
            </p>
            <div className="flex items-center text-blue-400 font-medium group-hover:text-blue-300">
              View Macro Index <ArrowRight className="ml-2 h-4 w-4" />
            </div>
          </div>
        </Link>

        <Link href="/dgca" className="group block">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 hover:border-red-500/50 transition-all hover:bg-slate-800/50">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-500/10 rounded-lg">
                <ShieldAlert className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-semibold">DGCA Matrix</h2>
            </div>
            <p className="text-slate-400 mb-6">
              Regulatory view for monitoring predatory pricing. Analyzes corridor-level surge alerts, fee breakdowns, and market concentration.
            </p>
            <div className="flex items-center text-red-400 font-medium group-hover:text-red-300">
              View Surge Alerts <ArrowRight className="ml-2 h-4 w-4" />
            </div>
          </div>
        </Link>
      </section>
    </div>
  );
}
