import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, CheckCircle } from 'lucide-react';
import Button from '@/components/Button/Button';
import LandingNavbar from '@/components/Layout/LandingNavbar';
import Footer from '@/components/Layout/Footer';
import { ROUTES } from '@/constants/routes';
import { COLOR_CLASSES, COLOR_PATTERNS } from '@/constants/colors';
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
    <div className={`min-h-screen ${COLOR_CLASSES.landing.backgrounds.secondary}`}>
      {/* Header */}
      <LandingNavbar />

      {/* Hero Section */}
      <section className={COLOR_PATTERNS.landing.hero}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="mb-6 text-4xl font-bold text-white">
              Plan Your Projects
              <span className={COLOR_CLASSES.landing.text.accent}> Smarter</span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-xl text-white">
              Streamline your workflow with our intuitive project management platform. Keep your
              team organized and projects on track.
            </p>
            <div className="flex flex-row justify-center gap-4 sm:gap-6">
              <Link to={ROUTES.AUTH}>
                <Button
                  variant="outline"
                  size="md"
                  className={`flex items-center ${COLOR_PATTERNS.landing.heroButton}`}
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to={ROUTES.AUTH}>
                <Button variant="outline" size="md" className={COLOR_PATTERNS.landing.heroButton}>
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className={COLOR_PATTERNS.landing.contentSection}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className={`mb-4 text-3xl font-bold ${COLOR_CLASSES.landing.text.primary}`}>
              How it works
            </h2>
            <p className={`mx-auto max-w-2xl ${COLOR_CLASSES.landing.text.muted}`}>
              Get started in just a few simple steps
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={index} className={COLOR_PATTERNS.landing.card}>
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-2xl font-bold text-white shadow-lg">
                  {step.number}
                </div>
                <h3
                  className={`mb-3 text-center text-xl font-semibold ${COLOR_CLASSES.landing.text.primary}`}
                >
                  {step.title}
                </h3>
                <p className={`text-center leading-relaxed ${COLOR_CLASSES.landing.text.muted}`}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className={COLOR_PATTERNS.landing.testimonialsSection}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className={`mb-4 text-3xl font-bold ${COLOR_CLASSES.landing.text.primary}`}>
              What people are saying
            </h2>
            <p className={`mx-auto max-w-2xl ${COLOR_CLASSES.landing.text.muted}`}>
              Hear from developers about their experience
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div key={index} className={COLOR_PATTERNS.landing.card}>
                <div className="mb-6 flex items-center">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="mr-4 h-14 w-14 rounded-full ring-2 ring-blue-200"
                  />
                  <div>
                    <h3 className={`font-semibold ${COLOR_CLASSES.landing.text.primary}`}>
                      {testimonial.name}
                    </h3>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
                <p className={`mb-6 leading-relaxed ${COLOR_CLASSES.landing.text.secondary}`}>
                  {testimonial.content}
                </p>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="mr-1 h-5 w-5 fill-current text-orange-500" />
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
