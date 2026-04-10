import React from 'react';

const AnimatedOrbs = ({ count = 15 }) => {
  // Generate random initial positions and animation durations for each orb
  const orbs = Array.from({ length: count }).map((_, i) => ({
    id: i,
    initialLeft: Math.random() * 100 + 'vw',
    initialTop: Math.random() * 100 + 'vh',
    animationDuration: Math.random() * 8 + 4 + 's', // 4-12 seconds
    size: Math.random() * 40 + 60 + 'px', // 60-100px
    opacity: Math.random() * 0.25 + 0.05, // 0.05-0.3
    backgroundColor: `rgba(255, 255, 255, ${Math.random() * 0.1 + 0.05})`, // Very light white
  }));

  // Define keyframe animations dynamically
  const generateKeyframes = (id) => `
    @keyframes orbAnimation-${id} {
      0% {
        transform: translate(${orbs[id].initialLeft}, ${orbs[id].initialTop}) scale(1);
        opacity: ${orbs[id].opacity};
      }
      25% {
        transform: translate(${Math.random() * 100}vw, ${Math.random() * 100}vh) scale(${Math.random() * 0.5 + 0.5});
        opacity: ${Math.random() * 0.25 + 0.05};
      }
      50% {
        transform: translate(${Math.random() * 100}vw, ${Math.random() * 100}vh) scale(${Math.random() * 0.5 + 0.5});
        opacity: ${Math.random() * 0.25 + 0.05};
      }
      75% {
        transform: translate(${Math.random() * 100}vw, ${Math.random() * 100}vh) scale(${Math.random() * 0.5 + 0.5});
        opacity: ${Math.random() * 0.25 + 0.05};
      }
      100% {
        transform: translate(${orbs[id].initialLeft}, ${orbs[id].initialTop}) scale(1);
        opacity: ${orbs[id].opacity};
      }
    }
  `;

  return (
    <div style={{
      position: 'fixed', // Use fixed to cover the whole viewport
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      overflow: 'hidden', // Hide orbs that go off-screen
      zIndex: -1, // Ensure orbs are in the background
    }}>
      {/* Dynamically create style tags for each orb's animation */}
      {orbs.map((orb) => (
        <style key={`style-${orb.id}`}>
          {generateKeyframes(orb.id)}
        </style>
      ))}

      {orbs.map((orb) => (
        <div
          key={orb.id}
          style={{
            position: 'absolute',
            width: orb.size,
            height: orb.size,
            borderRadius: '50%', // Make them perfect circles
            backgroundColor: orb.backgroundColor,
            animation: `orbAnimation-${orb.id} ${orb.animationDuration} ease-in-out infinite alternate`,
            filter: 'blur(5px)', // Add a subtle blur for a softer look
            willChange: 'transform, opacity', // Optimize for animation performance
          }}
        />
      ))}
    </div>
  );
};

export default AnimatedOrbs;