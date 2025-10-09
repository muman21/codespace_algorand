import React from 'react'

const PartnerInstitutions: React.FC = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-purple-800 mb-6 text-center">Partner Institutions</h2>
      <p className="text-gray-600 text-center mb-10">
        Academic institutions collaborating with AlgoCred to pioneer blockchain-based credentialing.
      </p>

      <div className="flex flex-wrap justify-center gap-8 max-w-6xl mx-auto">
        <div className="bg-white border-l-4 border-green-600 p-6 rounded-xl shadow-md w-full sm:w-[22rem] text-center">
          <img src="/smiu logo.png" alt="SMIU Logo" className="h-12 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Sindh Madressatul Islam University</h3>
          <p className="text-gray-700">Pioneering blockchain-enabled degree issuance and verification.</p>
        </div>

        <div className="bg-white border-l-4 border-blue-600 p-6 rounded-xl shadow-md w-full sm:w-[22rem] text-center">
          <img src="/darul uloom memon logo.jpeg" alt="Darul Uloom Logo" className="h-12 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Darul Uloom Memon</h3>
          <p className="text-gray-700">Digitally certifying religious education while upholding tradition.</p>
        </div>

        <div className="bg-white border-l-4 border-purple-600 p-6 rounded-xl shadow-md w-full sm:w-[22rem] text-center">
          <img src="/iqra-logo.png" alt="ABC University Logo" className="h-12 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">ABC University</h3>
          <p className="text-gray-700">Adopting blockchain to enhance trust in academic credentials.</p>
        </div>
      </div>
    </div>
  )
}

export default PartnerInstitutions
