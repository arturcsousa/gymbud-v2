// GymBud Color Palette - Design System Colors
export const COLORS = {
  // Primary gradient colors from design
  primary: {
    dark: '#005870',    // Deep teal
    medium: '#0C8F93',  // Medium teal  
    light: '#18C7B6',   // Light teal/aqua
    accent: '#FF9F1C'   // Orange accent
  },
  
  // Gradient definitions
  gradients: {
    primary: 'linear-gradient(135deg, #005870 0%, #0C8F93 50%, #18C7B6 100%)',
    button: 'linear-gradient(to right, #00BFA6, #64FFDA)',
    buttonHover: 'linear-gradient(to right, #00ACC1, #4DD0E1)'
  },
  
  // UI colors
  ui: {
    white: '#ffffff',
    navBar: 'rgba(0, 0, 0, 0.1)',
    buttonText: '#1e293b', // slate-900
    ghostHover: 'rgba(255, 255, 255, 0.2)'
  }
} as const

// CSS custom properties for Tailwind integration
export const cssVariables = `
:root {
  --gymbud-primary-dark: #005870;
  --gymbud-primary-medium: #0C8F93;
  --gymbud-primary-light: #18C7B6;
  --gymbud-accent: #FF9F1C;
  --gymbud-gradient: linear-gradient(135deg, #005870 0%, #0C8F93 50%, #18C7B6 100%);
}
`
