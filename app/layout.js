export const metadata = {
  title: "Foliofox",
  description: "Gestione patrimonio personale",
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body style={{ margin: 0, background: "#fff" }}>{children}</body>
    </html>
  );
}
