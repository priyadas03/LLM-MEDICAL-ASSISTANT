import "./globals.css";

export const metadata = {
  title: "Medical Assistance LLM",
  description: "Safety-first medical assistance (MVP)."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="medicalBg text-slate-100">
        {children}
      </body>
    </html>
  );
}

