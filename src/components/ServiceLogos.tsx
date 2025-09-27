import React from 'react';

const ServiceLogos: React.FC = () => {
  const serviceLogos = [
    {
      name: 'LinkedIn',
      logo: (
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-600 rounded flex items-center justify-center shadow-sm">
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </div>
          <div className="text-blue-600 text-sm font-medium">
            <div className="font-bold">LinkedIn</div>
          </div>
        </div>
      )
    },
    {
      name: 'Instagram',
      logo: (
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-lg flex items-center justify-center shadow-lg">
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
              {/* Instagram Logo */}
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </div>
          <div className="text-gray-700 text-sm font-medium">
            <div className="font-bold text-pink-600">Instagram</div>
          </div>
        </div>
      )
    },
    {
      name: 'Google AdSense',
      logo: (
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-transparent rounded-lg flex items-center justify-center">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              {/* Official Google AdSense Logo - Exact Design */}
              <g>
                {/* Left shape - Yellow capsule with green circle */}
                <ellipse cx="8" cy="10" rx="3.5" ry="2" fill="#FFD700" transform="rotate(-15 8 10)"/>
                <circle cx="6.5" cy="11.5" r="1.2" fill="#00C851"/>
                
                {/* Right shape - Blue capsule */}
                <ellipse cx="16" cy="8" rx="3.5" ry="2" fill="#4285F4" transform="rotate(15 16 8)"/>
                
                {/* Text "Google AdSense" */}
                <text x="12" y="18" textAnchor="middle" fontSize="3" fill="#333" fontFamily="Arial, sans-serif" fontWeight="400">
                  Google AdSense
                </text>
              </g>
            </svg>
          </div>
          <div className="text-gray-700 text-sm font-medium">
            <div className="font-bold text-blue-600">Google</div>
            <div className="text-green-600 font-medium">AdSense</div>
          </div>
        </div>
      )
    },
    {
      name: 'Meta',
      logo: (
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
              {/* Official Meta Logo - Infinity Symbol */}
              <path d="M8.5 7.5c-2.5 0-4.5 2-4.5 4.5s2 4.5 4.5 4.5c1.5 0 2.8-.7 3.5-1.8.7 1.1 2 1.8 3.5 1.8 2.5 0 4.5-2 4.5-4.5s-2-4.5-4.5-4.5c-1.5 0-2.8.7-3.5 1.8-.7-1.1-2-1.8-3.5-1.8zm0 2c1.4 0 2.5 1.1 2.5 2.5s-1.1 2.5-2.5 2.5-2.5-1.1-2.5-2.5 1.1-2.5 2.5-2.5zm7 0c1.4 0 2.5 1.1 2.5 2.5s-1.1 2.5-2.5 2.5-2.5-1.1-2.5-2.5 1.1-2.5 2.5-2.5z"/>
            </svg>
          </div>
          <div className="text-gray-700 text-sm font-medium">
            <div className="font-bold text-blue-600">Meta</div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="w-full">
      <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 py-2">
        {serviceLogos.map((service, index) => (
          <div
            key={index}
            className="flex items-center justify-center p-3 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 hover:scale-105 min-h-[50px]"
            title={service.name}
          >
            {service.logo}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServiceLogos;
