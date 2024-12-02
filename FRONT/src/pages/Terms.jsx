import { Link } from "react-router-dom";

const Terms = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-300">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Link to="/" className="text-2xl font-bold text-white">
            Money<span className="text-green-500">Up</span>
          </Link>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 sm:p-8 shadow-xl">
          <h1 className="text-3xl font-bold text-white mb-8">
            Terms of Service
          </h1>

          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                1. Account Terms
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  You must provide accurate information when creating an account
                </li>
                <li>
                  You are responsible for maintaining the security of your
                  account
                </li>
                <li>
                  You must notify us of any unauthorized use of your account
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                2. Service Usage
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Free tier users can access basic features</li>
                <li>Pro tier users get access to advanced features</li>
                <li>Usage must comply with applicable laws and regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                3. Payment Terms
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Pro subscription is billed monthly at ₱299</li>
                <li>Payments are non-refundable</li>
                <li>Subscription can be cancelled at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                4. Termination
              </h2>
              <p>We reserve the right to suspend or terminate accounts that:</p>
              <ul className="list-disc pl-5 mt-2 space-y-2">
                <li>Violate these terms</li>
                <li>Engage in fraudulent activity</li>
                <li>Abuse the service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                5. Changes to Terms
              </h2>
              <p>
                We may modify these terms at any time. Continued use of the
                service constitutes acceptance of the modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                6. Contact
              </h2>
              <p>For questions about these terms, please contact:</p>
              <p className="mt-2">support@leeyos.com</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
