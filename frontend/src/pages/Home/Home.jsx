import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, CheckCircle } from 'lucide-react';
import Button from '@/components/Button/Button';
import LandingNavbar from '@/components/Layout/LandingNavbar';
import Footer from '@/components/Layout/Footer';
import { ROUTES } from '@/constants/routes';
import prosperImg from '@/assets/images/testimonials/prosper.jpg';
import sudeepImg from '@/assets/images/testimonials/sudeep.jpg';
import vincentImg from '@/assets/images/testimonials/vincent.jpg';

const Home = () => {
  const steps = [
    {
      number: '1',
      title: 'Create Your Project',
      description: 'Start by setting up your project with a clear name and description',
    },
    {
      number: '2',
      title: 'Add Tasks',
      description: 'Break down your project into manageable tasks and set deadlines',
    },
    {
      number: '3',
      title: 'Track Progress',
      description: 'Monitor your progress and update task status as you complete them',
    },
  ];

  const testimonials = [
    {
      name: 'Prosper Banda',
      role: 'Software Engineer at Meta',
      content:
        'This app is still in development, but I can see the potential. Looking forward to the full release!',
      image: prosperImg,
    },
    {
      name: 'Sudeep Joshi',
      role: 'SWE Intern at Amazon',
      content:
        "The interface looks promising. Can't wait to try out all the features when it's ready.",
      image: sudeepImg,
    },
    {
      name: 'Vincent Anim-Addo',
      role: 'Meta U Intern at Meta',
      content:
        'Clean design and intuitive layout. This will be great for managing our design projects.',
      image: vincentImg,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <LandingNavbar />

      {/* Hero Section */}
      <section className="bg-blue-50 pb-16 pt-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="mb-6 text-4xl font-bold text-gray-900">
              Plan Your Projects
              <span className="text-blue-600"> Smarter</span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-600">
              Streamline your workflow with our intuitive project management platform. Keep your
              team organized and projects on track.
            </p>
            <div className="flex flex-row justify-center gap-3 sm:gap-4">
              <Link to={ROUTES.AUTH}>
                <Button variant="outline" size="sm" className="flex items-center sm:text-base">
                  Get Started
                  <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </Link>
              <Link to={ROUTES.AUTH}>
                <Button variant="outline" size="sm" className="sm:text-base">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-gray-100 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">How it works</h2>
            <p className="mx-auto max-w-2xl text-gray-600">
              Get started in just a few simple steps
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={index}
                className="rounded-lg bg-gray-300 p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
                  {step.number}
                </div>
                <h3 className="mb-2 text-center text-xl font-semibold text-gray-900">
                  {step.title}
                </h3>
                <p className="text-center text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-gray-100 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">What people are saying</h2>
            <p className="mx-auto max-w-2xl text-gray-600">
              Hear from developers about their experience
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="rounded-lg bg-gray-300 p-6">
                <div className="mb-4 flex items-center">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="mr-4 h-12 w-12 rounded-full"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">{testimonial.name}</h3>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-700">{testimonial.content}</p>
                <div className="mt-4 flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current text-yellow-400" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
