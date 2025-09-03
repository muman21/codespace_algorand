import { useWallet } from '@txnlab/use-wallet-react'
import React, { useRef, useState } from 'react'
import ConnectWallet from './components/ConnectWallet'
import MintDegreeForm from './components/MintDegreeForm'
import VerifyDegreeForm from './components/VerifyDegreeForm'
import ProformaForm from './components/SemesterProforma'
import PrintProforma from './components/PrintProforma' // ✅ new import

const registeredInstitutions: { wallet: string; name: string }[] = [
  { wallet: 'M62NKUYCQT2ESAMEOSGJPTNFCEESEPKJAMSQCPCYNMFJQ4N7VSSKKS6EAM', name: 'Darul Uloom Memon' },
  { wallet: '37IWAMOV226G32SEBQEDGAK6HQAB5QNXAHWITB2BYLFLECG3OMEFIN77QI', name: 'SMIU' },
  { wallet: 'BY5TDHHKSB224JZVCNEEEVADRK7FWYKJAOCKB3KZYAVRL6QZW6OYAVK5NM', name: 'ABC University' },
]

const Home: React.FC = () => {
  const { activeAddress } = useWallet()
  const [openWalletModal, setOpenWalletModal] = useState(false)
  const [showMint, setShowMint] = useState(false)
  const [showVerify, setShowVerify] = useState(false)
  const [showProforma, setShowProforma] = useState(false)
  const [showPrintProforma, setShowPrintProforma] = useState(false) // ✅ added
  const [menuOpen, setMenuOpen] = useState(false)

  const mintRef = useRef<HTMLDivElement>(null)
  const verifyRef = useRef<HTMLDivElement>(null)
  const proformaRef = useRef<HTMLDivElement>(null)
  const printProformaRef = useRef<HTMLDivElement>(null) // ✅ added

  const resetSections = () => {
    setShowMint(false)
    setShowVerify(false)
    setShowProforma(false)
    setShowPrintProforma(false)
  }

  const scrollTo = (ref: React.RefObject<HTMLDivElement>, setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(true)
    setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
    setMenuOpen(false)
  }

  // Match wallet to institution
  const matchedInstitution =
    registeredInstitutions.find((inst) => inst.wallet.toLowerCase() === (activeAddress || '').toLowerCase()) || null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAVBAR */}
      <nav className="bg-cyan-900 px-6 py-4 flex justify-between items-center shadow-md relative">
        <div className="flex items-center space-x-4">
          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-white hover:bg-cyan-800 rounded-full px-4 py-2 font-medium focus:outline-none"
            >
              Menu
            </button>
            {menuOpen && (
              <div className="absolute left-0 mt-2 w-60 bg-white rounded-lg shadow-lg border z-50">
                <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700" onClick={resetSections}>
                  Home
                </button>
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                  onClick={() => scrollTo(mintRef, setShowMint)}
                >
                  Issue Degree
                </button>
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                  onClick={() => scrollTo(proformaRef, setShowProforma)}
                >
                  Issue Semester Proforma
                </button>
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                  onClick={() => scrollTo(printProformaRef, setShowPrintProforma)}
                >
                  Print Semester Proforma
                </button>
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                  onClick={() => scrollTo(verifyRef, setShowVerify)}
                >
                  Verify Degree
                </button>
              </div>
            )}
          </div>

          {/* Logo */}
          <h1 className="text-2xl font-bold text-white">AlgoCred</h1>
        </div>

        {/* Wallet Connect */}
        <button className="btn btn-primary" onClick={() => setOpenWalletModal(true)}>
          {activeAddress ? 'Wallet Connected' : 'Connect Wallet'}
        </button>
      </nav>

      {/* HERO */}
      <section className="bg-cyan-100 py-20 text-center">
        <h2 className="text-4xl font-bold mb-4 text-cyan-900">Welcome to AlgoCred</h2>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto">
          A blockchain-based platform for issuing and verifying academic credentials with authenticity, security, and global accessibility.
        </p>
      </section>

      {/* PARTNERS */}
      <section className="py-12 bg-white">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-cyan-800">Partner Institutions</h2>
          <p className="text-gray-600 mt-2">Academic institutions collaborating on blockchain credentialing.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-8 max-w-7xl mx-auto">
          {/* Cards */}
          <div className="bg-white border-l-4 border-green-600 p-6 rounded-xl shadow-md w-full sm:w-[22rem] text-center">
            <img src="/smiu-logo.png" alt="SMIU Logo" className="h-12 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Sindh Madressatul Islam University</h3>
            <p className="text-gray-700">Pioneering blockchain-enabled degree issuance and verification.</p>
          </div>
          <div className="bg-white border-l-4 border-blue-600 p-6 rounded-xl shadow-md w-full sm:w-[22rem] text-center">
            <img src="/darululoom-logo.png" alt="Darul Uloom Logo" className="h-12 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Darul Uloom Memon</h3>
            <p className="text-gray-700">Digitally certifying religious education while upholding tradition.</p>
          </div>
          <div className="bg-white border-l-4 border-purple-600 p-6 rounded-xl shadow-md w-full sm:w-[22rem] text-center">
            <img src="/iqra-logo.png" alt="ABC University Logo" className="h-12 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">ABC University</h3>
            <p className="text-gray-700">Adopting blockchain to enhance trust in academic credentials.</p>
          </div>
        </div>
        <div className="flex justify-center mt-10">
          <div className="bg-white border-l-4 border-cyan-500 p-6 rounded-xl shadow-md w-full sm:w-[28rem] text-center">
            <img src="/algorand-logo.svg" alt="Algorand Logo" className="h-12 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Powered by Algorand</h3>
            <p className="text-gray-700">
              Leveraging Algorand’s secure, scalable, and carbon-negative blockchain to safeguard academic integrity.
            </p>
          </div>
        </div>
      </section>

      {/* ISSUE DEGREE */}
      {showMint && (
        <div ref={mintRef} className="w-full max-w-4xl bg-white rounded-xl shadow-md p-6 my-10 mx-auto relative">
          <h3 className="text-2xl font-bold text-cyan-700 mb-4">Issue a Degree</h3>
          {!activeAddress && (
            <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10 rounded-xl">
              <p className="text-gray-600 font-medium">Please connect your wallet to continue.</p>
            </div>
          )}
          <div className={activeAddress ? '' : 'pointer-events-none opacity-30'}>
            <MintDegreeForm goBack={() => setShowMint(false)} wallet={matchedInstitution} />
          </div>
        </div>
      )}

      {/* ISSUE SEMESTER PROFORMA */}
      {showProforma && (
        <div ref={proformaRef} className="w-full max-w-4xl bg-white rounded-xl shadow-md p-6 my-10 mx-auto relative">
          <h3 className="text-2xl font-bold text-cyan-700 mb-4">Issue a Semester Proforma</h3>
          {!activeAddress && (
            <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10 rounded-xl">
              <p className="text-gray-600 font-medium">Please connect your wallet to continue.</p>
            </div>
          )}
          <div className={activeAddress ? '' : 'pointer-events-none opacity-30'}>
            <ProformaForm goBack={() => setShowProforma(false)} wallet={matchedInstitution} />
          </div>
        </div>
      )}

      {/* PRINT SEMESTER PROFORMA (No Wallet Required) */}
      {showPrintProforma && (
        <div ref={printProformaRef} className="w-full max-w-4xl bg-white rounded-xl shadow-md p-6 my-10 mx-auto">
          <h3 className="text-2xl font-bold text-cyan-700 mb-4">Print Semester Proforma</h3>
          <PrintProforma />
        </div>
      )}

      {/* VERIFY DEGREE */}
      {showVerify && (
        <div ref={verifyRef} className="w-full max-w-4xl bg-white rounded-xl shadow-md p-6 my-10 mx-auto relative">
          <h3 className="text-2xl font-bold text-cyan-700 mb-4">Verify a Degree</h3>
          {!activeAddress && (
            <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10 rounded-xl">
              <p className="text-gray-600 font-medium">Please connect your wallet to continue.</p>
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
          <h2 className="text-3xl font-bold text-cyan-800 mb-6">Why AlgoCred?</h2>
          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div className="p-4 border-l-4 border-cyan-500">
              <h3 className="font-semibold text-lg mb-2">Tamper-proof Records</h3>
              <p>Academic credentials are immutable digital assets on Algorand.</p>
            </div>
            <div className="p-4 border-l-4 border-cyan-500">
              <h3 className="font-semibold text-lg mb-2">Instant Global Access</h3>
              <p>Verification can be performed anywhere in the world in seconds.</p>
            </div>
            <div className="p-4 border-l-4 border-cyan-500">
              <h3 className="font-semibold text-lg mb-2">Academic Integrity</h3>
              <p>Eliminates fraud and ensures authenticity of issued degrees.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="bg-gray-100 py-12 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-cyan-700 mb-4">Contact & Support</h2>
          <p className="text-gray-600 mb-6">For demonstrations or inquiries, reach out to our academic support team.</p>
          <a href="mailto:support@algocred.org" className="btn btn-outline btn-primary">
            Contact Us
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-cyan-900 text-white text-center py-6">
        <p className="font-medium">AlgoCred — Academic Credential Verification on Blockchain</p>
        <p className="text-sm mt-2 text-gray-300">© {new Date().getFullYear()} RZ Services. All rights reserved.</p>
      </footer>

      {/* Wallet Modal */}
      <ConnectWallet openModal={openWalletModal} closeModal={() => setOpenWalletModal(false)} setConnectedInstitution={() => {}} />
    </div>
  )
}

export default Home
