import { useWallet } from '@txnlab/use-wallet-react'
import React, { useRef, useState } from 'react'
import ConnectWallet from './components/ConnectWallet'
import MintDegreeForm from './components/MintDegreeForm'
import VerifyDegreeForm from './components/VerifyDegreeForm'

const registeredInstitutions: { wallet: string; name: string }[] = [
  { wallet: 'M62NKUYCQT2ESAMEOSGJPTNFCEESEPKJAMSQCPCYNMFJQ4N7VSSKKS6EAM', name: 'Darul Uloom Memon' },
  { wallet: '37IWAMOV226G32SEBQEDGAK6HQAB5QNXAHWITB2BYLFLECG3OMEFIN77QI', name: 'SMIU' },
  { wallet: 'BY5TDHHKSB224JZVCNEEEVADRK7FWYKJAOCKB3KZYAVRL6QZW6OYAVK5NM', name: 'Iqra University' },
]

const Home: React.FC = () => {
  const { activeAddress } = useWallet()
  const [openWalletModal, setOpenWalletModal] = useState(false)
  const [showMint, setShowMint] = useState(false)
  const [showVerify, setShowVerify] = useState(false)

  const mintRef = useRef<HTMLDivElement>(null)
  const verifyRef = useRef<HTMLDivElement>(null)

  const resetSections = () => {
    setShowMint(false)
    setShowVerify(false)
  }

  const scrollTo = (ref: React.RefObject<HTMLDivElement>, setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(true)
    setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  // Match wallet to institution
  const matchedInstitution =
    registeredInstitutions.find((inst) => inst.wallet.toLowerCase() === (activeAddress || '').toLowerCase()) || null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAVBAR */}
      <nav className="bg-cyan-800 px-6 py-4 flex justify-between items-center shadow-md">
        <h1 className="text-2xl font-bold text-white">AlgoCred</h1>
        <div className="space-x-4 flex items-center">
          <button className="btn btn-ghost text-white" onClick={resetSections}>
            Home
          </button>
          <button
            className="btn btn-outline text-white border-white hover:bg-white hover:text-cyan-800"
            onClick={() => scrollTo(mintRef, setShowMint)}
          >
            Issue Degree
          </button>
          <button
            className="btn btn-outline text-white border-white hover:bg-white hover:text-cyan-800"
            onClick={() => scrollTo(verifyRef, setShowVerify)}
          >
            Verify Degree
          </button>
          <button className="btn btn-primary" onClick={() => setOpenWalletModal(true)}>
            {activeAddress ? 'Wallet Connected' : 'Connect Wallet'}
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="bg-cyan-100 py-20 text-center">
        <h2 className="text-4xl font-bold mb-4 text-cyan-900">Welcome to AlgoCred</h2>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto">
          Issue and verify academic credentials on the Algorand blockchain. Trusted, secure, cheap, fast and globally accessible.
        </p>
      </section>

      {/* PARTNERS */}
      <section className="py-12 bg-white">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-cyan-800">Our Partners</h2>
          <p className="text-gray-600 mt-2">Institutions that have already partnered for a Pilot</p>
        </div>
        <div className="flex flex-wrap justify-center gap-8 max-w-7xl mx-auto">
          {/* SMIU */}
          <div className="bg-white border-l-4 border-green-600 p-6 rounded-xl shadow-md w-full sm:w-[22rem] text-center">
            <img src="/smiu-logo.png" alt="SMIU Logo" className="h-12 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">🏛 Sindh Madressatul Islam University (SMIU)</h3>
            <p className="text-gray-700">A prestigious institution taking the lead in digital academic credentialing.</p>
          </div>
          {/* Darul Uloom Memon */}
          <div className="bg-white border-l-4 border-blue-600 p-6 rounded-xl shadow-md w-full sm:w-[22rem] text-center">
            <img src="/darululoom-logo.png" alt="Darul Uloom Logo" className="h-12 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">🕌 Darul Uloom Memon</h3>
            <p className="text-gray-700">Digitally issuing certified religious degrees while maintaining authenticity and tradition.</p>
          </div>
          {/* ABC University */}
          <div className="bg-white border-l-4 border-purple-600 p-6 rounded-xl shadow-md w-full sm:w-[22rem] text-center">
            <img src="/iqra-logo.png" alt="ABC University Logo" className="h-12 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">🎓 ABC University</h3>
            <p className="text-gray-700">
              One of the top private universities in the country, embracing blockchain innovation in education.
            </p>
          </div>
        </div>
        <div className="flex justify-center mt-10">
          <div className="bg-white border-l-4 border-cyan-500 p-6 rounded-xl shadow-md w-full sm:w-[28rem] text-center">
            <img src="/algorand-logo.svg" alt="Algorand Logo" className="h-12 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">🔗 Powered by Algorand</h3>
            <p className="text-gray-700">
              Secure, cheap, carbon-negative blockchain with instant finality powering our degree verification.
            </p>
          </div>
        </div>
      </section>

      {/* ISSUE DEGREE */}
      {showMint && (
        <div ref={mintRef} className="w-full max-w-4xl bg-white rounded-xl shadow-md p-6 my-10 mx-auto relative">
          <h3 className="text-2xl font-bold text-cyan-700 mb-4">🎓 Issue a Degree</h3>
          {!activeAddress && (
            <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10 rounded-xl">
              <p className="text-gray-600 font-medium">Please connect your wallet to issue a degree.</p>
            </div>
          )}
          <div className={activeAddress ? '' : 'pointer-events-none opacity-30'}>
            <MintDegreeForm
              goBack={() => setShowMint(false)}
              wallet={matchedInstitution} // ✅ updated prop name
            />
          </div>
        </div>
      )}

      {/* VERIFY DEGREE */}
      {showVerify && (
        <div ref={verifyRef} className="w-full max-w-4xl bg-white rounded-xl shadow-md p-6 my-10 mx-auto relative">
          <h3 className="text-2xl font-bold text-cyan-700 mb-4">✅ Verify a Degree</h3>
          {!activeAddress && (
            <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10 rounded-xl">
              <p className="text-gray-600 font-medium">Please connect your wallet to verify a degree.</p>
            </div>
          )}
          <div className={activeAddress ? '' : 'pointer-events-none opacity-30'}>
            <VerifyDegreeForm
              goBack={() => setShowVerify(false)}
              wallet={activeAddress ? { wallet: activeAddress, name: 'Connected Wallet' } : null}
            />
          </div>
        </div>
      )}

      {/* WHY US */}
      <section className="bg-cyan-50 py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-cyan-800 mb-6">Why Use AlgoCred?</h2>
          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div className="p-4 border-l-4 border-cyan-500">
              <h3 className="font-semibold text-lg mb-2">🔒 Blockchain-secured</h3>
              <p>Degrees are tamper-proof digital assets stored immutably on Algorand.</p>
            </div>
            <div className="p-4 border-l-4 border-cyan-500">
              <h3 className="font-semibold text-lg mb-2">🌍 Global Verification</h3>
              <p>Degrees can be verified instantly worldwide — no stamps or delays.</p>
            </div>
            <div className="p-4 border-l-4 border-cyan-500">
              <h3 className="font-semibold text-lg mb-2">✅ Immutable & Authentic</h3>
              <p>Once issued, a degree can’t be changed. No fraud, no forgery, ever.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="bg-gray-100 py-12 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-cyan-700 mb-4">Need Help or a Demo?</h2>
          <p className="text-gray-600 mb-6">Reach out to our team and we’ll respond within 24 hours.</p>
          <a href="mailto:support@algocred.org" className="btn btn-outline btn-primary">
            Contact Support
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-cyan-800 text-white text-center py-6">
        <p>&copy; {new Date().getFullYear()} AlgoCred — Trusted Blockchain Credentials.</p>
      </footer>

      {/* Wallet Modal */}
      <ConnectWallet openModal={openWalletModal} closeModal={() => setOpenWalletModal(false)} setConnectedInstitution={() => {}} />
    </div>
  )
}

export default Home
