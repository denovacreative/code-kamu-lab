import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex flex-col items-center justify-center text-white">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="text-center mb-12"
      >
        <motion.h1
          className="text-6xl font-bold mb-4"
          initial={{ letterSpacing: '-0.1em' }}
          animate={{ letterSpacing: '0em' }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          Welcome to the Visual Coding Studio
        </motion.h1>
        <motion.p
          className="text-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
        >
          Learn to code the fun way!
        </motion.p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 1.5 }}
        className="flex space-x-4"
      >
        <Link to="/login">
          <Button size="lg" variant="secondary">
            Login
          </Button>
        </Link>
        <Link to="/register">
          <Button size="lg" variant="outline">
            Register
          </Button>
        </Link>
      </motion.div>
    </div>
  );
};

export default Landing;
