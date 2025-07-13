import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-purple-600">Visual Coding Studio</h1>
          <nav className="space-x-4">
            <Link to="/login" className="text-gray-600 hover:text-purple-600">Login</Link>
            <Link to="/register">
              <Button>Register</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-purple-600 to-blue-500 text-white">
        <div className="container mx-auto px-6 text-center">
          <motion.h2
            className="text-5xl font-bold mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            The Fun Way to Learn to Code
          </motion.h2>
          <motion.p
            className="text-xl mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Drag-and-drop programming for beginners.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Link to="/register">
              <Button size="lg" variant="secondary">Get Started for Free</Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h3 className="text-3xl font-bold text-center mb-12">Features</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <motion.div
              className="bg-white p-6 rounded-lg shadow-lg"
              whileHover={{ y: -5 }}
            >
              <h4 className="text-xl font-bold mb-2">Visual Block-Based Coding</h4>
              <p>No syntax errors! Just drag and drop blocks to build your programs.</p>
            </motion.div>
            {/* Feature 2 */}
            <motion.div
              className="bg-white p-6 rounded-lg shadow-lg"
              whileHover={{ y: -5 }}
            >
              <h4 className="text-xl font-bold mb-2">Interactive Sprites</h4>
              <p>Bring your creations to life with customizable characters and animations.</p>
            </motion.div>
            {/* Feature 3 */}
            <motion.div
              className="bg-white p-6 rounded-lg shadow-lg"
              whileHover={{ y: -5 }}
            >
              <h4 className="text-xl font-bold mb-2">From Blocks to Code</h4>
              <p>See the real Python code generated from your blocks and get ready for text-based programming.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-100">
        <div className="container mx-auto px-6">
          <h3 className="text-3xl font-bold text-center mb-12">Pricing</h3>
          <div className="flex justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm">
              <h4 className="text-2xl font-bold mb-4">Free Plan</h4>
              <p className="text-4xl font-bold mb-6">$0<span className="text-lg font-normal">/month</span></p>
              <ul className="space-y-4">
                <li className="flex items-center"><Check className="text-green-500 mr-2" /> Unlimited Projects</li>
                <li className="flex items-center"><Check className="text-green-500 mr-2" /> Access to all blocks</li>
                <li className="flex items-center"><Check className="text-green-500 mr-2" /> Community Support</li>
              </ul>
              <Link to="/register" className="mt-8">
                <Button className="w-full">Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Start Your Coding Journey?</h3>
          <p className="text-xl mb-8">Create your free account today.</p>
          <Link to="/register">
            <Button size="lg">Get Started Now</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-800 text-white">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; 2024 Visual Coding Studio. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
