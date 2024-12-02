import { Link } from "react-router-dom";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-300">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Link to="/" className="text-2xl font-bold text-white">
            Money<span className="text-green-500">Up</span>
          </Link>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 sm:p-8 shadow-xl">
          <h1 className="text-3xl font-bold text-white mb-8">Privacy Policy</h1>

          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                1. Information We Collect
              </h2>
              <p>
                We collect information that you provide directly to us,
                including:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-2">
                <li>Account information (email, username)</li>
                <li>Financial data (expenses, income, goals)</li>
                <li>Usage information and preferences</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                2. How We Use Your Information
              </h2>
              <p>We use the collected information to:</p>
              <ul className="list-disc pl-5 mt-2 space-y-2">
                <li>Provide and maintain our services</li>
                <li>Process your transactions</li>
                <li>Send you important updates</li>
                <li>Improve our services</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                3. Data Security
              </h2>
              <p>
                We implement appropriate security measures to protect your
                personal information, including:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-2">
                <li>Encryption of sensitive data</li>
                <li>Regular security assessments</li>
                <li>Secure data storage practices</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                4. Contact Us
              </h2>
              <p>
                If you have any questions about our Privacy Policy, please
                contact us at:
              </p>
              <p className="mt-2">support@leeyos.com</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
