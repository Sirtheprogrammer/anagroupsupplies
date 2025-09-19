import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-surface dark:bg-surface-dark text-text dark:text-text-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <img
                src="https://i.ibb.co/gFVc9yYP/Black-White-Modern-Letter-A-Logo-Design.png"
                alt="M3 Outfit Logo"
                className="h-10 w-10 object-contain"
              />
              <h3 className="text-2xl font-bold text-primary dark:text-primary-light tracking-wider">AnA GROUP SUPPLIES</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              We care about your Style
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-text dark:text-text-dark">QUICK LINKS</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light">
                  HOME
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light">
                  PRODUCTS
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light">
                  CART
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-text dark:text-text-dark">CUSTOMER SERVICE</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/contact" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light">
                  CONTACT US
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light">
                  SHIPPING INFO
                </Link>
              </li>
              <li>
                <Link to="/returns" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light">
                  RETURNS
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-text dark:text-text-dark">STAY UPDATED</h4>
            <form className="space-y-4">
              <input
                type="email"
                placeholder="Enter your email"
                className="input bg-gray-100 dark:bg-gray-700 text-text dark:text-text-dark placeholder-gray-500 dark:placeholder-gray-400"
              />
              <button type="submit" className="btn btn-primary w-full">
                SUBSCRIBE
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8 text-center text-gray-600 dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} AnA Group Supplies. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;