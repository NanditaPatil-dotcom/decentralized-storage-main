"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Coins, Atom, ShieldCheck, Zap, Lock } from "lucide-react"

type Feature = {
  icon: JSX.Element
  title: string
  description: string
}

function GlowingCard({ feature }: { feature: Feature }) {
  return (
    <motion.div
      className="relative"
      initial={false}
    >
      <motion.div
        whileHover={{ y: -5 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative z-10"
      >
        <Card className="backdrop-blur-md bg-white/5 border border-white/10 shadow-lg transition duration-300 ease-in-out min-h-[200px] md:min-h-[300px] lg:min-h-[300px] flex flex-col">
          <CardHeader className="pb-2">
            <div className="mx-auto -mt-10 mb-4 h-16 w-16 rounded-full bg-[#5931DD] flex items-center justify-center shadow-xl shadow-purple-500/60">
              <div className="text-white">{feature.icon}</div>
            </div>
            <CardTitle className="text-center text-white text-xl">{feature.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex items-start justify-center">
            <p className="text-center text-white/70 text-sm leading-relaxed w-full">{feature.description}</p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

export default function GlowingFeatureCards() {
  const features: Feature[] = [
    {
      icon: <Lock className="h-8 w-8" />,
      title: "Own Your Data",
      description: "No middlemen. Vaultix lets you store, manage, and share your files securely through decentralized storage networks — ensuring complete control and transparency every step of the way.",
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Instant Access",
      description: "Experience lightning-fast retrieval for your encrypted files. Vaultix’s system ensures data is always available, accessible, and resistant to censorship or single-point failures.",
    },
    {
      icon: <ShieldCheck className="h-8 w-8" />,
      title: "Privacy by Design",
      description: "Your keys, your control — always. Vaultix employs end-to-end encryption and user-owned authentication, ensuring your data remains confidential, verifiable, and truly yours forever.",
    },
  ]

  return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
        {features.map((f, i) => (
          <GlowingCard key={i} feature={f} />
        ))}
      </div>
  )
}


