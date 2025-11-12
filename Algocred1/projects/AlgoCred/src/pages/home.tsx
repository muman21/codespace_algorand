import React from 'react'
import { useNavigate } from 'react-router-dom'

const Home: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col text-white">
      {/* Top Header Section */}
      <div className="h-[20vh] w-full bg-gradient-to-r from-purple-900 via-purple-700 to-indigo-600 flex flex-col items-center justify-center shadow-md">
        <h1 className="text-5xl font-extrabold mb-2 tracking-wide drop-shadow-lg">
          AlgoCred <sub className="text-green-300 text-xl font-semibold align-baseline">by RZ Services</sub>
        </h1>
        <h2 className="text-lg font-medium text-gray-200">
          Empowering Academic Integrity — <span className="text-white font-semibold">Powered by Algorand</span>
        </h2>
      </div>

      {/* Bottom Two-Box Section */}
      <div className="flex flex-1">
        {/* Left Box — Blockchain Portal */}
        <div
          className="flex-1 relative border-r border-white/20"
          style={{
            backgroundImage: "url('/algocred home image.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Darker transparent overlay */}
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
            <h3 className="text-2xl font-bold mb-3 text-white">Blockchain Portal</h3>
            <p className="w-4/5 text-center text-white">
              Access blockchain-based degree issuance and verification for universities and students.
            </p>
            <button
              onClick={() => navigate('/algocred')}
              className="mt-6 px-6 py-2 bg-green-400 text-purple-900 font-semibold rounded-lg hover:bg-green-300"
            >
              Enter Portal
            </button>
          </div>
        </div>

        {/* Right Box — LMS / ERP Portal */}
        <div
          className="flex-1 relative"
          style={{
            backgroundImage: "url('/lms.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Darker transparent overlay */}
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
            <h3 className="text-2xl font-bold mb-3 text-white">LMS / ERP Portal</h3>
            <p className="w-4/5 text-center text-white">
              Manage student attendance, courses, and institutional workflows through a unified academic ERP.
            </p>
            <button
              onClick={() => navigate('/lms')}
              className="mt-6 px-6 py-2 bg-blue-400 text-purple-900 font-semibold rounded-lg hover:bg-blue-300"
            >
              Enter LMS / ERP
            </button>
          </div>
        </div>
      </div>

      <footer className="py-3 text-center text-sm text-gray-300 bg-purple-900">
        © {new Date().getFullYear()} RZ Services — Built on Algorand Blockchain
      </footer>
    </div>
  )
}

export default Home
