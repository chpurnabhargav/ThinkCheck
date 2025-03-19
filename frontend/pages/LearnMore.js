import React, { useState, useEffect, useRef } from 'react';

const LearnMore = () => {
  const [activeSection, setActiveSection] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [isBrowser, setIsBrowser] = useState(false);
  const scrollTimeoutRef = useRef(null);
  const scrollAccumulatorRef = useRef(0);
  const scrollLockRef = useRef(false);
  
  // References to each section - removed the Footer reference
  const sectionRefs = [
    useRef(null), // Hero
    useRef(null), // Intro
    useRef(null), // Features
    useRef(null)  // Why This Matters
  ];

  // Initialize browser-only variables after component mounts
  useEffect(() => {
    setIsBrowser(true);
    setViewportHeight(window.innerHeight);
    
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Handle scroll events and implement snap behavior
  useEffect(() => {
    if (!isBrowser) return;

    const handleWheel = (e) => {
      // Prevent default behavior to disable native scrolling
      e.preventDefault();
      
      // Don't process new scroll events if we're already in a locked scrolling state
      if (scrollLockRef.current) return;
      
      // Accumulate scroll values to detect meaningful scrolls
      scrollAccumulatorRef.current += e.deltaY;
      
      // Clear any existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Set a timeout to reset the accumulator if no scrolling occurs for a while
      scrollTimeoutRef.current = setTimeout(() => {
        scrollAccumulatorRef.current = 0;
      }, 150);
      
      // Only proceed if the accumulated scroll is significant
      // This helps avoid accidental scrolling with trackpads
      if (Math.abs(scrollAccumulatorRef.current) < 50) return;
      
      // Determine scroll direction
      const direction = scrollAccumulatorRef.current > 0 ? 1 : -1;
      const nextSection = Math.max(0, Math.min(sectionRefs.length - 1, activeSection + direction));
      
      // Only scroll if we're changing sections
      if (nextSection !== activeSection) {
        // Lock scrolling during the transition
        scrollLockRef.current = true;
        setIsScrolling(true);
        
        // Reset accumulator immediately after detecting a significant scroll
        scrollAccumulatorRef.current = 0;
        
        // Update the active section
        setActiveSection(nextSection);
        
        // Scroll to the next section
        sectionRefs[nextSection].current.scrollIntoView({
          behavior: 'smooth'
        });
        
        // Reset scrolling flags after animation completes
        setTimeout(() => {
          setIsScrolling(false);
          scrollLockRef.current = false;
        }, 800); // Slightly shorter than before to feel more responsive
      } else {
        // Reset accumulator if we're trying to scroll beyond the first or last section
        scrollAccumulatorRef.current = 0;
      }
    };

    // Add event listener to handle wheel events
    window.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [activeSection, isBrowser]);

  // Animation styles based on active section
  const getAnimationStyle = (sectionIndex) => {
    // Animation for sections not yet visible
    if (sectionIndex > activeSection) {
      return {
        opacity: 0,
        transform: 'translateY(50px)'
      };
    }
    
    // Animation for active section
    if (sectionIndex === activeSection) {
      return {
        opacity: 1,
        transform: 'translateY(0)',
        transition: 'opacity 700ms ease-out, transform 700ms ease-out'
      };
    }
    
    // Animation for sections already passed
    return {
      opacity: 0.3,
      transform: 'translateY(-30px)',
      transition: 'opacity 700ms ease-out, transform 700ms ease-out'
    };
  };

  // Floating effect for the heading in the intro section
  const getFloatingStyle = () => {
    if (activeSection !== 1) return { opacity: 0 };
    
    return {
      opacity: 1,
      transform: `translateY(${Math.sin(Date.now() * 0.001) * 10}px)`,
      filter: `drop-shadow(0 ${5 + Math.abs(Math.sin(Date.now() * 0.001) * 5)}px 15px rgba(0, 100, 255, 0.2))`,
      transition: 'opacity 700ms ease-out'
    };
  };

  // Separate effect for paragraph in the intro section
  const getParagraphStyle = () => {
    if (activeSection !== 1) return { opacity: 0 };
    
    return {
      opacity: 1,
      transform: 'translateY(0)',
      transition: 'opacity 700ms ease-out, transform 700ms ease-out 200ms'
    };
  };

  // Update floating effect continuously
  useEffect(() => {
    if (!isBrowser || activeSection !== 1) return;
    
    const animationFrame = requestAnimationFrame(function animate() {
      // Force re-render to update floating animation
      setIsScrolling(prev => prev); // Changed to avoid unnecessary re-renders
      requestAnimationFrame(animate);
    });
    
    return () => cancelAnimationFrame(animationFrame);
  }, [activeSection, isBrowser]);

  // Handling keyboard navigation
  useEffect(() => {
    if (!isBrowser) return;
    
    const handleKeyDown = (e) => {
      if (scrollLockRef.current) return;
      
      let nextSection = activeSection;
      
      // Arrow Up/Down and Page Up/Down keys
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        nextSection = Math.min(sectionRefs.length - 1, activeSection + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        nextSection = Math.max(0, activeSection - 1);
      } else if (e.key === 'Home') {
        nextSection = 0;
      } else if (e.key === 'End') {
        nextSection = sectionRefs.length - 1;
      } else {
        return; // Not a navigation key
      }
      
      if (nextSection !== activeSection) {
        e.preventDefault();
        scrollLockRef.current = true;
        setIsScrolling(true);
        setActiveSection(nextSection);
        
        sectionRefs[nextSection].current.scrollIntoView({
          behavior: 'smooth'
        });
        
        setTimeout(() => {
          setIsScrolling(false);
          scrollLockRef.current = false;
        }, 800);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeSection, isBrowser]);

  return (
    <div className="relative w-full bg-black text-white overflow-hidden h-screen">
      {/* Snap Container */}
      <div className="h-screen overflow-hidden">
        {/* Hero Section */}
        <div 
          ref={sectionRefs[0]}
          className="relative h-screen flex items-center justify-center"
          style={getAnimationStyle(0)}
        >
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black opacity-70"></div>
          </div>
          <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
            <h1 className="text-6xl font-bold tracking-tight mb-6">Learn More</h1>
            <p className="text-2xl font-light leading-relaxed">
              Discover everything you need to know. Designed for you.
            </p>
            <div className="mt-12 animate-bounce">
              <p className="text-sm text-gray-400">Scroll Down</p>
              <svg className="w-6 h-6 mx-auto mt-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </div>

        {/* Intro Section */}
        <div 
          ref={sectionRefs[1]}
          className="relative h-screen flex items-center justify-center px-6"
        >
          <div className="text-center max-w-5xl mx-auto">
            <h2 
              className="text-5xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500"
              style={getFloatingStyle()}
            >
              A new way to learn. <br />A better way to understand.
            </h2>
            <p 
              className="text-xl font-light text-gray-300 max-w-3xl mx-auto leading-relaxed"
              style={getParagraphStyle()}
            >
              Welcome to the Learn More page. Here, you can explore more information about our services, features, and how we can help you succeed. Dive deeper into the topics that matter most to you.
            </p>
          </div>
        </div>

        {/* Features Grid Section */}
        <div 
          ref={sectionRefs[2]}
          className="relative h-screen flex items-center justify-center px-6"
          style={getAnimationStyle(2)}
        >
          <div className="max-w-5xl mx-auto w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              <div className="flex flex-col items-start">
                <h3 className="text-3xl font-medium mb-6">What You Can Learn</h3>
                <ul className="space-y-4 text-lg text-gray-400">
                  <li className="flex items-center">
                    <span className="mr-3 text-blue-500">•</span>
                    In-depth tutorials and guides
                  </li>
                  <li className="flex items-center">
                    <span className="mr-3 text-blue-500">•</span>
                    Tips and tricks for using the app
                  </li>
                  <li className="flex items-center">
                    <span className="mr-3 text-blue-500">•</span>
                    Best practices for getting the most out of our features
                  </li>
                  <li className="flex items-center">
                    <span className="mr-3 text-blue-500">•</span>
                    Frequently asked questions
                  </li>
                </ul>
              </div>

              <div className="flex flex-col items-start">
                <h3 className="text-3xl font-medium mb-6">Additional Resources</h3>
                <ul className="space-y-4 text-lg text-gray-400">
                  <li className="flex items-center">
                    <span className="mr-3 text-blue-500">•</span>
                    Video tutorials and walkthroughs
                  </li>
                  <li className="flex items-center">
                    <span className="mr-3 text-blue-500">•</span>
                    Step-by-step guides for beginners
                  </li>
                  <li className="flex items-center">
                    <span className="mr-3 text-blue-500">•</span>
                    Best practices and tips for advanced users
                  </li>
                  <li className="flex items-center">
                    <span className="mr-3 text-blue-500">•</span>
                    API documentation and developer resources
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Why This Matters Section */}
        <div 
          ref={sectionRefs[3]}
          className="relative h-screen flex items-center justify-center px-6"
          style={getAnimationStyle(3)}
        >
          <div className="text-center max-w-5xl mx-auto">
            <h2 className="text-4xl font-medium mb-8">Why This Matters</h2>
            <p className="text-xl font-light text-gray-400 max-w-3xl mx-auto leading-relaxed mb-8">
              With this information, you'll be able to make the most of our platform, stay up-to-date on new features, and ensure you are following best practices to maximize your success.
            </p>
            <p className="text-xl font-light text-gray-400 max-w-3xl mx-auto leading-relaxed">
              We're committed to making your learning journey as efficient and enjoyable as possible. Let us guide you every step of the way.
            </p>
          </div>
        </div>
      </div>
      
      {/* Subtle section indicators */}
      <div className="fixed right-8 top-1/2 transform -translate-y-1/2 flex flex-col space-y-3">
        {sectionRefs.map((_, i) => (
          <button 
            key={i}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${activeSection === i ? 'bg-blue-500 scale-125' : 'bg-gray-600 scale-100'}`}
            onClick={() => {
              if (scrollLockRef.current) return;
              scrollLockRef.current = true;
              setActiveSection(i);
              sectionRefs[i].current.scrollIntoView({ behavior: 'smooth' });
              setTimeout(() => {
                scrollLockRef.current = false;
              }, 800);
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default LearnMore;