import React, { useState } from 'react'

const LMS: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false)

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
                <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 font-semibold">Home</button>
                <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 font-semibold">Dashboard</button>
                <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 font-semibold">Courses</button>
                <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 font-semibold">Attendance</button>
                <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 font-semibold">Reports</button>
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold text-white leading-tight">
            CrediChain LMS
            <sub className="text-sm text-gray-200 ml-1">by RZ Services</sub>
          </h1>
        </div>

        <button className="btn btn-primary">Login</button>
      </nav>

      {/* MAIN BODY */}
      <section className="py-16 bg-gradient-to-r from-green-300 to-green-500 text-center text-white shadow-md">
        <h2 className="text-4xl font-extrabold mb-4 drop-shadow-lg">Welcome to CrediChain LMS</h2>
        <p className="text-lg max-w-2xl mx-auto font-medium mb-8">
          The first LMS built with usng a blockchain — Presenting CrediChain which uses Algorand the fastest, cheapest, and most secure
          Layer-1. CrediChain brings verifiable records, tamper-proof academics, and instant credentialing, putting us years ahead of all
          traditional systems.
        </p>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white rounded-xl shadow-md p-6 text-purple-800">
            <h3 className="font-semibold text-lg mb-2">Courses & Curriculum</h3>
            <p>Manage and deliver courses with transparency and trust, backed by Algorand-secured academic data.</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-purple-800">
            <h3 className="font-semibold text-lg mb-2">Attendance Tracking</h3>
            <p>Each attendance event can be blockchain-backed, preventing manipulation and ensuring institutional integrity.</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-purple-800">
            <h3 className="font-semibold text-lg mb-2">Performance Analytics</h3>
            <p>Insights built on verifiable on-chain data — no errors, no tampering, complete academic truth.</p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white text-center">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-purple-800 mb-8">Additional Features</h2>
          <div className="grid md:grid-cols-2 gap-8 text-left">
            <div className="p-6 bg-gray-50 rounded-xl shadow-md border-l-4 border-purple-500">
              <h3 className="font-semibold text-lg mb-2">Faculty Management</h3>
              <p>Empower faculty with blockchain-backed class records, secured on Algorand for unmatched transparency.</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-xl shadow-md border-l-4 border-purple-500">
              <h3 className="font-semibold text-lg mb-2">Institution Reports</h3>
              <p>
                Generate reports that are immutable, verifiable, and future-proof — powered by Algorand, making CrediChain the most advanced
                LMS ecosystem in the market.
              </p>
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

      {/* FOOTER */}
      <footer className="bg-purple-900 text-white text-center py-6">
        <p className="font-medium">CrediChain — Academic LMS & Credential Management</p>
        <p className="text-sm mt-2 text-gray-300">© {new Date().getFullYear()} RZ Services. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default LMS
