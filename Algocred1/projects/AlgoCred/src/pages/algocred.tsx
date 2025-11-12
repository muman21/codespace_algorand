import { useWallet } from '@txnlab/use-wallet-react'
import React, { useState } from 'react'
import ConnectWallet from '../components/ConnectWallet'
import MintDegreeForm from '../components/MintDegreeForm'
import VerifyDegreeForm from '../components/VerifyDegreeForm'
import ProformaForm from '../components/SemesterProforma'
import PrintProforma from '../components/PrintProforma'
import PrintMarksheet from '../components/PrintMarksheet'
import PartnerInstitutions from '../components/PartnerInstitutions'
import { registeredInstitutions } from '../utils/registeredinstitutions'

const Home: React.FC = () => {
  const { activeAddress } = useWallet()
  const [openWalletModal, setOpenWalletModal] = useState(false)
  const [showMint, setShowMint] = useState(false)
  const [showVerify, setShowVerify] = useState(false)
  const [showProforma, setShowProforma] = useState(false)
  const [showPrintProforma, setShowPrintProforma] = useState(false)
  const [showPrintMarksheet, setShowPrintMarksheet] = useState(false)
  const [showPartners, setShowPartners] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  // Dropdown toggles
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false)
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false)
  const [verifyDropdownOpen, setVerifyDropdownOpen] = useState(false)
  const [corporateDropdownOpen, setCorporateDropdownOpen] = useState(false)
  const [adminSubOpen, setAdminSubOpen] = useState<{ madrasa: boolean; university: boolean; school: boolean; skill: boolean }>({
    madrasa: false,
    university: false,
    school: false,
    skill: false,
  })
  const [studentSubOpen, setStudentSubOpen] = useState<{ madrasa: boolean; university: boolean; school: boolean; skill: boolean }>({
    madrasa: false,
    university: false,
    school: false,
    skill: false,
  })

  const matchedInstitution =
    registeredInstitutions.find((inst: { wallet: string }) => inst.wallet.toLowerCase() === (activeAddress || '').toLowerCase()) || null

  const Modal: React.FC<{ open: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({
    open,
    onClose,
    title,
    children,
  }) => {
    if (!open) return null
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl h-[80vh] flex flex-col relative">
          <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
            <h3 className="text-2xl font-bold text-purple-700">{title}</h3>
            <button className="text-gray-500 hover:text-gray-800 text-lg font-bold" onClick={onClose}>
              ✕
            </button>
          </div>
          <div className="p-6 overflow-y-auto flex-1">{children}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAVBAR */}
      <nav className="bg-purple-900 px-6 py-4 flex justify-between items-center shadow-md relative">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-white hover:bg-purple-800 rounded-full px-4 py-2 font-medium focus:outline-none"
            >
              Menu
            </button>

            {menuOpen && (
              <div className="absolute left-0 mt-2 w-72 bg-white rounded-lg shadow-lg border z-50 text-gray-700">
                {/* HOME */}
                <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 font-semibold" onClick={() => setMenuOpen(false)}>
                  Home
                </button>

                {/* PARTNER INSTITUTIONS */}
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 font-semibold"
                  onClick={() => {
                    setShowPartners(true)
                    setMenuOpen(false)
                  }}
                >
                  Partner Institutions
                </button>

                {/* CORPORATE PORTAL */}
                <div className="relative border-t my-1">
                  <button
                    className="w-full text-left px-4 py-2 font-bold text-purple-700 hover:bg-gray-50"
                    onClick={() => setCorporateDropdownOpen(!corporateDropdownOpen)}
                  >
                    Corporate Portal ▾
                  </button>

                  {corporateDropdownOpen && (
                    <div className="flex flex-col bg-white border-t text-gray-700">
                      <button
                        className="px-6 py-2 text-left hover:bg-gray-100"
                        onClick={() => {
                          alert('Issue Certificate feature coming soon!')
                          setMenuOpen(false)
                        }}
                      >
                        Issue Certificates
                      </button>

                      <button
                        className="px-6 py-2 text-left hover:bg-gray-100"
                        onClick={() => {
                          alert('Issue Diploma feature coming soon!')
                          setMenuOpen(false)
                        }}
                      >
                        Issue Diplomas
                      </button>
                    </div>
                  )}
                </div>

                {/* ACADEMIC ADMIN PORTAL */}
                <div className="relative border-t my-1">
                  <button
                    className="w-full text-left px-4 py-2 font-bold text-purple-700 hover:bg-gray-50"
                    onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                  >
                    Academic Admin Portal ▾
                  </button>

                  {adminDropdownOpen && (
                    <div className="flex flex-col bg-white border-t text-gray-700">
                      {/* مدرسہ */}
                      <button
                        className="px-6 py-2 text-left hover:bg-gray-100"
                        onClick={() => setAdminSubOpen((prev) => ({ ...prev, madrasa: !prev.madrasa }))}
                      >
                        مدرسہ ▾
                      </button>
                      {adminSubOpen.madrasa && <div className="pl-8 pb-2 text-sm text-gray-500">Coming soon...</div>}

                      {/* UNIVERSITY */}
                      <button
                        className="px-6 py-2 text-left hover:bg-gray-100"
                        onClick={() => setAdminSubOpen((prev) => ({ ...prev, university: !prev.university }))}
                      >
                        University ▾
                      </button>
                      {adminSubOpen.university && (
                        <div className="flex flex-col pl-8 pb-2">
                          <button
                            className="text-left py-1 hover:text-purple-700"
                            onClick={() => {
                              setShowProforma(true)
                              setMenuOpen(false)
                            }}
                          >
                            Issue Semester Proforma / Transcript
                          </button>
                          <button
                            className="text-left py-1 hover:text-purple-700"
                            onClick={() => {
                              setShowMint(true)
                              setMenuOpen(false)
                            }}
                          >
                            Issue Degree
                          </button>
                        </div>
                      )}

                      {/* Skill Building Institutes */}
                      <button
                        className="px-6 py-2 text-left hover:bg-gray-100"
                        onClick={() => setAdminSubOpen((prev) => ({ ...prev, skill: !prev.skill }))}
                      >
                        Skill Building institutes ▾
                      </button>
                      {adminSubOpen.skill && (
                        <div className="flex flex-col pl-8 pb-2">
                          <button
                            className="text-left py-1 hover:text-purple-700"
                            onClick={() => {
                              alert('Issue Certificate feature coming soon!')
                              setMenuOpen(false)
                            }}
                          >
                            Issue Certificates
                          </button>
                          <button
                            className="text-left py-1 hover:text-purple-700"
                            onClick={() => {
                              alert('Issue Diploma feature coming soon!')
                              setMenuOpen(false)
                            }}
                          >
                            Issue Diplomas
                          </button>
                        </div>
                      )}

                      {/* SCHOOL */}
                      <button
                        className="px-6 py-2 text-left hover:bg-gray-100"
                        onClick={() => setAdminSubOpen((prev) => ({ ...prev, school: !prev.school }))}
                      >
                        School ▾
                      </button>
                      {adminSubOpen.school && <div className="pl-8 pb-2 text-sm text-gray-500">Coming soon...</div>}
                    </div>
                  )}
                </div>

                {/* STUDENT PORTAL */}
                <div className="relative border-t my-1">
                  <button
                    className="w-full text-left px-4 py-2 font-bold text-purple-700 hover:bg-gray-50"
                    onClick={() => setStudentDropdownOpen(!studentDropdownOpen)}
                  >
                    Student Portal ▾
                  </button>

                  {studentDropdownOpen && (
                    <div className="flex flex-col bg-white border-t text-gray-700">
                      {/* مدرسہ */}
                      <button
                        className="px-6 py-2 text-left hover:bg-gray-100"
                        onClick={() => setStudentSubOpen((prev) => ({ ...prev, madrasa: !prev.madrasa }))}
                      >
                        مدرسہ ▾
                      </button>
                      {studentSubOpen.madrasa && <div className="pl-8 pb-2 text-sm text-gray-500">Coming soon...</div>}

                      {/* UNIVERSITY */}
                      <button
                        className="px-6 py-2 text-left hover:bg-gray-100"
                        onClick={() => setStudentSubOpen((prev) => ({ ...prev, university: !prev.university }))}
                      >
                        University ▾
                      </button>
                      {studentSubOpen.university && (
                        <div className="flex flex-col pl-8 pb-2">
                          <button
                            className="text-left py-1 hover:text-purple-700"
                            onClick={() => {
                              setShowPrintProforma(true)
                              setMenuOpen(false)
                            }}
                          >
                            Print Semester Transcript / Proforma
                          </button>
                          <button
                            className="text-left py-1 hover:text-purple-700"
                            onClick={() => {
                              setShowPrintMarksheet(true)
                              setMenuOpen(false)
                            }}
                          >
                            Print Marksheet
                          </button>
                          <button
                            className="text-left py-1 hover:text-purple-700"
                            onClick={() => {
                              alert('Print Degree feature coming soon!')
                              setMenuOpen(false)
                            }}
                          >
                            Print Degree
                          </button>
                        </div>
                      )}

                      {/* Skill Building Institutes */}
                      <button
                        className="px-6 py-2 text-left hover:bg-gray-100"
                        onClick={() => setStudentSubOpen((prev) => ({ ...prev, skill: !prev.skill }))}
                      >
                        Skill Building Institutes ▾
                      </button>
                      {studentSubOpen.skill && (
                        <div className="flex flex-col pl-8 pb-2">
                          <button
                            className="text-left py-1 hover:text-purple-700"
                            onClick={() => {
                              alert('Print Certificate feature coming soon!')
                              setMenuOpen(false)
                            }}
                          >
                            Print Certificates
                          </button>
                          <button
                            className="text-left py-1 hover:text-purple-700"
                            onClick={() => {
                              alert('Print Diploma feature coming soon!')
                              setMenuOpen(false)
                            }}
                          >
                            Print Diplomas
                          </button>
                        </div>
                      )}

                      {/* SCHOOL */}
                      <button
                        className="px-6 py-2 text-left hover:bg-gray-100"
                        onClick={() => setStudentSubOpen((prev) => ({ ...prev, school: !prev.school }))}
                      >
                        School ▾
                      </button>
                      {studentSubOpen.school && <div className="pl-8 pb-2 text-sm text-gray-500">Coming soon...</div>}
                    </div>
                  )}
                </div>

                {/* VERIFICATION PORTAL */}
                <div className="relative border-t my-1">
                  <button
                    className="w-full text-left px-4 py-2 font-bold text-purple-700 hover:bg-gray-50"
                    onClick={() => setVerifyDropdownOpen(!verifyDropdownOpen)}
                  >
                    Verification Portal ▾
                  </button>

                  {verifyDropdownOpen && (
                    <div className="flex flex-col bg-white border-t text-gray-700">
                      <button
                        className="px-6 py-2 text-left hover:bg-gray-100"
                        onClick={() => {
                          alert('Verify Certificate feature coming soon!')
                          setMenuOpen(false)
                        }}
                      >
                        Verify Certificate
                      </button>
                      <button
                        className="px-6 py-2 text-left hover:bg-gray-100"
                        onClick={() => {
                          alert('Verify Diploma feature coming soon!')
                          setMenuOpen(false)
                        }}
                      >
                        Verify Diploma
                      </button>
                      <button
                        className="px-6 py-2 text-left hover:bg-gray-100"
                        onClick={() => {
                          setShowPrintMarksheet(true)
                          setMenuOpen(false)
                        }}
                      >
                        Verify Marksheet
                      </button>
                      <button
                        className="px-6 py-2 text-left hover:bg-gray-100"
                        onClick={() => {
                          setShowVerify(true)
                          setMenuOpen(false)
                        }}
                      >
                        Verify Degree
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold text-white leading-tight">
            AlgoCred
            <sub className="text-sm text-gray-200 ml-1">by RZ Services</sub>
          </h1>
        </div>

        <button className="btn btn-primary" onClick={() => setOpenWalletModal(true)}>
          {activeAddress ? 'Wallet Connected' : 'Connect Wallet'}
        </button>
      </nav>

      {/* BODY SECTIONS (unchanged) */}
      <section className="bg-gradient-to-r from-green-300 to-green-500 py-20 text-center text-white shadow-md">
        <h2 className="text-4xl font-extrabold mb-4 drop-shadow-lg">Welcome to AlgoCred</h2>
        <p className="text-lg max-w-2xl mx-auto font-medium">
          A blockchain-based platform for issuing and verifying academic credentials with authenticity, ZK-transparency, and global
          accessibility.
        </p>
      </section>

      <section className="bg-purple-50 py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-purple-800 mb-8">Why AlgoCred?</h2>
          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div className="p-6 bg-white rounded-xl shadow-md border-l-4 border-purple-500">
              <h3 className="font-semibold text-lg mb-2">Tamper-proof Records</h3>
              <p>Academic credentials are immutable digital assets on Algorand.</p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-md border-l-4 border-purple-500">
              <h3 className="font-semibold text-lg mb-2">Instant Global Access</h3>
              <p>ZK-Verification can be performed anywhere in the world within seconds.</p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-md border-l-4 border-purple-500">
              <h3 className="font-semibold text-lg mb-2">Academic Integrity</h3>
              <p>Eliminates fraud and ensures authenticity of issued degrees.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="flex justify-center">
          <div className="bg-gray-50 border-l-4 border-purple-600 p-8 rounded-xl shadow-md w-full sm:w-[28rem] text-center">
            <img src="/algo logo.jpg" alt="Algorand Logo" className="h-12 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2 text-purple-800">Powered by Algorand</h3>
            <p className="text-gray-700">
              Leveraging Algorand’s secure, scalable, and carbon-negative blockchain to safeguard academic integrity.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-green-100 py-12 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-purple-700 mb-4">Contact & Support</h2>
          <p className="text-gray-600 mb-6">For demonstrations or inquiries, reach out to our academic support team.</p>
          <a href="mailto:lfrostie10@gmail.com" className="btn btn-outline btn-primary">
            Contact Us
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-purple-900 text-white text-center py-6">
        <p className="font-medium">AlgoCred — Academic Credential Verification on Blockchain</p>
        <p className="text-sm mt-2 text-gray-300">© {new Date().getFullYear()} RZ Services. All rights reserved.</p>
      </footer>

      {/* MODALS */}
      <ConnectWallet openModal={openWalletModal} closeModal={() => setOpenWalletModal(false)} setConnectedInstitution={() => {}} />

      <Modal open={showMint} onClose={() => setShowMint(false)} title="Issue a Degree">
        {!activeAddress && <p className="text-gray-600 text-center mb-4">Please connect your wallet to continue.</p>}
        <div className={activeAddress ? '' : 'pointer-events-none opacity-30'}>
          <MintDegreeForm goBack={() => setShowMint(false)} wallet={matchedInstitution} />
        </div>
      </Modal>

      <Modal open={showProforma} onClose={() => setShowProforma(false)} title="Issue a Semester Proforma">
        {!activeAddress && <p className="text-gray-600 text-center mb-4">Please connect your wallet to continue.</p>}
        <div className={activeAddress ? '' : 'pointer-events-none opacity-30'}>
          <ProformaForm goBack={() => setShowProforma(false)} wallet={matchedInstitution} />
        </div>
      </Modal>

      <Modal open={showPrintProforma} onClose={() => setShowPrintProforma(false)} title="Print Semester Proforma">
        <PrintProforma />
      </Modal>

      <Modal open={showPrintMarksheet} onClose={() => setShowPrintMarksheet(false)} title="Print Marksheet">
        <PrintMarksheet />
      </Modal>

      <Modal open={showVerify} onClose={() => setShowVerify(false)} title="Verify a Degree">
        <VerifyDegreeForm goBack={() => setShowVerify(false)} />
      </Modal>

      <Modal open={showPartners} onClose={() => setShowPartners(false)} title="Partner Institutions">
        <PartnerInstitutions />
      </Modal>
    </div>
  )
}

export default Home
