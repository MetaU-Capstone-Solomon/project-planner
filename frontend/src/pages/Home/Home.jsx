import React from 'react';
import { ArrowRight, Star, CheckCircle } from 'lucide-react';
import Logo from '../../components/Logo/Logo';
import prosperImg from '../../assets/images/testimonials/prosper.jpg';
import sudeepImg from '../../assets/images/testimonials/sudeep.jpg';
import vincentImg from '../../assets/images/testimonials/vincent.jpg';

const Home = () => {
  const steps = [
    {
      number: '1',
      title: 'Create Your Project',
      description: 'Start by setting up your project with a clear name and description'
    },
    {
      number: '2',
      title: 'Add Tasks',
      description: 'Break down your project into manageable tasks and set deadlines'
    },
    {
      number: '3',
      title: 'Track Progress',
      description: 'Monitor your progress and update task status as you complete them'
    }
  ];

  const testimonials = [
    {
      name: 'Prosper Banda',
      role: 'Software Engineer at Meta',
      content: 'This app is still in development, but I can see the potential. Looking forward to the full release!',
      image: prosperImg
    },
    {
      name: 'Sudeep Joshi',
      role: 'SWE Intern at Amazon',
      content: 'The interface looks promising. Can\'t wait to try out all the features when it\'s ready.',
      image: sudeepImg
    },
    {
      name: 'Vincent Anim-Addo',
      role: 'Meta U Intern at Meta',
      content: 'Clean design and intuitive layout. This will be great for managing our design projects.',
      image: vincentImg
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Logo />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Plan Your Projects
              <span className="text-blue-600"> Smarter</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Streamline your workflow with our intuitive project management platform. 
              Keep your team organized and projects on track.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center">
                Get Started
                <ArrowRight className="ml-2 w-4 h-4" />
              </button>
              <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50">
                Sign In
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How it works
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Get started in just a few simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-center">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What people are saying
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Hear from developers about their experience
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center mb-4">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">{testimonial.name}</h3>
                    <p className="text-gray-600 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-700">{testimonial.content}</p>
                <div className="flex mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-t border-gray-800 text-center text-gray-400 py-8">
            <p>&copy; 2024 Project Planner. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home; 