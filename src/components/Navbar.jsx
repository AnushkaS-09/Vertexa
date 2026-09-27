export default function Navbar({ onNavigate }) {
  return (
    <div className="nav">
      <div className="brand">🏛️ Civic Task Navigator</div>
      <div className="links">
        <span onClick={() => onNavigate("home")}>Home</span>
        <span onClick={() => onNavigate("how")}>How It Works</span>
        <span onClick={() => onNavigate("about")}>About</span>
      </div>
    </div>
  );
}
