import React, { useState, useRef } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import ConnectWallet from './components/ConnectWallet'
import MintDegreeForm from './components/MintDegreeForm'
import VerifyDegreeForm from './components/VerifyDegreeForm'

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

  const scrollToRef = (ref: React.RefObject<HTMLDivElement>, showSetter: React.Dispatch<React.SetStateAction<boolean>>) => {
    showSetter(true)
    setTimeout(() => {
      if (ref.current) {
        ref.current.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAVBAR */}
      <nav className="bg-cyan-800 px-6 py-4 flex justify-between items-center shadow-md">
        <h1 className="text-2xl font-bold text-white">AlgoCred</h1>
        <div className="space-x-4">
          <button className="btn btn-ghost text-white" onClick={resetSections}>
            Home
          </button>
          <button
            className="btn btn-outline text-white border-white hover:bg-white hover:text-cyan-800"
            onClick={() => scrollToRef(mintRef, setShowMint)}
          >
            Issue Degree
          </button>
          <button
            className="btn btn-outline text-white border-white hover:bg-white hover:text-cyan-800"
            onClick={() => scrollToRef(verifyRef, setShowVerify)}
          >
            Verify Degree
          </button>
          <button className="btn btn-primary" onClick={() => setOpenWalletModal(true)}>
            {activeAddress ? 'Wallet Connected' : 'Connect Wallet'}
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="bg-cyan-100 py-20 text-center">
        <h2 className="text-4xl font-bold mb-4 text-cyan-900">Welcome to AlgoCred</h2>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto">
          Issue and verify academic credentials on the Algorand blockchain. Trusted, secure, and globally accessible.
        </p>
      </section>

      {/* PARTNER & TECH BOXES */}
      <section className="py-12 flex flex-col items-center bg-white">
        <div className="flex flex-wrap justify-center gap-8 max-w-6xl mx-auto mb-8">
          <div className="bg-white border-l-4 border-green-600 p-6 rounded-xl shadow-md w-full md:w-[28rem] text-center">
            <img src="/hec-logo.png" alt="HEC Logo" className="h-12 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">🎓 HEC Partnership</h3>
            <p className="text-gray-700">
              We are partnering with the Higher Education Commission (HEC) for digital issuance of official degrees.
            </p>
          </div>
          <div className="bg-white border-l-4 border-blue-600 p-6 rounded-xl shadow-md w-full md:w-[28rem] text-center">
            <img src="/tanzeem-logo.png" alt="Tanzeem Logo" className="h-12 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">🕌 Tanzeem ul Madaris Ahle Sunnat Pakistan</h3>
            <p className="text-gray-700">
              Issuing certified religious degrees in collaboration with Tanzeem ul Madaris Ahle Sunnat Pakistan.
            </p>
          </div>
        </div>
        <div className="bg-white border-l-4 border-cyan-600 p-6 rounded-xl shadow-md w-full md:w-[28rem] text-center">
          <img src="/algorand-logo.png" alt="Algorand Logo" className="h-10 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">💡 Powered by Algorand</h3>
          <p className="text-gray-700">
            Using the fastest, cheapest blockchain with <strong>instant finality</strong> and global scalability.
          </p>
        </div>
      </section>

      {/* MINT SECTION */}
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
              wallet={''}
              goBack={function (): void {
                throw new Error('Function not implemented.')
              }}
            />
          </div>
        </div>
      )}

      {/* VERIFY SECTION */}
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
              wallet={''}
              goBack={function (): void {
                throw new Error('Function not implemented.')
              }}
            />
          </div>
        </div>
      )}

      {/* WHY US SECTION */}
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

      {/* CONTACT SECTION */}
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
      <ConnectWallet openModal={openWalletModal} closeModal={() => setOpenWalletModal(false)} />
    </div>
  )
}

export default Home
