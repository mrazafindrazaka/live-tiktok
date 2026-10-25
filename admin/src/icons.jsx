// Icônes en trait, grille 24x24, coins carrés.
const paths = {
  chat: <path d="M4 5h16v11H11l-4 3.5V16H4z" />,
  gift: (
    <>
      <path d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13" />
      <path d="M12 7C10 3 6 4 7.5 7M12 7c2-4 6-3 4.5 0" />
    </>
  ),
};

export default function Icon({ name, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}
