import logo from '../../assets/images/logo.png'
import './Logo.css'

export default function Logo({ size = 'md' }) {
  return (
    <div className={`logo ${size}`}>
      <img 
        src={logo} 
        alt="ProPlan Logo" 
      />
    </div>
  )
} 